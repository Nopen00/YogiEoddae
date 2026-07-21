from rest_framework import serializers
from .models import Schedule, DailyPlace, ScheduleBookmark


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
    tags = serializers.SerializerMethodField()
    place_count = serializers.SerializerMethodField()

    def get_tags(self, obj):
        return [{'id': t.id, 'name': t.name, 'category': t.category} for t in obj.tags.all()]

    def get_place_count(self, obj):
        return obj.media_places.filter(status='admin_approved').count()


class ScheduleSerializer(serializers.ModelSerializer):
    daily_places = DailyPlaceSerializer(many=True, read_only=True)
    media = MediaBriefSerializer(read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Schedule
        fields = ('id', 'title', 'media', 'start_date', 'end_date', 'created_at', 'daily_places', 'is_bookmarked')

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not user.is_authenticated:
            return False
        return obj.bookmarks.filter(user=user).exists()


class ScheduleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = ('title', 'start_date', 'end_date')
