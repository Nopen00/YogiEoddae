from django.db import models
from users.models import User
from places.models import Media, MediaPlace


class QuizSubmission(models.Model):
    """유저가 특정 미디어의 퀴즈를 제출했는지 표시 (재제출 방지 + QuizListScreen의 is_submitted 표시용)."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_submissions')
    media = models.ForeignKey(Media, on_delete=models.CASCADE, related_name='quiz_submissions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'media')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} → {self.media.title}'


class QuizAnswer(models.Model):
    """미디어 퀴즈의 장소별 자유서술 답안 1건. is_correct는 제출 시점에 place.name과 퍼지매칭해서 즉시 확정."""

    submission = models.ForeignKey(QuizSubmission, on_delete=models.CASCADE, related_name='answers')
    media_place = models.ForeignKey(MediaPlace, on_delete=models.CASCADE, related_name='quiz_answers')
    answer_text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.submission.user} → {self.media_place.place.name} ({self.answer_text})'
