from django.db import models
from users.models import User


class CourseSuggestion(models.Model):
    """사용자가 건의한 코스(미디어) 후보. 프론트 CourseSuggestionWriteScreen에서 토큰 소모 후 생성."""

    MEDIA_TYPE_CHOICES = [
        ('drama', '드라마'),
        ('movie', '영화'),
        ('youtube', '유튜브'),
    ]

    STATUS_PENDING = 'pending'
    STATUS_REVIEWED = 'reviewed'
    STATUS_CHOICES = [
        (STATUS_PENDING, '대기'),
        (STATUS_REVIEWED, '검토완료'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='course_suggestions')
    title = models.CharField(max_length=200)
    link = models.URLField(max_length=500)
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.title} ({self.get_status_display()})'
