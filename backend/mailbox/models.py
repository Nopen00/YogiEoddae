from django.db import models
from users.models import User


class MailboxItem(models.Model):
    """1회성 고정 보상 (예: 리뷰 작성 10토큰). 수령하면 그대로 삭제된다."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mailbox_items')
    action = models.CharField(max_length=100)
    token_amount = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.action} ({self.token_amount})'


class SettlementItem(models.Model):
    """누적/마일스톤 기반 보상 (예: 포토스팟 좋아요 50개 달성). 수령하면 그대로 삭제된다."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='settlement_items')
    action = models.CharField(max_length=100)
    token_amount = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.action} ({self.token_amount})'
