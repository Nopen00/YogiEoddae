from django.db import models


class User(models.Model):
    device_id_hash = models.CharField(max_length=64, unique=True, editable=False)
    token_balance = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f'User #{self.pk}'
