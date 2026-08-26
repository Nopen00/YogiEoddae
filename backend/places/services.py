"""
장소 추출 서비스 — management command와 web view 양쪽에서 호출 가능.
"""
import re
import logging
import random
from datetime import timedelta
from zoneinfo import ZoneInfo

import requests as http_requests
from django.conf import settings
from django.utils import timezone
from googleapiclient.discovery import build

from places.management.commands.fetch_youtube_place import (
    _extract_video_id,
    _fetch_video_info,
    _fetch_comments,
    _fetch_transcript,
    _parse_chapters,
    _build_chapter_transcript,
    _build_location_prompt,
    _kto_search,
    _gemini_infer,
    _claude_infer,
)
from places.models import Media, MediaPlace, Place

logger = logging.getLogger(__name__)


def _has_precise_address(address: str) -> bool:
    """도로명/지번 번호가 포함된 정확한 주소인지 확인."""
    if not address:
        return False
    # 숫자가 있으면 '구포시장2길 7', '금성로 100', '123-4번지' 같은 정확한 주소
    return bool(re.search(r'\d', address))


def _address_matches(candidate_address: str, address_hint: str) -> bool:
    """
    address_hint에서 뽑은 지역 단위 토큰(시/구/군/동/로/길 등)이
    candidate_address에 포함되는지 확인한다. hint가 없거나 토큰을 못 뽑으면
    검증 불가로 보고 통과시킨다(기존 동작 유지, 오탐 줄이기 위한 보수적 기본값).

    '도'(경기도, 강원도 등 광역 단위)는 같은 도 안에 시/군이 여러 개 있어
    식별력이 낮으므로, 더 구체적인 단위 토큰이 함께 있으면 제외한다.
    """
    if not address_hint or not candidate_address:
        return True
    tokens = re.findall(r'[가-힣]+(?:시|도|구|군|동|읍|면|로|길)', address_hint)
    specific_tokens = [t for t in tokens if not t.endswith('도')]
    tokens = specific_tokens or tokens
    if not tokens:
        return True
    return any(token in candidate_address for token in tokens)


def _pick_kto_match(kto_places: list, address_hint: str):
    """KTO 후보들 중 address_hint와 지역이 일치하는 것을 우선 선택, 없으면 1순위 후보."""
    if not kto_places:
        return None
    if address_hint:
        for p in kto_places:
            if _address_matches(p.address, address_hint):
                return p
    return kto_places[0]


def _pick_kakao_match(candidates: list, address_hint: str):
    """카카오 후보들 중 address_hint와 지역이 일치하는 것을 우선 선택, 없으면 1순위 후보."""
    if not candidates:
        return None
    if address_hint:
        for c in candidates:
            if _address_matches(c['address'], address_hint):
                return c
    return candidates[0]


def _kakao_search_candidates(query: str, size: int = 5, lat=None, lng=None, radius: int = None) -> list:
    """카카오 키워드 검색 → 후보 리스트(최대 size개) 반환. 실패 시 빈 리스트.
    lat/lng를 주면 그 좌표 반경(radius, 기본 1000m) 내로 검색을 제한한다 — 이미
    위치를 아는 장소를 이름으로 재검색할 때, "성균관"처럼 훨씬 유명한 동명의
    다른 지역 후보가 전국 검색 순위를 다 차지해서 진짜 후보가 애초에 후보군에
    들어오지도 못하는 문제를 막기 위함."""
    if not settings.KAKAO_REST_KEY or not query:
        return []
    headers = {'Authorization': f'KakaoAK {settings.KAKAO_REST_KEY}'}
    params = {'query': query, 'size': size}
    if lat is not None and lng is not None:
        params['x'] = lng
        params['y'] = lat
        params['radius'] = radius or 1000
    try:
        r = http_requests.get(
            'https://dapi.kakao.com/v2/local/search/keyword.json',
            params=params,
            headers=headers, timeout=5,
        )
        docs = r.json().get('documents', [])
        return [
            {
                'name':             d['place_name'],
                'address':          d.get('road_address_name') or d.get('address_name', ''),
                'lat':              float(d['y']),
                'lng':              float(d['x']),
                'kakao_place_id':   d.get('id'),
                'kakao_place_url':  d.get('place_url'),
            }
            for d in docs
        ]
    except Exception:
        return []


