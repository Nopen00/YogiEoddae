import logging
import random

logger = logging.getLogger(__name__)


def generate_verification_code():
    return f'{random.randint(0, 999999):06d}'


def send_verification_email(email, code, purpose):
    """
    실제 SMTP 연동 전까지의 인터페이스. 지금은 로그만 남기고,
    나중에 이 함수 내부만 실제 메일 발송 로직으로 교체하면 된다.
    """
    logger.info('[MOCK EMAIL] to=%s purpose=%s code=%s', email, purpose, code)
