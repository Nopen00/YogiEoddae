from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .jwt_utils import InvalidTokenError, TOKEN_TYPE_ACCESS, decode_token
from .models import User


class JWTAuthentication(BaseAuthentication):
    """Authorization: Bearer <access token> 헤더로 유저를 식별한다."""
    keyword = 'Bearer'

    def authenticate(self, request):
        header = request.headers.get('Authorization')
        if not header or not header.startswith(f'{self.keyword} '):
            return None

        token = header[len(self.keyword) + 1:].strip()
        try:
            payload = decode_token(token, expected_type=TOKEN_TYPE_ACCESS)
        except InvalidTokenError as e:
            raise AuthenticationFailed(str(e))

        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise AuthenticationFailed('유효하지 않은 토큰입니다.')

        User.objects.filter(id=user.id).update(last_active_at=timezone.now())
        return (user, token)
