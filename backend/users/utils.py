import hashlib
import hmac
import uuid

from django.conf import settings


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
