from rest_framework import serializers
from .models import MediaBookmark, PlaceBookmark, PhotoBookmark


class MediaBookmarkSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='media.id')
    title = serializers.CharField(source='media.title')
    media_type = serializers.CharField(source='media.media_type')
    thumbnail_url = serializers.URLField(source='media.thumbnail_url')
    tags = serializers.SerializerMethodField()
    saved_at = serializers.DateTimeField(source='created_at')

    class Meta:
        model = MediaBookmark
        fields = ('id', 'title', 'media_type', 'thumbnail_url', 'tags', 'saved_at')

    def get_tags(self, obj):
        return [{'name': t.name, 'category': t.category} for t in obj.media.tags.all()]


class PlaceBookmarkSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='place.id')
    name = serializers.CharField(source='place.name')
    address = serializers.CharField(source='place.address')
    image_url = serializers.URLField(source='place.image_url')
    tags = serializers.SerializerMethodField()
    saved_at = serializers.DateTimeField(source='created_at')

    class Meta:
        model = PlaceBookmark
        fields = ('id', 'name', 'address', 'image_url', 'tags', 'saved_at')

    def get_tags(self, obj):
        return [{'name': t.name, 'category': t.category} for t in obj.place.tags.all()]


class PhotoBookmarkSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='photo.id')
    image_url = serializers.URLField(source='photo.image_url')
    description = serializers.CharField(source='photo.description')
    place_name = serializers.CharField(source='photo.place.name')
    tags = serializers.SerializerMethodField()
    saved_at = serializers.DateTimeField(source='created_at')

    class Meta:
        model = PhotoBookmark
        fields = ('id', 'image_url', 'description', 'place_name', 'tags', 'saved_at')

    def get_tags(self, obj):
        return [{'name': t.name, 'category': t.category} for t in obj.photo.tags.all()]