def kakao_reverse_geocode(lat, lng):
    """좌표 → 행정 주소(도로명 우선, 없으면 지번) 변환. 실패 시 None.
    AI가 추정한 장소명/주소가 부정확할 때, 저장된 좌표가 실제로 어디를 가리키는지
    관리자가 확인할 수 있도록 지원한다."""
    if not settings.KAKAO_REST_KEY or lat is None or lng is None:
        return None
    headers = {'Authorization': f'KakaoAK {settings.KAKAO_REST_KEY}'}
    try:
        r = http_requests.get(
            'https://dapi.kakao.com/v2/local/geo/coord2address.json',
            params={'x': lng, 'y': lat},
            headers=headers, timeout=5,
        )
        docs = r.json().get('documents', [])
        if not docs:
            return None
        doc = docs[0]
        road = doc.get('road_address')
        if road and road.get('address_name'):
            return road['address_name']
        jibun = doc.get('address')
        return jibun['address_name'] if jibun else None
    except Exception:
        return None


NEARBY_CATEGORY_CODES = ['AT4', 'FD6', 'CE7', 'CT1', 'AD5']  # 관광명소/음식점/카페/문화시설/숙박


def kakao_nearby_search(lat, lng, radius: int = 200, limit: int = 15) -> list:
    """좌표 주변의 실제 업체 목록을 카테고리 검색으로 가져온다(거리순, 중복 제거, 최대 limit개).
    관리자가 AI 추정 위치의 핀 주변에 실제로 어떤 업체들이 있는지 지도에서 확인하고
    직접 선택할 수 있도록 지원한다."""
    if not settings.KAKAO_REST_KEY or lat is None or lng is None:
        return []
    headers = {'Authorization': f'KakaoAK {settings.KAKAO_REST_KEY}'}
    seen = set()
    results = []
    for code in NEARBY_CATEGORY_CODES:
        try:
            r = http_requests.get(
                'https://dapi.kakao.com/v2/local/search/category.json',
                params={'category_group_code': code, 'x': lng, 'y': lat, 'radius': radius, 'sort': 'distance'},
                headers=headers, timeout=5,
            )
            for d in r.json().get('documents', []):
                place_id = d.get('id')
                if not place_id or place_id in seen:
                    continue
                seen.add(place_id)
                results.append({
                    'name': d['place_name'],
                    'address': d.get('road_address_name') or d.get('address_name', ''),
                    'lat': float(d['y']),
                    'lng': float(d['x']),
                    'distance': int(d['distance']) if d.get('distance') else None,
                    'category': d.get('category_group_name', ''),
                })
        except Exception:
            continue
    results.sort(key=lambda r: r['distance'] if r['distance'] is not None else 999999)
    return results[:limit]


def kakao_search(query: str, lat=None, lng=None, radius: int = None):
    """
    카카오 키워드 검색 → {name, address, lat, lng} 반환(1순위 후보). 실패 시 None.
    주소는 도로명 > 지번 순으로 우선 사용.
    """
    candidates = _kakao_search_candidates(query, size=1, lat=lat, lng=lng, radius=radius)
    return candidates[0] if candidates else None


def kakao_geocode_full(query: str, address_hint: str = '', lat=None, lng=None, radius: int = None):
    """
    카카오 REST API로 장소명/주소 검색 → 매칭된 후보 전체
    ({name, address, lat, lng, kakao_place_id, kakao_place_url})를 반환. 실패 시 None.
    address_hint를 주면 후보들 중 지역이 일치하는 곳을 우선 선택한다.
    lat/lng를 주면(이미 신뢰할 수 있는 좌표를 아는 경우) 그 근처로 검색을 좁혀서,
    이름이 유명해서 다른 지역 동명 후보에 밀리는 것을 방지한다.
    키워드 검색으로 후보를 못 찾으면 주소 검색 API로 좌표만 얻어
    name/kakao_place_id/kakao_place_url을 None으로 채운 dict를 반환한다.
    """
    if address_hint:
        match = _pick_kakao_match(_kakao_search_candidates(query, lat=lat, lng=lng, radius=radius), address_hint)
    else:
        match = kakao_search(query, lat=lat, lng=lng, radius=radius)
    if match:
        return match
    if not settings.KAKAO_REST_KEY or not query:
        return None
    # 주소 검색도 시도
    try:
        headers = {'Authorization': f'KakaoAK {settings.KAKAO_REST_KEY}'}
        r = http_requests.get(
            'https://dapi.kakao.com/v2/local/search/address.json',
            params={'query': query, 'size': 1},
            headers=headers, timeout=5,
        )
        docs = r.json().get('documents', [])
        if docs:
            d = docs[0]
            return {
                'name': None,
                'address': d.get('address_name', query),
                'lat': float(d['y']),
                'lng': float(d['x']),
                'kakao_place_id': None,
                'kakao_place_url': None,
            }
    except Exception:
        pass
    return None


