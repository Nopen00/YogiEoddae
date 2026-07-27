import re

from places.models import MediaPlace
from mailbox.models import MailboxItem

# 프론트 QuizDetailScreen 하드코딩 문구("3 토큰이 우편함으로 지급되었습니다")와 동일 값 유지 필요
QUIZ_PARTICIPATION_REWARD = 3
QUIZ_CORRECT_ANSWER_REWARD = 5

# MediaPlace를 quiz_confirmed로 자동 전환하는 기준 — 응답 수 N개 이상 + 정답률 80% 이상
QUIZ_MIN_RESPONSES = 3
QUIZ_CONFIRM_THRESHOLD = 0.8


def _normalize(text):
    """공백 제거 + 소문자화. 한글엔 대소문자가 없지만 영문 표기 장소명 대비."""
    return re.sub(r'\s+', '', text or '').lower()


def is_answer_correct(answer_text, place_name):
    """자유서술 답안과 실제 장소명을 퍼지매칭. 짧은 답안(1글자)은 오탐 방지를 위해 제외."""
    answer = _normalize(answer_text)
    name = _normalize(place_name)
    if len(answer) < 2 or not name:
        return False
    return answer in name or name in answer


def recalculate_media_place(media_place):
    """media_place의 퀴즈 답안 전체를 집계해 confidence_score를 갱신하고,
    기준(QUIZ_MIN_RESPONSES개 이상 + 정답률 QUIZ_CONFIRM_THRESHOLD 이상) 충족 시 quiz_confirmed로 전환한다."""
    answers = media_place.quiz_answers.all()
    total = answers.count()
    if total == 0:
        return

    correct = answers.filter(is_correct=True).count()
    media_place.confidence_score = correct / total

    if total >= QUIZ_MIN_RESPONSES and media_place.confidence_score >= QUIZ_CONFIRM_THRESHOLD:
        media_place.is_confirmed = True
        media_place.status = MediaPlace.STATUS_QUIZ_CONFIRMED

    media_place.save(update_fields=['confidence_score', 'is_confirmed', 'status'])


def grant_quiz_rewards(user, correct_count):
    """퀴즈 제출 참여 보상(고정) + 정답 개수에 비례한 보너스를 우편함에 지급."""
    MailboxItem.objects.create(user=user, action='퀴즈 참여', token_amount=QUIZ_PARTICIPATION_REWARD)
    if correct_count > 0:
        MailboxItem.objects.create(
            user=user,
            action=f'퀴즈 정답 {correct_count}개',
            token_amount=QUIZ_CORRECT_ANSWER_REWARD * correct_count,
        )
