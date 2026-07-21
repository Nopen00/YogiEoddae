import { LabeledInputBox } from '@/components/ui/LabeledInputBox';
import { Colors } from '@/constants/Colors';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]*$/;

const getNicknameErrors = (nickname: string): string[] => {
  const errors: string[] = [];
  if (!NICKNAME_REGEX.test(nickname)) errors.push('한글, 영문, 숫자만 입력가능합니다.');
  if (nickname.length < 2 || nickname.length > 10) errors.push('2~10자로 입력해주세요.');
  return errors;
};

const SignUpScreen = () => {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [nicknameErrors, setNicknameErrors] = useState<string[]>([]);
  const isActive = nickname.trim().length > 0;

  const handleChangeNickname = (text: string) => {
    setNickname(text);
    if (nicknameErrors.length > 0) setNicknameErrors([]);
  };

  const handleBlurNickname = () => {
    if (!nickname.trim()) return;
    setNicknameErrors(getNicknameErrors(nickname));
  };

  const handleNext = () => {
    if (!isActive) return;
    const errors = getNicknameErrors(nickname);
    setNicknameErrors(errors);
    if (errors.length > 0) return;
    router.push({ pathname: '/SignUpStep2Screen', params: { nickname } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
          <View style={styles.body}>
            <Text style={styles.title}>미디어 속 경험을 현실에서</Text>
            <Text style={styles.subtitle}>미디어에서 보기만 했던 장소들을 현실에서 만나보세요.</Text>

            <LabeledInputBox
              label="닉네임"
              placeholder="한글, 영문, 숫자 (2~10자)"
              value={nickname}
              onChangeText={handleChangeNickname}
              onBlur={handleBlurNickname}
              errorMessage={nicknameErrors}
            />

            <TouchableOpacity
              style={[styles.nextButton, !isActive && styles.nextButtonDisabled]}
              activeOpacity={0.8}
              disabled={!isActive}
              onPress={handleNext}
            >
              <Text style={[styles.nextButtonText, !isActive && styles.nextButtonTextDisabled]}>다음</Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  body: {
    // ScreenHeader가 없는 화면이지만, 다른 화면(LoginScreen 등)의 헤더+16 위치와
    // 동일한 세로 위치에 맞추기 위해 헤더의 marginTop(8)+height(56)만큼 미리 띄움
    marginTop: Spacing.v.small + Size.header + Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  title: { ...Typography.title1, color: Colors.light.black },
  subtitle: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  nextButton: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonMd,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: { backgroundColor: Colors.light.grayLight },
  nextButtonText: { ...Typography.button2, color: Colors.light.white },
  nextButtonTextDisabled: { color: Colors.light.grayDark },
  signInRow: {
    marginTop: Spacing.v.large,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInPrompt: { ...Typography.body2, color: Colors.light.grayDark },
  signInLink: { ...Typography.button1, color: Colors.light.grayDark, marginLeft: Spacing.h.small },
});

export default SignUpScreen;
