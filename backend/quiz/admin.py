from django.contrib import admin
from .models import QuizSubmission, QuizAnswer


class QuizAnswerInline(admin.TabularInline):
    model = QuizAnswer
    extra = 0
    readonly_fields = ('media_place', 'answer_text', 'is_correct', 'weight', 'is_probable_visit', 'created_at')
    can_delete = False


@admin.register(QuizSubmission)
class QuizSubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'media', 'created_at')
    list_filter = ('media',)
    inlines = [QuizAnswerInline]
