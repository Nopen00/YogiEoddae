import uuid
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin

from .utils import hash_device_id


class UpdateLastActiveMiddleware(MiddlewareMixin):
    """
    X-Device-ID 헤더가 있는 모든 요청에서 해당 유저의 last_active_at을 갱신한다.
    고아 데이터 판별(2년 기준)에 사용된다.
    """
    def process_request(self, request):
        device_id = request.headers.get('X-Device-ID')
        if not device_id:
            return

        try:
            uuid.UUID(device_id)
        except ValueError:
            return

        from users.models import User
        User.objects.filter(device_id_hash=hash_device_id(device_id)).update(last_active_at=timezone.now())
