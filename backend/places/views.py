import json
import os
import threading
import uuid

import requests
from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models import Count, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Place, Media, MediaPlace, Tag, Photo, PhotoImage, PhotoLike
from .serializers import (
    PlaceSerializer, PlaceMapSerializer,
    MediaSerializer, MediaDetailSerializer, MediaPlaceSerializer,
    TagSerializer, PhotoSerializer, PhotoSpotDetailSerializer,
)
from .moderation import moderate_photo, CATEGORY_LABELS
from .services import refresh_place_if_stale, fetch_nearby_places, get_or_create_place_by_content_id
from bookmarks.models import MediaBookmark, PlaceBookmark
from mailbox.services import check_and_grant_like_milestone, grant_photo_publish_reward
from quiz.models import QuizSubmission, QuizAnswer
from quiz.services import grade_answer, recalculate_media_place, grant_quiz_rewards


def place_map_test(request):
    places = Place.objects.all()
    return render(request, 'places/map_test.html', {
        'places': places,
        'naver_client_id': settings.NAVER_CLIENT_ID,
    })


def demo_view(request):
    media_list = Media.objects.all().order_by('media_type', 'title')
    return render(request, 'places/demo.html', {
        'media_list': media_list,
        'kakao_js_key': settings.KAKAO_JS_KEY,
    })


def _parse_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def map_embed_view(request):
    """앱 WebView가 실제 URL로 내비게이션해서 불러오는 카카오 지도 임베드 페이지.
    앱 안에서 인라인 HTML(baseUrl 트릭)로 로드하면 Referer가 안 실려 카카오 도메인 인증이
    조용히 실패하는 문제가 있어서(2026-08-18 실기기 확인), 진짜 서버 URL로 내비게이션시켜
    데모 페이지와 동일하게 정상적으로 도메인 인증이 되도록 만든 전용 엔드포인트."""
    places = []
    places_raw = request.GET.get('places')
    if places_raw:
        try:
            raw_list = json.loads(places_raw)
        except (ValueError, TypeError):
            raw_list = []
        for p in raw_list if isinstance(raw_list, list) else []:
            if not isinstance(p, dict):
                continue
            lat = _parse_float(p.get('lat'))
            lng = _parse_float(p.get('lng'))
            if lat is not None and lng is not None:
                places.append({'name': str(p.get('name', ''))[:100], 'lat': lat, 'lng': lng})

    lat = _parse_float(request.GET.get('lat'))
    lng = _parse_float(request.GET.get('lng'))

    return render(request, 'places/map_embed.html', {
        'kakao_js_key': settings.KAKAO_JS_KEY,
        'lat': lat if lat is not None else 0,
        'lng': lng if lng is not None else 0,
        'title': (request.GET.get('title') or '')[:100],
        'places': places,
    })


def fetch_and_save_places(request):
    # 1. API 호출 설정
    keyword = request.GET.get('keyword', '잠수교')  # 검색어 (기본값: 잠수교)
    url = "http://apis.data.go.kr/B551011/KorService2/searchKeyword2"
    
    params = {
        'serviceKey': settings.TOUR_API_KEY, # .env에서 가져온 키
        'MobileApp': 'YogiEoddae',
        'MobileOS': 'ETC',
        'keyword': keyword,
        '_type': 'json',
        'numOfRows': 10, # 일단 10개만 가져와보자
    }

    try:
        # 2. API 데이터 가져오기
        response = requests.get(url, params=params)
        data = response.json()
        
        # [수정 포인트] 아이템이 있는지 안전하게 확인
        body = data.get('response', {}).get('body', {})
        items_data = body.get('items')
        
        # 검색 결과가 아예 없는 경우 (items가 공백이거나 None일 때)
        if not items_data or not items_data.get('item'):
            return JsonResponse({'status': 'success', 'new_saved': 0, 'message': '검색 결과가 없습니다.'}, json_dumps_params={'ensure_ascii': False})

        items = items_data['item']
        
        # 만약 결과가 딱 1개면 리스트가 아니라 딕셔너리로 올 때가 있어서 리스트로 통일
        if isinstance(items, dict):
            items = [items]

        
        saved_count = 0
        for item in items:
            # 3. 데이터 중복 체크 및 저장 (이미 있으면 업데이트, 없으면 생성)
            place, created = Place.objects.update_or_create(
                content_id=item['contentid'], # 고유 ID 기준
                defaults={
                    'name': item['title'],
                    'address': item.get('addr1', ''),
                    'latitude': item['mapy'],
                    'longitude': item['mapx'],
                    'image_url': item.get('firstimage', ''),
                    'category': item.get('contenttypeid', ''),
                    'last_synced_at': timezone.now(),
                }
            )
            if created:
                saved_count += 1

        return JsonResponse({'status': 'success', 'new_saved': saved_count})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})
    


def get_place_list(request):
    # 1. DB에서 모든 장소 데이터를 가져오기
    # 주소창에서 검색어 가져오기 (예: ?name=박물관)
    search_name = request.GET.get('name', '')

    if search_name:
        # 이름에 검색어가 포함된 것만 가져오기
        places = Place.objects.filter(name__icontains=search_name).order_by('-created_at')
    else:
        # 검색어 없으면 전체 가져오기
        places = Place.objects.all().order_by('-created_at')

    place_list = []
    
    # 2. 데이터를 파이썬 리스트/딕셔너리 형태로 변환
    place_list = []
    for p in places:
        place_list.append({
            'id': p.id,
            'name': p.name,
            'address': p.address,
            'latitude': float(p.latitude),   # Decimal은 JSON으로 바로 못 보내서 숫자로 변환
            'longitude': float(p.longitude),
            'image_url': p.image_url,
        })
    
    # 3. JSON으로 응답 (한글 깨짐 방지 옵션 추가!)
    return JsonResponse(
        {'status': 'success', 'data': place_list},
        json_dumps_params={'ensure_ascii': False}
    )


