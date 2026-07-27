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
    """미디어 퀴즈의 장소별 자유서술 답안 1건.

    is_probable_visit이 True면(유저가 이 장소를 일정에 넣었고 방문 개연성이 있다고 판단된 경우)
    place.name 매칭 없이 is_correct=True로 무조건 처리하고 weight=1.3 — "얼마나 아는지" 테스트가
    아니라 "실제로 갔을 사람이 이 장소를 확인해줬다"는 신뢰도 데이터 수집 목적이기 때문.
    일반 답변은 퍼지매칭으로 정답/오답을 가리고 weight=1.0. 유저에게는 두 유형을 구분해서 보여주지 않는다.
    """

    submission = models.ForeignKey(QuizSubmission, on_delete=models.CASCADE, related_name='answers')
    media_place = models.ForeignKey(MediaPlace, on_delete=models.CASCADE, related_name='quiz_answers')
    answer_text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)
    weight = models.FloatField(default=1.0)
    is_probable_visit = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.submission.user} → {self.media_place.place.name} ({self.answer_text})'
