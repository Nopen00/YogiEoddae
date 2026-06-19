from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='device_id_hash',
            field=models.CharField(max_length=64, null=True, blank=True, editable=False),
        ),
    ]
