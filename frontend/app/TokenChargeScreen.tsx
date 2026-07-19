import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { TOKEN_PACKAGES, userApi } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { Compass, Film } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AD_REWARD_TOKENS = 10;
// mock 응답이 거의 즉시 와서 로딩 스피너가 한 프레임만 스치듯 지나가는 것을 막기 위한 최소 노출 시간
const MIN_LOADING_MS = 400;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const TokenChargeScreen = () => {
  const router = useRouter();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [chargingId, setChargingId] = useState<string | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [chargeResult, setChargeResult] = useState<{ tokens: number; balance: number } | null>(null);
  const [isChargeFailed, setIsChargeFailed] = useState(false);
  const [adResult, setAdResult] = useState<{ tokens: number; balance: number } | null>(null);
  const [isAdFailed, setIsAdFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      userApi.getMe().then(res => setTokenBalance(res.data.token_balance)).catch(() => {});
    }, [])
  );

  const handlePick = async (packageId: string, tokens: number) => {
    setChargingId(packageId);
    const start = Date.now();
    try {
      const res = await userApi.chargeToken(packageId);
      await wait(Math.max(0, MIN_LOADING_MS - (Date.now() - start)));
      setTokenBalance(res.data.token_balance);
      setChargeResult({ tokens, balance: res.data.token_balance });
    } catch {
      await wait(Math.max(0, MIN_LOADING_MS - (Date.now() - start)));
      setIsChargeFailed(true);
    }
    setChargingId(null);
  };

  const handleWatchAd = async () => {
    setIsWatchingAd(true);
    const start = Date.now();
    try {
      const res = await userApi.watchAd(AD_REWARD_TOKENS);
      await wait(Math.max(0, MIN_LOADING_MS - (Date.now() - start)));
      setTokenBalance(res.data.token_balance);
      setAdResult({ tokens: AD_REWARD_TOKENS, balance: res.data.token_balance });
    } catch {
      await wait(Math.max(0, MIN_LOADING_MS - (Date.now() - start)));
      setIsAdFailed(true);
    }
    setIsWatchingAd(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} title="토큰 충전" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
        <View style={styles.myTokenRow}>
          <Text style={styles.myTokenLabel}>내 토큰</Text>
          <Text style={styles.myTokenValue}>{tokenBalance.toLocaleString()} 토큰</Text>
        </View>

        <TouchableOpacity style={styles.adButton} activeOpacity={0.8} disabled={isWatchingAd} onPress={handleWatchAd}>
          <Film size={20} color={Colors.light.white} strokeWidth={IconStroke.regular} />
          <Text style={styles.adButtonText}>광고 보고 토큰 받기</Text>
          <Text style={styles.adButtonReward}>{AD_REWARD_TOKENS} 토큰</Text>
        </TouchableOpacity>

        <View style={styles.packageSection}>
          {TOKEN_PACKAGES.map((pkg, idx) => (
            <View key={pkg.id} style={[styles.packageItemRow, idx > 0 && styles.packageItemSpacing]}>
              <View style={styles.packageLeftGroup}>
                <Compass size={20} color={Colors.light.star} strokeWidth={IconStroke.regular} />
                <Text style={styles.packageTokenText}>{pkg.tokens.toLocaleString()} 토큰</Text>
              </View>
              <TouchableOpacity
                style={styles.priceButton}
                activeOpacity={0.8}
                disabled={chargingId !== null}
                onPress={() => handlePick(pkg.id, pkg.tokens)}
              >
                {chargingId === pkg.id ? (
                  <ActivityIndicator size="small" color={Colors.light.white} />
                ) : (
                  <Text style={styles.priceButtonText}>₩{pkg.price.toLocaleString()}</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Divider marginTop={Spacing.v.large} style={{ marginHorizontal: Spacing.h.medium }} />

        <View style={styles.noticeSection}>
          <Text style={styles.noticeTitle}>본 결제는 데모기능입니다.</Text>
          <Text style={styles.noticeSub1}>실제 금액이 청구되거나 환불이 발생하지 않습니다.</Text>
          <Text style={styles.noticeSub2}>토큰은 테스트 목적으로만 지급됩니다.</Text>
        </View>
      </ScrollView>

      <Modal visible={!!chargeResult} transparent animationType="none">
        <TouchableOpacity style={styles.resultOverlay} activeOpacity={1} onPress={() => setChargeResult(null)}>
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>결제가 완료되었습니다.</Text>
            <Text style={styles.resultSub1}>{chargeResult?.tokens.toLocaleString()} 토큰이 충전되었습니다.</Text>
            <Text style={styles.resultSub2}>현재 토큰 : {chargeResult?.balance.toLocaleString()} 토큰</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isChargeFailed} transparent animationType="none">
        <TouchableOpacity style={styles.resultOverlay} activeOpacity={1} onPress={() => setIsChargeFailed(false)}>
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>결제가 실패하였습니다.</Text>
            <Text style={styles.resultSub1}>잠시 후 다시 시도해주세요.</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!adResult} transparent animationType="none">
        <TouchableOpacity style={styles.resultOverlay} activeOpacity={1} onPress={() => setAdResult(null)}>
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>광고를 보고 토큰을 획득했습니다.</Text>
            <Text style={styles.resultSub1}>{adResult?.tokens.toLocaleString()} 토큰이 획득되었습니다.</Text>
            <Text style={styles.resultSub2}>현재 토큰 : {adResult?.balance.toLocaleString()} 토큰</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isAdFailed} transparent animationType="none">
        <TouchableOpacity style={styles.resultOverlay} activeOpacity={1} onPress={() => setIsAdFailed(false)}>
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>광고를 불러오는데 실패하였습니다.</Text>
            <Text style={styles.resultSub1}>잠시 후 다시 시도해주세요.</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  myTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.medium,
  },
  myTokenLabel: { ...Typography.title1, color: Colors.light.black },
  myTokenValue: { ...Typography.title1, color: Colors.light.primary, marginLeft: Spacing.h.small },
  adButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
    padding: Spacing.h.medium,
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
  },
  adButtonText: { ...Typography.button2, color: Colors.light.white, marginLeft: Spacing.h.small },
  adButtonReward: { ...Typography.button2, color: Colors.light.white, marginLeft: Spacing.h.small },
  packageSection: {
    marginTop: Spacing.v.large,
    paddingHorizontal: Spacing.h.medium,
  },
  packageItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageItemSpacing: { marginTop: Spacing.v.large },
  packageLeftGroup: { flexDirection: 'row', alignItems: 'center', gap: Spacing.h.small },
  packageTokenText: { ...Typography.subtitle2, color: Colors.light.black },
  priceButton: {
    height: Size.buttonSm,
    minWidth: 96,
    paddingHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceButtonText: { ...Typography.button2, color: Colors.light.white },
  noticeSection: {
    marginTop: Spacing.v.large,
    paddingHorizontal: Spacing.h.medium,
    alignItems: 'center',
  },
  noticeTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  noticeSub1: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.medium, textAlign: 'center' },
  noticeSub2: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small, textAlign: 'center' },
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
  resultSub1: { ...Typography.body2, color: Colors.light.primary, marginTop: Spacing.v.medium, textAlign: 'center' },
  resultSub2: { ...Typography.body2, color: Colors.light.primary, marginTop: Spacing.v.small, textAlign: 'center' },
});

export default TokenChargeScreen;
