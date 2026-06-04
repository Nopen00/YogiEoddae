from rest_framework import serializers
from .models import User


class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('device_id',)
        read_only_fields = ('device_id',)
