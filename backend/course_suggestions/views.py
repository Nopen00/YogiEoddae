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
