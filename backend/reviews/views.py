from decimal import Decimal, InvalidOperation

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from places.models import Media, Photo, Place
from mailbox.services import grant_review_write_reward
from .models import MediaReview, MediaReviewLike, PhotoReview, PhotoReviewLike, PlaceReview, PlaceReviewLike
from .serializers import MediaReviewSerializer, PhotoReviewSerializer, PlaceReviewSerializer

# type 문자열 → (대상 모델, 리뷰 모델, 시리얼라이저, 리뷰 모델의 대상 FK 필드명, 좋아요 모델)
REVIEW_TYPES = {
    'place': (Place, PlaceReview, PlaceReviewSerializer, 'place', PlaceReviewLike),
    'media': (Media, MediaReview, MediaReviewSerializer, 'media', MediaReviewLike),
    'photo': (Photo, PhotoReview, PhotoReviewSerializer, 'photo', PhotoReviewLike),
}


def _reviews_queryset(review_model, fk_name, review_type):
    extra = ['photo__place'] if review_type == 'photo' else []
    return (review_model.objects
            .select_related('user', fk_name, *extra)
            .prefetch_related(f'{fk_name}__tags'))


def _validate_rating(value):
    try:
        rating = Decimal(str(value))
    except (InvalidOperation, TypeError):
        return None
    if rating < Decimal('0.5') or rating > Decimal('5.0'):
        return None
    if (rating * 2) % 1 != 0:
        return None
    return rating


class ReviewListCreateView(APIView):
    """
    GET  /api/reviews/?type=place&id=5   특정 대상의 리뷰 목록 (공개)
    POST /api/reviews/                   리뷰 작성 { type, id, rating, content, visit_date, images } (JWT 필요)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return []

    def get(self, request):
        review_type = request.query_params.get('type')
        target_id = request.query_params.get('id')
        entry = REVIEW_TYPES.get(review_type)
        if not entry or not target_id:
            return Response({'error': 'type과 id를 지정해주세요.'}, status=status.HTTP_400_BAD_REQUEST)

        _, review_model, serializer_class, fk_name, _ = entry
        reviews = _reviews_queryset(review_model, fk_name, review_type).filter(**{f'{fk_name}_id': target_id})
        return Response(serializer_class(reviews, many=True, context={'request': request}).data)

    def post(self, request):
        review_type = request.data.get('type')
        entry = REVIEW_TYPES.get(review_type)
        if not entry:
            return Response({'error': '유효하지 않은 type입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        target_model, review_model, serializer_class, fk_name, _ = entry
        target = get_object_or_404(target_model, pk=request.data.get('id'))

        rating = _validate_rating(request.data.get('rating'))
        if rating is None:
            return Response({'rating': ['별점은 0.5~5.0 사이 0.5 단위로 입력해주세요.']}, status=status.HTTP_400_BAD_REQUEST)

        review = review_model.objects.create(
            user=request.user,
            rating=rating,
            content=request.data.get('content', ''),
            visit_date=request.data.get('visit_date', ''),
            images=request.data.get('images', []),
            **{fk_name: target},
        )
        grant_review_write_reward(request.user)
        return Response(serializer_class(review, context={'request': request}).data, status=status.HTTP_201_CREATED)


class MyReviewListView(APIView):
    """GET /api/reviews/mine/?type=place   내가 쓴 리뷰 전체 (대상 무관, JWT 필요)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        review_type = request.query_params.get('type')
        entry = REVIEW_TYPES.get(review_type)
        if not entry:
            return Response({'error': '유효하지 않은 type입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        _, review_model, serializer_class, fk_name, _ = entry
        reviews = _reviews_queryset(review_model, fk_name, review_type).filter(user=request.user)
        return Response(serializer_class(reviews, many=True, context={'request': request}).data)


class ReviewDetailView(APIView):
    """
    GET/PATCH/DELETE /api/reviews/<review_type>/<pk>/
    PATCH/DELETE는 작성자 본인만 가능 (JWT 필요)
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return []
        return [IsAuthenticated()]

    def get(self, request, review_type, pk):
        entry = REVIEW_TYPES.get(review_type)
        if not entry:
            return Response({'error': '유효하지 않은 type입니다.'}, status=status.HTTP_400_BAD_REQUEST)
        _, review_model, serializer_class, _, _ = entry
        review = get_object_or_404(review_model, pk=pk)
        return Response(serializer_class(review, context={'request': request}).data)

    def patch(self, request, review_type, pk):
        entry = REVIEW_TYPES.get(review_type)
        if not entry:
            return Response({'error': '유효하지 않은 type입니다.'}, status=status.HTTP_400_BAD_REQUEST)
        _, review_model, serializer_class, _, _ = entry
        review = get_object_or_404(review_model, pk=pk, user=request.user)

        if 'rating' in request.data:
            rating = _validate_rating(request.data.get('rating'))
            if rating is None:
                return Response({'rating': ['별점은 0.5~5.0 사이 0.5 단위로 입력해주세요.']}, status=status.HTTP_400_BAD_REQUEST)
            review.rating = rating
        if 'content' in request.data:
            review.content = request.data.get('content', '')
        if 'visit_date' in request.data:
            review.visit_date = request.data.get('visit_date', '')
        if 'images' in request.data:
            review.images = request.data.get('images', [])
        review.save()
        return Response(serializer_class(review, context={'request': request}).data)

    def delete(self, request, review_type, pk):
        entry = REVIEW_TYPES.get(review_type)
        if not entry:
            return Response({'error': '유효하지 않은 type입니다.'}, status=status.HTTP_400_BAD_REQUEST)
        _, review_model, _, _, _ = entry
        review = get_object_or_404(review_model, pk=pk, user=request.user)
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReviewLikeView(APIView):
    """POST/DELETE /api/reviews/<review_type>/<pk>/like/  리뷰 좋아요 등록/취소 (JWT 필요)"""
    permission_classes = [IsAuthenticated]

    def post(self, request, review_type, pk):
        entry = REVIEW_TYPES.get(review_type)
        if not entry:
            return Response({'error': '유효하지 않은 type입니다.'}, status=status.HTTP_400_BAD_REQUEST)
        _, review_model, _, _, like_model = entry
        review = get_object_or_404(review_model, pk=pk)

        _, created = like_model.objects.get_or_create(user=request.user, review=review)
        if created:
            review.likes += 1
            review.save(update_fields=['likes'])
        return Response({'likes': review.likes, 'isLiked': True})

    def delete(self, request, review_type, pk):
        entry = REVIEW_TYPES.get(review_type)
        if not entry:
            return Response({'error': '유효하지 않은 type입니다.'}, status=status.HTTP_400_BAD_REQUEST)
        _, review_model, _, _, like_model = entry
        review = get_object_or_404(review_model, pk=pk)

        deleted, _ = like_model.objects.filter(user=request.user, review=review).delete()
        if deleted:
            review.likes = max(0, review.likes - 1)
            review.save(update_fields=['likes'])
        return Response({'likes': review.likes, 'isLiked': False})
