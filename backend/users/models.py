from django.core.validators import RegexValidator
from django.db import models


username_validator = RegexValidator(
    regex=r'^[a-zA-Z0-9]{5,20}$',
    message='아이디는 영문과 숫자로 5~20자여야 합니다.',
)

nickname_validator = RegexValidator(
    regex=r'^[가-힣a-zA-Z0-9]{2,10}$',
    message='닉네임은 한글, 영문, 숫자로 2~10자여야 합니다.',
)


class User(models.Model):
    # DRF의 IsAuthenticated 등 permission 클래스가 request.user.is_authenticated를 참조하므로,
    # Django auth의 AbstractUser를 상속하지 않는 이 모델에도 동일한 인터페이스를 맞춰준다.
    is_authenticated = True

    device_id_hash = models.CharField(max_length=64, unique=True, editable=False, null=True, blank=True)
    username = models.CharField(max_length=20, unique=True, null=True, blank=True, validators=[username_validator])
    nickname = models.CharField(max_length=10, null=True, blank=True, validators=[nickname_validator])
    email = models.EmailField(unique=True, null=True, blank=True)
    password_hash = models.CharField(max_length=128, null=True, blank=True)
    token_balance = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username or f'User #{self.pk}'


class PasswordHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_history')
    password_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_password_history'
        ordering = ['-created_at']


class EmailVerificationCode(models.Model):
    PURPOSE_LINK_EMAIL = 'link_email'
    PURPOSE_RESET_PASSWORD = 'reset_password'
    PURPOSE_CHOICES = [
        (PURPOSE_LINK_EMAIL, '이메일 연동/변경'),
        (PURPOSE_RESET_PASSWORD, '비밀번호 재설정'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verification_codes')
    email = models.EmailField()
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_verification_codes'
