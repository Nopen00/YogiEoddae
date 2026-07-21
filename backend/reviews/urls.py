from django.urls import path
from .views import ReviewListCreateView, MyReviewListView, ReviewDetailView

urlpatterns = [
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('reviews/mine/', MyReviewListView.as_view(), name='review-mine'),
    path('reviews/<str:review_type>/<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
]