def kakao_geocode(query: str, address_hint: str = ''):
    """
    카카오 REST API로 장소명/주소 → (lat, lng) 변환. 실패 시 None 반환.
    address_hint를 주면 후보들 중 지역이 일치하는 곳을 우선 선택한다.
    """
    match = kakao_geocode_full(query, address_hint)
    return (match['lat'], match['lng']) if match else None


def resolve_place(name: str, address_hint: str, video_id: str, log=lambda msg: None):
    """
    장소명 + AI가 추론한 주소 힌트로 실제 Place를 매칭/생성한다.
    KTO 후보 중 address_hint와 지역이 일치하는 것을 우선 선택하고,
    주소가 부정확하면 카카오로 보완한다. KTO 매칭이 전혀 없으면
    카카오 좌표 검색 결과로 미확정 Place를 생성한다.
    management command(CLI)와 web view 양쪽에서 공통으로 사용한다.
    """
    kto_places = _kto_search(name)
    place = _pick_kto_match(kto_places, address_hint)

    if place:
        if not _has_precise_address(place.address):
            kakao_match = _pick_kakao_match(_kakao_search_candidates(place.name), address_hint)
            if kakao_match and _has_precise_address(kakao_match['address']):
                place.address = kakao_match['address']
                place.latitude = kakao_match['lat']
                place.longitude = kakao_match['lng']
                place.save(update_fields=['address', 'latitude', 'longitude'])
                log(f'  KTO+카카오 주소 보완: {place.name} → {place.address}')
            else:
                log(f'  KTO 확인: {place.name}')
        else:
            log(f'  KTO 확인: {place.name}')
        return place

    # KTO 매칭 없음 → 카카오 검색으로 미확정 Place 생성
    # (좌표뿐 아니라 매칭된 후보의 실제 name/address/kakao_place_id/url까지 그대로 사용 —
    # AI의 address_hint 원문을 저장하면 좌표는 맞는데 주소 텍스트만 틀린 채 안 보이게 남는 문제 방지)
    match = kakao_geocode_full(name, address_hint) or kakao_geocode_full(address_hint, address_hint)
    verified = match is not None
    lat, lng = (match['lat'], match['lng']) if match else (0, 0)
    resolved_name = (match and match.get('name')) or name
    resolved_address = (match and match.get('address')) or address_hint

    safe = re.sub(r'[^a-zA-Z0-9가-힣]', '_', name)[:20]
    place, created = Place.objects.get_or_create(
        content_id=f'yt_{video_id}_{safe}',
        defaults={
            'name': resolved_name,
            'address': resolved_address,
            'latitude': lat,
            'longitude': lng,
            'is_verified': verified,
            'kakao_place_id': match.get('kakao_place_id') if match else None,
            'kakao_place_url': match.get('kakao_place_url') if match else None,
        },
    )
    if not created and float(place.latitude) == 0 and match:
        place.latitude = lat
        place.longitude = lng
        place.is_verified = True
        place.save(update_fields=['latitude', 'longitude', 'is_verified'])

    log(f'  카카오 매칭: {place.name} → {resolved_address} ({lat}, {lng})' if match else f'  미확정 저장: {place.name}')
    return place


# ── 장소 최신화 / 근처 추천 장소 ──────────────────────────────────────────────

