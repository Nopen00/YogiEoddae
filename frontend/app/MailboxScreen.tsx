import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { mailApi } from '@/services/api';
import type { MailItem } from '@/services/types';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MailboxScreen = () => {
  const router = useRouter();
  const [mailItems, setMailItems] = useState<MailItem[]>([]);
  const isEmpty = mailItems.length === 0;
  const [tokenPopup, setTokenPopup] = useState<{ amount: number; balance: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      mailApi.getList().then(res => setMailItems(res.data)).catch(() => {});
    }, [])
  );

  const claimItem = async (item: MailItem) => {
    try {
      const res = await mailApi.claim(item.id);
      setMailItems((prev) => prev.filter((i) => i.id !== item.id));
      setTokenPopup({ amount: item.tokenAmount, balance: res.data.token_balance });
    } catch {}
  };

  const claimAll = async () => {
    const total = mailItems.reduce((sum, item) => sum + item.tokenAmount, 0);
    try {
      const res = await mailApi.claimAll();
      setMailItems([]);
      setTokenPopup({ amount: total, balance: res.data.token_balance });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} title="우편함" />

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.claimAllButton, isEmpty && styles.claimAllButtonDisabled]}
          activeOpacity={isEmpty ? 1 : 0.8}
          disabled={isEmpty}
          onPress={claimAll}
        >
          <Text style={styles.claimAllButtonText}>일괄 받기</Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>우편함이 비어있습니다.</Text>
          <Text style={styles.emptySubtitle}>받을 보상이 도착하면 이곳에 표시됩니다.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {mailItems.map((item) => (
            <View key={item.id} style={styles.mailCard}>
              <Text style={styles.mailCardTitle}>{item.action} 보상 X {item.tokenAmount} 토큰</Text>
              <Text style={styles.mailCardBody}>{item.action} 보상으로 {item.tokenAmount} 토큰이 지급되었습니다.</Text>
              <TouchableOpacity style={styles.receiveButton} activeOpacity={0.8} onPress={() => claimItem(item)}>
                <Text style={styles.receiveButtonText}>받기</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={!!tokenPopup} transparent animationType="none">
        <TouchableOpacity style={styles.resultOverlay} activeOpacity={1} onPress={() => setTokenPopup(null)}>
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>{tokenPopup?.amount}개의 토큰을 획득했습니다.</Text>
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
  resultSub: { ...Typography.body2, color: Colors.light.primary, marginTop: Spacing.v.medium, textAlign: 'center' },
});

export default MailboxScreen;
