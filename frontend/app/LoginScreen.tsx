import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const LoginScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader />

      <View style={styles.body}>
        <Text style={styles.logo}>요기어때?</Text>
      </View>

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + Spacing.v.xxxlarge }]}>
        <TouchableOpacity style={styles.startButton} activeOpacity={0.8} onPress={() => router.push('/SignUpAgreementScreen')}>
          <Text style={styles.startButtonText}>시작하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInRow}
          activeOpacity={0.7}
          onPress={() => router.push('/SignInScreen')}
        >
          <Text style={styles.signInPrompt}>이미 회원이라면?</Text>
          <Text style={styles.signInLink}>로그인</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  body: {
    flex: 1,
    marginTop: Spacing.v.medium,
    alignItems: 'center',
  },
  logo: { ...Typography.HeadLine5, color: Colors.light.black },
  bottomSection: {
    paddingHorizontal: Spacing.h.medium,
  },
  startButton: {
    minHeight: Size.buttonMd,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: { ...Typography.button2, color: Colors.light.white },
  signInRow: {
    marginTop: Spacing.v.large,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInPrompt: { ...Typography.body2, color: Colors.light.grayDark },
  signInLink: { ...Typography.button1, color: Colors.light.grayDark, marginLeft: Spacing.h.small },
});

export default LoginScreen;
