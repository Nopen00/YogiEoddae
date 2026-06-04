from django.contrib import admin
from .models import MediaBookmark, PlaceBookmark, PhotoBookmark


@admin.register(MediaBookmark)
class MediaBookmarkAdmin(admin.ModelAdmin):
    list_display = ('user', 'media', 'created_at')


@admin.register(PlaceBookmark)
class PlaceBookmarkAdmin(admin.ModelAdmin):
    list_display = ('user', 'place', 'created_at')


@admin.register(PhotoBookmark)
class PhotoBookmarkAdmin(admin.ModelAdmin):
    list_display = ('user', 'photo', 'created_at')
