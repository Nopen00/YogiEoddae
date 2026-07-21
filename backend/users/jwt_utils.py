from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings

ALGORITHM = 'HS256'
TOKEN_TYPE_ACCESS = 'access'
TOKEN_TYPE_REFRESH = 'refresh'


class InvalidTokenError(Exception):
    pass


def _build_token(user, token_type, lifetime):
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user.id,
        'type': token_type,
        'iat': now,
        'exp': now + lifetime,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def generate_access_token(user):
    lifetime = timedelta(minutes=settings.JWT_ACCESS_TOKEN_LIFETIME_MINUTES)
    return _build_token(user, TOKEN_TYPE_ACCESS, lifetime)


def generate_refresh_token(user):
    lifetime = timedelta(days=settings.JWT_REFRESH_TOKEN_LIFETIME_DAYS)
    return _build_token(user, TOKEN_TYPE_REFRESH, lifetime)


def issue_token_pair(user):
    return {
        'access': generate_access_token(user),
        'refresh': generate_refresh_token(user),
    }


def decode_token(token, expected_type):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise InvalidTokenError('토큰이 만료되었습니다.')
    except jwt.InvalidTokenError:
        raise InvalidTokenError('유효하지 않은 토큰입니다.')

    if payload.get('type') != expected_type:
        raise InvalidTokenError('유효하지 않은 토큰입니다.')
    return payload
