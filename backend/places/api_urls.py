from rest_framework.routers import DefaultRouter
from .views import PlaceViewSet, MediaViewSet, TagViewSet, PhotoViewSet

router = DefaultRouter()
router.register(r'places', PlaceViewSet, basename='place')
router.register(r'media', MediaViewSet, basename='media')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'photos', PhotoViewSet, basename='photo')

urlpatterns = router.urls
