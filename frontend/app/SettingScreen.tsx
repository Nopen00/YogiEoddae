import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { userApi } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, HelpCircle } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingScreen = () => {
  const router = useRouter();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [isLargeIconMode, setIsLargeIconMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      userApi.getMe().then(res => setTokenBalance(res.data.token_balance)).catch(() => {});
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="MY" onBack={() => router.back()} />

      {/* 유저 정보 섹션 */}
      <View style={styles.userSection}>
        <View style={styles.profileImage} />

        <View style={styles.userInfoColumn}>
          <Text style={styles.nickname}>내이름은김철수</Text>
          <TouchableOpacity style={styles.infoDetailButton} activeOpacity={0.7} onPress={() => router.push('/AccountScreen')}>
            <Text style={styles.infoDetailText}>내 정보</Text>
            <ChevronRight size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.mailboxButton} activeOpacity={0.7} onPress={() => router.push('/MailboxScreen')}>
          <Text style={styles.mailboxButtonText}>우편함</Text>
        </TouchableOpacity>
      </View>

      <Divider marginTop={Spacing.v.large} style={{ marginHorizontal: Spacing.h.medium }} />

      {/* 토큰 섹션 */}
      <View style={styles.tokenSection}>
        <View style={styles.tokenLabelRow}>
          <Text style={styles.tokenLabel}>토큰</Text>
          <Text style={styles.tokenValue}>{tokenBalance.toLocaleString()} 토큰</Text>
        </View>
        <TouchableOpacity style={styles.chargeButton} activeOpacity={0.8} onPress={() => router.push('/TokenChargeScreen')}>
          <Text style={styles.chargeButtonText}>충전</Text>
        </TouchableOpacity>
      </View>

      {/* 리뷰 관리 섹션 */}
      <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => router.push('/ReviewManageScreen')}>
        <Text style={styles.menuRowText}>작성한 리뷰 관리</Text>
        <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
      </TouchableOpacity>

      {/* 포토스팟 관리 섹션 */}
      <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
        <Text style={styles.menuRowText}>작성한 포토스팟 관리</Text>
        <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
      </TouchableOpacity>

      {/* 아이콘 모드 섹션 */}
      <View style={styles.iconModeSection}>
        <View style={styles.iconModeTextColumn}>
          <Text style={styles.iconModeTitle}>큰 아이콘 모드</Text>
          <View style={styles.iconModeDescRow}>
            <HelpCircle size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
            <Text style={styles.iconModeDesc}>상세정보 화면을 좀 더 큰 아이콘으로 볼 수 있어요.</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.toggle, { backgroundColor: isLargeIconMode ? Colors.light.primary : Colors.light.grayLight }]}
          onPress={() => setIsLargeIconMode(!isLargeIconMode)}
          activeOpacity={0.8}
        >
          <View style={[styles.toggleCircle, { left: isLargeIconMode ? 26 : 2 }]} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  userSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.medium,
  },
  profileImage: {
    width: Size.avatarLg,
    height: Size.avatarLg,
    borderRadius: Size.avatarLg / 2,
    backgroundColor: Colors.light.grayLight,
    flexShrink: 0,
  },
  userInfoColumn: {
    flex: 1,
    marginLeft: Spacing.h.medium,
  },
  nickname: { ...Typography.title1, color: Colors.light.black },
  infoDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.h.small,
    marginTop: Spacing.v.small,
    alignSelf: 'flex-start',
  },
  infoDetailText: { ...Typography.button4, color: Colors.light.grayDark },
  mailboxButton: {
    width: 80,
    height: Size.buttonSm,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  mailboxButtonText: { ...Typography.button2, color: Colors.light.grayDark },
  tokenSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.large,
  },
  tokenLabelRow: { flexDirection: 'row', alignItems: 'center' },
  tokenLabel: { ...Typography.title1, color: Colors.light.black },
  tokenValue: { ...Typography.title1, color: Colors.light.primary, marginLeft: Spacing.h.small },
  chargeButton: {
    width: 80,
    height: Size.buttonSm,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chargeButtonText: { ...Typography.button2, color: Colors.light.white },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.large,
  },
  menuRowText: { ...Typography.title1, color: Colors.light.black },
  iconModeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.large,
  },
  iconModeTextColumn: { flex: 1 },
  iconModeTitle: { ...Typography.title1, color: Colors.light.black },
  iconModeDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.h.small,
    marginTop: Spacing.v.small,
  },
  iconModeDesc: { ...Typography.body2, color: Colors.light.grayDark, flexShrink: 1 },
  toggle: {
    width: 48,
    height: 24,
    borderRadius: 12,
    flexShrink: 0,
  },
  toggleCircle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.white,
    top: 2,
  },
});

export default SettingScreen;
