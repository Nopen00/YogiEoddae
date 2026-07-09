from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Schedule, DailyPlace, ScheduleBookmark
from .serializers import ScheduleSerializer, ScheduleCreateSerializer, DailyPlaceSerializer
from places.models import Media, MediaPlace
from users.utils import get_user_by_device_id


def get_user(request):
    return get_user_by_device_id(request.headers.get('X-Device-ID'))


class ScheduleListCreateView(APIView):
    def get(self, request):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        schedules = Schedule.objects.filter(user=user).prefetch_related('daily_places__place')
        return Response(ScheduleSerializer(schedules, many=True, context={'request': request}).data)

    def post(self, request):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = ScheduleCreateSerializer(data=request.data)
        if serializer.is_valid():
            schedule = serializer.save(user=user)
            return Response(ScheduleSerializer(schedule, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ScheduleDetailView(APIView):
    def _get_schedule(self, pk, user):
        return get_object_or_404(Schedule, pk=pk, user=user)

    def get(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        schedule = self._get_schedule(pk, user)
        return Response(ScheduleSerializer(schedule, context={'request': request}).data)

    def patch(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        schedule = self._get_schedule(pk, user)
        serializer = ScheduleCreateSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ScheduleSerializer(schedule, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        schedule = self._get_schedule(pk, user)
        schedule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DailyPlaceCreateView(APIView):
    def post(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        schedule = get_object_or_404(Schedule, pk=pk, user=user)
        serializer = DailyPlaceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(schedule=schedule)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DailyPlaceDetailView(APIView):
    def patch(self, request, pk, dp_pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        schedule = get_object_or_404(Schedule, pk=pk, user=user)
        daily_place = get_object_or_404(DailyPlace, pk=dp_pk, schedule=schedule)
        serializer = DailyPlaceSerializer(daily_place, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, dp_pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        schedule = get_object_or_404(Schedule, pk=pk, user=user)
        daily_place = get_object_or_404(DailyPlace, pk=dp_pk, schedule=schedule)
        daily_place.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MediaImportView(APIView):
    """미디어 코스 → 내 일정으로 가져오기"""
    def post(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        media = get_object_or_404(Media, pk=pk)
        schedule = Schedule.objects.create(
            user=user,
            title=request.data.get('title', media.title),
            media=media,
            start_date=request.data.get('start_date'),
            end_date=request.data.get('end_date'),
        )
        media_places = MediaPlace.objects.filter(media=media).select_related('place').order_by('day', 'id')
        for i, mp in enumerate(media_places):
            DailyPlace.objects.create(
                schedule=schedule,
                place=mp.place,
                day_number=mp.day if mp.day else 1,
                order=i,
            )
        return Response(ScheduleSerializer(schedule, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ScheduleImportView(APIView):
    """다른 유저의 일정 → 내 일정으로 가져오기"""
    def post(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        source = get_object_or_404(Schedule, pk=pk)
        new_schedule = Schedule.objects.create(
            user=user,
            title=request.data.get('title', f'{source.title} (복사)'),
            media=source.media,
            start_date=request.data.get('start_date'),
            end_date=request.data.get('end_date'),
        )
        for dp in source.daily_places.all():
            DailyPlace.objects.create(
                schedule=new_schedule,
                place=dp.place,
                day_number=dp.day_number,
                order=dp.order,
                memo=dp.memo,
            )
        return Response(ScheduleSerializer(new_schedule, context={'request': request}).data, status=status.HTTP_201_CREATED)


class DailyPlaceBulkReorderView(APIView):
    """POST /api/schedules/{id}/places/reorder/  장소 순서 일괄 변경"""
    def post(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        schedule = get_object_or_404(Schedule, pk=pk, user=user)
        items = request.data
        if not isinstance(items, list):
            return Response({'error': '리스트 형태로 전송해주세요.'}, status=status.HTTP_400_BAD_REQUEST)
        ids = [item.get('id') for item in items if item.get('id') is not None]
        daily_places = {dp.id: dp for dp in DailyPlace.objects.filter(schedule=schedule, id__in=ids)}
        if len(daily_places) != len(ids):
            return Response({'error': '유효하지 않은 장소 ID가 포함되어 있습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        for item in items:
            dp = daily_places[item['id']]
            dp.day_number = item.get('day_number', dp.day_number)
            dp.order = item.get('order', dp.order)
        DailyPlace.objects.bulk_update(list(daily_places.values()), ['day_number', 'order'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScheduleBookmarkView(APIView):
    def post(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        schedule = get_object_or_404(Schedule, pk=pk)
        _, created = ScheduleBookmark.objects.get_or_create(user=user, schedule=schedule)
        if not created:
            return Response({'message': '이미 저장된 일정입니다.'}, status=status.HTTP_200_OK)
        return Response({'message': '저장되었습니다.'}, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        schedule = get_object_or_404(Schedule, pk=pk)
        ScheduleBookmark.objects.filter(user=user, schedule=schedule).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BookmarkedScheduleListView(APIView):
    def get(self, request):
        user = get_user(request)
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        bookmarks = ScheduleBookmark.objects.filter(user=user).select_related('schedule').prefetch_related('schedule__daily_places__place')
        schedules = [b.schedule for b in bookmarks]
        return Response(ScheduleSerializer(schedules, many=True, context={'request': request}).data)
