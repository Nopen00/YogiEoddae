import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { mailApi, settlementApi } from '@/services/api';
import type { MailItem } from '@/services/types';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MailSource = 'mail' | 'settlement';
type MergedMailItem = MailItem & { source: MailSource };

interface TokenPopupState {
  amount: number;
  balance: number;
  breakdown?: { action: string; tokenAmount: number }[];
}

const MailboxScreen = () => {
  const router = useRouter();
  const [mailItems, setMailItems] = useState<MergedMailItem[]>([]);
  const isEmpty = mailItems.length === 0;
  const [tokenPopup, setTokenPopup] = useState<TokenPopupState | null>(null);
  const [claimingKeys, setClaimingKeys] = useState<Set<string>>(new Set());
  const [isClaimingAll, setIsClaimingAll] = useState(false);
  const [claimError, setClaimError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        mailApi.getList().catch(() => ({ data: [] as MailItem[] })),
        settlementApi.getList().catch(() => ({ data: [] as MailItem[] })),
      ]).then(([mailRes, settlementRes]) => {
        setMailItems([
          ...mailRes.data.map((item) => ({ ...item, source: 'mail' as const })),
          ...settlementRes.data.map((item) => ({ ...item, source: 'settlement' as const })),
        ]);
      });
    }, [])
  );

  const claimItem = async (item: MergedMailItem) => {
    const key = `${item.source}-${item.id}`;
    if (claimingKeys.has(key)) return;
    setClaimError(false);
    setClaimingKeys((prev) => new Set(prev).add(key));
    try {
      const res = item.source === 'mail' ? await mailApi.claim(item.id) : await settlementApi.claim(item.id);
      setMailItems((prev) => prev.filter((i) => !(i.id === item.id && i.source === item.source)));
      setTokenPopup({ amount: item.tokenAmount, balance: res.data.token_balance });
    } catch {
      setClaimError(true);
    } finally {
      setClaimingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const claimAll = async () => {
    if (isClaimingAll || isEmpty) return;
    setClaimError(false);
    setIsClaimingAll(true);
    const claimedItems = mailItems.filter((i) => i.source === 'mail' || i.source === 'settlement');
    const hasMail = claimedItems.some((i) => i.source === 'mail');
    const hasSettlement = claimedItems.some((i) => i.source === 'settlement');

    let balance = 0;
    let claimedMail = false;
    let claimedSettlement = false;
    let hadError = false;

    if (hasMail) {
      try {
        balance = (await mailApi.claimAll()).data.token_balance;
        claimedMail = true;
      } catch {
        hadError = true;
      }
    }
    if (hasSettlement) {
      try {
        balance = (await settlementApi.claimAll()).data.token_balance;
        claimedSettlement = true;
      } catch {
        hadError = true;
      }
    }

    if (claimedMail || claimedSettlement) {
      const breakdown = claimedItems
        .filter((item) => (item.source === 'mail' && claimedMail) || (item.source === 'settlement' && claimedSettlement))
        .map((item) => ({ action: item.action, tokenAmount: item.tokenAmount }));
      const total = breakdown.reduce((sum, item) => sum + item.tokenAmount, 0);
      setMailItems((prev) => prev.filter((i) => !((i.source === 'mail' && claimedMail) || (i.source === 'settlement' && claimedSettlement))));
      setTokenPopup({ amount: total, balance, breakdown });
    }
    if (hadError) setClaimError(true);
    setIsClaimingAll(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} title="우편함" />

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.claimAllButton, (isEmpty || isClaimingAll) && styles.claimAllButtonDisabled]}
          activeOpacity={isEmpty || isClaimingAll ? 1 : 0.8}
          disabled={isEmpty || isClaimingAll}
          onPress={claimAll}
        >
          <Text style={styles.claimAllButtonText}>일괄 받기</Text>
        </TouchableOpacity>
      </View>

      {claimError && (
        <Text style={styles.claimErrorText}>일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</Text>
      )}

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>우편함이 비어있습니다.</Text>
          <Text style={styles.emptySubtitle}>받을 보상이 도착하면 이곳에 표시됩니다.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {mailItems.map((item) => {
            const key = `${item.source}-${item.id}`;
            const isClaiming = claimingKeys.has(key) || isClaimingAll;
            return (
              <View key={key} style={styles.mailCard}>
                <Text style={styles.mailCardTitle}>{item.action} 보상 X {item.tokenAmount} 토큰</Text>
                <Text style={styles.mailCardBody}>{item.action} 보상으로 {item.tokenAmount} 토큰이 지급되었습니다.</Text>
                <TouchableOpacity
                  style={[styles.receiveButton, isClaiming && styles.claimAllButtonDisabled]}
                  activeOpacity={isClaiming ? 1 : 0.8}
                  disabled={isClaiming}
                  onPress={() => claimItem(item)}
                >
                  <Text style={styles.receiveButtonText}>받기</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal visible={!!tokenPopup} transparent animationType="none">
        <TouchableOpacity style={styles.resultOverlay} activeOpacity={1} onPress={() => setTokenPopup(null)}>
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>{tokenPopup?.amount}개의 토큰을 획득했습니다.</Text>
            {!!tokenPopup?.breakdown?.length && (
              <View style={styles.breakdownList}>
                {tokenPopup.breakdown.map((entry, i) => (
                  <Text key={i} style={[styles.breakdownText, i > 0 && styles.breakdownTextSpaced]}>
                    {entry.action} 보상 : +{entry.tokenAmount} 토큰
                  </Text>
                ))}
              </View>
            )}
            <Text style={styles.resultSub}>현재 토큰 : {tokenPopup?.balance.toLocaleString()} 토큰</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.medium,
  },
  claimAllButton: {
    height: Size.buttonSm,
    paddingHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimAllButtonDisabled: { backgroundColor: Colors.light.grayLight },
  claimAllButtonText: { ...Typography.button2, color: Colors.light.white },
  claimErrorText: {
    ...Typography.body2,
    color: Colors.light.error,
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.small,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.v.medium },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  emptySubtitle: { ...Typography.body2, color: Colors.light.grayLight },
  listContent: { paddingBottom: Spacing.v.screenBottom },
  mailCard: {
    marginHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.medium,
    padding: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
  },
  mailCardTitle: { ...Typography.title2, color: Colors.light.black },
  mailCardBody: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  receiveButton: {
    alignSelf: 'flex-end',
    width: 80,
    height: Size.buttonSm,
    marginTop: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiveButtonText: { ...Typography.button2, color: Colors.light.white },
  resultOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.xlarge,
  },
  resultPopupBox: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    alignItems: 'center',
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  resultTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  breakdownList: { marginTop: Spacing.v.medium, flexDirection: 'column' },
  breakdownText: { ...Typography.body2, color: Colors.light.dark, textAlign: 'center' },
  breakdownTextSpaced: { marginTop: Spacing.v.small },
  resultSub: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.medium, textAlign: 'center' },
});

export default MailboxScreen;
