"""
장소 추출 서비스 — management command와 web view 양쪽에서 호출 가능.
"""
import re
import logging

import requests as http_requests
from django.conf import settings
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


def _kakao_search_candidates(query: str, size: int = 5) -> list:
    """카카오 키워드 검색 → 후보 리스트(최대 size개) 반환. 실패 시 빈 리스트."""
    if not settings.KAKAO_REST_KEY or not query:
        return []
    headers = {'Authorization': f'KakaoAK {settings.KAKAO_REST_KEY}'}
    try:
        r = http_requests.get(
            'https://dapi.kakao.com/v2/local/search/keyword.json',
            params={'query': query, 'size': size},
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


def kakao_search(query: str):
    """
    카카오 키워드 검색 → {name, address, lat, lng} 반환(1순위 후보). 실패 시 None.
    주소는 도로명 > 지번 순으로 우선 사용.
    """
    candidates = _kakao_search_candidates(query, size=1)
    return candidates[0] if candidates else None


def kakao_geocode(query: str, address_hint: str = ''):
    """
    카카오 REST API로 장소명/주소 → (lat, lng) 변환. 실패 시 None 반환.
    address_hint를 주면 후보들 중 지역이 일치하는 곳을 우선 선택한다.
    """
    if address_hint:
        match = _pick_kakao_match(_kakao_search_candidates(query), address_hint)
    else:
        match = kakao_search(query)
    if match:
        return match['lat'], match['lng']
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
            return float(docs[0]['y']), float(docs[0]['x'])
    except Exception:
        pass
    return None


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

    # KTO 매칭 없음 → 카카오 좌표 검색으로 미확정 Place 생성
    coords = kakao_geocode(name, address_hint) or kakao_geocode(address_hint, address_hint)
    lat, lng = coords if coords else (0, 0)
    verified = coords is not None

    safe = re.sub(r'[^a-zA-Z0-9가-힣]', '_', name)[:20]
    place, created = Place.objects.get_or_create(
        content_id=f'yt_{video_id}_{safe}',
        defaults={
            'name': name,
            'address': address_hint,
            'latitude': lat,
            'longitude': lng,
            'is_verified': verified,
        },
    )
    if not created and float(place.latitude) == 0 and coords:
        place.latitude = lat
        place.longitude = lng
        place.is_verified = True
        place.save(update_fields=['latitude', 'longitude', 'is_verified'])

    log(f'  카카오 좌표: {place.name} ({lat}, {lng})' if coords else f'  미확정 저장: {place.name}')
    return place


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
                },
            )
            if not mp_created:
                mp.status = MediaPlace.STATUS_INFERRED
                mp.confidence_score = confidence
                mp.ai_reason = reason
                mp.save()

            saved.append(mp)

        writer.write(f'저장 완료: {len(saved)}개')
        return {'media': media, 'places': saved, 'log': writer.lines, 'error': None}

    except Exception as e:
        logger.exception('장소 추출 중 오류')
        return {'media': None, 'places': [], 'log': writer.lines, 'error': str(e)}
