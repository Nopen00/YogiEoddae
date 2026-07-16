from django.urls import path
from .views import UserCreateView, UserMeView, TokenChargeView, TokenResetView

urlpatterns = [
    path('users/', UserCreateView.as_view(), name='user-create'),
    path('users/me/', UserMeView.as_view(), name='user-me'),
    path('users/charge-token/', TokenChargeView.as_view(), name='token-charge'),
    path('users/reset-token/', TokenResetView.as_view(), name='token-reset'),
]
