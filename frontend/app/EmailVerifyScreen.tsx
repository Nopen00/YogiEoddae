import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Shadows } from '@/constants/Shadows';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { userApi } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CODE_TIMEOUT_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const EmailVerifyScreen = () => {
  const router = useRouter();
  const { email, mode } = useLocalSearchParams<{ email?: string; mode?: string }>();
  const isSetup = mode === 'setup';
  const [code, setCode] = useState('');
  const [hasError, setHasError] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(CODE_TIMEOUT_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [confirmPopupVisible, setConfirmPopupVisible] = useState(false);
  const [successPopupVisible, setSuccessPopupVisible] = useState(false);
  const isActive = code.trim().length > 0;

  const handleChangeCode = (text: string) => {
    setCode(text);
    if (hasError) setHasError(false);
  };

  const handleBlurCode = () => {
    // 형식 사전체크만 — 실제 코드 일치 여부는 서버 확정(confirmEmailLink) 시점에 판정
  };

  const handleConfirmEmail = async () => {
    if (!email) return;
    try {
      await userApi.confirmEmailLink(email, code.trim());
      setConfirmPopupVisible(false);
      setSuccessPopupVisible(true);
    } catch (e: any) {
      setConfirmPopupVisible(false);
      setHasError(true);
    }
  };

  const handleConfirm = () => {
    if (!isActive) return;
    if (isSetup) {
      handleConfirmEmail();
    } else {
      setConfirmPopupVisible(true);
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

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    try {
      await userApi.requestEmailLink(email);
      setRemainingSeconds(CODE_TIMEOUT_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {}
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
        <Text style={styles.title}>인증 코드를 메일로 전송했습니다.</Text>
        <Text style={styles.subtitle}>5분 내에, 이메일로 전송받은 코드를 입력해 주세요.</Text>
        <Text style={styles.subtitle}>전송된 이메일 주소 : {email}</Text>

        <View style={[styles.codeBox, hasError && styles.codeBoxError]}>
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, hasError && styles.inputLabelError]}>인증 코드</Text>
            <TextInput
              style={[styles.codeInput, { color: code ? Colors.light.black : Colors.light.grayLight }]}
              placeholder="인증 코드 6자리"
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

      </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={confirmPopupVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmPopup}>
            <Text style={styles.confirmTitle}>이메일을 변경하시겠습니까?</Text>
            <Text style={styles.confirmDesc}>이메일을 변경할 시, 7일 간 재변경이 불가능합니다.</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.btnCancel}
                activeOpacity={0.8}
                onPress={() => setConfirmPopupVisible(false)}
              >
                <Text style={styles.btnCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirm}
                activeOpacity={0.8}
                onPress={handleConfirmEmail}
              >
                <Text style={styles.btnConfirmText}>변경</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={successPopupVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.successOverlay}
          activeOpacity={1}
          onPress={() => {
            setSuccessPopupVisible(false);
            router.dismiss(2);
          }}
        >
          <View style={styles.successPopup}>
            <Text style={styles.successTitle}>{isSetup ? '이메일이 설정되었습니다.' : '이메일이 변경되었습니다.'}</Text>
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
  confirmDesc: { ...Typography.body2, color: Colors.light.primary, marginTop: Spacing.v.medium, textAlign: 'center' },
  confirmButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnConfirmText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },

  successOverlay: { flex: 1, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  successPopup: {
    width: SCREEN_WIDTH - 64,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    ...Shadows.card,
    alignItems: 'center',
  },
  successTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
});

export default EmailVerifyScreen;
