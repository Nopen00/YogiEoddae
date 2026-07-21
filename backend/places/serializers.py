from rest_framework import serializers
from .models import MediaPlace, Place, Media, Tag, Photo


def _get_user_from_context(context):
    """request context에서 로그인된 유저를 추출한다. 한 직렬화 패스에서 한 번만 계산하도록 캐싱."""
    if 'resolved_user' in context:
        return context['resolved_user']
    request = context.get('request')
    user = getattr(request, 'user', None) if request else None
    if not user or not user.is_authenticated:
        user = None
    context['resolved_user'] = user
    return user


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'category', 'name']


class PlaceSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = [
            'id', 'content_id', 'name', 'address',
            'latitude', 'longitude', 'image_url',
            'category', 'is_verified', 'kakao_place_url',
            'tags', 'is_bookmarked', 'created_at',
        ]

    def get_is_bookmarked(self, obj):
        user = _get_user_from_context(self.context)
        if not user:
            return False
        from bookmarks.models import PlaceBookmark
        return PlaceBookmark.objects.filter(user=user, place=obj).exists()


class PhotoSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ['id', 'image_url', 'description', 'likes', 'tags', 'is_bookmarked', 'created_at']

    def get_is_bookmarked(self, obj):
        user = _get_user_from_context(self.context)
        if not user:
            return False
        from bookmarks.models import PhotoBookmark
        return PhotoBookmark.objects.filter(user=user, photo=obj).exists()


class PhotoSpotDetailSerializer(serializers.Serializer):
    """GET /api/photos/{id}/  포토스팟 상세 — 소속 장소 + 같은 장소의 다른 사진 + 태그 겹치는 관련 사진"""
    photo = serializers.SerializerMethodField()
    place = serializers.SerializerMethodField()
    placePhotos = serializers.SerializerMethodField()
    relatedPhotos = serializers.SerializerMethodField()

    def get_photo(self, obj):
        return PhotoSerializer(obj, context=self.context).data

    def get_place(self, obj):
        return PlaceSerializer(obj.place, context=self.context).data

    def get_placePhotos(self, obj):
        qs = Photo.objects.filter(place=obj.place, is_approved=True).exclude(pk=obj.pk).prefetch_related('tags')
        return PhotoSerializer(qs, many=True, context=self.context).data

    def get_relatedPhotos(self, obj):
        tag_ids = list(obj.tags.values_list('id', flat=True))
        if not tag_ids:
            return []
        qs = (Photo.objects
              .filter(is_approved=True, tags__id__in=tag_ids)
              .exclude(pk=obj.pk)
              .distinct()
              .prefetch_related('tags'))
        return PhotoSerializer(qs, many=True, context=self.context).data


class MediaSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    is_bookmarked = serializers.SerializerMethodField()
    place_count = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = ['id', 'title', 'media_type', 'year', 'thumbnail_url', 'description', 'tags', 'is_bookmarked', 'place_count', 'created_at']

    def get_is_bookmarked(self, obj):
        user = _get_user_from_context(self.context)
        if not user:
            return False
        from bookmarks.models import MediaBookmark
        return MediaBookmark.objects.filter(user=user, media=obj).exists()

    def get_place_count(self, obj):
        return obj.media_places.filter(status='admin_approved').count()


class MediaPlaceSerializer(serializers.ModelSerializer):
    place = PlaceSerializer(read_only=True)

    class Meta:
        model = MediaPlace
        fields = ['id', 'place', 'day', 'scene_description', 'confidence_score', 'is_confirmed', 'created_at']


class MediaBriefSerializer(serializers.Serializer):
    """지도 마커용 — 장소에 연결된 미디어 요약 정보."""
    media_id = serializers.IntegerField(source='media.id')
    title = serializers.CharField(source='media.title')
    media_type = serializers.CharField(source='media.media_type')
    scene_description = serializers.CharField()
    confidence_score = serializers.FloatField()


class PlaceMapSerializer(serializers.ModelSerializer):
    """지도 마커용 — 좌표 + 연결된 미디어 목록."""
    media = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = ['id', 'name', 'address', 'latitude', 'longitude', 'image_url', 'media']

    def get_media(self, obj):
        media_places = obj.media_places.filter(
            status='admin_approved'
        ).select_related('media')
        return MediaBriefSerializer(media_places, many=True).data


class MediaDetailSerializer(serializers.ModelSerializer):
    """미디어 상세 조회 시 촬영지 목록까지 포함."""
    places = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = ['id', 'title', 'media_type', 'year', 'thumbnail_url', 'description', 'tags', 'is_bookmarked', 'places', 'created_at']

    def get_places(self, obj):
        media_places = obj.media_places.select_related('place').all()
        return MediaPlaceSerializer(media_places, many=True, context=self.context).data

    def get_is_bookmarked(self, obj):
        user = _get_user_from_context(self.context)
        if not user:
            return False
        from bookmarks.models import MediaBookmark
        return MediaBookmark.objects.filter(user=user, media=obj).exists()
