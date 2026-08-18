"""
URL configuration for YogiEoddae project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.contrib.admin.views.decorators import staff_member_required
from django.urls import path, include
from django.views.generic import TemplateView
from django.views.static import serve
from places.views import index_view

urlpatterns = [
    # 관리 대시보드(승인/검토 대기 통계) — 관리자 포털 로그인 보호 대상, 2026-08-18 추가
    path('',        staff_member_required(index_view), name='index'),
    path('admin/',  admin.site.urls),
    path('privacy/', TemplateView.as_view(template_name='legal/privacy.html'), name='privacy'),
    path('terms/',   TemplateView.as_view(template_name='legal/terms.html'),   name='terms'),
    path('account-deletion/', TemplateView.as_view(template_name='legal/account-deletion.html'), name='account-deletion'),
    path('places/', include('places.urls')),
    path('course-suggestions/', include('course_suggestions.admin_urls')),
    path('api/',    include('places.api_urls')),
    path('api/',    include('users.urls')),
    path('api/',    include('schedules.urls')),
    path('api/',    include('bookmarks.urls')),
    path('api/',    include('reviews.urls')),
    path('api/',    include('mailbox.urls')),
    path('api/',    include('course_suggestions.urls')),
]

# media(업로드된 포토스팟 이미지 등)는 별도 스토리지/CDN 없이 Railway 볼륨에 로컬 저장 중이라,
# DEBUG 여부와 무관하게 항상 서빙해야 함. django.conf.urls.static.static()은 DEBUG=False면
# 내부적으로 빈 리스트를 반환해버려서(no-op) 쓸 수 없고, serve 뷰를 직접 등록해야 함 —
# 기존엔 DEBUG일 때만 서빙해서 운영 환경(DEBUG=False)에서 업로드 이미지가 전부 404가 나
# AI 검열 다운로드 실패 + 앱에서 이미지 로드 실패로 이어졌었음 (2026-08-15 발견).
urlpatterns += [
    path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
]
