from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_populate_device_id_hash'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='device_id',
        ),
        migrations.AlterField(
            model_name='user',
            name='device_id_hash',
            field=models.CharField(max_length=64, unique=True, editable=False),
        ),
    ]
