from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('places', '0007_mediaplace_day'),
    ]

    operations = [
        migrations.AddField(
            model_name='place',
            name='kakao_place_id',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='place',
            name='kakao_place_url',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
