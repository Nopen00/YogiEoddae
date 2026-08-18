from django.urls import path
from .views import (
    fetch_and_save_places, get_place_list, place_map_test, demo_view, map_embed_view,
    index_view, admin_media_list_view, admin_extract_view, admin_review_view,
    admin_place_update_view, admin_place_search_view,
    admin_geocode_media_view, admin_revoke_approval_view, admin_delete_media_view,
    admin_photo_review_view, admin_photo_approve_view, admin_photo_delete_view,
    admin_photo_recheck_view,
    admin_playlist_extract_view, admin_playlist_fetch_api, admin_playlist_fetch_status_view,
    admin_playlist_fetch_history_view, admin_playlist_job_start_view,
    admin_playlist_job_status_view, admin_playlist_job_cancel_view, admin_playlist_job_retry_view,
)

urlpatterns = [
    path('fetch/',  fetch_and_save_places, name='fetch_places'),
    path('list/',   get_place_list,        name='place_list'),
    path('map-test/', place_map_test,      name='map_test'),
    path('demo/',   demo_view,             name='demo'),
    path('map-embed/', map_embed_view,     name='map_embed'),

    # 관리자 포털
    path('extract/',                        admin_extract_view,    name='admin_extract'),
    path('extract/history/',                admin_media_list_view, name='admin_media_list'),
    path('extract/review/<int:media_id>/',  admin_review_view,     name='admin_review'),
    path('extract/<int:media_id>/delete/',  admin_delete_media_view, name='admin_delete_media'),
    path('place/<int:place_id>/update/',    admin_place_update_view, name='admin_place_update'),
    path('place/search/',                   admin_place_search_view,  name='admin_place_search'),
    path('extract/review/<int:media_id>/geocode/', admin_geocode_media_view,   name='admin_geocode_media'),
    path('mediaplace/<int:mp_id>/revoke/',         admin_revoke_approval_view, name='admin_revoke_approval'),

    # 재생목록 일괄 추출
    path('extract/playlist/',                        admin_playlist_extract_view,    name='admin_playlist_extract'),
    path('extract/playlist/fetch/',                   admin_playlist_fetch_api,        name='admin_playlist_fetch'),
    path('extract/playlist/fetch/<int:fetch_job_id>/status/', admin_playlist_fetch_status_view, name='admin_playlist_fetch_status'),
    path('extract/playlist/fetch/history/',            admin_playlist_fetch_history_view, name='admin_playlist_fetch_history'),
    path('extract/playlist/start/',                   admin_playlist_job_start_view,  name='admin_playlist_job_start'),
    path('extract/playlist/job/<int:job_id>/status/', admin_playlist_job_status_view, name='admin_playlist_job_status'),
    path('extract/playlist/job/<int:job_id>/cancel/', admin_playlist_job_cancel_view, name='admin_playlist_job_cancel'),
    path('extract/playlist/job/<int:job_id>/retry/',  admin_playlist_job_retry_view,  name='admin_playlist_job_retry'),

    # 포토스팟 검열 포털
    path('photos/review/',                  admin_photo_review_view,   name='admin_photo_review'),
    path('photos/review/recheck/',          admin_photo_recheck_view,  name='admin_photo_recheck'),
    path('photos/<int:photo_id>/approve/',  admin_photo_approve_view,  name='admin_photo_approve'),
    path('photos/<int:photo_id>/delete/',   admin_photo_delete_view,   name='admin_photo_delete'),
]
