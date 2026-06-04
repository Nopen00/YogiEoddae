import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('places', '0007_mediaplace_day'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Schedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='schedules', to='users.user')),
                ('media', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='schedules', to='places.media')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='DailyPlace',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day_number', models.IntegerField()),
                ('order', models.IntegerField()),
                ('memo', models.TextField(blank=True)),
                ('schedule', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='daily_places', to='schedules.schedule')),
                ('place', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='places.place')),
            ],
            options={'ordering': ['day_number', 'order']},
        ),
        migrations.CreateModel(
            name='ScheduleBookmark',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookmarked_schedules', to='users.user')),
                ('schedule', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookmarks', to='schedules.schedule')),
            ],
            options={'unique_together': {('user', 'schedule')}},
        ),
    ]
