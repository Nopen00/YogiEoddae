from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('places', '0006_photo'),
    ]

    operations = [
        migrations.AddField(
            model_name='mediaplace',
            name='day',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