# ── 관리자 포털 뷰 ───────────────────────────────────────────────────────────

def index_view(request):
    from course_suggestions.models import CourseSuggestion

    pending  = MediaPlace.objects.filter(status=MediaPlace.STATUS_INFERRED).count()
    approved = MediaPlace.objects.filter(status=MediaPlace.STATUS_ADMIN_APPROVED).count()
    quiz     = MediaPlace.objects.filter(status=MediaPlace.STATUS_QUIZ_CONFIRMED).count()
    photo_pending = Photo.objects.filter(status=Photo.STATUS_PENDING).count()
    course_suggestion_pending = CourseSuggestion.objects.filter(status=CourseSuggestion.STATUS_PENDING).count()
    return render(request, 'places/index.html', {
        'pending_count':  pending,
        'approved_count': approved,
        'quiz_count':     quiz,
        'photo_pending_count': photo_pending,
        'course_suggestion_pending_count': course_suggestion_pending,
        'media_count':    Media.objects.count(),
    })


def admin_media_list_view(request):
    media_list = Media.objects.annotate(
        inferred_count=Count('media_places', filter=Q(media_places__status=MediaPlace.STATUS_INFERRED)),
        approved_count=Count('media_places', filter=Q(media_places__status=MediaPlace.STATUS_ADMIN_APPROVED)),
        rejected_count=Count('media_places', filter=Q(media_places__status=MediaPlace.STATUS_REJECTED)),
        quiz_count=Count('media_places', filter=Q(media_places__status=MediaPlace.STATUS_QUIZ_CONFIRMED)),
    ).order_by('-created_at')
    return render(request, 'places/admin_media_list.html', {'media_list': media_list})


def admin_delete_media_view(request, media_id):
    """추출 내역(미디어) 삭제 — 연결된 MediaPlace도 함께 삭제됨."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    media = get_object_or_404(Media, pk=media_id)
    media.delete()
    return JsonResponse({'ok': True})


def admin_extract_view(request):
    if request.method == 'POST':
        from places.services import run_extraction
        url           = request.POST.get('url', '').strip()
        media_title   = request.POST.get('media_title', '').strip()
        media_type    = request.POST.get('media_type', 'youtube')
        max_locations = int(request.POST.get('max_locations') or 10)
        ai_choice     = request.POST.get('ai_choice', 'gemini')
        scene         = request.POST.get('scene', '').strip()

        result = run_extraction(url, media_title, media_type, max_locations, ai_choice, scene)
        if result['error']:
            return render(request, 'places/admin_extract.html', {
                'error': result['error'],
                'form': request.POST,
            })
        return redirect('admin_review', media_id=result['media'].pk)

    prefill = {}
    media_id = request.GET.get('media_id')
    if media_id:
        from .models import Media as _Media
        try:
            m = _Media.objects.get(pk=media_id)
            prefill = {
                'url':         m.source_url,
                'media_title': m.title,
                'media_type':  m.media_type,
                'max_locations': '10',
            }
        except _Media.DoesNotExist:
            pass
    return render(request, 'places/admin_extract.html', {'form': prefill} if prefill else {})


def admin_revoke_approval_view(request, mp_id):
    """승인된 장소를 다시 검토 대기 상태로 되돌리기."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    mp = get_object_or_404(MediaPlace, pk=mp_id, status=MediaPlace.STATUS_ADMIN_APPROVED)
    mp.status       = MediaPlace.STATUS_INFERRED
    mp.is_confirmed = False
    mp.save(update_fields=['status', 'is_confirmed'])
    return JsonResponse({'ok': True})


