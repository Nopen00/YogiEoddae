import { LabeledInputBox } from '@/components/ui/LabeledInputBox';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { authApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FindPasswordScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [findError, setFindError] = useState(false);

  const isActive = username.trim().length > 0;

  const handleChangeUsername = (text: string) => {
    setUsername(text);
    if (findError) setFindError(false);
  };

  const handleNext = async () => {
    if (!isActive) return;
    try {
      const res = await authApi.requestPasswordReset(username);
      router.push({
        pathname: '/PasswordChangeScreen',
        params: { username, maskedEmail: res.data.masked_email, fromPublic: '1' },
      });
    } catch (e: any) {
      setFindError(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
          <View style={styles.body}>
            <Text style={styles.title}>비밀번호를 재설정합니다.</Text>
            <Text style={styles.subtitle}>계정을 찾기 위해 아이디를 입력해 주세요.</Text>

            <LabeledInputBox
              label="아이디"
              placeholder="아이디"
              value={username}
              onChangeText={handleChangeUsername}
              hasError={findError}
            />

            {findError && (
              <View style={styles.findErrorRow}>
                <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
                <Text style={styles.findErrorText}>입력하신 정보와 일치하는 계정을 찾을 수 없습니다.</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.nextButton, findError && styles.nextButtonWithError, !isActive && styles.nextButtonDisabled]}
              activeOpacity={0.8}
              disabled={!isActive}
              onPress={handleNext}
            >
              <Text style={[styles.nextButtonText, !isActive && styles.nextButtonTextDisabled]}>다음</Text>
            </TouchableOpacity>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomLinkText} onPress={() => router.push('/SignUpScreen')}>회원가입</Text>
              <View style={styles.bottomDivider} />
              <Text style={styles.bottomLinkText} onPress={() => router.push('/SignInScreen')}>로그인</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  body: {
    marginTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  title: { ...Typography.title1, color: Colors.light.black },
  subtitle: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  findErrorRow: {
    marginTop: Spacing.v.large,
    flexDirection: 'row',
    alignItems: 'center',
  },
  findErrorText: { ...Typography.body2, color: Colors.light.error, marginLeft: Spacing.h.small },
  nextButton: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonMd,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonWithError: { marginTop: Spacing.v.medium },
  nextButtonDisabled: { backgroundColor: Colors.light.grayLight },
  nextButtonText: { ...Typography.button2, color: Colors.light.white },
  nextButtonTextDisabled: { color: Colors.light.grayDark },
  bottomRow: {
    marginTop: Spacing.v.large,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomLinkText: { ...Typography.button1, color: Colors.light.grayDark },
  bottomDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.light.grayLight,
    marginHorizontal: Spacing.h.small,
  },
});

export default FindPasswordScreen;
