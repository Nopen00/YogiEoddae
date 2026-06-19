from rest_framework import serializers
from .models import Schedule, DailyPlace, ScheduleBookmark
from users.utils import hash_device_id


class PlaceBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    address = serializers.CharField()
    image_url = serializers.URLField()
    latitude = serializers.DecimalField(max_digits=20, decimal_places=14)
    longitude = serializers.DecimalField(max_digits=20, decimal_places=14)


class DailyPlaceSerializer(serializers.ModelSerializer):
    place = PlaceBriefSerializer(read_only=True)
    place_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = DailyPlace
        fields = ('id', 'place', 'place_id', 'day_number', 'order', 'memo')


class MediaBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    thumbnail_url = serializers.URLField()
    media_type = serializers.CharField()


class ScheduleSerializer(serializers.ModelSerializer):
    daily_places = DailyPlaceSerializer(many=True, read_only=True)
    media = MediaBriefSerializer(read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Schedule
        fields = ('id', 'title', 'media', 'start_date', 'end_date', 'created_at', 'daily_places', 'is_bookmarked')

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        device_id = request.headers.get('X-Device-ID')
        if not device_id:
            return False
        return obj.bookmarks.filter(user__device_id_hash=hash_device_id(device_id)).exists()


class ScheduleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = ('title', 'start_date', 'end_date')