def admin_geocode_media_view(request, media_id):
    """미디어에 연결된 장소 중 주소가 불명확한 것을 카카오로 일괄 보완."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    from .services import kakao_search, _has_precise_address
    media = get_object_or_404(Media, pk=media_id)
    places = Place.objects.filter(media_places__media=media).distinct()

    updated, skipped = 0, 0
    for place in places:
        if _has_precise_address(place.address):
            skipped += 1
            continue
        kakao = kakao_search(place.name)
        if kakao and _has_precise_address(kakao['address']):
            place.address   = kakao['address']
            place.latitude  = kakao['lat']
            place.longitude = kakao['lng']
            place.save(update_fields=['address', 'latitude', 'longitude'])
            updated += 1
        else:
            skipped += 1

    return JsonResponse({'ok': True, 'updated': updated, 'skipped': skipped})


def admin_place_search_view(request):
    """장소명으로 KTO → Kakao 순서로 검색, 후보 목록 반환."""
    keyword = request.GET.get('q', '').strip()
    if not keyword:
        return JsonResponse({'results': []})

    # 1차: KTO 관광공사 검색
    from places.management.commands.fetch_youtube_place import _kto_search
    from places.services import kakao_search, _has_precise_address
    candidates = _kto_search(keyword, num_rows=5)
    results = []
    for p in candidates:
        if not p.address:
            continue
        addr = p.address
        lat  = float(p.latitude)
        lng  = float(p.longitude)
        # KTO 주소가 불명확하면 카카오로 보완
        if not _has_precise_address(addr):
            kakao = kakao_search(p.name)
            if kakao and _has_precise_address(kakao['address']):
                addr = kakao['address']
                lat  = kakao['lat']
                lng  = kakao['lng']
        results.append({
            'name': p.name, 'address': addr,
            'lat': lat, 'lng': lng, 'source': 'kto',
        })

    # 2차: KTO 결과 없으면 카카오 키워드 검색으로 폴백
    if not results and settings.KAKAO_REST_KEY:
        try:
            resp = requests.get(
                'https://dapi.kakao.com/v2/local/search/keyword.json',
                params={'query': keyword, 'size': 5},
                headers={'Authorization': f'KakaoAK {settings.KAKAO_REST_KEY}'},
                timeout=5,
            )
            for doc in resp.json().get('documents', []):
                results.append({
                    'name':    doc['place_name'],
                    'address': doc.get('road_address_name') or doc.get('address_name', ''),
                    'lat':     float(doc['y']),
                    'lng':     float(doc['x']),
                    'source':  'kakao',
                })
        except Exception:
            pass

    return JsonResponse({'results': results})


def admin_place_reverse_geocode_view(request, place_id):
    """좌표가 실제로 어느 주소를 가리키는지 역지오코딩으로 확인.
    AI가 추정한 장소명/주소가 부정확할 때, 관리자가 좌표 기준 실제 주소와 비교할 수 있게 한다.
    ?lat=&lng= 쿼리파라미터로 임의 좌표(지도 클릭/검색 선택 등 아직 저장 전인 좌표)를 넘기면
    그 좌표를 조회하고, 없으면 저장된 좌표를 사용한다."""
    from places.services import kakao_reverse_geocode
    place = get_object_or_404(Place, pk=place_id)
    lat = request.GET.get('lat') or place.latitude
    lng = request.GET.get('lng') or place.longitude
    address = kakao_reverse_geocode(lat, lng)
    return JsonResponse({'address': address})


def admin_place_nearby_view(request, place_id):
    """좌표 주변의 실제 업체 목록(지도에 마커로 표시할 후보)을 반환.
    ?lat=&lng= 쿼리파라미터가 있으면 그 좌표 기준, 없으면 저장된 좌표 기준으로 조회한다."""
    from places.services import kakao_nearby_search
    place = get_object_or_404(Place, pk=place_id)
    lat = request.GET.get('lat') or place.latitude
    lng = request.GET.get('lng') or place.longitude
    results = kakao_nearby_search(lat, lng)
    return JsonResponse({'results': results, 'lat': float(lat), 'lng': float(lng)})


def admin_place_update_view(request, place_id):
    """장소 이름/주소 수정 (추가 확인 필요 섹션에서 인라인 편집용)."""
    import json
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    place = get_object_or_404(Place, pk=place_id)
    try:
        data = json.loads(request.body)
    except ValueError:
        return JsonResponse({'ok': False, 'error': '잘못된 요청'}, status=400)

    name    = data.get('name', '').strip()
    address = data.get('address', '').strip()
    lat     = data.get('lat')
    lng     = data.get('lng')

    update_fields = []
    address_changed = bool(address) and address != place.address
    if name:
        place.name = name
        update_fields.append('name')
    if address:
        place.address = address
        update_fields.append('address')

    if lat is not None and lng is not None:
        # 검색 결과/지도 마커를 클릭해서 좌표를 직접 받은 경우 — 그대로 사용
        try:
            place.latitude    = float(lat)
            place.longitude   = float(lng)
            place.is_verified = True
            update_fields += ['latitude', 'longitude', 'is_verified']
        except (ValueError, TypeError):
            pass
    elif address_changed:
        # 좌표를 직접 고르지 않고 주소 텍스트만 손으로 고친 경우 — 기존 좌표가
        # 이미 있어도(0이 아니어도) 새 주소 기준으로 다시 지오코딩해서 맞춘다.
        # (안 그러면 주소 텍스트와 실제 핀 위치가 계속 어긋난 채로 남음)
        from .services import kakao_geocode_full
        match = kakao_geocode_full(address) or (kakao_geocode_full(name) if name else None)
        if match:
            place.latitude    = match['lat']
            place.longitude   = match['lng']
            place.is_verified = True
            update_fields += ['latitude', 'longitude', 'is_verified']
            if match.get('kakao_place_id'):
                place.kakao_place_id  = match['kakao_place_id']
                place.kakao_place_url = match.get('kakao_place_url')
                update_fields += ['kakao_place_id', 'kakao_place_url']

    if update_fields:
        place.save(update_fields=update_fields)
    return JsonResponse({
        'ok': True,
        'name': place.name,
        'address': place.address,
        'lat': float(place.latitude),
        'lng': float(place.longitude),
        'has_coords': float(place.latitude) != 0 and float(place.longitude) != 0,
    })


def admin_review_view(request, media_id):
    media = get_object_or_404(Media, pk=media_id)

    if request.method == 'POST':
        approved_ids = set(request.POST.getlist('approved'))
        form_pks     = set(request.POST.getlist('form_pks'))
        if not form_pks:
            return redirect('admin_review', media_id=media_id)
        qs = MediaPlace.objects.filter(
            media=media,
            status=MediaPlace.STATUS_INFERRED,
            pk__in=form_pks,
        )
        for mp in qs:
            if str(mp.pk) in approved_ids:
                mp.status = MediaPlace.STATUS_ADMIN_APPROVED
                mp.is_confirmed = True
            else:
                mp.status = MediaPlace.STATUS_REJECTED
            mp.save()
        return redirect('admin_review', media_id=media_id)

    all_inferred = MediaPlace.objects.filter(media=media, status=MediaPlace.STATUS_INFERRED).select_related('place')
    inferred_verified  = [mp for mp in all_inferred if mp.place.is_verified]
    inferred_uncertain = [mp for mp in all_inferred if not mp.place.is_verified]
    approved = MediaPlace.objects.filter(media=media, status=MediaPlace.STATUS_ADMIN_APPROVED).select_related('place')
    rejected = MediaPlace.objects.filter(media=media, status=MediaPlace.STATUS_REJECTED).select_related('place')
    return render(request, 'places/admin_review.html', {
        'media':               media,
        'inferred_verified':   inferred_verified,
        'inferred_uncertain':  inferred_uncertain,
        'approved':            approved,
        'rejected':            rejected,
        'kakao_js_key':        settings.KAKAO_JS_KEY,
    })


# ── 재생목록 일괄 추출 포털 ────────────────────────────────────────────────────

@ensure_csrf_cookie
def admin_playlist_extract_view(request):
    """재생목록 URL 입력 → 영상 목록 조회/선택 → 일괄 추출을 진행하는 페이지.
    fetch()로만 POST하는 페이지라 {% csrf_token %} 태그가 없으면 쿠키 자체가 안 심어짐(기존 검수 포털들과 동일한 이슈) — 데코레이터로 강제."""
    prefill = {
        'media_title': request.GET.get('media_title', ''),
        'media_type':  request.GET.get('media_type', 'youtube'),
        'ai_choice':   request.GET.get('ai_choice', 'gemini'),
    }
    return render(request, 'places/admin_playlist_extract.html', {'form': prefill})


def admin_playlist_fetch_api(request):
    """POST { playlist_url, media_title } → 재생목록 조회를 백그라운드 스레드로 시작하고 fetch_job_id를 반환.
    영상이 많으면 자막 유무 확인 때문에 수십 초~수 분 걸릴 수 있어서 요청-응답 안에서 끝내지 않는다
    (관리자가 이 페이지를 벗어나도 fetch_job_id로 어디서든 진행 상황을 조회할 수 있게 하기 위함).
    media_title은 나중에 "저장된 재생목록" 기록에서 구분하는 용도라 필수로 받는다."""
    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': '허용되지 않는 메서드'}, status=405)
    from .models import PlaylistFetchJob
    from .services import run_playlist_fetch_job
    try:
        body = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        body = {}
    playlist_url = (body.get('playlist_url') or '').strip()
    media_title = (body.get('media_title') or '').strip()
    if not playlist_url:
        return JsonResponse({'ok': False, 'error': '재생목록 URL을 입력하세요.'})
    if not media_title:
        return JsonResponse({'ok': False, 'error': '미디어 제목을 입력하세요.'})

    job = PlaylistFetchJob.objects.create(playlist_url=playlist_url, media_title=media_title)

    # 저장 기록은 최근 HISTORY_LIMIT개만 유지 — 넘치면 오래된 것부터 삭제
    stale_ids = list(
        PlaylistFetchJob.objects.order_by('-created_at')
        .values_list('id', flat=True)[PlaylistFetchJob.HISTORY_LIMIT:]
    )
    if stale_ids:
        PlaylistFetchJob.objects.filter(id__in=stale_ids).delete()

    threading.Thread(target=run_playlist_fetch_job, args=(job.pk,), daemon=True).start()
    return JsonResponse({'ok': True, 'fetch_job_id': job.pk})


def admin_playlist_fetch_status_view(request, fetch_job_id):
    """GET → 재생목록 조회 작업의 진행 상황(JSON). 다른 화면에 떠 있는 알림 위젯도 이걸 폴링한다.
    저장된 기록을 다시 열람하는 경우, 조회했던 시점 이후 그 사이 실제로 장소 추출이 끝난 영상이
    있을 수 있으므로 "이미 처리됨" 표시를 매번 최신 상태로 다시 계산해서 내려준다."""
    from .models import PlaylistFetchJob
    from .services import refresh_duplicate_flags
    job = get_object_or_404(PlaylistFetchJob, pk=fetch_job_id)
    videos = job.videos
    if job.status == PlaylistFetchJob.STATUS_DONE and videos:
        videos = refresh_duplicate_flags(videos)
        PlaylistFetchJob.objects.filter(pk=fetch_job_id).update(videos=videos)
    return JsonResponse({
        'ok': True,
        'status': job.status,
        'playlist_url': job.playlist_url,
        'media_title': job.media_title,
        'videos': videos,
        'error': job.error,
    }, json_dumps_params={'ensure_ascii': False})


def admin_playlist_fetch_history_view(request):
    """GET → 저장된 재생목록 조회 기록(최근 PlaylistFetchJob.HISTORY_LIMIT개). 다시 불러오지 않고 클릭만으로 복원하는 용도."""
    from .models import PlaylistFetchJob
    jobs = PlaylistFetchJob.objects.order_by('-created_at')[:PlaylistFetchJob.HISTORY_LIMIT]
    return JsonResponse({
        'ok': True,
        'jobs': [
            {
                'id': j.id,
                'media_title': j.media_title,
                'playlist_url': j.playlist_url,
                'status': j.status,
                'video_count': len(j.videos),
                'created_at': j.created_at.strftime('%Y-%m-%d %H:%M'),
            }
            for j in jobs
        ],
    }, json_dumps_params={'ensure_ascii': False})


def admin_playlist_job_start_view(request):
    """POST { playlist_url, media_title, media_type, ai_choice, fallback_ai_choice, scene, merge_videos, videos: [...] }
    선택된 영상들로 PlaylistExtractionJob을 만들고 백그라운드 스레드로 순차 처리를 시작한다.
    merge_videos=False(기본, "개별 추출")면 영상마다 그 영상 자체의 제목으로 별도 Media를 만들고,
    merge_videos=True("통합 추출")면 선택된 영상 전부를 media_title 하나로 묶는다."""
    if request.method != 'POST':
        return JsonResponse({'ok': False, 'error': '허용되지 않는 메서드'}, status=405)
    from .models import PlaylistExtractionJob
    from .services import run_batch_job
    try:
        body = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'error': '잘못된 요청'}, status=400)

    playlist_url = (body.get('playlist_url') or '').strip()
    media_title  = (body.get('media_title') or '').strip()
    media_type   = body.get('media_type') or 'youtube'
    ai_choice    = body.get('ai_choice') or 'gemini'
    fallback_ai  = body.get('fallback_ai_choice') or 'gemini'
    scene        = (body.get('scene') or '').strip()
    merge_videos = bool(body.get('merge_videos'))
    videos       = body.get('videos') or []

    if not media_title:
        return JsonResponse({'ok': False, 'error': '미디어 제목을 입력하세요.'})
    if not isinstance(videos, list) or not videos:
        return JsonResponse({'ok': False, 'error': '선택된 영상이 없습니다.'})

    for v in videos:
        v['status'] = 'queued'
        v['media_place_count'] = 0
        v['error'] = ''
        v['ai_used'] = ''

    job = PlaylistExtractionJob.objects.create(
        playlist_url=playlist_url,
        media_title=media_title,
        media_type=media_type,
        ai_choice=ai_choice,
        fallback_ai_choice=fallback_ai,
        scene=scene,
        merge_videos=merge_videos,
        status=PlaylistExtractionJob.STATUS_RUNNING,
        videos=videos,
    )
    threading.Thread(target=run_batch_job, args=(job.pk,), daemon=True).start()
    return JsonResponse({'ok': True, 'job_id': job.pk})


def admin_playlist_job_status_view(request, job_id):
    """GET → 진행 상황 폴링용 JSON 스냅샷."""
    from .models import PlaylistExtractionJob
    job = get_object_or_404(PlaylistExtractionJob, pk=job_id)
    return JsonResponse({
        'ok': True,
        'status': job.status,
        'cancel_requested': job.cancel_requested,
        'current_index': job.current_index,
        'total': len(job.videos),
        'videos': job.videos,
    }, json_dumps_params={'ensure_ascii': False})


def admin_playlist_job_cancel_view(request, job_id):
    """POST → 진행 중인 작업에 취소 요청. 처리 중이던 영상은 끝까지 완료(결과 저장)하고 다음 영상부터 중단."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    from .models import PlaylistExtractionJob
    updated = PlaylistExtractionJob.objects.filter(
        pk=job_id, status=PlaylistExtractionJob.STATUS_RUNNING).update(cancel_requested=True)
    return JsonResponse({'ok': bool(updated)})


