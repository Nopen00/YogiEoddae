from django.contrib import admin
from .models import Schedule, DailyPlace, ScheduleBookmark


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'media', 'start_date', 'end_date', 'created_at')
    list_filter = ('created_at',)


@admin.register(DailyPlace)
class DailyPlaceAdmin(admin.ModelAdmin):
    list_display = ('schedule', 'place', 'day_number', 'order')


@admin.register(ScheduleBookmark)
class ScheduleBookmarkAdmin(admin.ModelAdmin):
    list_display = ('user', 'schedule', 'created_at')