KST = ZoneInfo('Asia/Seoul')
# 관광공사 원본 데이터는 콘텐츠 수정일 기준 다음날 새벽 04:30 또는 07:30에 서비스별로
# 동기화된다(공사 안내). 지금 쓰는 국내관광정보는 04:30 티어지만, 이후 두루누비 등
# 07:30 티어 데이터를 추가로 쓸 수도 있어 더 늦은 07:30 기준으로 30분 여유를 두고
# 08:00을 공통 기준으로 삼는다.
DAILY_SYNC_HOUR = 8


def _last_sync_cutoff(now=None):
    """가장 최근에 지난 08:00(KST) 시각을 반환한다.
    이 시각 이전에 저장된 값은 전날 이전 데이터일 수 있으므로 '오래됨'으로 취급한다."""
    now = (now or timezone.now()).astimezone(KST)
    cutoff = now.replace(hour=DAILY_SYNC_HOUR, minute=0, second=0, microsecond=0)
    if now < cutoff:
        cutoff -= timedelta(days=1)
    return cutoff


def _kto_detail_common(content_id: str):
    """KTO 상세조회(detailCommon2) — contentId로 특정 장소의 최신 정보를 가져온다.
    유튜브 파싱으로 생성된 미확정 장소(content_id가 'yt_'로 시작)는 KTO 데이터가 아니므로 건너뛴다."""
    if not content_id or content_id.startswith('yt_'):
        return None
    url = "http://apis.data.go.kr/B551011/KorService2/detailCommon2"
    params = {
        'serviceKey': settings.TOUR_API_KEY,
        'MobileApp': 'YogiEoddae',
        'MobileOS': 'ETC',
        'contentId': content_id,
        '_type': 'json',
    }
    try:
        response = http_requests.get(url, params=params, timeout=10)
        data = response.json()
        items_data = data.get('response', {}).get('body', {}).get('items')
        if not items_data or not items_data.get('item'):
            return None
        item = items_data['item']
        return item[0] if isinstance(item, list) else item
    except Exception:
        return None


def refresh_place_if_stale(place: 'Place') -> bool:
    """조회 시점 기준 last_synced_at이 가장 최근 05:00(KST) 동기화 시각보다 이전이면
    KTO 상세조회로 갱신한다(lazy, 정기 배치 아님 — 실제로 조회되는 시점에만 갱신하므로
    특정 시각에 호출이 몰리지 않는다). 실패해도 조용히 무시 — 캐시된 값을 그대로 유지해
    사용자 응답에는 영향을 주지 않는다."""
    if place.last_synced_at and place.last_synced_at >= _last_sync_cutoff():
        return False

    item = _kto_detail_common(place.content_id)
    if not item:
        return False

    place.name = item.get('title') or place.name
    place.address = item.get('addr1') or place.address
    place.latitude = item.get('mapy') or place.latitude
    place.longitude = item.get('mapx') or place.longitude
    place.image_url = item.get('firstimage') or place.image_url
    place.category = item.get('contenttypeid') or place.category
    place.last_synced_at = timezone.now()
    place.save(update_fields=['name', 'address', 'latitude', 'longitude', 'image_url', 'category', 'last_synced_at'])
    return True


def fetch_nearby_places(lat, lng, exclude_content_id: str = '', radius: int = 2000, count: int = 5) -> list:
    """좌표 근처의 장소를 KTO locationBasedList2로 매 요청마다 실시간 조회한다.
    결과는 DB에 저장하지 않고, 후보 중 무작위로 count개를 뽑아 가벼운 dict로 반환한다."""
    if not lat or not lng:
        return []
    url = "http://apis.data.go.kr/B551011/KorService2/locationBasedList2"
    params = {
        'serviceKey': settings.TOUR_API_KEY,
        'MobileApp': 'YogiEoddae',
        'MobileOS': 'ETC',
        'mapX': lng,
        'mapY': lat,
        'radius': radius,
        'arrange': 'E',
        'numOfRows': 30,
        '_type': 'json',
    }
    try:
        response = http_requests.get(url, params=params, timeout=10)
        data = response.json()
        items_data = data.get('response', {}).get('body', {}).get('items')
        if not items_data or not items_data.get('item'):
            return []
        items = items_data['item']
        if isinstance(items, dict):
            items = [items]
    except Exception:
        return []

    candidates = [
        {
            'content_id': it['contentid'],
            'name': it.get('title', ''),
            'address': it.get('addr1', ''),
            'latitude': it.get('mapy'),
            'longitude': it.get('mapx'),
            'image_url': it.get('firstimage', ''),
            'category': it.get('contenttypeid', ''),
        }
        for it in items
        if it.get('contentid') and it['contentid'] != exclude_content_id
    ]
    # 후보 풀(최대 30개)이 필요 개수(count)보다 넉넉하므로, 이미지 있는 후보를 우선 채우고
    # 부족할 때만 이미지 없는 후보로 채운다(KTO의 firstimage가 일부 항목만 비어있는 경우가 많음).
    with_image = [c for c in candidates if c['image_url']]
    without_image = [c for c in candidates if not c['image_url']]
    random.shuffle(with_image)
    random.shuffle(without_image)
    return (with_image + without_image)[:count]


