import { TokenChargeAlert } from '@/components/modals/TokenChargeAlert';
import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { userApi } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Coins, Trash2, User as UserIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingScreen = () => {
  const router = useRouter();
  const [tokenBalance, setTokenBalance] = useState(0);
  const [isChargeVisible, setIsChargeVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      userApi.getMe().then(res => setTokenBalance(res.data.token_balance)).catch(() => {});
    }, [])
  );

  const handleResetToken = () => {
    userApi.resetToken().then(res => setTokenBalance(res.data.token_balance)).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="MY" onBack={() => router.back()} />

      <View style={styles.profileSection}>
        <View style={styles.avatarCircle}>
          <UserIcon size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </View>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenLabel}>보유 토큰</Text>
          <View style={styles.tokenRow}>
            <Coins size={IconSize.medium} color={Colors.light.primary} strokeWidth={IconStroke.regular} />
            <Text style={styles.tokenValue}>{tokenBalance.toLocaleString()}</Text>
            <TouchableOpacity
              onPress={handleResetToken}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.resetButton}
            >
              <Trash2 size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.chargeButton} activeOpacity={0.8} onPress={() => setIsChargeVisible(true)}>
        <Text style={styles.chargeButtonText}>토큰 충전하기</Text>
      </TouchableOpacity>

      <Divider style={{ marginHorizontal: Spacing.h.medium, marginTop: Spacing.v.medium }} />

      <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => router.push('/AccountScreen')}>
        <Text style={styles.menuLabel}>계정</Text>
        <ChevronRight size={IconSize.large} color={Colors.light.grayDark} />
      </TouchableOpacity>
      <Divider style={{ marginHorizontal: Spacing.h.medium }} />

      <TokenChargeAlert
        visible={isChargeVisible}
        onClose={() => setIsChargeVisible(false)}
        onCharged={setTokenBalance}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.medium,
  },
  avatarCircle: {
    width: Size.circleMd,
    height: Size.circleMd,
    borderRadius: Size.circleMd / 2,
    backgroundColor: Colors.light.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenInfo: {
    marginLeft: Spacing.h.medium,
  },
  tokenLabel: { ...Typography.subtitle1, color: Colors.light.grayDark },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    gap: Spacing.h.xsmall,
  },
  tokenValue: { ...Typography.title1, color: Colors.light.black },
  resetButton: { marginLeft: Spacing.h.xsmall },
  chargeButton: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    height: Size.buttonSm,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chargeButtonText: { ...Typography.button2, color: Colors.light.white },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.medium,
  },
  menuLabel: { ...Typography.title1, color: Colors.light.black },
});

export default SettingScreen;
