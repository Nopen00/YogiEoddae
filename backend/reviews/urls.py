from django.urls import path
from .views import ReviewListCreateView, MyReviewListView, ReviewDetailView, ReviewLikeView

urlpatterns = [
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('reviews/mine/', MyReviewListView.as_view(), name='review-mine'),
    path('reviews/<str:review_type>/<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
    path('reviews/<str:review_type>/<int:pk>/like/', ReviewLikeView.as_view(), name='review-like'),
]
