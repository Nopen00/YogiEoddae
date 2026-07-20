import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { userApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CODE_TIMEOUT_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;
const DUMMY_CODE = '1111';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const PasswordChangeScreen = () => {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [hasError, setHasError] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(CODE_TIMEOUT_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const isActive = code.trim().length > 0;

  useEffect(() => {
    userApi.getMe().then((res) => setEmail(res.data.email));
  }, []);

  const handleChangeCode = (text: string) => {
    setCode(text);
    if (hasError) setHasError(false);
  };

  const handleBlurCode = () => {
    if (!code.trim()) return;
    setHasError(code.trim() !== DUMMY_CODE);
  };

  const handleConfirm = () => {
    if (!isActive) return;
    if (code.trim() === DUMMY_CODE) {
      setHasError(false);
      router.replace('/PasswordResetScreen');
    } else {
      setHasError(true);
    }
  };

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = setInterval(() => setRemainingSeconds(prev => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setRemainingSeconds(CODE_TIMEOUT_SECONDS);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} title="비밀번호 변경" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
      <View style={styles.body}>
        <Text style={styles.title}>인증 코드를 메일로 전송했습니다.</Text>
        <Text style={styles.subtitle}>5분 내에, 이메일로 전송받은 코드를 입력해 주세요.</Text>
        <Text style={styles.subtitle}>전송된 이메일 주소 : {email || '이메일이 없습니다.'}</Text>

        <View style={[styles.codeBox, hasError && styles.codeBoxError]}>
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, hasError && styles.inputLabelError]}>인증 코드</Text>
            <TextInput
              style={[styles.codeInput, { color: code ? Colors.light.black : Colors.light.grayLight }]}
              placeholder="인증 코드를 입력해주세요."
              placeholderTextColor={Colors.light.grayLight}
              value={code}
              onChangeText={handleChangeCode}
              onBlur={handleBlurCode}
            />
          </View>
          {hasError && (
            <AlertCircle size={IconSize.large} color={Colors.light.error} />
          )}
        </View>

        {hasError && (
          <View style={styles.errorRow}>
            <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
            <Text style={styles.errorText}>인증코드가 일치하지 않습니다.</Text>
          </View>
        )}

        <Text style={styles.timer}>
          {remainingSeconds > 0 ? formatTime(remainingSeconds) : '인증 코드가 만료되었습니다.'}
        </Text>

        <TouchableOpacity
          style={[styles.confirmButton, !isActive && styles.confirmButtonDisabled]}
          activeOpacity={0.8}
          disabled={!isActive}
          onPress={handleConfirm}
        >
          <Text style={[styles.confirmButtonText, !isActive && styles.confirmButtonTextDisabled]}>확인</Text>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <TouchableOpacity activeOpacity={0.7} disabled={resendCooldown > 0} onPress={handleResend}>
            <Text style={styles.resendText}>인증메일 재전송</Text>
          </TouchableOpacity>
        </View>
        {resendCooldown > 0 && (
          <Text style={styles.resendNotice}>{resendCooldown}초 이후 재전송이 가능합니다.</Text>
        )}

        <View style={styles.dummyRow}>
          <Text style={styles.dummyLabel}>더미 인증코드</Text>
          <Text style={styles.dummyValue}>1111</Text>
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
  codeBox: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonSm,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  codeBoxError: { borderColor: Colors.light.error },
  inputSection: { flex: 1 },
  inputLabel: { ...Typography.body1, color: Colors.light.grayLight, marginBottom: Spacing.v.small },
  inputLabelError: { color: Colors.light.error },
  codeInput: { padding: 0, ...Typography.body3 },
  errorRow: {
    marginTop: Spacing.v.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: { ...Typography.body2, color: Colors.light.error, marginLeft: Spacing.h.small },
  timer: { ...Typography.subtitle2, color: Colors.light.primary, marginTop: Spacing.v.large, width: '100%', textAlign: 'center' },
  confirmButton: {
    marginTop: Spacing.v.medium,
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
  resendRow: {
    marginTop: Spacing.v.large,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: { ...Typography.button2, color: Colors.light.grayDark },
  resendNotice: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small, textAlign: 'center' },
  dummyRow: {
    marginTop: Spacing.v.small,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dummyLabel: { ...Typography.body2, color: Colors.light.grayDark },
  dummyValue: { ...Typography.button2, color: Colors.light.grayDark, marginLeft: Spacing.h.small },
});

export default PasswordChangeScreen;
