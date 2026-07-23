"""
포토스팟 이미지 1차 AI 검열 — Gemini 2.5 Flash 비전으로 부적절 콘텐츠 여부를 판단한다.
승인/보류만 결정하고, 실제 반려(삭제)는 관리자가 places/admin_photo_review.html 에서 최종 처리한다.
"""
import logging
import mimetypes

import requests as http_requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

CATEGORY_LABELS = {
    'sexual':   '선정성',
    'violence': '폭력성',
    'gambling': '도박',
    'hate':     '혐오표현',
    'drugs':    '마약',
}

MODERATION_PROMPT = """당신은 여행 포토스팟 커뮤니티에 업로드된 사진을 검열하는 안전 검토관입니다.
아래 이미지(대표사진 포함 전체)를 보고 다음 카테고리에 해당하는 부적절한 콘텐츠가 있는지 판단하세요.

- sexual: 선정성 (노출, 성적인 콘텐츠)
- violence: 폭력성 (유혈, 폭력, 잔혹한 장면)
- gambling: 도박 (도박 시설, 도박 행위 홍보)
- hate: 혐오표현 (차별적/혐오적 상징이나 문구)
- drugs: 마약 (마약 사용/거래를 암시하는 콘텐츠)

여행지/장소 사진으로서 문제가 없으면 안전(safe)으로 판단하세요. 애매하거나 확신이 서지 않으면
반드시 safe=false로 보류 처리하고 이유를 설명하세요 (과도한 확신으로 위험한 사진을 통과시키지 마세요).

반드시 아래 JSON 형식으로만 응답하세요:
{"safe": true 또는 false, "categories": ["감지된 카테고리 키(sexual/violence/gambling/hate/drugs) 목록, 없으면 빈 배열"], "reason": "판단 이유를 한국어 한 문장으로"}
"""


def _download_image(url: str, timeout: int = 10):
    """이미지 URL을 바이트로 다운로드. 실패 시 None."""
    try:
        resp = http_requests.get(url, timeout=timeout)
        resp.raise_for_status()
        mime_type = resp.headers.get('Content-Type', '').split(';')[0].strip()
        if not mime_type or not mime_type.startswith('image/'):
            mime_type = mimetypes.guess_type(url)[0] or 'image/jpeg'
        return resp.content, mime_type
    except Exception:
        logger.exception('포토스팟 이미지 다운로드 실패: %s', url)
        return None


def _fail_safe(reason: str) -> dict:
    return {'safe': False, 'categories': [], 'reason': reason}


def check_photo_images(image_urls: list) -> dict:
    """
    이미지 URL 목록(대표사진 + 부사진)을 Gemini 2.5 Flash로 검사한다.

    Returns:
        dict: {'safe': bool, 'categories': list[str], 'reason': str}
        API 오류/파싱 실패 등 검열이 불가능한 경우 safe=False로 보류 처리한다(fail-safe).
    """
    if not image_urls:
        return _fail_safe('검사할 이미지가 없습니다.')

    if not settings.GEMINI_API_KEY:
        return _fail_safe('GEMINI_API_KEY가 설정되지 않아 AI 검사를 수행할 수 없습니다.')

    try:
        from google import genai
        from google.genai import types

        parts = [MODERATION_PROMPT]
        for url in image_urls:
            downloaded = _download_image(url)
            if downloaded is None:
                continue
            data, mime_type = downloaded
            parts.append(types.Part.from_bytes(data=data, mime_type=mime_type))

        if len(parts) == 1:
            return _fail_safe('이미지를 하나도 다운로드하지 못해 AI 검사를 수행할 수 없습니다.')

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=parts,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                response_schema={
                    'type': 'object',
                    'properties': {
                        'safe': {'type': 'boolean'},
                        'categories': {'type': 'array', 'items': {'type': 'string'}},
                        'reason': {'type': 'string'},
                    },
                    'required': ['safe', 'categories', 'reason'],
                },
            ),
        )

        import json
        result = json.loads(response.text)
        categories = [c for c in result.get('categories', []) if c in CATEGORY_LABELS]
        return {
            'safe': bool(result.get('safe', False)),
            'categories': categories,
            'reason': result.get('reason', ''),
        }
    except Exception:
        logger.exception('AI 포토스팟 검열 실패')
        return _fail_safe('AI 검사 중 오류가 발생하여 관리자 확인이 필요합니다.')


def moderate_photo(photo) -> dict:
    """
    Photo 인스턴스의 대표사진+부사진 전체를 AI로 검사하고 결과에 따라 상태를 갱신한다.
    안전(safe) 판정이면 승인 처리 + 게시 보상 지급, 아니면 보류(관리자 검토 대기) 상태로 저장한다.
    업로드 직후와 관리자 페이지의 'AI 재검수' 양쪽에서 공용으로 사용.

    Returns: check_photo_images()와 동일한 dict.
    """
    from mailbox.services import grant_photo_publish_reward

    image_urls = [photo.image_url] + list(photo.sub_images.values_list('image_url', flat=True))
    result = check_photo_images(image_urls)

    photo.moderation_categories = result['categories']
    photo.moderation_reason = result['reason']
    photo.moderation_checked_at = timezone.now()

    if result['safe']:
        photo.status = photo.STATUS_APPROVED
        photo.save(update_fields=[
            'status', 'moderation_categories', 'moderation_reason', 'moderation_checked_at',
        ])
        grant_photo_publish_reward(photo)
    else:
        photo.status = photo.STATUS_PENDING
        photo.save(update_fields=[
            'status', 'moderation_categories', 'moderation_reason', 'moderation_checked_at',
        ])

    return result