def get_or_create_place_by_content_id(content_id: str):
    """근처 추천 장소 카드를 탭한 시점에 그 장소를 정식 Place로 등록한다.
    이미 등록돼 있으면 그대로 반환하고, 없으면 KTO 상세조회로 채워서 새로 만든다."""
    existing = Place.objects.filter(content_id=content_id).first()
    if existing:
        return existing

    item = _kto_detail_common(content_id)
    if not item:
        return None

    return Place.objects.create(
        content_id=content_id,
        name=item.get('title', ''),
        address=item.get('addr1', ''),
        latitude=item.get('mapy') or 0,
        longitude=item.get('mapx') or 0,
        image_url=item.get('firstimage', ''),
        category=item.get('contenttypeid', ''),
        is_verified=True,
        last_synced_at=timezone.now(),
    )


class _Writer:
    """추출 로그를 캡처하는 더미 writer."""
    def __init__(self):
        self.lines = []

    def write(self, msg='', ending='\n'):
        self.lines.append(str(msg))


def run_extraction(url, media_title, media_type, max_locations, ai_choice, scene=''):
    """
    YouTube URL에서 장소를 추출해 DB에 status=inferred 로 저장.

    Returns:
        dict: {media, places(list[MediaPlace]), log(list[str]), error(str|None)}
    """
    video_id = _extract_video_id(url)
    if not video_id:
        return {'media': None, 'places': [], 'log': [], 'error': '유효한 YouTube URL이 아닙니다.'}

    if not settings.YOUTUBE_API_KEY:
        return {'media': None, 'places': [], 'log': [], 'error': 'YOUTUBE_API_KEY가 설정되지 않았습니다.'}
    if ai_choice == 'gemini' and not settings.GEMINI_API_KEY:
        return {'media': None, 'places': [], 'log': [], 'error': 'GEMINI_API_KEY가 설정되지 않았습니다.'}
    if ai_choice == 'claude' and not settings.ANTHROPIC_API_KEY:
        return {'media': None, 'places': [], 'log': [], 'error': 'ANTHROPIC_API_KEY가 설정되지 않았습니다.'}

    writer = _Writer()

    try:
        youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)

        video_info = _fetch_video_info(youtube, video_id)
        if not video_info:
            return {'media': None, 'places': [], 'log': [], 'error': '영상 정보를 가져올 수 없습니다.'}

        writer.write(f'제목: {video_info["title"]}')

        comments = _fetch_comments(youtube, video_id)
        writer.write(f'댓글 {len(comments)}개 수집')

        transcript, segments = _fetch_transcript(video_id)
        chapters = _parse_chapters(video_info['description'])
        chapter_transcript = _build_chapter_transcript(segments, chapters)
        writer.write(f'자막 {len(transcript)}자 / 챕터 {len(chapters)}개')

        context = {
            'title': video_info['title'],
            'description': video_info['description'],
            'tags': video_info['tags'],
            'transcript': transcript,
            'segments': segments,
            'chapters': chapters,
            'chapter_transcript': chapter_transcript,
            'comments': comments,
            'max_locations': max_locations,
        }

        writer.write(f'AI({ai_choice}) 장소 추론 중...')
        if ai_choice == 'gemini':
            inferred = _gemini_infer(settings.GEMINI_API_KEY, context, writer)
        else:
            inferred = _claude_infer(settings.ANTHROPIC_API_KEY, context, writer)

        if not inferred:
            return {'media': None, 'places': [], 'log': writer.lines, 'error': '추론된 장소가 없습니다.'}

        writer.write(f'추론 결과: {len(inferred)}개')

        media, created = Media.objects.get_or_create(
            title=media_title,
            defaults={
                'media_type': media_type,
                'source_url': url,
                'thumbnail_url': f'https://img.youtube.com/vi/{video_id}/hqdefault.jpg',
                'description': video_info.get('description', '')[:500],
            },
        )
        if not created and not media.source_url:
            media.source_url = url
            media.save(update_fields=['source_url'])
        writer.write(f'미디어 {"생성" if created else "기존"}: {media.title}')

        saved = []
        for loc in inferred:
            name = loc.get('name', '').strip()
            if not name:
                continue

            confidence = float(loc.get('confidence', 0.5))
            reason = loc.get('reason', '')
            address_hint = loc.get('address_hint', '')

            place = resolve_place(name, address_hint, video_id, log=writer.write)

            mp, mp_created = MediaPlace.objects.get_or_create(
                media=media,
                place=place,
                defaults={
                    'scene_description': scene or reason,
                    'confidence_score': confidence,
                    'is_confirmed': False,
                    'status': MediaPlace.STATUS_INFERRED,
                    'ai_reason': reason,
                    'source_video_id': video_id,
                },
            )
            if not mp_created:
                mp.status = MediaPlace.STATUS_INFERRED
                mp.confidence_score = confidence
                mp.ai_reason = reason
                mp.source_video_id = video_id
                mp.save()

            saved.append(mp)

        writer.write(f'저장 완료: {len(saved)}개')
        return {'media': media, 'places': saved, 'log': writer.lines, 'error': None}

    except Exception as e:
        logger.exception('장소 추출 중 오류')
        return {'media': None, 'places': [], 'log': writer.lines, 'error': str(e)}


