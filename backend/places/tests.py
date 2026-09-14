from django.test import TestCase
from rest_framework.test import APIClient

from .models import Media, Place, MediaPlace
from reviews.models import MediaReview
from bookmarks.models import MediaBookmark
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
