import hashlib
import hmac

from django.conf import settings
from django.db import migrations


def populate_device_id_hash(apps, schema_editor):
    User = apps.get_model('users', 'User')
    key = settings.DEVICE_ID_HASH_KEY.encode()
    for user in User.objects.all():
        user.device_id_hash = hmac.new(key, str(user.device_id).encode(), hashlib.sha256).hexdigest()
        user.save(update_fields=['device_id_hash'])


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_device_id_hash'),
    ]

    operations = [
        migrations.RunPython(populate_device_id_hash, reverse_noop),
    ]
