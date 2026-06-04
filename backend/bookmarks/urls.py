from django.urls import path
from .views import (
    BookmarkListView,
    MediaBookmarkView,
    PlaceBookmarkView,
    PhotoBookmarkView,
)

urlpatterns = [
    path('bookmarks/',                      BookmarkListView.as_view(),  name='bookmark-list'),
    path('media/<int:pk>/bookmark/',        MediaBookmarkView.as_view(), name='media-bookmark'),
    path('places/<int:pk>/bookmark/',       PlaceBookmarkView.as_view(), name='place-bookmark'),
    path('photos/<int:pk>/bookmark/',       PhotoBookmarkView.as_view(), name='photo-bookmark'),
]
