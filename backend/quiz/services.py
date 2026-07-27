import re
from datetime import timedelta

from django.utils import timezone

from places.models import MediaPlace
from mailbox.models import MailboxItem

# 프론트 QuizDetailScreen 하드코딩 문구("3 토큰이 우편함으로 지급되었습니다")와 동일 값 유지 필요
QUIZ_PARTICIPATION_REWARD = 3
QUIZ_CORRECT_ANSWER_REWARD = 5

# MediaPlace를 quiz_confirmed로 자동 전환하는 기준 — 응답 수 N개 이상 + (가중)정답률 80% 이상
QUIZ_MIN_RESPONSES = 3
QUIZ_CONFIRM_THRESHOLD = 0.8

QUIZ_REGULAR_WEIGHT = 1.0
QUIZ_PROBABLE_VISIT_WEIGHT = 1.3


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


def is_probable_visit(user, place):
    """유저가 이 장소를 일정에 넣었고, '일정 생성일 < 배정된 날짜 < 오늘'이면 실제로 다녀왔을 개연성이 있다고 본다.
    일정 생성일이 배정된 날짜보다 앞서야 하므로, 퀴즈를 보고 그 자리에서 과거 날짜로 급조한 일정은 걸러진다."""
    from schedules.models import DailyPlace  # 순환 임포트 방지(schedules는 quiz를 참조하지 않음)

    today = timezone.localdate()
    daily_places = (DailyPlace.objects
                     .filter(schedule__user=user, place=place, schedule__start_date__isnull=False)
                     .select_related('schedule'))
    for dp in daily_places:
        visit_date = dp.schedule.start_date + timedelta(days=dp.day_number - 1)
        if dp.schedule.created_at.date() < visit_date < today:
            return True
    return False


def grade_answer(user, media_place, answer_text):
    """(is_correct, weight, is_probable_visit) 반환.
    방문 개연성이 있는 유저의 답변은 이름 매칭 없이 무조건 정답 처리 — 지식 테스트가 아니라
    "실제로 갔을 사람이 이 장소를 확인해줬다"는 신뢰도 데이터 수집이 목적이기 때문. 유저에게는
    이 구분을 노출하지 않으므로(같은 문제, 같은 보상) 여기서만 조용히 분기한다."""
    if is_probable_visit(user, media_place.place):
        return True, QUIZ_PROBABLE_VISIT_WEIGHT, True
    correct = is_answer_correct(answer_text, media_place.place.name)
    return correct, QUIZ_REGULAR_WEIGHT, False


def recalculate_media_place(media_place):
    """media_place의 퀴즈 답안 전체를 가중 집계해 confidence_score를 갱신하고,
    기준(원본 응답 수 QUIZ_MIN_RESPONSES개 이상 + 가중 정답률 QUIZ_CONFIRM_THRESHOLD 이상) 충족 시
    quiz_confirmed로 전환한다. 응답 수는 가중치와 무관하게 원본 개수로만 센다 — 방문 개연성 답변
    하나가 "N명이 답했다" 조건 자체를 혼자 채워버리지 않도록."""
    answers = list(media_place.quiz_answers.all())
    total = len(answers)
    if total == 0:
        return

    weighted_total = sum(a.weight for a in answers)
    weighted_correct = sum(a.weight for a in answers if a.is_correct)
    media_place.confidence_score = weighted_correct / weighted_total

    if total >= QUIZ_MIN_RESPONSES and media_place.confidence_score >= QUIZ_CONFIRM_THRESHOLD:
        media_place.is_confirmed = True
        media_place.status = MediaPlace.STATUS_QUIZ_CONFIRMED

    media_place.save(update_fields=['confidence_score', 'is_confirmed', 'status'])


def grant_quiz_rewards(user, correct_count):
    """퀴즈 제출 참여 보상(고정) + 정답 개수에 비례한 보너스를 우편함에 지급.
    방문 개연성으로 자동 정답 처리된 답변도 일반 정답과 동일하게 보상 — 유저에게 두 유형을
    구분해서 보여주지 않기로 했으므로 보상도 똑같아야 한다."""
    MailboxItem.objects.create(user=user, action='퀴즈 참여', token_amount=QUIZ_PARTICIPATION_REWARD)
    if correct_count > 0:
        MailboxItem.objects.create(
            user=user,
            action=f'퀴즈 정답 {correct_count}개',
            token_amount=QUIZ_CORRECT_ANSWER_REWARD * correct_count,
        )
