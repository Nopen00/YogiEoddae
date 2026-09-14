from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Media, Place, MediaPlace
from reviews.models import MediaReview, PlaceReview
from bookmarks.models import MediaBookmark, PlaceBookmark
from users.models import User


class MediaListQueryCountTests(TestCase):
    """유튜브 PICK 탭(GET /api/media/?type=youtube)이 코스 개수만큼 쿼리를
    추가로 던지지 않는지 확인한다 (N+1 회귀 방지)."""

    def _make_media_with_place(self, n):
        media = Media.objects.create(title=f'course {n}', media_type='youtube')
        place = Place.objects.create(
            name=f'place {n}', address='addr', latitude=0, longitude=0,
            content_id=f'yt_{n}',
        )
        MediaPlace.objects.create(media=media, place=place, status=MediaPlace.STATUS_ADMIN_APPROVED)
        return media

    def _count_queries(self, client):
        from django.test.utils import CaptureQueriesContext
        from django.db import connection
        with CaptureQueriesContext(connection) as ctx:
            client.get('/api/media/?type=youtube')
        return len(ctx.captured_queries)

    def test_query_count_does_not_scale_with_item_count(self):
        client = APIClient()

        for n in range(3):
            self._make_media_with_place(n)
        small_count = self._count_queries(client)

        for n in range(3, 12):
            self._make_media_with_place(n)
        large_count = self._count_queries(client)

        self.assertEqual(
            small_count, large_count,
            f'query count grew with item count ({small_count} -> {large_count}) - N+1 regression',
        )

    def test_annotated_fields_match_actual_data(self):
        user = User.objects.create(username='tester', device_id_hash='x')
        media = self._make_media_with_place(0)
        MediaReview.objects.create(user=user, media=media, rating=4.5, content='great')
        MediaBookmark.objects.create(user=user, media=media)

        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.get('/api/media/?type=youtube')
        item = resp.json()['results'][0]

        self.assertEqual(item['place_count'], 1)
        self.assertEqual(item['rating'], 4.5)
        self.assertEqual(item['like_count'], 1)
        self.assertTrue(item['is_bookmarked'])
        self.assertFalse(item['is_submitted'])


@override_settings(GOOGLE_PLACES_API_KEY='', TOUR_PHOTO_API_KEY='')
class MediaPlacesQueryCountTests(TestCase):
    """코스 상세의 장소 목록(GET /api/media/{id}/places/, 화면의 작은 썸네일들)이
    장소 개수만큼 쿼리를 추가로 던지지 않는지 확인한다 (N+1 회귀 방지)."""

    def _make_media_with_n_places(self, n, prefix=''):
        media = Media.objects.create(title='course', media_type='youtube')
        for i in range(n):
            place = Place.objects.create(
                name=f'place {prefix}{i}', address='addr', latitude=0, longitude=0,
                content_id=f'yt_{prefix}{i}', image_url='http://example.com/x.jpg',
            )
            MediaPlace.objects.create(media=media, place=place, status=MediaPlace.STATUS_ADMIN_APPROVED)
        return media

    def _count_queries(self, client, media_id):
        from django.test.utils import CaptureQueriesContext
        from django.db import connection
        with CaptureQueriesContext(connection) as ctx:
            resp = client.get(f'/api/media/{media_id}/places/')
        return len(ctx.captured_queries), resp

    def test_query_count_does_not_scale_with_place_count(self):
        client = APIClient()
        small_media = self._make_media_with_n_places(2, prefix='s')
        small_count, _ = self._count_queries(client, small_media.id)

        large_media = self._make_media_with_n_places(10, prefix='l')
        large_count, _ = self._count_queries(client, large_media.id)

        self.assertEqual(
            small_count, large_count,
            f'query count grew with place count ({small_count} -> {large_count}) - N+1 regression',
        )

    def test_place_annotated_fields_match_actual_data(self):
        user = User.objects.create(username='tester2', device_id_hash='y')
        media = self._make_media_with_n_places(1)
        place = media.media_places.first().place
        PlaceReview.objects.create(user=user, place=place, rating=3.5, content='ok')
        PlaceBookmark.objects.create(user=user, place=place)

        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.get(f'/api/media/{media.id}/places/')
        item = resp.json()[0]['place']

        self.assertEqual(item['rating'], 3.5)
        self.assertEqual(item['like_count'], 1)
        self.assertTrue(item['is_bookmarked'])
