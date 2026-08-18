import random

import requests
from django.conf import settings

SUBJECTS = {
    'link_email': '[요기어때?] 이메일 인증코드',
    'reset_password': '[요기어때?] 비밀번호 재설정 인증코드',
}

RESEND_API_URL = 'https://api.resend.com/emails'


def generate_verification_code():
    return f'{random.randint(0, 999999):06d}'


def send_verification_email(email, code, purpose):
    """
    Resend HTTP API로 인증코드 메일을 발송한다 (Gmail SMTP는 Railway가 587 포트를
    막고 있어서 못 씀 - settings.py 주석 참고).
    .env에 RESEND_API_KEY가 없으면 콘솔 출력으로 자동 대체된다.
    발송 실패 시 예외를 그대로 올려서 호출한 뷰가 500으로 응답하게 한다 —
    인증코드가 실제로 전달됐는지 알 수 없는 상태에서 성공 응답을 보내면 안 되기 때문.
    """
    subject = SUBJECTS.get(purpose, '[요기어때?] 인증코드')
    message = f'인증코드: {code}\n5분 이내에 입력해주세요.'

    if not settings.RESEND_API_KEY:
        print(f'[EMAIL to {email}] {subject}\n{message}')
        return

    resp = requests.post(
        RESEND_API_URL,
        headers={'Authorization': f'Bearer {settings.RESEND_API_KEY}'},
        json={
            'from': settings.RESEND_FROM_EMAIL,
            'to': [email],
            'subject': subject,
            'text': message,
        },
        timeout=10,
    )
    resp.raise_for_status()