# ── 재생목록 일괄 추출 ─────────────────────────────────────────────────────────

PLAYLIST_MAX_VIDEOS = 200  # 재생목록 조회 시 캡(과도한 쿼터 소진 방지)


def _extract_playlist_id(url: str):
    m = re.search(r'[?&]list=([a-zA-Z0-9_-]+)', url or '')
    return m.group(1) if m else None


def _parse_iso8601_duration_minutes(duration: str) -> int:
    """'PT25M3S' 같은 ISO 8601 duration 문자열을 분 단위(반올림)로 변환."""
    m = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration or '')
    if not m:
        return 0
    h, mi, s = (int(g) if g else 0 for g in m.groups())
    return round(h * 60 + mi + s / 60)


def _max_locations_for_minutes(minutes: int) -> int:
    """기존 단일 추출 폼의 '30분마다 10개' 규칙과 동일."""
    if not minutes or minutes <= 0:
        return 10
    return (minutes // 30 + 1) * 10


def _compute_duplicate_ids(video_ids: list) -> set:
    """주어진 video_id들 중 이미 장소 추출이 완료된(=MediaPlace가 있거나 그 영상 URL로 만들어진
    Media가 있는) 것들의 집합을 한 번에(대량 쿼리로) 계산한다."""
    if not video_ids:
        return set()
    dup_ids = set(
        MediaPlace.objects.filter(source_video_id__in=video_ids).values_list('source_video_id', flat=True)
    )
    media_video_ids = {
        _extract_video_id(url)
        for url in Media.objects.exclude(source_url='').values_list('source_url', flat=True)
    }
    dup_ids |= {vid for vid in media_video_ids if vid in video_ids}
    return dup_ids


def refresh_duplicate_flags(videos: list) -> list:
    """저장된 재생목록 조회 기록을 나중에 다시 열람할 때 '이미 처리됨' 표시를 최신 상태로 갱신한다.
    videos에 저장된 is_duplicate는 최초 조회 시점의 스냅샷이라, 그 이후에 해당 영상들 중 일부가
    실제로 장소 추출됐어도 반영되지 않는 문제가 있었음 — 다시 보여줄 때마다 이 함수로 재계산한다."""
    video_ids = [v['video_id'] for v in videos]
    dup_ids = _compute_duplicate_ids(video_ids)
    for v in videos:
        v['is_duplicate'] = v['video_id'] in dup_ids
    return videos


def fetch_playlist_videos(playlist_url: str) -> dict:
    """
    재생목록 URL → 영상 목록 반환.
    각 항목: video_id, title, position, upload_date, duration_minutes,
             max_locations(자동계산), has_caption, is_duplicate
    """
    playlist_id = _extract_playlist_id(playlist_url)
    if not playlist_id:
        return {'videos': [], 'error': '유효한 재생목록 URL이 아닙니다 (list= 파라미터를 찾을 수 없음).'}
    if not settings.YOUTUBE_API_KEY:
        return {'videos': [], 'error': 'YOUTUBE_API_KEY가 설정되지 않았습니다.'}

    youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)

    items = []
    page_token = None
    try:
        while True:
            resp = youtube.playlistItems().list(
                part='snippet,contentDetails',
                playlistId=playlist_id,
                maxResults=50,
                pageToken=page_token,
            ).execute()
            items.extend(resp.get('items', []))
            page_token = resp.get('nextPageToken')
            if not page_token or len(items) >= PLAYLIST_MAX_VIDEOS:
                break
    except Exception as e:
        return {'videos': [], 'error': f'재생목록 조회 실패: {e}'}

    items = items[:PLAYLIST_MAX_VIDEOS]
    video_ids = [
        it['contentDetails']['videoId'] for it in items
        if it.get('contentDetails', {}).get('videoId')
    ]

    # 영상 길이(duration)를 일괄 조회 — videos.list는 한 번에 최대 50개까지만 가능
    durations = {}
    for i in range(0, len(video_ids), 50):
        chunk = video_ids[i:i + 50]
        try:
            resp = youtube.videos().list(part='contentDetails', id=','.join(chunk)).execute()
            for v in resp.get('items', []):
                durations[v['id']] = _parse_iso8601_duration_minutes(v['contentDetails'].get('duration', ''))
        except Exception:
            pass

    dup_ids = _compute_duplicate_ids(video_ids)

    videos = []
    for it in items:
        cd = it.get('contentDetails', {})
        sn = it.get('snippet', {})
        video_id = cd.get('videoId')
        if not video_id:
            continue
        upload_date = (cd.get('videoPublishedAt') or sn.get('publishedAt') or '')[:10]
        duration_minutes = durations.get(video_id, 0)
        has_caption = bool(_fetch_transcript(video_id)[0])
        videos.append({
            'video_id':         video_id,
            'title':            sn.get('title', '(제목 없음)'),
            'position':         sn.get('position', 0),
            'upload_date':      upload_date,
            'duration_minutes': duration_minutes,
            'max_locations':    _max_locations_for_minutes(duration_minutes),
            'has_caption':      has_caption,
            'is_duplicate':     video_id in dup_ids,
        })

    return {'videos': videos, 'error': None}