def admin_playlist_job_retry_view(request, job_id):
    """POST { video_ids: [...] } → 실패한 영상들만 다시 큐에 넣고 재실행."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    from .models import PlaylistExtractionJob
    from .services import run_batch_job
    job = get_object_or_404(PlaylistExtractionJob, pk=job_id)
    try:
        body = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        body = {}
    retry_ids = set(body.get('video_ids') or [])
    if not retry_ids:
        return JsonResponse({'ok': False, 'error': '재시도할 영상을 선택하세요.'})

    videos = job.videos
    changed = False
    for v in videos:
        if v.get('video_id') in retry_ids and v.get('status') == 'failed':
            v['status'] = 'queued'
            v['error'] = ''
            changed = True
    if not changed:
        return JsonResponse({'ok': False, 'error': '재시도 가능한(실패 상태) 영상이 없습니다.'})

    PlaylistExtractionJob.objects.filter(pk=job_id).update(
        videos=videos, status=PlaylistExtractionJob.STATUS_RUNNING, cancel_requested=False)
    threading.Thread(target=run_batch_job, args=(job.pk,), daemon=True).start()
    return JsonResponse({'ok': True})


# ── 포토스팟 검열(1차 AI + 2차 관리자) 포털 ───────────────────────────────────

def admin_photo_review_view(request):
    """AI가 보류(pending) 판정한 포토스팟 목록 — 관리자가 최종승인/삭제를 결정."""
    pending = (Photo.objects
               .filter(status=Photo.STATUS_PENDING)
               .select_related('place', 'uploaded_by')
               .prefetch_related('sub_images')
               .order_by('-created_at'))
    for photo in pending:
        photo.category_labels = [CATEGORY_LABELS.get(c, c) for c in photo.moderation_categories]
    return render(request, 'places/admin_photo_review.html', {'pending': pending})


def admin_photo_approve_view(request, photo_id):
    """보류 중인 포토스팟을 관리자가 최종 승인."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    photo = get_object_or_404(Photo, pk=photo_id)
    photo.status = Photo.STATUS_APPROVED
    photo.save(update_fields=['status'])
    grant_photo_publish_reward(photo)
    return JsonResponse({'ok': True})


