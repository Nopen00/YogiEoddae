import { LabeledInputBox } from '@/components/ui/LabeledInputBox';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { CheckCircle, Circle } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 백엔드 규칙(영문 소문자+숫자+_/., 4~20자) 기준
const USERNAME_REGEX = /^[a-z0-9_.]*$/;

const getUsernameErrors = (username: string): string[] => {
  const errors: string[] = [];
  if (!USERNAME_REGEX.test(username)) errors.push("영문 소문자, 숫자, '_', '.'만 입력가능합니다.");
  if (username.length < 4 || username.length > 20) errors.push('4~20자로 입력해주세요.');
  return errors;
};

// 백엔드 규칙(8자 이상, 영문+숫자+특수문자 조합, 아이디와 동일 금지) 기준
const hasMinLength = (password: string) => password.length >= 8;
const hasMixedChars = (password: string) => {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  return hasLetter && hasNumber && hasSpecial;
};

const SignUpStep2Screen = () => {
  const [username, setUsername] = useState('');
  const [usernameErrors, setUsernameErrors] = useState<string[]>([]);

  const handleChangeUsername = (text: string) => {
    setUsername(text);
    if (usernameErrors.length > 0) setUsernameErrors([]);
  };

  const handleBlurUsername = () => {
    if (!username.trim()) return;
    setUsernameErrors(getUsernameErrors(username));
  };

  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(false);
  };

  const handleBlurPassword = () => {
    if (!password.trim()) return;
    setPasswordError(password === username);
  };

  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);
  const [passwordConfirmError, setPasswordConfirmError] = useState(false);

  const handleChangePasswordConfirm = (text: string) => {
    setPasswordConfirm(text);
    if (passwordConfirmError) setPasswordConfirmError(false);
  };

  const handleBlurPasswordConfirm = () => {
    if (!password.trim() || !passwordConfirm.trim()) return;
    setPasswordConfirmError(passwordConfirm !== password);
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
              placeholder="영문 소문자, 숫자, _, . (4~20자)"
              value={username}
              onChangeText={handleChangeUsername}
              onBlur={handleBlurUsername}
              errorMessage={usernameErrors}
            />

            <LabeledInputBox
              label="비밀번호"
              placeholder="영문, 숫자, 특수문자(“_”,”.”) 조합 (8자 이상)"
              value={password}
              onChangeText={handleChangePassword}
              onBlur={handleBlurPassword}
              secure
              visible={passwordVisible}
              onToggleVisible={() => setPasswordVisible(!passwordVisible)}
              errorMessage={passwordError ? '아이디와 같은 비밀번호는 사용할 수 없습니다.' : undefined}
            />

            <View style={styles.checklistRow}>
              {hasMinLength(password) ? (
                <CheckCircle size={IconSize.xsmall} color={Colors.light.primary} />
              ) : (
                <Circle size={IconSize.xsmall} color={Colors.light.grayDark} />
              )}
              <Text style={[styles.checklistText, hasMinLength(password) && styles.checklistTextMet]}>8자 이상입니다.</Text>
            </View>
            <View style={styles.checklistRowSpaced}>
              {hasMixedChars(password) ? (
                <CheckCircle size={IconSize.xsmall} color={Colors.light.primary} />
              ) : (
                <Circle size={IconSize.xsmall} color={Colors.light.grayDark} />
              )}
              <Text style={[styles.checklistText, hasMixedChars(password) && styles.checklistTextMet]}>영문, 숫자, 특수문자가 포함되었습니다.</Text>
            </View>

            <LabeledInputBox
              label="비밀번호 확인"
              placeholder="비밀번호 재입력"
              value={passwordConfirm}
              onChangeText={handleChangePasswordConfirm}
              onBlur={handleBlurPasswordConfirm}
              secure
              visible={passwordConfirmVisible}
              onToggleVisible={() => setPasswordConfirmVisible(!passwordConfirmVisible)}
              errorMessage={passwordConfirmError ? '입력한 비밀번호가 다릅니다.' : undefined}
            />
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
  checklistRow: {
    marginTop: Spacing.v.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistRowSpaced: {
    marginTop: Spacing.v.small,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistText: { ...Typography.body2, color: Colors.light.grayDark, marginLeft: Spacing.h.small },
  checklistTextMet: { color: Colors.light.primary },
});

export default SignUpStep2Screen;
