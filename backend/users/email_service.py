import random

from django.conf import settings
from django.core.mail import send_mail

SUBJECTS = {
    'link_email': '[요기어때?] 이메일 인증코드',
    'reset_password': '[요기어때?] 비밀번호 재설정 인증코드',
}


def generate_verification_code():
    return f'{random.randint(0, 999999):06d}'


def send_verification_email(email, code, purpose):
    """
    Gmail SMTP로 인증코드 메일을 발송한다 (settings.EMAIL_BACKEND 참고).
    .env에 EMAIL_HOST_USER/EMAIL_HOST_PASSWORD가 없으면 콘솔 출력으로 자동 대체된다.
    발송 실패 시 예외를 그대로 올려서 호출한 뷰가 500으로 응답하게 한다 —
    인증코드가 실제로 전달됐는지 알 수 없는 상태에서 성공 응답을 보내면 안 되기 때문.
    """
    subject = SUBJECTS.get(purpose, '[요기어때?] 인증코드')
    message = f'인증코드: {code}\n5분 이내에 입력해주세요.'
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
