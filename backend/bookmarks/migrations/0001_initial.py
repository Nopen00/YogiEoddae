import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('places', '0008_place_kakao_fields'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='MediaBookmark',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='media_bookmarks', to='users.user')),
                ('media', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookmarks', to='places.media')),
            ],
            options={'ordering': ['-created_at'], 'unique_together': {('user', 'media')}},
        ),
        migrations.CreateModel(
            name='PlaceBookmark',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='place_bookmarks', to='users.user')),
                ('place', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookmarks', to='places.place')),
            ],
            options={'ordering': ['-created_at'], 'unique_together': {('user', 'place')}},
        ),
        migrations.CreateModel(
            name='PhotoBookmark',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='photo_bookmarks', to='users.user')),
                ('photo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bookmarks', to='places.photo')),
            ],
            options={'ordering': ['-created_at'], 'unique_together': {('user', 'photo')}},
        ),
    ]
