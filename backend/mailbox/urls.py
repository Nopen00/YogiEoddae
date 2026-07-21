from django.urls import path
from .views import (
    MailboxListView, MailboxClaimAllView, MailboxClaimView,
    SettlementListView, SettlementClaimAllView, SettlementClaimView,
)

urlpatterns = [
    path('mailbox/', MailboxListView.as_view(), name='mailbox-list'),
    path('mailbox/claim-all/', MailboxClaimAllView.as_view(), name='mailbox-claim-all'),
    path('mailbox/<int:pk>/claim/', MailboxClaimView.as_view(), name='mailbox-claim'),
    path('settlements/', SettlementListView.as_view(), name='settlement-list'),
    path('settlements/claim-all/', SettlementClaimAllView.as_view(), name='settlement-claim-all'),
    path('settlements/<int:pk>/claim/', SettlementClaimView.as_view(), name='settlement-claim'),
]
