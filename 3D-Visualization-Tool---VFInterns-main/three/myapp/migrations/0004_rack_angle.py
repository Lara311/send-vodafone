# Generated by Django 5.0.6 on 2024-07-13 14:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0003_floor_gridx_floor_gridy'),
    ]

    operations = [
        migrations.AddField(
            model_name='rack',
            name='angle',
            field=models.FloatField(default='0'),
            preserve_default=False,
        ),
    ]
