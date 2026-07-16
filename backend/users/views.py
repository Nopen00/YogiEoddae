import uuid

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .utils import hash_device_id, get_user_by_device_id


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


class UserMeView(APIView):
    """GET /api/users/me/  내 보유 토큰 등 유저 정보 조회"""
    def get(self, request):
        user = get_user_by_device_id(request.headers.get('X-Device-ID'))
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'token_balance': user.token_balance})


# 실제 PG(토스페이먼츠 등) 연동 전까지의 mock 카탈로그.
# 결제 금액은 클라이언트가 아니라 이 서버측 값을 기준으로 처리한다.
TOKEN_PACKAGES = {
    'p100':  {'tokens': 100,  'price': 1000},
    'p500':  {'tokens': 500,  'price': 4500},
    'p1000': {'tokens': 1000, 'price': 8000},
}


class TokenChargeView(APIView):
    """
    POST /api/users/charge-token/  { "package_id": "p100" }
    실제 PG 연동 전 mock — 결제가 성공했다고 가정하고 바로 토큰 잔액을 반영한다.
    """
    def post(self, request):
        user = get_user_by_device_id(request.headers.get('X-Device-ID'))
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)

        package = TOKEN_PACKAGES.get(request.data.get('package_id'))
        if not package:
            return Response({'error': '유효하지 않은 상품입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        user.token_balance += package['tokens']
        user.save(update_fields=['token_balance'])
        return Response({'token_balance': user.token_balance})


class TokenResetView(APIView):
    """POST /api/users/reset-token/  테스트용 — 보유 토큰을 0으로 초기화"""
    def post(self, request):
        user = get_user_by_device_id(request.headers.get('X-Device-ID'))
        if not user:
            return Response({'error': '유저 정보가 없습니다.'}, status=status.HTTP_401_UNAUTHORIZED)

        user.token_balance = 0
        user.save(update_fields=['token_balance'])
        return Response({'token_balance': user.token_balance})
