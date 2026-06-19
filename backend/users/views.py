import uuid

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .utils import hash_device_id


class UserCreateView(APIView):
    """
    POST /api/users/
    새 익명 유저를 생성하고 device_id를 반환한다.
    device_id 원본은 저장하지 않고 해시만 DB에 저장한다.
    """
    def post(self, request):
        raw_device_id = uuid.uuid4()
        User.objects.create(device_id_hash=hash_device_id(raw_device_id))
        return Response({'device_id': str(raw_device_id)}, status=status.HTTP_201_CREATED)
