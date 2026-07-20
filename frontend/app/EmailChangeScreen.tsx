import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { userApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 이미 사용 중인 이메일 mock 목록 — 실제 회원 조회 대신 더미 값으로 비교
const EXISTING_EMAILS = ['1234@1234.com', 'test@test.com'];

interface InputBoxProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  secure?: boolean;
  visible?: boolean;
  onToggleVisible?: () => void;
  errorMessage?: string;
}

const InputBox = ({ label, value, onChangeText, onBlur, secure, visible, onToggleVisible, errorMessage }: InputBoxProps) => (
  <>
    <View style={[styles.inputBox, errorMessage && styles.inputBoxError]}>
      <View style={styles.inputSection}>
        {value.length > 0 && (
          <Text style={[styles.inputLabel, errorMessage && styles.inputLabelError]}>{label}</Text>
        )}
        <TextInput
          style={[styles.input, { color: value ? Colors.light.black : Colors.light.grayLight }]}
          placeholder={label}
          placeholderTextColor={Colors.light.grayLight}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={secure ? !visible : false}
        />
      </View>
      <View style={styles.boxRightIcons}>
        {onToggleVisible && (
          <TouchableOpacity activeOpacity={0.7} onPress={onToggleVisible}>
            {visible ? (
              <EyeOff size={IconSize.large} color={Colors.light.grayLight} />
            ) : (
              <Eye size={IconSize.large} color={Colors.light.grayLight} />
            )}
          </TouchableOpacity>
        )}
        {errorMessage && (
          <AlertCircle size={IconSize.large} color={Colors.light.error} style={styles.errorIcon} />
        )}
      </View>
    </View>
    {errorMessage && (
      <View style={styles.errorRow}>
        <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    )}
  </>
);

const EmailChangeScreen = () => {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const isActive = newEmail.trim().length > 0 && password.trim().length > 0;

  const handleChangeNewEmail = (text: string) => {
    setNewEmail(text);
    if (emailError) setEmailError(false);
  };

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(false);
  };

  const handleBlurNewEmail = () => {
    if (!newEmail.trim()) return;
    setEmailError(EXISTING_EMAILS.includes(newEmail.trim()));
  };

  const handleBlurPassword = async () => {
    if (!password.trim()) return;
    const res = await userApi.verifyPassword(password);
    setPasswordError(!res.data.success);
  };

  const handleConfirm = async () => {
    if (!isActive) return;
    const res = await userApi.verifyPassword(password);
    const isPasswordError = !res.data.success;
    setPasswordError(isPasswordError);

    const isEmailError = EXISTING_EMAILS.includes(newEmail.trim());
    setEmailError(isEmailError);

    if (isPasswordError || isEmailError) return;
    router.push({ pathname: '/EmailVerifyScreen', params: { email: newEmail } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} title="이메일 변경" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
      <View style={styles.body}>
        <Text style={styles.title}>이메일을 변경해주세요.</Text>
        <Text style={styles.subtitle}>이메일을 변경할 시, 7일 간 재변경이 불가능합니다.</Text>

        <InputBox
          label="새 이메일 주소"
          value={newEmail}
          onChangeText={handleChangeNewEmail}
          onBlur={handleBlurNewEmail}
          errorMessage={emailError ? '이미 사용중인 이메일 입니다.' : undefined}
        />

        <InputBox
          label="비밀번호"
          value={password}
          onChangeText={handleChangePassword}
          onBlur={handleBlurPassword}
          secure
          visible={passwordVisible}
          onToggleVisible={() => setPasswordVisible(!passwordVisible)}
          errorMessage={passwordError ? '현재 비밀번호와 일치하지 않습니다.' : undefined}
        />

        <TouchableOpacity
          style={[styles.confirmButton, !isActive && styles.confirmButtonDisabled]}
          activeOpacity={0.8}
          disabled={!isActive}
          onPress={handleConfirm}
        >
          <Text style={[styles.confirmButtonText, !isActive && styles.confirmButtonTextDisabled]}>인증 메일 발송</Text>
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
    marginTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  title: { ...Typography.title1, color: Colors.light.black },
  subtitle: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  inputBox: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonSm,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputBoxError: { borderColor: Colors.light.error },
  inputSection: { flex: 1 },
  inputLabel: { ...Typography.body1, color: Colors.light.grayLight, marginBottom: Spacing.v.small },
  inputLabelError: { color: Colors.light.error },
  input: { padding: 0, ...Typography.body3 },
  boxRightIcons: { flexDirection: 'row', alignItems: 'center' },
  errorIcon: { marginLeft: Spacing.h.small },
  errorRow: {
    marginTop: Spacing.v.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: { ...Typography.body2, color: Colors.light.error, marginLeft: Spacing.h.small },
  confirmButton: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonMd,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: { backgroundColor: Colors.light.grayLight },
  confirmButtonText: { ...Typography.button2, color: Colors.light.white },
  confirmButtonTextDisabled: { color: Colors.light.grayDark },
});

export default EmailChangeScreen;
