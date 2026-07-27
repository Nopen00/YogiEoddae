from django.contrib import admin
from .models import CourseSuggestion


@admin.action(description='선택한 건의를 검토완료로 표시')
def mark_reviewed(modeladmin, request, queryset):
    queryset.update(status=CourseSuggestion.STATUS_REVIEWED)


@admin.register(CourseSuggestion)
class CourseSuggestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'media_type', 'user', 'status', 'created_at')
    list_filter = ('status', 'media_type')
    search_fields = ('title', 'link', 'description')
    actions = [mark_reviewed]
