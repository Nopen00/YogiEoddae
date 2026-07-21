from rest_framework import serializers
from .models import MediaReview, PlaceReview, PhotoReview


class ReviewSerializerBase(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    travelDate = serializers.CharField(source='visit_date')
    writtenDate = serializers.SerializerMethodField()
    hasPhoto = serializers.SerializerMethodField()
    likeCount = serializers.IntegerField(source='likes')
    isMine = serializers.SerializerMethodField()

    class Meta:
        fields = ('id', 'author', 'travelDate', 'writtenDate', 'rating', 'content', 'images', 'hasPhoto', 'likeCount', 'isMine')

    def get_author(self, obj):
        return obj.user.nickname

    def get_writtenDate(self, obj):
        return obj.created_at.strftime('%Y.%m.%d')

    def get_hasPhoto(self, obj):
        return bool(obj.images)

    def get_isMine(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        return bool(user and user.is_authenticated and user.id == obj.user_id)


def _tag_list(tags):
    return [{'id': t.id, 'name': t.name, 'category': t.category} for t in tags.all()]


class PlaceReviewSerializer(ReviewSerializerBase):
    place = serializers.SerializerMethodField()

    class Meta(ReviewSerializerBase.Meta):
        model = PlaceReview
        fields = ReviewSerializerBase.Meta.fields + ('place',)

    def get_place(self, obj):
        return {
            'id': obj.place_id,
            'name': obj.place.name,
            'address': obj.place.address,
            'image_url': obj.place.image_url,
            'category': obj.place.category,
            'tags': _tag_list(obj.place.tags),
        }


class MediaReviewSerializer(ReviewSerializerBase):
    media = serializers.SerializerMethodField()

    class Meta(ReviewSerializerBase.Meta):
        model = MediaReview
        fields = ReviewSerializerBase.Meta.fields + ('media',)

    def get_media(self, obj):
        return {
            'id': obj.media_id,
            'title': obj.media.title,
            'media_type': obj.media.media_type,
            'thumbnail_url': obj.media.thumbnail_url,
            'tags': _tag_list(obj.media.tags),
        }


class PhotoReviewSerializer(ReviewSerializerBase):
    photo = serializers.SerializerMethodField()

    class Meta(ReviewSerializerBase.Meta):
        model = PhotoReview
        fields = ReviewSerializerBase.Meta.fields + ('photo',)

    def get_photo(self, obj):
        return {
            'id': obj.photo_id,
            'description': obj.photo.description,
            'image_url': obj.photo.image_url,
            'place_name': obj.photo.place.name,
            'tags': _tag_list(obj.photo.tags),
        }
