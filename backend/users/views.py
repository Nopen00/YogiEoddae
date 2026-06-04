from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .serializers import UserCreateSerializer


class UserCreateView(APIView):
    """
    POST /api/users/
    새 익명 유저를 생성하고 device_id를 반환한다.
    """
    def post(self, request):
        user = User.objects.create()
        serializer = UserCreateSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
