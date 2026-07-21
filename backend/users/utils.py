import hashlib
import hmac
import re
import uuid

from django.conf import settings
from django.contrib.auth.hashers import check_password

PASSWORD_MIN_LENGTH = 8


def validate_password(password, username=None):
    errors = []
    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append('8자 이상으로 입력해주세요.')
    has_letter = re.search(r'[a-zA-Z]', password)
    has_digit = re.search(r'\d', password)
    has_special = re.search(r'[^a-zA-Z0-9]', password)
    if not (has_letter and has_digit and has_special):
        errors.append('영문, 숫자, 특수문자를 혼합사용하여 입력해주세요.')
    if username and password == username:
        errors.append('아이디와 같은 비밀번호는 사용할 수 없습니다.')
    return errors


def hash_device_id(raw_device_id):
    return hmac.new(
        settings.DEVICE_ID_HASH_KEY.encode(),
        str(raw_device_id).encode(),
        hashlib.sha256,
    ).hexdigest()


def get_user_by_device_id(raw_device_id):
    if not raw_device_id:
        return None
    try:
        uuid.UUID(raw_device_id)
    except (ValueError, TypeError):
        return None

    from .models import User
    try:
        return User.objects.get(device_id_hash=hash_device_id(raw_device_id))
    except User.DoesNotExist:
        return None


def mask_email(email):
    local, _, domain = email.partition('@')
    domain_name, dot, tld = domain.rpartition('.')
    masked_local = local[:2] + '****'
    masked_domain = (domain_name[:1] + '****') if domain_name else '****'
    return f'{masked_local}@{masked_domain}{dot}{tld}'


def mask_username(username):
    return f'{username[:4]}{"*" * 6}'


def is_password_reused(user, raw_password):
    if user.password_hash and check_password(raw_password, user.password_hash):
        return True
    return any(
        check_password(raw_password, history.password_hash)
        for history in user.password_history.all()
    )
