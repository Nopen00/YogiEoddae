from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CourseSuggestion

# 프론트 COURSE_SUGGESTION_TOKEN_COST(frontend/services/api.ts)와 동일한 값 유지 필요
COURSE_SUGGESTION_TOKEN_COST = 100


class CourseSuggestionCreateView(APIView):
    """POST /api/course-suggestions/  { title, link, media_type, description } (JWT 필요)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = (request.data.get('title') or '').strip()
        link = (request.data.get('link') or '').strip()
        media_type = request.data.get('media_type')
        description = (request.data.get('description') or '').strip()

        if not title or not link or not description:
            return Response({'error': '제목, 링크, 설명을 모두 입력해주세요.'}, status=status.HTTP_400_BAD_REQUEST)
        if media_type not in dict(CourseSuggestion.MEDIA_TYPE_CHOICES):
            return Response({'error': '유효하지 않은 media_type입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.token_balance < COURSE_SUGGESTION_TOKEN_COST:
            return Response({'error': '토큰이 부족합니다.'}, status=status.HTTP_400_BAD_REQUEST)

        user.token_balance -= COURSE_SUGGESTION_TOKEN_COST
        user.save(update_fields=['token_balance'])

        CourseSuggestion.objects.create(
            user=user,
            title=title,
            link=link,
            media_type=media_type,
            description=description,
        )
        return Response({'token_balance': user.token_balance}, status=status.HTTP_201_CREATED)


@ensure_csrf_cookie
def admin_list_view(request):
    """전체 코스 건의 목록 (한 페이지) — 검토완료 표시/삭제.
    fetch()로 POST하는 버튼들이 document.cookie에서 csrftoken을 읽으므로,
    이 페이지 로드 시 쿠키가 반드시 심어지도록 명시적으로 강제한다."""
    suggestions = CourseSuggestion.objects.select_related('user').order_by('-created_at')
    pending_count = suggestions.filter(status=CourseSuggestion.STATUS_PENDING).count()
    return render(request, 'course_suggestions/admin_list.html', {
        'suggestions': suggestions,
        'pending_count': pending_count,
    })


def admin_review_view(request, pk):
    """건의 1건을 검토완료로 표시."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    suggestion = get_object_or_404(CourseSuggestion, pk=pk)
    suggestion.status = CourseSuggestion.STATUS_REVIEWED
    suggestion.save(update_fields=['status'])
    return JsonResponse({'ok': True})


def admin_delete_view(request, pk):
    """건의 1건 삭제."""
    if request.method != 'POST':
        return JsonResponse({'ok': False}, status=405)
    suggestion = get_object_or_404(CourseSuggestion, pk=pk)
    suggestion.delete()
    return JsonResponse({'ok': True})
