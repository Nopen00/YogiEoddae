import { LabeledInputBox } from '@/components/ui/LabeledInputBox';
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

const SignInScreen = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const isActive = username.trim().length > 0 && password.trim().length > 0 && !isLoggingIn;

  const handleChangeUsername = (text: string) => {
    setUsername(text);
    if (loginError) setLoginError(false);
  };

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (loginError) setLoginError(false);
  };

  const handleLogin = async () => {
    if (!isActive) return;
    setIsLoggingIn(true);
    try {
      const res = await authApi.login({ username, password });
      router.dismissAll();
      router.replace({
        pathname: '/MainScreen',
        params: { welcome: '1', nickname: res.data.nickname, welcomeSource: 'login' },
      });
    } catch (e: any) {
      setLoginError(true);
      setIsLoggingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
          <View style={styles.body}>
            <Text style={styles.title}>미디어 속 경험을 현실에서</Text>
            <Text style={styles.subtitle}>미디어에서 보기만 했던 장소들을 현실에서 만나보세요.</Text>

            <LabeledInputBox
              label="아이디"
              placeholder="아이디"
              value={username}
              onChangeText={handleChangeUsername}
              hasError={loginError}
            />

            <LabeledInputBox
              label="비밀번호"
              placeholder="비밀번호"
              value={password}
              onChangeText={handleChangePassword}
              secure
              visible={passwordVisible}
              onToggleVisible={() => setPasswordVisible(!passwordVisible)}
              hasError={loginError}
            />

            {loginError && (
              <View style={styles.loginErrorRow}>
                <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
                <Text style={styles.loginErrorText}>등록되지 않은 아이디이거나, 비밀번호가 올바르지 않습니다.</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, loginError && styles.loginButtonWithError, !isActive && styles.loginButtonDisabled]}
              activeOpacity={0.8}
              disabled={!isActive}
              onPress={handleLogin}
            >
              <Text style={[styles.loginButtonText, !isActive && styles.loginButtonTextDisabled]}>로그인</Text>
            </TouchableOpacity>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomLinkText} onPress={() => router.push('/SignUpAgreementScreen')}>회원가입</Text>
              <View style={styles.bottomDivider} />
              <Text style={styles.bottomLinkText} onPress={() => router.push('/FindIdScreen')}>아이디 찾기</Text>
              <View style={styles.bottomDivider} />
              <Text style={styles.bottomLinkText} onPress={() => router.push('/FindPasswordScreen')}>비밀번호 재설정</Text>
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
    // ScreenHeader가 없는 화면이지만, 다른 화면(SignUpStep2Screen 등)의 헤더+16 위치와
    // 동일한 세로 위치에 맞추기 위해 헤더의 marginTop(8)+height(56)만큼 미리 띄움
    marginTop: Spacing.v.small + Size.header + Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  title: { ...Typography.title1, color: Colors.light.black },
  subtitle: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  loginErrorRow: {
    marginTop: Spacing.v.large,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginErrorText: { ...Typography.body2, color: Colors.light.error, marginLeft: Spacing.h.small },
  loginButton: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonMd,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonWithError: { marginTop: Spacing.v.medium },
  loginButtonDisabled: { backgroundColor: Colors.light.grayLight },
  loginButtonText: { ...Typography.button2, color: Colors.light.white },
  loginButtonTextDisabled: { color: Colors.light.grayDark },
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

export default SignInScreen;
