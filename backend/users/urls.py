from django.urls import path
from .views import (
    SignupView,
    LoginView,
    TokenRefreshView,
    FindIdView,
    WithdrawView,
    PasswordResetRequestView,
    PasswordResetVerifyView,
    PasswordResetConfirmView,
    UserCreateView,
    UserMeView,
    TokenChargeView,
    TokenResetView,
)

urlpatterns = [
    path('users/signup/', SignupView.as_view(), name='user-signup'),
    path('users/login/', LoginView.as_view(), name='user-login'),
    path('users/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('users/find-id/', FindIdView.as_view(), name='user-find-id'),
    path('users/withdraw/', WithdrawView.as_view(), name='user-withdraw'),
    path('users/password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('users/password-reset/verify/', PasswordResetVerifyView.as_view(), name='password-reset-verify'),
    path('users/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('users/', UserCreateView.as_view(), name='user-create'),
    path('users/me/', UserMeView.as_view(), name='user-me'),
    path('users/charge-token/', TokenChargeView.as_view(), name='token-charge'),
    path('users/reset-token/', TokenResetView.as_view(), name='token-reset'),
]
