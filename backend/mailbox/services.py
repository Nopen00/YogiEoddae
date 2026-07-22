from .models import MailboxItem, SettlementItem

REVIEW_WRITE_REWARD = 10
PHOTO_PUBLISH_REWARD = 20

LIKE_MILESTONE_FIRST = 50
LIKE_MILESTONE_FIRST_REWARD = 100
LIKE_MILESTONE_STEP = 10
LIKE_MILESTONE_STEP_REWARD = 10


def grant_review_write_reward(user):
    MailboxItem.objects.create(user=user, action='리뷰 작성', token_amount=REVIEW_WRITE_REWARD)


def grant_photo_publish_reward(photo):
    """포토스팟이 최초로 승인(게시)될 때 1회만 지급. 이후 보상은 좋아요 마일스톤 정산으로만 받는다."""
    if not photo.uploaded_by_id or photo.publish_reward_granted:
        return
    MailboxItem.objects.create(user=photo.uploaded_by, action='포토스팟 게시', token_amount=PHOTO_PUBLISH_REWARD)
    photo.publish_reward_granted = True
    photo.save(update_fields=['publish_reward_granted'])


def check_and_grant_like_milestone(photo):
    """photo.likes가 새 마일스톤(50개, 이후 10개마다)을 넘었으면 정산함에 지급한다."""
    if not photo.uploaded_by_id:
        return

    likes = photo.likes
    last = photo.last_rewarded_likes
    if likes < LIKE_MILESTONE_FIRST:
        return

    if last == 0:
        SettlementItem.objects.create(
            user=photo.uploaded_by,
            action=f'포토스팟 좋아요 {LIKE_MILESTONE_FIRST}개 달성',
            token_amount=LIKE_MILESTONE_FIRST_REWARD,
        )
        last = LIKE_MILESTONE_FIRST

    next_threshold = last + LIKE_MILESTONE_STEP
    while likes >= next_threshold:
        SettlementItem.objects.create(
            user=photo.uploaded_by,
            action=f'포토스팟 좋아요 {next_threshold}개 달성',
            token_amount=LIKE_MILESTONE_STEP_REWARD,
        )
        last = next_threshold
        next_threshold += LIKE_MILESTONE_STEP

    photo.last_rewarded_likes = last
    photo.save(update_fields=['last_rewarded_likes'])
