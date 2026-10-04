from django.db import connection
from django.test import TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from bookmarks.models import PlaceBookmark
from reviews.models import PlaceReview
from schedules.models import DailyPlace, Schedule
from users.models import User
from .models import Photo, Place


@override_settings(GOOGLE_PLACES_API_KEY='', TOUR_PHOTO_API_KEY='')
class PlaceImageFallbackTests(TestCase):
    """일정/찜/리뷰 화면의 장소 썸네일이 코스 화면과 같은 폴백(KTO → KTO사진 → 포토스팟 → 구글)을
    쓰는지 확인한다 (image_url 원본 컬럼만 내려주던 회귀 방지)."""

    def setUp(self):
        self.user = User.objects.create(username='fb', device_id_hash='fb')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.schedule = Schedule.objects.create(user=self.user, title='s')

    def _place(self, i, **kw):
        place = Place.objects.create(name=f'p{i}', address='a', latitude=0, longitude=0, content_id=f'yt_{i}', **kw)
        DailyPlace.objects.create(schedule=self.schedule, place=place, day_number=1, order=i)
        PlaceBookmark.objects.create(user=self.user, place=place)
        PlaceReview.objects.create(user=self.user, place=place, rating=4, content='ok')
        return place

    def _images(self):
        sched = self.client.get(f'/api/schedules/{self.schedule.id}/').json()
        sched_imgs = [dp['place']['image_url'] for dp in sched['daily_places']]
        saved = self.client.get('/api/bookmarks/').json()['saved_places']
        saved_imgs = [p['image_url'] for p in saved]
        mine = self.client.get('/api/reviews/mine/?type=place').json()
        review_imgs = [r['place']['image_url'] for r in mine]
        return sched_imgs, saved_imgs, review_imgs

    def test_fallback_applies_to_schedule_bookmark_review(self):
        self._place(0, image_url='http://x/kto.jpg')
        self._place(1, kto_photo_url='http://x/ktophoto.jpg')
        p2 = self._place(2)
        Photo.objects.create(place=p2, image_url='http://x/spot.jpg')
        self._place(3, google_photo_url='/media/g.jpg')
        self._place(4)

        for imgs in self._images():
            self.assertCountEqual(
                imgs,
                ['http://x/kto.jpg', 'http://x/ktophoto.jpg', 'http://x/spot.jpg', 'http://testserver/media/g.jpg', ''],
            )

    def test_schedule_query_count_does_not_scale_with_place_count(self):
        def count():
            with CaptureQueriesContext(connection) as ctx:
                self.client.get(f'/api/schedules/{self.schedule.id}/')
            return len(ctx.captured_queries)

        self._place(0)
        small = count()
        for i in range(1, 8):
            self._place(i)
        self.assertEqual(small, count(), 'schedule detail query count grew with place count - N+1 regression')
