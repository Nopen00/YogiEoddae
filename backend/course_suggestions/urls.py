from django.urls import path
from .views import CourseSuggestionCreateView

urlpatterns = [
    path('course-suggestions/', CourseSuggestionCreateView.as_view(), name='course-suggestion-create'),
]
