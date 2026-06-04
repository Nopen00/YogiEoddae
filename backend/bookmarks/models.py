from django.db import models
from users.models import User
from places.models import Media, Place, Photo


class MediaBookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='media_bookmarks')
    media = models.ForeignKey(Media, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'media')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} → {self.media.title}'


class PlaceBookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='place_bookmarks')
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'place')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} → {self.place.name}'


class PhotoBookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='photo_bookmarks')
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'photo')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} → Photo {self.photo.id}'
