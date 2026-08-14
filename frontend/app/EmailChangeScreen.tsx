import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { userApi } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 형식만 클라이언트에서 사전 체크. 중복 여부는 서버(requestEmailLink) 응답으로 판단.
type EmailError = 'invalidFormat' | 'duplicate' | null;

const getEmailFormatError = (email: string): EmailError => {
  if (!EMAIL_REGEX.test(email)) return 'invalidFormat';
  return null;
};

const EMAIL_ERROR_MESSAGE: Record<Exclude<EmailError, null>, string> = {
  invalidFormat: '이메일의 형식이 아닙니다.',
  duplicate: '이미 사용중인 이메일 입니다.',
};

interface InputBoxProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  secure?: boolean;
  visible?: boolean;
  onToggleVisible?: () => void;
  errorMessage?: string;
  keyboardType?: 'default' | 'email-address';
}

const InputBox = ({ label, placeholder, value, onChangeText, onBlur, secure, visible, onToggleVisible, errorMessage, keyboardType }: InputBoxProps) => (
  <>
    <View style={[styles.inputBox, errorMessage && styles.inputBoxError]}>
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, errorMessage && styles.inputLabelError]}>{label}</Text>
        <TextInput
          style={[styles.input, { color: value ? Colors.light.black : Colors.light.grayLight }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.grayLight}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={secure ? !visible : false}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          accessibilityLabel={label}
        />
      </View>
      <View style={styles.boxRightIcons}>
        {onToggleVisible && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleVisible}
            accessibilityRole="button"
            accessibilityLabel={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
          >
            {visible ? (
              <EyeOff size={IconSize.large} color={Colors.light.grayDark} />
            ) : (
              <Eye size={IconSize.large} color={Colors.light.grayDark} />
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
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSetup = mode === 'setup';
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [emailError, setEmailError] = useState<EmailError>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  const isActive = newEmail.trim().length > 0 && password.trim().length > 0 && !isSubmitting;

  const handleChangeNewEmail = (text: string) => {
    setNewEmail(text);
    if (emailError) setEmailError(null);
  };

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(false);
  };

  const handleBlurNewEmail = () => {
    if (!newEmail.trim()) return;
    setEmailError(getEmailFormatError(newEmail.trim()));
  };

  const handleBlurPassword = async () => {
    if (!password.trim()) return;
    try {
      const res = await userApi.verifyPassword(password);
      setPasswordError(!res.data.success);
    } catch {
      // 네트워크 오류일 수 있으므로 여기서는 비밀번호 오류로 단정하지 않고 제출 시점에 재시도한다.
    }
  };

  const handleConfirm = async () => {
    if (!isActive) return;
    setIsSubmitting(true);
    try {
      const res = await userApi.verifyPassword(password);
      const isPasswordError = !res.data.success;
      setPasswordError(isPasswordError);

      const nextEmailError = getEmailFormatError(newEmail.trim());
      setEmailError(nextEmailError);

      if (isPasswordError || nextEmailError) return;

      await userApi.requestEmailLink(newEmail.trim());
      router.push({ pathname: '/EmailVerifyScreen', params: { email: newEmail, mode } });
    } catch (e: any) {
      if (e?.response?.data?.email) {
        setEmailError('duplicate');
      } else {
        setNetworkError(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} title={isSetup ? '연동 이메일 설정' : '연동 이메일 변경'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
      <View style={styles.body}>
        <Text style={styles.title}>{isSetup ? '이메일을 설정해주세요.' : '이메일을 변경해주세요.'}</Text>
        <Text style={styles.subtitle}>
          {isSetup ? '이메일을 연동할 시, 계정 찾기에 사용됩니다.' : '이메일을 변경할 시, 7일 간 재변경이 불가능합니다.'}
        </Text>

        <InputBox
          label={isSetup ? '이메일 주소' : '새 이메일 주소'}
          placeholder="example@email.com"
          value={newEmail}
          onChangeText={handleChangeNewEmail}
          onBlur={handleBlurNewEmail}
          errorMessage={emailError ? EMAIL_ERROR_MESSAGE[emailError] : undefined}
          keyboardType="email-address"
        />

        <InputBox
          label="비밀번호"
          placeholder="현재 사용중인 비밀번호"
          value={password}
          onChangeText={handleChangePassword}
          onBlur={handleBlurPassword}
          secure
          visible={passwordVisible}
          onToggleVisible={() => setPasswordVisible(!passwordVisible)}
          errorMessage={passwordError ? '현재 비밀번호와 일치하지 않습니다.' : undefined}
        />

        {networkError && (
          <View style={styles.errorRow}>
            <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
            <Text style={styles.errorText}>일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</Text>
          </View>
        )}

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
  inputLabel: { ...Typography.body1, color: Colors.light.grayDark, marginBottom: Spacing.v.small },
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