def run_playlist_fetch_job(fetch_job_id: int):
    """재생목록 조회를 백그라운드에서 실행하고 결과를 PlaylistFetchJob에 기록한다.
    threading.Thread(target=run_playlist_fetch_job)로 호출된다."""
    from places.models import PlaylistFetchJob

    job = PlaylistFetchJob.objects.filter(pk=fetch_job_id).first()
    if not job:
        return
    try:
        result = fetch_playlist_videos(job.playlist_url)
        if result['error']:
            PlaylistFetchJob.objects.filter(pk=fetch_job_id).update(
                status=PlaylistFetchJob.STATUS_ERROR, error=result['error'])
        else:
            PlaylistFetchJob.objects.filter(pk=fetch_job_id).update(
                status=PlaylistFetchJob.STATUS_DONE, videos=result['videos'])
    except Exception as e:
        logger.exception('재생목록 조회 중 오류')
        PlaylistFetchJob.objects.filter(pk=fetch_job_id).update(
            status=PlaylistFetchJob.STATUS_ERROR, error=str(e))


_QUOTA_ERROR_HINTS = [
    '429', 'quota', 'resource_exhausted', 'rate limit', 'ratelimit',
    'insufficient_quota', 'credit balance', 'too many requests',
]


def _looks_like_quota_error(message: str) -> bool:
    """AI 호출 실패 사유가 토큰/쿼터 소진으로 보이는지 대략적으로 판정 (SDK 버전별 예외 클래스가 달라
    문자열 휴리스틱으로 판단 — run_extraction()이 예외를 문자열로만 반환하기 때문)."""
    m = (message or '').lower()
    return any(hint in m for hint in _QUOTA_ERROR_HINTS)


