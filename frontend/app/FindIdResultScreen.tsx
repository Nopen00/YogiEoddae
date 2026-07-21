import { Colors } from '@/constants/Colors';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FindIdResultScreen = () => {
  const router = useRouter();
  const { maskedUsername } = useLocalSearchParams<{ maskedUsername?: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
        <View style={styles.body}>
          <Text style={styles.title}>회원님의 아이디를 찾았습니다.</Text>
          <Text style={styles.subtitle}>개인정보 보호를 위해 아이디 일부를 마스킹 처리하였습니다.</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxLabel}>아이디</Text>
            <Text style={styles.infoBoxValue}>{maskedUsername}</Text>
          </View>

          <TouchableOpacity style={styles.loginButton} activeOpacity={0.8} onPress={() => router.replace('/SignInScreen')}>
            <Text style={styles.loginButtonText}>로그인 하러가기</Text>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomLinkText} onPress={() => router.push('/FindPasswordScreen')}>비밀번호 재설정</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  body: {
    // ScreenHeader가 없는 화면이지만, 다른 화면(SignUpStep2Screen 등)의 헤더+16 위치와
    // 동일한 세로 위치에 맞추기 위해 헤더의 marginTop(8)+height(56)만큼 미리 띄움
    marginTop: Spacing.v.small + Size.header + Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  title: { ...Typography.title1, color: Colors.light.black },
  subtitle: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  infoBox: {
    marginTop: Spacing.v.large,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
  },
  infoBoxLabel: { ...Typography.body2, color: Colors.light.black },
  infoBoxValue: { ...Typography.subtitle2, color: Colors.light.black, marginTop: Spacing.v.small },
  loginButton: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonMd,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: { ...Typography.button2, color: Colors.light.white },
  bottomRow: {
    marginTop: Spacing.v.large,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomLinkText: { ...Typography.button1, color: Colors.light.grayDark },
});

export default FindIdResultScreen;
