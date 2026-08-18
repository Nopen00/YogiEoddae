from django.db import models
from users.models import User


class Tag(models.Model):
    CATEGORY_CHOICES = [
        ('media_type', '미디어 유형'),
        ('genre',      '장르'),
        ('place_type', '장소 유형'),
        ('photo_custom', '포토스팟 자유 태그'),
    ]

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    name = models.CharField(max_length=50)

    class Meta:
        unique_together = ('category', 'name')
        ordering = ['category', 'name']

    def __str__(self):
        return f'[{self.get_category_display()}] {self.name}'


class Place(models.Model):
    CONTENT_TYPES = [
        ('12', '관광지'),
        ('14', '문화시설'),
        ('15', '축제공연행사'),
        ('25', '여행코스'),
        ('28', '레포츠'),
        ('32', '숙박'),
        ('38', '쇼핑'),
        ('39', '음식점'),
    ]

    name = models.CharField(max_length=200)
    address = models.CharField(max_length=500)
    latitude = models.DecimalField(max_digits=20, decimal_places=14)
    longitude = models.DecimalField(max_digits=20, decimal_places=14)
    content_id = models.CharField(max_length=50, unique=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    # 관광공사 콘텐츠 타입 (12=관광지, 14=문화시설 등)
    category = models.CharField(max_length=5, choices=CONTENT_TYPES, blank=True, default='')
    # KTO 공식 데이터 = True, YouTube 파싱 등 미확정 = False
    is_verified = models.BooleanField(default=True)
    kakao_place_id = models.CharField(max_length=50, blank=True, null=True)
    kakao_place_url = models.URLField(max_length=500, blank=True, null=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='places')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Media(models.Model):
    MEDIA_TYPES = [
        ('drama', '드라마'),
        ('movie', '영화'),
        ('youtube', '유튜브'),
        ('etc', '기타'),
    ]

    title = models.CharField(max_length=200)
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES)
    source_url = models.URLField(max_length=500, blank=True, default='')
    year = models.IntegerField(null=True, blank=True)
    thumbnail_url = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='media')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'[{self.get_media_type_display()}] {self.title}'


class Photo(models.Model):
    STATUS_APPROVED = 'approved'
    STATUS_PENDING = 'pending'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_APPROVED, '승인'),
        (STATUS_PENDING,  '심사중'),
        (STATUS_REJECTED, '반려'),
    ]

    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='photos')
    image_url = models.URLField(max_length=500)  # 대표사진
    description = models.TextField(blank=True)  # 제목
    # 프론트에서 'YYYY.MM.DD' 형태의 자유 문자열로 보내므로 DateField 대신 CharField로 그대로 저장.
    travel_date = models.CharField(max_length=20, blank=True, default='')
    content = models.TextField(blank=True, default='')  # 상세 설명
    likes = models.IntegerField(default=0)
    tags = models.ManyToManyField(Tag, blank=True, related_name='photos')
    # 유저 업로드 지원 (null=관리자가 기존 방식으로 등록한 포토스팟)
    uploaded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='uploaded_photos')
    # 심사 상태. 관리자/기존 등록 건은 기본값 approved로 그대로 노출, 유저 업로드는 생성 시 pending으로 시작.
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_APPROVED)
    # 게시(최초 승인) 시 1회성 보상 지급 여부 — 관리자가 승인 액션을 재실행해도 중복 지급되지 않도록 방지
    publish_reward_granted = models.BooleanField(default=False)
    # 좋아요 마일스톤 보상(정산함) 중복 지급 방지용 — 마지막으로 보상을 지급한 시점의 likes 값
    last_rewarded_likes = models.PositiveIntegerField(default=0)
    # AI 1차 검열 결과. 부적절 의심으로 보류(pending)된 경우 어떤 카테고리가 감지됐는지, AI 사유는 무엇인지 기록.
    moderation_categories = models.JSONField(default=list, blank=True)
    moderation_reason = models.TextField(blank=True, default='')
    moderation_checked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.place.name} - 사진'


class PhotoImage(models.Model):
    """포토스팟 부사진 (대표사진 image_url 외 추가 사진, 최대 10장)."""
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='sub_images')
    image_url = models.URLField(max_length=500)
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']


class PhotoLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='photo_likes')
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name='like_records')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'photo')


