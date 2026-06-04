from django.urls import path
from .views import (
    ScheduleListCreateView, ScheduleDetailView,
    DailyPlaceCreateView, DailyPlaceDetailView,
    MediaImportView, ScheduleImportView,
    ScheduleBookmarkView, BookmarkedScheduleListView,
)

urlpatterns = [
    path('schedules/', ScheduleListCreateView.as_view(), name='schedule-list'),
    path('schedules/bookmarked/', BookmarkedScheduleListView.as_view(), name='schedule-bookmarked'),
    path('schedules/<int:pk>/', ScheduleDetailView.as_view(), name='schedule-detail'),
    path('schedules/<int:pk>/places/', DailyPlaceCreateView.as_view(), name='dailyplace-create'),
    path('schedules/<int:pk>/places/<int:dp_pk>/', DailyPlaceDetailView.as_view(), name='dailyplace-detail'),
    path('schedules/<int:pk>/import/', ScheduleImportView.as_view(), name='schedule-import'),
    path('schedules/<int:pk>/bookmark/', ScheduleBookmarkView.as_view(), name='schedule-bookmark'),
    path('media/<int:pk>/import/', MediaImportView.as_view(), name='media-import'),
]
