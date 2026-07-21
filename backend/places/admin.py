from django.contrib import admin
from .models import Place, Media, MediaPlace, Tag, Photo


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('category', 'name')
    list_filter = ('category',)
    search_fields = ('name',)


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'category', 'is_verified', 'created_at')
    search_fields = ('name', 'address', 'content_id')
    list_filter = ('category', 'is_verified', 'tags')
    filter_horizontal = ('tags',)


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ('title', 'media_type', 'year', 'created_at')
    list_filter = ('media_type', 'tags')
    search_fields = ('title',)
    filter_horizontal = ('tags',)


@admin.register(MediaPlace)
class MediaPlaceAdmin(admin.ModelAdmin):
    list_display = ('media', 'place', 'confidence_score', 'is_confirmed', 'created_at')
    list_filter = ('is_confirmed',)
    search_fields = ('media__title', 'place__name')


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ('place', 'description', 'uploaded_by', 'is_approved', 'likes', 'created_at')
    list_filter = ('is_approved',)
    search_fields = ('place__name', 'description')
    actions = ['approve_photos']

    @admin.action(description='선택한 포토스팟 승인')
    def approve_photos(self, request, queryset):
        queryset.update(is_approved=True)
