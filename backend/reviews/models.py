from django.db import models
from users.models import User
from places.models import Media, Place, Photo


class ReviewBase(models.Model):
    rating = models.DecimalField(max_digits=2, decimal_places=1)  # 0.5~5.0, 0.5 단위
    content = models.TextField(blank=True)
    visit_date = models.CharField(max_length=20, blank=True)  # 다녀온 날짜(텍스트), Schedule과 무관
    images = models.JSONField(default=list, blank=True)
    likes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class PlaceReview(ReviewBase):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='place_reviews')
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='reviews')

    def __str__(self):
        return f'{self.user} → {self.place.name} ({self.rating}★)'


class MediaReview(ReviewBase):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='media_reviews')
    media = models.ForeignKey(Media, on_delete=models.CASCADE, related_name='reviews')

    def __str__(self):
        return f'{self.user} → {self.media.title} ({self.rating}★)'


class PhotoReview(ReviewBase):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='photo_reviews')
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='reviews')

    def __str__(self):
        return f'{self.user} → Photo {self.photo.id} ({self.rating}★)'


class ReviewLikeBase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class PlaceReviewLike(ReviewLikeBase):
    review = models.ForeignKey(PlaceReview, on_delete=models.CASCADE, related_name='like_records')

    class Meta:
        unique_together = ('user', 'review')


class MediaReviewLike(ReviewLikeBase):
    review = models.ForeignKey(MediaReview, on_delete=models.CASCADE, related_name='like_records')

    class Meta:
        unique_together = ('user', 'review')


class PhotoReviewLike(ReviewLikeBase):
    review = models.ForeignKey(PhotoReview, on_delete=models.CASCADE, related_name='like_records')

    class Meta:
        unique_together = ('user', 'review')
