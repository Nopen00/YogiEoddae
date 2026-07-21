import uuid
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .email_service import generate_verification_code, send_verification_email
from .jwt_utils import InvalidTokenError, TOKEN_TYPE_REFRESH, decode_token, generate_access_token, issue_token_pair
from .models import EmailVerificationCode, PasswordHistory, User
from .utils import (
    hash_device_id,
    is_password_reused,
    mask_email,
    mask_username,
    validate_password,
)

RESEND_COOLDOWN_SECONDS = 60
CODE_TTL_MINUTES = 5


class SignupView(APIView):
    """POST /api/users/signup/  아이디/닉네임/비밀번호로 회원가입 (이메일은 가입 후 MY페이지에서 선택 연동)"""
    def post(self, request):
        username = (request.data.get('username') or '').strip()
        nickname = (request.data.get('nickname') or '').strip()
        password = request.data.get('password') or ''

        errors = {}

        user = User(username=username, nickname=nickname)
        try:
            user.full_clean(validate_unique=False)
        except DjangoValidationError as e:
            errors.update(e.message_dict)

        password_errors = validate_password(password, username=username)
        if password_errors:
            errors['password'] = password_errors

        if 'username' not in errors and User.objects.filter(username=username).exists():
            errors['username'] = ['이미 사용 중인 아이디입니다.']

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user.password_hash = make_password(password)
        user.save()

        tokens = issue_token_pair(user)
        return Response({
            'id': user.id,
            'username': user.username,
            'nickname': user.nickname,
            'access': tokens['access'],
            'refresh': tokens['refresh'],
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST /api/users/login/  아이디+비밀번호 로그인, JWT access/refresh 토큰 발급"""
    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''

        auth_error = Response(
            {'detail': '등록되지 않은 아이디이거나, 비밀번호가 올바르지 않습니다.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

        if not username or not password:
            return auth_error

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return auth_error

        if not user.password_hash or not check_password(password, user.password_hash):
            return auth_error

        tokens = issue_token_pair(user)
        return Response({
            'id': user.id,
            'username': user.username,
            'nickname': user.nickname,
            'access': tokens['access'],
            'refresh': tokens['refresh'],
        })


class TokenRefreshView(APIView):
    """POST /api/users/token/refresh/  { refresh } → 새 access 토큰 발급"""
    def post(self, request):
        refresh_token = request.data.get('refresh') or ''

        try:
            payload = decode_token(refresh_token, expected_type=TOKEN_TYPE_REFRESH)
        except InvalidTokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            return Response({'detail': '유효하지 않은 토큰입니다.'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response({'access': generate_access_token(user)})


class FindIdView(APIView):
    """POST /api/users/find-id/  { email, password } → 일치하면 마스킹된 아이디 반환 (인증코드 없음)"""
    def post(self, request):
        email = (request.data.get('email') or '').strip()
        password = request.data.get('password') or ''

        not_found_error = Response(
            {'detail': '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'},
            status=status.HTTP_404_NOT_FOUND,
        )

        if not email or not password:
            return not_found_error

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return not_found_error

        if not user.username or not user.password_hash or not check_password(password, user.password_hash):
            return not_found_error

        return Response({'masked_username': mask_username(user.username)})


class WithdrawView(APIView):
    """
    POST /api/users/withdraw/  회원탈퇴 (JWT 인증 필요, 비밀번호 재확인)
    데이터·토큰 잔액은 즉시 소멸하며 환불되지 않는다 (schedules/bookmarks는 User FK CASCADE로 함께 삭제됨).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get('password') or ''
        user = request.user

        if not user.password_hash or not check_password(password, user.password_hash):
            return Response({'detail': '비밀번호가 올바르지 않습니다.'}, status=status.HTTP_401_UNAUTHORIZED)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VerifyPasswordView(APIView):
    """POST /api/users/verify-password/  { password } → 로그인한 유저의 현재 비밀번호 확인"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get('password') or ''
        user = request.user
        success = bool(user.password_hash) and check_password(password, user.password_hash)
        return Response({'success': success})


class ChangePasswordView(APIView):
    """POST /api/users/change-password/  { current_password, new_password } — 로그인 상태에서 바로 변경"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('current_password') or ''
        new_password = request.data.get('new_password') or ''
        user = request.user

        if not user.password_hash or not check_password(current_password, user.password_hash):
            return Response(
                {'current_password': ['현재 비밀번호와 일치하지 않습니다.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        errors = {}
        password_errors = validate_password(new_password, username=user.username)
        if password_errors:
            errors['new_password'] = password_errors
        elif is_password_reused(user, new_password):
            errors['new_password'] = ['최근에 사용했던 비밀번호는 사용할 수 없습니다.']

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        PasswordHistory.objects.create(user=user, password_hash=user.password_hash)
        user.password_hash = make_password(new_password)
        user.save(update_fields=['password_hash'])
        return Response({'detail': '비밀번호가 변경되었습니다.'})


class EmailLinkRequestView(APIView):
    """POST /api/users/email/request/  { email } → 로그인한 유저에게 이메일 연동/변경용 인증코드 발송"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        user = request.user

        if not email:
            return Response({'email': ['이메일을 입력해주세요.']}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exclude(pk=user.pk).exists():
            return Response({'email': ['이미 사용중인 이메일 입니다.']}, status=status.HTTP_400_BAD_REQUEST)

        last_code = user.email_verification_codes.filter(
            purpose=EmailVerificationCode.PURPOSE_LINK_EMAIL,
        ).order_by('-created_at').first()
        if last_code and (timezone.now() - last_code.created_at).total_seconds() < RESEND_COOLDOWN_SECONDS:
            return Response(
                {'detail': '인증 메일은 60초 후에 재전송할 수 있습니다.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        code = generate_verification_code()
        EmailVerificationCode.objects.create(
            user=user,
            email=email,
            code=code,
            purpose=EmailVerificationCode.PURPOSE_LINK_EMAIL,
            expires_at=timezone.now() + timedelta(minutes=CODE_TTL_MINUTES),
        )
        send_verification_email(email, code, EmailVerificationCode.PURPOSE_LINK_EMAIL)
        return Response({'email': email})


class EmailLinkConfirmView(APIView):
    """POST /api/users/email/confirm/  { email, code } → 인증코드 확인 후 이메일 연동/변경 확정"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        code = (request.data.get('code') or '').strip()
        user = request.user

        verification = user.email_verification_codes.filter(
            purpose=EmailVerificationCode.PURPOSE_LINK_EMAIL,
            email=email,
            is_used=False,
        ).order_by('-created_at').first()

        if not verification:
            return Response({'detail': '인증코드가 일치하지 않습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        if verification.expires_at < timezone.now():
            return Response({'detail': '인증 코드가 만료되었습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        if verification.code != code:
            return Response({'detail': '인증코드가 일치하지 않습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exclude(pk=user.pk).exists():
            return Response({'email': ['이미 사용중인 이메일 입니다.']}, status=status.HTTP_400_BAD_REQUEST)

        verification.is_used = True
        verification.save(update_fields=['is_used'])
        user.email = email
        user.save(update_fields=['email'])
        return Response({'email': user.email})


class PasswordResetRequestView(APIView):
    """POST /api/users/password-reset/request/  { username } → 연동된 이메일로 인증코드 발송"""
    def post(self, request):
        username = (request.data.get('username') or '').strip()

        not_found_error = Response(
            {'detail': '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'},
            status=status.HTTP_404_NOT_FOUND,
        )

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return not_found_error

        if not user.email:
            return not_found_error

        last_code = user.email_verification_codes.filter(
            purpose=EmailVerificationCode.PURPOSE_RESET_PASSWORD,
        ).order_by('-created_at').first()
        if last_code and (timezone.now() - last_code.created_at).total_seconds() < RESEND_COOLDOWN_SECONDS:
            return Response(
                {'detail': '인증 메일은 60초 후에 재전송할 수 있습니다.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        code = generate_verification_code()
        EmailVerificationCode.objects.create(
            user=user,
            email=user.email,
            code=code,
            purpose=EmailVerificationCode.PURPOSE_RESET_PASSWORD,
            expires_at=timezone.now() + timedelta(minutes=CODE_TTL_MINUTES),
        )
        send_verification_email(user.email, code, EmailVerificationCode.PURPOSE_RESET_PASSWORD)

        return Response({'masked_email': mask_email(user.email)})


class PasswordResetVerifyView(APIView):
    """POST /api/users/password-reset/verify/  { username, code } → 인증코드 확인"""
    def post(self, request):
        username = (request.data.get('username') or '').strip()
        code = (request.data.get('code') or '').strip()

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'detail': '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        verification = user.email_verification_codes.filter(
            purpose=EmailVerificationCode.PURPOSE_RESET_PASSWORD,
            is_used=False,
        ).order_by('-created_at').first()

        if not verification:
            return Response({'detail': '인증코드가 일치하지 않습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        if verification.expires_at < timezone.now():
            return Response({'detail': '인증 코드가 만료되었습니다.'}, status=status.HTTP_400_BAD_REQUEST)
        if verification.code != code:
            return Response({'detail': '인증코드가 일치하지 않습니다.'}, status=status.HTTP_400_BAD_REQUEST)

        verification.is_used = True
        verification.save(update_fields=['is_used'])
        return Response({'verified': True})


class PasswordResetConfirmView(APIView):
    """POST /api/users/password-reset/confirm/  { username, new_password } — verify를 통과한 코드가 있어야 함"""
    def post(self, request):
        username = (request.data.get('username') or '').strip()
        new_password = request.data.get('new_password') or ''

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'detail': '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        verification = user.email_verification_codes.filter(
            purpose=EmailVerificationCode.PURPOSE_RESET_PASSWORD,
            is_used=True,
            expires_at__gte=timezone.now(),
        ).order_by('-created_at').first()
        if not verification:
            return Response(
                {'detail': '인증이 만료되었습니다. 처음부터 다시 시도해주세요.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        errors = {}
        password_errors = validate_password(new_password, username=username)
        if password_errors:
            errors['new_password'] = password_errors
        elif is_password_reused(user, new_password):
            errors['new_password'] = ['최근에 사용했던 비밀번호는 사용할 수 없습니다.']

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        if user.password_hash:
            PasswordHistory.objects.create(user=user, password_hash=user.password_hash)
        user.password_hash = make_password(new_password)
        user.save(update_fields=['password_hash'])
        verification.delete()

        return Response({'detail': '비밀번호 재설정이 완료되었습니다.'})


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
    """GET /api/users/me/  내 프로필/토큰 정보 조회, PATCH로 닉네임/아이디 변경 (이메일은 email/request·confirm으로만 변경)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'nickname': user.nickname,
            'email': user.email,
            'token_balance': user.token_balance,
        })

    def patch(self, request):
        user = request.user
        errors = {}
        update_fields = []

        if 'nickname' in request.data:
            user.nickname = (request.data.get('nickname') or '').strip()
            update_fields.append('nickname')

        if 'username' in request.data:
            username = (request.data.get('username') or '').strip()
            if User.objects.filter(username=username).exclude(pk=user.pk).exists():
                errors['username'] = ['이미 사용 중인 아이디입니다.']
            else:
                user.username = username
                update_fields.append('username')

        if update_fields and not errors:
            try:
                user.full_clean(validate_unique=False)
            except DjangoValidationError as e:
                errors.update(e.message_dict)

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        if update_fields:
            user.save(update_fields=update_fields)

        return Response({
            'id': user.id,
            'username': user.username,
            'nickname': user.nickname,
            'email': user.email,
            'token_balance': user.token_balance,
        })


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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        package = TOKEN_PACKAGES.get(request.data.get('package_id'))
        if not package:
            return Response({'error': '유효하지 않은 상품입니다.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        user.token_balance += package['tokens']
        user.save(update_fields=['token_balance'])
        return Response({'token_balance': user.token_balance})


class TokenResetView(APIView):
    """POST /api/users/reset-token/  테스트용 — 보유 토큰을 0으로 초기화"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.token_balance = 0
        user.save(update_fields=['token_balance'])
        return Response({'token_balance': user.token_balance})
