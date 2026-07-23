from django.db import models
from users.models import User


class Tag(models.Model):
    CATEGORY_CHOICES = [
        ('media_type', '미디어 유형'),
        ('genre',      '장르'),
        ('place_type', '장소 유형'),
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('media', 'place')

    def __str__(self):
        return f'{self.media.title} → {self.place.name}'