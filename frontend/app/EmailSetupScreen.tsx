import { LabeledInputBox } from '@/components/ui/LabeledInputBox';
import { Colors } from '@/constants/Colors';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { userApi } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const EmailSetupScreen = () => {
  const router = useRouter();
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<EmailError>(null);
  const [setupLaterPopupVisible, setSetupLaterPopupVisible] = useState(false);

  const handleChangeNewEmail = (text: string) => {
    setNewEmail(text);
    if (emailError) setEmailError(null);
  };

  const handleBlurNewEmail = () => {
    if (!newEmail.trim()) return;
    setEmailError(getEmailFormatError(newEmail.trim()));
  };

  const handleConfirm = async () => {
    if (!newEmail.trim()) return;
    const nextEmailError = getEmailFormatError(newEmail.trim());
    setEmailError(nextEmailError);
    if (nextEmailError) return;

    try {
      await userApi.requestEmailLink(newEmail.trim());
      router.push({
        pathname: '/EmailVerifyScreen',
        params: { email: newEmail, mode: 'setup', fromSignup: '1', nickname: nickname ?? '' },
      });
    } catch (e: any) {
      if (e?.response?.data?.email) {
        setEmailError('duplicate');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
          <View style={styles.body}>
            <Text style={styles.title}>이메일을 설정해주세요.</Text>
            <Text style={styles.subtitle}>이메일을 연동할 시, 계정 찾기에 사용됩니다.</Text>

            <LabeledInputBox
              label="이메일 주소"
              placeholder="example@email.com"
              value={newEmail}
              onChangeText={handleChangeNewEmail}
              onBlur={handleBlurNewEmail}
              errorMessage={emailError ? EMAIL_ERROR_MESSAGE[emailError] : undefined}
            />

            <TouchableOpacity
              style={[styles.confirmButton, !newEmail.trim() && styles.confirmButtonDisabled]}
              activeOpacity={0.8}
              disabled={!newEmail.trim()}
              onPress={handleConfirm}
            >
              <Text style={[styles.confirmButtonText, !newEmail.trim() && styles.confirmButtonTextDisabled]}>인증 메일 발송</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipRow}
              activeOpacity={0.7}
              onPress={() => setSetupLaterPopupVisible(true)}
            >
              <Text style={styles.skipText}>다음에 하기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  body: {
    // ScreenHeader가 없는 화면이지만, 다른 화면(SignUpScreen 등)의 헤더+16 위치와
    // 동일한 세로 위치에 맞추기 위해 헤더의 marginTop(8)+height(56)만큼 미리 띄움
    marginTop: Spacing.v.small + Size.header + Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  title: { ...Typography.title1, color: Colors.light.black },
  subtitle: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
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
  skipRow: {
    marginTop: Spacing.v.large,
    alignItems: 'center',
  },
  skipText: { ...Typography.button1, color: Colors.light.grayDark },

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

export default EmailSetupScreen;
