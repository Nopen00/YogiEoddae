from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MailboxItem, SettlementItem


def _serialize(item):
    return {'id': item.id, 'action': item.action, 'tokenAmount': item.token_amount}


def _credit_and_delete(user, items):
    total = sum(i.token_amount for i in items)
    user.token_balance += total
    user.save(update_fields=['token_balance'])
    items.delete()
    return user.token_balance


class MailboxListView(APIView):
    """GET /api/mailbox/  내 우편함 목록"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = MailboxItem.objects.filter(user=request.user)
        return Response([_serialize(i) for i in items])


class MailboxClaimView(APIView):
    """POST /api/mailbox/{id}/claim/  개별 수령"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        item = get_object_or_404(MailboxItem, pk=pk, user=request.user)
        balance = _credit_and_delete(request.user, MailboxItem.objects.filter(pk=item.pk))
        return Response({'token_balance': balance})


class MailboxClaimAllView(APIView):
    """POST /api/mailbox/claim-all/  전체 일괄 수령"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        balance = _credit_and_delete(request.user, MailboxItem.objects.filter(user=request.user))
        return Response({'token_balance': balance})


class SettlementListView(APIView):
    """GET /api/settlements/  내 정산함 목록 (좋아요 마일스톤 등 누적 보상)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = SettlementItem.objects.filter(user=request.user)
        return Response([_serialize(i) for i in items])


class SettlementClaimView(APIView):
    """POST /api/settlements/{id}/claim/  개별 수령"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        item = get_object_or_404(SettlementItem, pk=pk, user=request.user)
        balance = _credit_and_delete(request.user, SettlementItem.objects.filter(pk=item.pk))
        return Response({'token_balance': balance})


class SettlementClaimAllView(APIView):
    """POST /api/settlements/claim-all/  전체 일괄 수령"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        balance = _credit_and_delete(request.user, SettlementItem.objects.filter(user=request.user))
        return Response({'token_balance': balance})
