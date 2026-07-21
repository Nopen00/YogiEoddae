import random


def generate_verification_code():
    return f'{random.randint(0, 999999):06d}'


def send_verification_email(email, code, purpose):
    """
    실제 SMTP 연동 전까지의 인터페이스. 지금은 콘솔 출력만 하고,
    나중에 이 함수 내부만 실제 메일 발송 로직으로 교체하면 된다.
    (logging 모듈은 프로젝트에 LOGGING 설정이 없어 기본 레벨(WARNING)에 걸려
    조용히 버려지므로, 반드시 눈에 보이는 print를 쓴다.)
    """
    print(f'[MOCK EMAIL] to={email} purpose={purpose} code={code}')