class MediaPlace(models.Model):
    """미디어 작품과 촬영 장소를 연결하는 테이블."""

    STATUS_INFERRED = 'inferred'
    STATUS_ADMIN_APPROVED = 'admin_approved'
    STATUS_REJECTED = 'rejected'
    STATUS_QUIZ_CONFIRMED = 'quiz_confirmed'
    STATUS_CHOICES = [
        (STATUS_INFERRED,       'AI 추론'),
        (STATUS_ADMIN_APPROVED, '관리자 승인'),
        (STATUS_REJECTED,       '반려'),
        (STATUS_QUIZ_CONFIRMED, '퀴즈 확정'),
    ]

    media = models.ForeignKey(Media, on_delete=models.CASCADE, related_name='media_places')
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='media_places')
    day = models.IntegerField(null=True, blank=True)
    scene_description = models.TextField(blank=True)
    confidence_score = models.FloatField(default=1.0)
    is_confirmed = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_INFERRED)
    ai_reason = models.TextField(blank=True, default='')
    # 이 장소를 추론한 원본 유튜브 영상 ID (재생목록 일괄 추출 시 영상별 "이미 처리됨" 중복 판정에 사용)
    source_video_id = models.CharField(max_length=20, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('media', 'place')

    def __str__(self):
        return f'{self.media.title} → {self.place.name}'


class PlaylistExtractionJob(models.Model):
    """유튜브 재생목록 일괄 추출 작업 상태. 백그라운드 스레드가 진행 상황을 여기에 기록하고,
    관리자 화면은 이 레코드를 폴링해서 진행률을 표시한다."""

    STATUS_RUNNING = 'running'
    STATUS_DONE = 'done'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_RUNNING,   '진행중'),
        (STATUS_DONE,      '완료'),
        (STATUS_CANCELLED, '취소됨'),
    ]

    playlist_url = models.URLField(max_length=500)
    media_title = models.CharField(max_length=200)
    media_type = models.CharField(max_length=20, choices=Media.MEDIA_TYPES, default='youtube')
    ai_choice = models.CharField(max_length=20, default='gemini')
    fallback_ai_choice = models.CharField(max_length=20, default='gemini')
    scene = models.TextField(blank=True, default='')
    # False(기본, "개별 추출"): 영상마다 그 영상 자체의 YouTube 제목으로 별도 Media를 만듦.
    # True("통합 추출"): 선택된 영상 전부를 media_title 하나로 묶어서 같은 Media에 연결
    # (여러 회차가 한 작품을 이루는 경우를 위한 별도 모드 — 기본값이 아님).
    merge_videos = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RUNNING)
    # 취소 요청 여부 — 클릭 시점에 처리 중이던 영상은 끝까지 완료(결과 저장)하고, 다음 영상은 시작하지 않는다.
    # (그 영상의 AI 응답을 기다리는 시간은 어차피 그대로 흐르므로 "즉시 중단+결과 폐기" 옵션은 실효성이 없어 두지 않음)
    cancel_requested = models.BooleanField(default=False)
    # 선택된 영상별 진행 상태를 통째로 담는다.
    # [{video_id, title, position, upload_date, duration_minutes, max_locations,
    #   has_caption, is_duplicate, status(queued/processing/success/failed/cancelled),
    #   media_place_count, error, ai_used}, ...]
    videos = models.JSONField(default=list)
    current_index = models.IntegerField(default=-1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'재생목록 추출 #{self.pk} ({self.get_status_display()})'


class PlaylistFetchJob(models.Model):
    """재생목록 '목록 불러오기' 단계를 백그라운드로 돌리기 위한 작업 상태.
    영상이 많으면(자막 유무를 영상마다 확인하느라) 수십 초~수 분 걸릴 수 있어서,
    관리자가 이 페이지를 벗어나 다른 화면에서 작업해도 완료 시 알림을 받을 수 있도록
    브라우저 localStorage + 폴링으로 추적한다.
    조회 결과는 media_title로 이름 붙여 최근 HISTORY_LIMIT개까지 보관해서, 페이지를 나갔다
    다시 들어와도 재조회 없이 다시 볼 수 있게 한다(오래된 것부터 자동 삭제)."""

    HISTORY_LIMIT = 20

    STATUS_RUNNING = 'running'
    STATUS_DONE = 'done'
    STATUS_ERROR = 'error'
    STATUS_CHOICES = [
        (STATUS_RUNNING, '조회중'),
        (STATUS_DONE,    '완료'),
        (STATUS_ERROR,   '오류'),
    ]

    playlist_url = models.URLField(max_length=500)
    media_title = models.CharField(max_length=200, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RUNNING)
    videos = models.JSONField(default=list)
    error = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'재생목록 조회 #{self.pk} [{self.media_title}] ({self.get_status_display()})'