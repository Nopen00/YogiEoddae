from django.urls import path
from .views import admin_list_view, admin_review_view, admin_delete_view

urlpatterns = [
    path('review/',            admin_list_view,   name='admin_course_suggestion_list'),
    path('<int:pk>/review/',   admin_review_view, name='admin_course_suggestion_review'),
    path('<int:pk>/delete/',   admin_delete_view, name='admin_course_suggestion_delete'),
]
