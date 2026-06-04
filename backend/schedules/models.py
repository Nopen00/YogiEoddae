from django.db import models
from users.models import User
from places.models import Place, Media


class Schedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schedules')
    title = models.CharField(max_length=200)
    media = models.ForeignKey(Media, on_delete=models.SET_NULL, null=True, blank=True, related_name='schedules')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.title}'


class DailyPlace(models.Model):
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='daily_places')
    place = models.ForeignKey(Place, on_delete=models.CASCADE)
    day_number = models.IntegerField()
    order = models.IntegerField()
    memo = models.TextField(blank=True)

    class Meta:
        ordering = ['day_number', 'order']

    def __str__(self):
        return f'{self.schedule.title} - Day {self.day_number} - {self.place.name}'


class ScheduleBookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarked_schedules')
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'schedule')

    def __str__(self):
        return f'{self.user} → {self.schedule.title}'