def _run_one_video(job, video: dict, ai_choice: str) -> dict:
    """
    영상 1개를 run_extraction()으로 처리한다.
    기본(개별 추출, merge_videos=False)은 그 영상 자체의 YouTube 제목으로 별도 Media를 만든다 —
    재생목록 속 영상들이 서로 다른 주제(예: 여행 유튜버의 각기 다른 여행지)인 경우가 보통이라서.
    "통합 추출"(merge_videos=True)을 선택했을 때만 job.media_title 하나로 전부 묶는다
    (여러 회차가 한 작품인 경우를 위한 예외적 모드).
    """
    video_url = f"https://www.youtube.com/watch?v={video['video_id']}"
    max_locations = video.get('max_locations') or 10
    media_title = job.media_title if job.merge_videos else (video.get('title') or job.media_title)
    return run_extraction(video_url, media_title, job.media_type, max_locations, ai_choice, job.scene)


def run_batch_job(job_id: int):
    """
    재생목록 일괄 추출 백그라운드 실행 함수 — threading.Thread(target=run_batch_job)로 호출된다.

    취소 요청("cancel_requested")이 들어오면 처리 중이던 영상은 끝까지 완료(결과 저장)하고
    다음 영상은 시작하지 않는다. 처리 중인 영상의 AI 응답을 기다리는 시간은 취소 여부와
    무관하게 그대로 흐르므로, "즉시 중단하고 그 영상 결과를 버리는" 옵션은 두지 않는다
    (완료를 기다리는 시간이 같다면 결과를 버릴 이유가 없음 — 필요하면 완료 후 관리자 화면에서
    해당 미디어를 수동 삭제하면 됨).
    """
    from places.models import PlaylistExtractionJob as Job

    job = Job.objects.filter(pk=job_id).first()
    if not job:
        return

    current_ai = job.ai_choice
    videos = job.videos
    cancelled = False

    for idx, video in enumerate(videos):
        if video.get('status') != 'queued':
            continue

        try:
            fresh_cancel = Job.objects.filter(pk=job_id).values_list('cancel_requested', flat=True).first()
            if fresh_cancel:
                cancelled = True
                break

            video['status'] = 'processing'
            Job.objects.filter(pk=job_id).update(videos=videos, current_index=idx)

            result = _run_one_video(job, video, current_ai)

            if (result.get('error') and _looks_like_quota_error(result['error'])
                    and current_ai != job.fallback_ai_choice):
                # 토큰/쿼터 소진으로 보임 → 대체 AI로 전환해서 이 영상부터 재시도, 이후 영상도 계속 대체 AI 사용
                current_ai = job.fallback_ai_choice
                result = _run_one_video(job, video, current_ai)

            if result.get('error'):
                video['status'] = 'failed'
                video['error'] = result['error']
            else:
                video['status'] = 'success'
                video['media_place_count'] = len(result['places'])
                video['ai_used'] = current_ai

            Job.objects.filter(pk=job_id).update(videos=videos, current_index=idx)

            fresh_cancel = Job.objects.filter(pk=job_id).values_list('cancel_requested', flat=True).first()
            if fresh_cancel:
                cancelled = True
                break

        except Exception as e:
            logger.exception('재생목록 일괄 추출 중 영상 처리 오류')
            video['status'] = 'failed'
            video['error'] = str(e)
            Job.objects.filter(pk=job_id).update(videos=videos, current_index=idx)

    if cancelled:
        for v in videos:
            if v.get('status') == 'queued':
                v['status'] = 'cancelled'
        Job.objects.filter(pk=job_id).update(videos=videos, status=Job.STATUS_CANCELLED, cancel_requested=False)
    else:
        Job.objects.filter(pk=job_id).update(status=Job.STATUS_DONE, cancel_requested=False)
