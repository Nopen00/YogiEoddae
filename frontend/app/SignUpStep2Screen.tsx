import { LabeledInputBox } from '@/components/ui/LabeledInputBox';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Shadows } from '@/constants/Shadows';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { authApi } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Circle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 백엔드 규칙(영문+숫자, 5~20자) 기준
const USERNAME_REGEX = /^[a-zA-Z0-9]*$/;

const getUsernameErrors = (username: string): string[] => {
  const errors: string[] = [];
  if (!USERNAME_REGEX.test(username)) errors.push('영문, 숫자만 입력가능합니다.');
  if (username.length < 5 || username.length > 20) errors.push('5~20자로 입력해주세요.');
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
  const router = useRouter();
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const [username, setUsername] = useState('');
  const [usernameErrors, setUsernameErrors] = useState<string[]>([]);
  const [confirmPopupVisible, setConfirmPopupVisible] = useState(false);
  const [setupLaterPopupVisible, setSetupLaterPopupVisible] = useState(false);
  const [signupErrorMessage, setSignupErrorMessage] = useState<string | null>(null);

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

  const isActive = username.trim().length > 0 && password.trim().length > 0 && passwordConfirm.trim().length > 0;

  const handleNext = async () => {
    if (!isActive) return;

    const errors = getUsernameErrors(username);
    setUsernameErrors(errors);

    const sameAsUsername = password === username;
    setPasswordError(sameAsUsername);

    const mismatch = passwordConfirm !== password;
    setPasswordConfirmError(mismatch);

    if (errors.length > 0 || sameAsUsername || !hasMinLength(password) || !hasMixedChars(password) || mismatch) return;

    try {
      await authApi.signup({ username, nickname: nickname ?? '', password });
      setConfirmPopupVisible(true);
    } catch (e: any) {
      const duplicateUsername = e?.response?.data?.username?.[0];
      if (duplicateUsername) {
        setUsernameErrors([duplicateUsername]);
      } else {
        setSignupErrorMessage('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
          <View style={styles.body}>
            <Text style={styles.title}>미디어 속 경험을 현실에서</Text>
            <Text style={styles.subtitle}>미디어에서 보기만 했던 장소들을 현실에서 만나보세요.</Text>

            <LabeledInputBox
              label="아이디"
              placeholder="영문, 숫자 (5~20자)"
              value={username}
              onChangeText={handleChangeUsername}
              onBlur={handleBlurUsername}
              errorMessage={usernameErrors}
            />

            <LabeledInputBox
              label="비밀번호"
              placeholder="영문, 숫자, 특수문자 조합 (8자 이상)"
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
              <Text style={[styles.checklistText, hasMixedChars(password) && styles.checklistTextMet]}>영문, 숫자, 특수문자(!, @, #, _, ^)가 포함되었습니다.</Text>
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

            <TouchableOpacity
              style={[styles.nextButton, !isActive && styles.nextButtonDisabled]}
              activeOpacity={0.8}
              disabled={!isActive}
              onPress={handleNext}
            >
              <Text style={[styles.nextButtonText, !isActive && styles.nextButtonTextDisabled]}>회원가입</Text>
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

      <Modal visible={confirmPopupVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmPopup}>
            <Text style={styles.confirmTitle}>이메일을 연동하시겠습니까?</Text>
            <Text style={styles.confirmDesc}>계정을 찾거나 비밀번호를 재설정할 때 사용됩니다.</Text>
            <Text style={styles.confirmDescSpaced}>MY페이지에서 언제든 연동 가능합니다.</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.btnCancel}
                activeOpacity={0.8}
                onPress={() => {
                  setConfirmPopupVisible(false);
                  setSetupLaterPopupVisible(true);
                }}
              >
                <Text style={styles.btnCancelText}>다음에</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirm}
                activeOpacity={0.8}
                onPress={() => {
                  setConfirmPopupVisible(false);
                  router.push({ pathname: '/EmailSetupScreen', params: { nickname: nickname ?? '' } });
                }}
              >
                <Text style={styles.btnConfirmText}>연동하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={setupLaterPopupVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.resultOverlay}
          activeOpacity={1}
          onPress={() => {
            setSetupLaterPopupVisible(false);
            router.dismissAll();
            router.replace({ pathname: '/MainScreen', params: { welcome: '1', nickname: nickname ?? '' } });
          }}
        >
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>다음에 설정하기로 완료되었습니다.</Text>
            <Text style={styles.resultSub1}>MY페이지에서 언제든지 이메일을 연동하실 수 있어요.</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={signupErrorMessage !== null} transparent animationType="none">
        <TouchableOpacity
          style={styles.resultOverlay}
          activeOpacity={1}
          onPress={() => setSignupErrorMessage(null)}
        >
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>{signupErrorMessage}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
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
  checklistTextMet: { color: Colors.light.dark },
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

  confirmOverlay: { flex: 1, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  confirmPopup: {
    width: SCREEN_WIDTH - 64,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingBottom: Spacing.v.medium,
    ...Shadows.card,
  },
  confirmTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  confirmDesc: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.medium, textAlign: 'center' },
  confirmDescSpaced: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.small, textAlign: 'center' },
  confirmButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnConfirmText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },

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
  resultSub1: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.medium, textAlign: 'center' },
});

export default SignUpStep2Screen;