def admin_photo_delete_view(request, photo_id):
    """보류 중인 포토스팟을 관리자가 최종 삭제(게시글 삭제)."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    photo = get_object_or_404(Photo, pk=photo_id)
    photo.delete()
    return JsonResponse({'ok': True})


def admin_photo_recheck_view(request):
    """보류 중인 포토스팟 전체에 대해 AI 검열을 재실행 (AI 호출 실패로 쌓인 건 재시도용)."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    from .moderation import moderate_photo

    pending = Photo.objects.filter(status=Photo.STATUS_PENDING).prefetch_related('sub_images')
    approved_count = 0
    still_pending_count = 0
    for photo in pending:
        result = moderate_photo(photo)
        if result['safe']:
            approved_count += 1
        else:
            still_pending_count += 1
    return JsonResponse({'ok': True, 'approved': approved_count, 'still_pending': still_pending_count})


# ── DRF ViewSets ────────────────────────────────────────────────────────────

class PlaceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/places/                     전체 장소 목록
    GET /api/places/{id}/                장소 상세
    GET /api/places/?keyword=이태원      이름 검색
    GET /api/places/?category=12         관광공사 카테고리 필터
    GET /api/places/?unverified=true     위치 미확정 장소 (퀴즈 대상)
    """
    queryset = Place.objects.all().order_by('-created_at')
    serializer_class = PlaceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        keyword = self.request.query_params.get('keyword')
        category = self.request.query_params.get('category')
        unverified = self.request.query_params.get('unverified')

        if keyword:
            qs = qs.filter(Q(name__icontains=keyword) | Q(address__icontains=keyword))
        if category:
            qs = qs.filter(category=category)
        if unverified == 'true':
            qs = qs.filter(is_verified=False)
        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__name__icontains=tag)
        return qs.distinct()

    def retrieve(self, request, *args, **kwargs):
        """캐시된 장소 정보를 그대로 즉시 응답하고, 최신화 기한(30일)이 지났으면
        백그라운드 스레드로 KTO 상세조회를 돌려 갱신한다(stale-while-revalidate).
        갱신은 다음 조회부터 반영되며, 이번 응답의 지연에는 영향을 주지 않는다."""
        instance = self.get_object()
        threading.Thread(target=refresh_place_if_stale, args=(instance,), daemon=True).start()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='bookmarked', permission_classes=[IsAuthenticated])
    def bookmarked(self, request):
        """GET /api/places/bookmarked/  저장한 장소 목록"""
        bookmarks = PlaceBookmark.objects.filter(user=request.user).select_related('place').prefetch_related('place__tags')
        places = [b.place for b in bookmarks]
        return Response(PlaceSerializer(places, many=True, context={'request': request}).data)

    @action(detail=True, methods=['get'], url_path='nearby')
    def nearby(self, request, pk=None):
        """GET /api/places/{id}/nearby/  근처 추천 장소 3~5곳 (매 요청마다 실시간 조회, 미저장)"""
        place = self.get_object()
        results = fetch_nearby_places(place.latitude, place.longitude, place.content_id)
        return Response(results)

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """POST /api/places/register/ {content_id}  근처 추천 장소 카드를 탭한 시점에
        정식 Place로 등록(get_or_create)하고 상세 진입에 쓸 데이터를 반환한다."""
        content_id = request.data.get('content_id')
        if not content_id:
            return Response({'error': 'content_id가 필요합니다.'}, status=status.HTTP_400_BAD_REQUEST)
        place = get_or_create_place_by_content_id(content_id)
        if not place:
            return Response({'error': '장소 정보를 가져오지 못했습니다.'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(PlaceSerializer(place, context={'request': request}).data)

    @action(detail=True, methods=['get'])
    def photos(self, request, pk=None):
        """
        GET /api/places/{id}/photos/   해당 장소의 포토스팟 목록 (승인된 것만)
        """
        place = self.get_object()
        qs = Photo.objects.filter(place=place, status=Photo.STATUS_APPROVED).prefetch_related('tags')
        return Response(PhotoSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='map')
    def map_data(self, request):
        """
        GET /api/places/map/             전체 촬영지 좌표 + 연결 미디어
        GET /api/places/map/?media_id=1  특정 미디어 촬영지만
        """
        media_id = request.query_params.get('media_id')
        base_filter = dict(
            media_places__status=MediaPlace.STATUS_ADMIN_APPROVED,
        )
        if media_id:
            base_filter['media_places__media_id'] = media_id

        qs = (Place.objects
              .filter(**base_filter)
              .exclude(latitude=0, longitude=0)
              .prefetch_related('media_places__media')
              .distinct())
        serializer = PlaceMapSerializer(qs, many=True)
        return Response(serializer.data)


class MediaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/media/                      전체 미디어 목록
    GET /api/media/{id}/                 미디어 상세 + 촬영지 목록
    GET /api/media/?type=drama           타입 필터 (drama/movie/youtube/etc)
    GET /api/media/?ordering=popular     인기순 정렬 (북마크 수 + 리뷰 개수 합산 내림차순)
    GET /api/media/{id}/places/          해당 미디어의 촬영지만 조회
    POST /api/media/{id}/quiz/submit/    퀴즈 제출 { answers: { media_place_id: 답안 } } (Phase 3, JWT 필요)
    """
    queryset = Media.objects.all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MediaDetailSerializer
        return MediaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        media_type = self.request.query_params.get('type')
        if media_type:
            qs = qs.filter(media_type=media_type)
        keyword = self.request.query_params.get('keyword')
        if keyword:
            qs = qs.filter(Q(title__icontains=keyword) | Q(tags__name__icontains=keyword))
        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__name__icontains=tag)
        qs = qs.distinct()

        # ?ordering=popular — 북마크 수 + 리뷰 개수 합산 기준 인기순 (Phase 8)
        if self.request.query_params.get('ordering') == 'popular':
            qs = qs.annotate(
                bookmark_count=Count('bookmarks', distinct=True),
                review_count=Count('reviews', distinct=True),
            ).order_by('-bookmark_count', '-review_count', '-created_at')
        return qs

    @action(detail=False, methods=['get'], url_path='bookmarked', permission_classes=[IsAuthenticated])
    def bookmarked(self, request):
        """GET /api/media/bookmarked/  저장한 코스 목록"""
        bookmarks = MediaBookmark.objects.filter(user=request.user).select_related('media').prefetch_related('media__tags')
        media_list = [b.media for b in bookmarks]
        return Response(MediaSerializer(media_list, many=True, context={'request': request}).data)

    @action(detail=True, methods=['get'])
    def places(self, request, pk=None):
        media = self.get_object()
        media_places = (MediaPlace.objects
                        .filter(media=media, status=MediaPlace.STATUS_ADMIN_APPROVED)
                        .select_related('place')
                        .prefetch_related('place__tags')
                        .order_by('day', 'id'))
        return Response(MediaPlaceSerializer(media_places, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='quiz/submit', permission_classes=[IsAuthenticated])
    def submit_quiz(self, request, pk=None):
        """POST /api/media/{id}/quiz/submit/  { answers: { [media_place_id]: 자유서술 답안 } } (JWT 필요)"""
        media = self.get_object()
        if QuizSubmission.objects.filter(user=request.user, media=media).exists():
            return Response({'error': '이미 제출한 퀴즈입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        answers = request.data.get('answers')
        if not isinstance(answers, dict) or not answers:
            return Response({'error': '답안을 입력해주세요.'}, status=status.HTTP_400_BAD_REQUEST)

        media_places = {
            mp.id: mp for mp in
            MediaPlace.objects.filter(media=media, status=MediaPlace.STATUS_ADMIN_APPROVED).select_related('place')
        }

        valid_answers = []
        for place_id_str, answer_text in answers.items():
            try:
                media_place = media_places[int(place_id_str)]
            except (TypeError, ValueError, KeyError):
                continue
            if (answer_text or '').strip():
                valid_answers.append((media_place, answer_text.strip()))

        if not valid_answers:
            return Response({'error': '유효한 답안이 없습니다.'}, status=status.HTTP_400_BAD_REQUEST)

        submission = QuizSubmission.objects.create(user=request.user, media=media)
        correct_count = 0
        for media_place, answer_text in valid_answers:
            correct, weight, probable_visit = grade_answer(request.user, media_place, answer_text)
            QuizAnswer.objects.create(
                submission=submission, media_place=media_place, answer_text=answer_text,
                is_correct=correct, weight=weight, is_probable_visit=probable_visit,
            )
            correct_count += int(correct)

        for media_place, _ in valid_answers:
            recalculate_media_place(media_place)

        grant_quiz_rewards(request.user, correct_count)

        return Response(
            {'correct_count': correct_count, 'total_count': len(valid_answers)},
            status=status.HTTP_201_CREATED,
        )


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/tags/                   전체 태그 목록
    GET /api/tags/?category=genre    대분류 필터 (media_type / genre / place_type)
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


def _resolve_photo_tag_ids(request):
    """포토스팟 태그 입력을 Tag id 목록으로 변환한다. 'tag_ids'/'tags' 둘 다 없으면
    태그를 건드리지 않는다는 뜻으로 None을 반환한다(부분수정 시 다른 필드만 바꾸는 경우 보존).
    프론트(TagAddAlert)는 기존 태그 체계와 무관한 자유 텍스트를 'tags'(이름 배열)로 보내는데,
    지금까지 백엔드는 'tag_ids'만 읽고 있어서 태그가 저장된 적이 없었다(2026-08-18 확인).
    이름으로 넘어오면 category='photo_custom'으로 get_or_create해서 매칭한다."""
    if 'tag_ids' in request.data:
        return request.data.get('tag_ids') or []
    if 'tags' not in request.data:
        return None
    tag_names = request.data.get('tags') or []
    tag_ids = []
    for name in tag_names:
        name = (name or '').strip()
        if not name:
            continue
        tag, _ = Tag.objects.get_or_create(category='photo_custom', name=name)
        tag_ids.append(tag.id)
    return tag_ids


class PhotoViewSet(viewsets.ModelViewSet):
    """
    GET   /api/photos/               전체 포토스팟 목록 (승인된 것 + 내가 올린 것, keyword로 설명/장소명 검색, author로 작성자 닉네임 필터)
    GET   /api/photos/mine/          내가 올린 포토스팟 전체 (상태 무관, JWT 필요)
    POST  /api/photos/upload-image/  이미지 파일 업로드 (multipart, JWT 필요) → image_url 반환
    GET   /api/photos/{id}/          포토스팟 상세 (장소 + 같은 장소 사진 + 관련 사진)
    POST  /api/photos/               포토스팟 업로드 (JWT 필요, 심사중 상태로 생성, 부사진 최대 10장)
    PATCH /api/photos/{id}/          포토스팟 수정 (작성자 본인만, 사진은 수정 불가 — 제목/상세설명/여행일/태그만)
    DELETE /api/photos/{id}/         포토스팟 삭제 (작성자 본인만)
    POST/DELETE /api/photos/{id}/like/   좋아요 토글 (JWT 필요)
    """
    MAX_SUB_IMAGES = 10

    queryset = Photo.objects.select_related('place', 'uploaded_by').prefetch_related('tags', 'sub_images')
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PhotoSpotDetailSerializer
        return PhotoSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user if self.request.user.is_authenticated else None
        if user:
            qs = qs.filter(Q(status=Photo.STATUS_APPROVED) | Q(uploaded_by=user))
        else:
            qs = qs.filter(status=Photo.STATUS_APPROVED)
        keyword = self.request.query_params.get('keyword')
        if keyword:
            qs = qs.filter(Q(description__icontains=keyword) | Q(place__name__icontains=keyword))
        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__name__icontains=tag)
        author = self.request.query_params.get('author')
        if author:
            qs = qs.filter(uploaded_by__nickname=author)
        return qs.distinct()

    @action(detail=False, methods=['get'], url_path='mine', permission_classes=[IsAuthenticated])
    def mine(self, request):
        """GET /api/photos/mine/   내가 올린 포토스팟 전체 (상태 무관)"""
        qs = self.get_queryset().filter(uploaded_by=request.user).order_by('-created_at')
        return Response(PhotoSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=False, methods=['post'], url_path='upload-image',
            permission_classes=[IsAuthenticated], parser_classes=[MultiPartParser])
    def upload_image(self, request):
        """
        POST /api/photos/upload-image/   이미지 파일 업로드 (multipart, 필드명 'image')
        저장된 파일의 절대 URL을 반환한다. 대표사진/부사진 모두 이 엔드포인트로 먼저 업로드한 뒤
        받은 image_url을 POST /api/photos/ 에 넘기는 방식으로 사용.
        로컬 디스크(MEDIA_ROOT)에 저장 — 배포 시 스토리지 전환은 DEVPLAN.md 참고.
        """
        file = request.FILES.get('image')
        if not file:
            return Response({'image': ['이미지 파일이 필요합니다.']}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file.name)[1].lower() or '.jpg'
        filename = f'photos/{uuid.uuid4().hex}{ext}'
        saved_path = default_storage.save(filename, file)
        image_url = request.build_absolute_uri(default_storage.url(saved_path))
        return Response({'image_url': image_url}, status=status.HTTP_201_CREATED)

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'error': '로그인이 필요합니다.'}, status=status.HTTP_401_UNAUTHORIZED)

        place = get_object_or_404(Place, pk=request.data.get('place_id'))
        image_url = request.data.get('image_url', '')
        if not image_url:
            return Response({'image_url': ['이미지가 필요합니다.']}, status=status.HTTP_400_BAD_REQUEST)

        sub_image_urls = request.data.get('sub_image_urls') or []
        if len(sub_image_urls) > self.MAX_SUB_IMAGES:
            return Response(
                {'sub_image_urls': [f'부사진은 최대 {self.MAX_SUB_IMAGES}장까지 첨부할 수 있습니다.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        photo = Photo.objects.create(
            place=place,
            image_url=image_url,
            description=request.data.get('description', ''),
            content=request.data.get('content', ''),
            travel_date=request.data.get('travel_date', ''),
            uploaded_by=request.user,
            status=Photo.STATUS_PENDING,
        )
        tag_ids = _resolve_photo_tag_ids(request)
        if tag_ids:
            photo.tags.set(tag_ids)
        if sub_image_urls:
            PhotoImage.objects.bulk_create([
                PhotoImage(photo=photo, image_url=url, order=i)
                for i, url in enumerate(sub_image_urls)
            ])

        # AI 1차 검열: 안전하면 즉시 승인, 의심되면 보류(관리자 검토 대기)
        moderate_photo(photo)
        photo.refresh_from_db()

        return Response(PhotoSerializer(photo, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        photo = self.get_object()
        if not request.user.is_authenticated or photo.uploaded_by_id != request.user.id:
            return Response({'error': '수정 권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
        if 'image_url' in request.data or 'sub_image_urls' in request.data:
            return Response({'error': '사진은 수정할 수 없습니다.'}, status=status.HTTP_400_BAD_REQUEST)

        update_fields = []
        if 'description' in request.data:
            photo.description = request.data.get('description', '')
            update_fields.append('description')
        if 'content' in request.data:
            photo.content = request.data.get('content', '')
            update_fields.append('content')
        if 'travel_date' in request.data:
            photo.travel_date = request.data.get('travel_date', '')
            update_fields.append('travel_date')
        if update_fields:
            photo.save(update_fields=update_fields)
        tag_ids = _resolve_photo_tag_ids(request)
        if tag_ids is not None:
            photo.tags.set(tag_ids)

        return Response(PhotoSerializer(photo, context={'request': request}).data)

    def destroy(self, request, *args, **kwargs):
        photo = self.get_object()
        if not request.user.is_authenticated or photo.uploaded_by_id != request.user.id:
            return Response({'error': '삭제 권한이 없습니다.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post', 'delete'])
    def like(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({'error': '로그인이 필요합니다.'}, status=status.HTTP_401_UNAUTHORIZED)

        photo = self.get_object()
        if request.method == 'POST':
            _, created = PhotoLike.objects.get_or_create(user=request.user, photo=photo)
            if created:
                photo.likes += 1
                photo.save(update_fields=['likes'])
                check_and_grant_like_milestone(photo)
        else:
            deleted, _ = PhotoLike.objects.filter(user=request.user, photo=photo).delete()
            if deleted:
                photo.likes = max(0, photo.likes - 1)
                photo.save(update_fields=['likes'])
        return Response({'likes': photo.likes})