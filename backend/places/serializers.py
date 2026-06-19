from rest_framework import serializers
from .models import MediaPlace, Place, Media, Tag, Photo


def _get_user_from_context(context):
    """request context에서 유저를 추출한다. 한 직렬화 패스에서 한 번만 DB 조회하도록 캐싱."""
    if 'resolved_user' in context:
        return context['resolved_user']
    user = None
    request = context.get('request')
    if request:
        device_id = request.headers.get('X-Device-ID')
        if device_id:
            from users.utils import get_user_by_device_id
            user = get_user_by_device_id(device_id)
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

    class Meta:
        model = Photo
        fields = ['id', 'image_url', 'description', 'likes', 'tags', 'created_at']


class MediaSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = ['id', 'title', 'media_type', 'year', 'thumbnail_url', 'description', 'tags', 'is_bookmarked', 'created_at']

    def get_is_bookmarked(self, obj):
        user = _get_user_from_context(self.context)
        if not user:
            return False
        from bookmarks.models import MediaBookmark
        return MediaBookmark.objects.filter(user=user, media=obj).exists()


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
