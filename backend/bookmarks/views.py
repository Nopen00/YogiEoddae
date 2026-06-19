from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import MediaBookmark, PlaceBookmark, PhotoBookmark
from .serializers import MediaBookmarkSerializer, PlaceBookmarkSerializer, PhotoBookmarkSerializer
from places.models import Media, Place, Photo
from users.utils import get_user_by_device_id


def get_user(request):
    return get_user_by_device_id(request.headers.get('X-Device-ID'))


class BookmarkListView(APIView):
    """GET /api/bookmarks/ — 저장한 일정, 명소, 포토스팟 한 번에 조회"""
    def get(self, request):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)

        media_bookmarks = MediaBookmark.objects.filter(user=user).select_related('media').prefetch_related('media__tags')
        place_bookmarks = PlaceBookmark.objects.filter(user=user).select_related('place').prefetch_related('place__tags')
        photo_bookmarks = PhotoBookmark.objects.filter(user=user).select_related('photo__place').prefetch_related('photo__tags')

        return Response({
            'saved_media':  MediaBookmarkSerializer(media_bookmarks, many=True).data,
            'saved_places': PlaceBookmarkSerializer(place_bookmarks, many=True).data,
            'saved_photos': PhotoBookmarkSerializer(photo_bookmarks, many=True).data,
        })


class MediaBookmarkView(APIView):
    """POST/DELETE /api/media/{id}/bookmark/"""
    def post(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        media = get_object_or_404(Media, pk=pk)
        _, created = MediaBookmark.objects.get_or_create(user=user, media=media)
        if not created:
            return Response({'message': '이미 저장된 코스입니다.'}, status=status.HTTP_200_OK)
        return Response({'message': '저장되었습니다.'}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        media = get_object_or_404(Media, pk=pk)
        MediaBookmark.objects.filter(user=user, media=media).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlaceBookmarkView(APIView):
    """POST/DELETE /api/places/{id}/bookmark/"""
    def post(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        place = get_object_or_404(Place, pk=pk)
        _, created = PlaceBookmark.objects.get_or_create(user=user, place=place)
        if not created:
            return Response({'message': '이미 저장된 장소입니다.'}, status=status.HTTP_200_OK)
        return Response({'message': '저장되었습니다.'}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        place = get_object_or_404(Place, pk=pk)
        PlaceBookmark.objects.filter(user=user, place=place).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PhotoBookmarkView(APIView):
    """POST/DELETE /api/photos/{id}/bookmark/"""
    def post(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        photo = get_object_or_404(Photo, pk=pk)
        _, created = PhotoBookmark.objects.get_or_create(user=user, photo=photo)
        if not created:
            return Response({'message': '이미 저장된 포토스팟입니다.'}, status=status.HTTP_200_OK)
        return Response({'message': '저장되었습니다.'}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        photo = get_object_or_404(Photo, pk=pk)
        PhotoBookmark.objects.filter(user=user, photo=photo).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
