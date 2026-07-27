import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Shadows } from '@/constants/Shadows';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { authApi, userApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle, Circle, Eye, EyeOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const hasMinLength = (password: string) => password.length >= 8;
const hasMixedChars = (password: string) => {
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  return hasLetter && hasNumber && hasSpecial;
};

type NewPasswordError = 'sameAsUserId' | 'recentlyUsed' | null;

// 클라이언트 사전 체크는 아이디 동일 여부만. 재사용 이력 여부는 서버(changePassword) 응답으로 판단.
const getNewPasswordError = (password: string, userId: string): NewPasswordError => {
  if (password === userId) return 'sameAsUserId';
  return null;
};

const NEW_PASSWORD_ERROR_MESSAGE: Record<Exclude<NewPasswordError, null>, string> = {
  sameAsUserId: '아이디와 같은 비밀번호는 사용할 수 없습니다.',
  recentlyUsed: '최근에 사용했던 비밀번호는 사용할 수 없습니다.',
};

interface PasswordInputBoxProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  visible: boolean;
  onToggleVisible: () => void;
  errorMessage?: string;
}

const PasswordInputBox = ({ label, placeholder, value, onChangeText, onBlur, visible, onToggleVisible, errorMessage }: PasswordInputBoxProps) => (
  <>
    <View style={[styles.passwordBox, errorMessage && styles.passwordBoxError]}>
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, errorMessage && styles.inputLabelError]}>{label}</Text>
        <TextInput
          style={[styles.passwordInput, { color: value ? Colors.light.black : Colors.light.grayLight }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.grayLight}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={!visible}
        />
      </View>
      <View style={styles.boxRightIcons}>
        <TouchableOpacity activeOpacity={0.7} onPress={onToggleVisible}>
          {visible ? (
            <EyeOff size={IconSize.large} color={Colors.light.grayLight} />
          ) : (
            <Eye size={IconSize.large} color={Colors.light.grayLight} />
          )}
        </TouchableOpacity>
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

const PasswordEditScreen = () => {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [currentVisible, setCurrentVisible] = useState(false);
  const [newVisible, setNewVisible] = useState(false);
  const [newConfirmVisible, setNewConfirmVisible] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState<NewPasswordError>(null);
  const [newPasswordConfirmError, setNewPasswordConfirmError] = useState(false);
  const [userId, setUserId] = useState('');
  const [confirmPopupVisible, setConfirmPopupVisible] = useState(false);
  const [successPopupVisible, setSuccessPopupVisible] = useState(false);

  useEffect(() => {
    userApi.getMe().then((res) => setUserId(res.data.username));
  }, []);

  const isActive =
    currentPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    newPasswordConfirm.trim().length > 0 &&
    hasMinLength(newPassword) &&
    hasMixedChars(newPassword);

  const handleChangeCurrentPassword = (text: string) => {
    setCurrentPassword(text);
    if (currentPasswordError) setCurrentPasswordError(false);
  };

  const handleChangeNewPassword = (text: string) => {
    setNewPassword(text);
    if (newPasswordError) setNewPasswordError(null);
  };

  const handleChangeNewPasswordConfirm = (text: string) => {
    setNewPasswordConfirm(text);
    if (newPasswordConfirmError) setNewPasswordConfirmError(false);
  };

  const handleBlurCurrentPassword = async () => {
    if (!currentPassword.trim()) return;
    const res = await userApi.verifyPassword(currentPassword);
    setCurrentPasswordError(!res.data.success);
  };

  const handleBlurNewPassword = () => {
    if (!newPassword.trim()) return;
    setNewPasswordError(getNewPasswordError(newPassword, userId));
  };

  const handleBlurNewPasswordConfirm = () => {
    if (!newPassword.trim() || !newPasswordConfirm.trim()) return;
    setNewPasswordConfirmError(newPasswordConfirm !== newPassword);
  };

  const handleConfirm = async () => {
    if (!isActive) return;
    const res = await userApi.verifyPassword(currentPassword);
    const isCurrentPasswordError = !res.data.success;
    setCurrentPasswordError(isCurrentPasswordError);

    const nextNewPasswordError = getNewPasswordError(newPassword, userId);
    setNewPasswordError(nextNewPasswordError);

    const isNewPasswordConfirmError = newPasswordConfirm !== newPassword;
    setNewPasswordConfirmError(isNewPasswordConfirmError);

    if (isCurrentPasswordError || nextNewPasswordError || isNewPasswordConfirmError) return;
    setConfirmPopupVisible(true);
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
        <Text style={styles.title}>비밀번호를 변경해주세요.</Text>
        <Text style={styles.subtitle}>비밀번호를 변경할 시, 7일 간 재변경이 불가능합니다.</Text>

        <PasswordInputBox
          label="현재 비밀번호"
          placeholder="현재 사용중인 비밀번호"
          value={currentPassword}
          onChangeText={handleChangeCurrentPassword}
          onBlur={handleBlurCurrentPassword}
          visible={currentVisible}
          onToggleVisible={() => setCurrentVisible(!currentVisible)}
          errorMessage={currentPasswordError ? '현재 비밀번호와 일치하지 않습니다.' : undefined}
        />

        <PasswordInputBox
          label="새 비밀번호"
          placeholder="영문, 숫자, 특수문자 조합 (8자 이상)"
          value={newPassword}
          onChangeText={handleChangeNewPassword}
          onBlur={handleBlurNewPassword}
          visible={newVisible}
          onToggleVisible={() => setNewVisible(!newVisible)}
          errorMessage={newPasswordError ? NEW_PASSWORD_ERROR_MESSAGE[newPasswordError] : undefined}
        />

        <View style={styles.checklistRow}>
          {hasMinLength(newPassword) ? (
            <CheckCircle size={IconSize.xsmall} color={Colors.light.primary} />
          ) : (
            <Circle size={IconSize.xsmall} color={Colors.light.grayDark} />
          )}
          <Text style={[styles.checklistText, hasMinLength(newPassword) && styles.checklistTextMet]}>8자 이상입니다.</Text>
        </View>
        <View style={styles.checklistRowSpaced}>
          {hasMixedChars(newPassword) ? (
            <CheckCircle size={IconSize.xsmall} color={Colors.light.primary} />
          ) : (
            <Circle size={IconSize.xsmall} color={Colors.light.grayDark} />
          )}
          <Text style={[styles.checklistText, hasMixedChars(newPassword) && styles.checklistTextMet]}>영문, 숫자, 특수문자(!, @, #, _, ^)가 포함되었습니다.</Text>
        </View>

        <PasswordInputBox
          label="새 비밀번호 확인"
          placeholder="비밀번호 재입력"
          value={newPasswordConfirm}
          onChangeText={handleChangeNewPasswordConfirm}
          onBlur={handleBlurNewPasswordConfirm}
          visible={newConfirmVisible}
          onToggleVisible={() => setNewConfirmVisible(!newConfirmVisible)}
          errorMessage={newPasswordConfirmError ? '입력한 비밀번호가 다릅니다.' : undefined}
        />

        <TouchableOpacity
          style={[styles.confirmButton, !isActive && styles.confirmButtonDisabled]}
          activeOpacity={0.8}
          disabled={!isActive}
          onPress={handleConfirm}
        >
          <Text style={[styles.confirmButtonText, !isActive && styles.confirmButtonTextDisabled]}>변경</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={confirmPopupVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmPopup}>
            <Text style={styles.confirmTitle}>비밀번호를 변경하시겠습니까?</Text>
            <Text style={styles.confirmDesc}>비밀번호를 변경할 시, 7일 간 재변경이 불가능합니다.</Text>
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
                onPress={async () => {
                  try {
                    await userApi.changePassword(currentPassword, newPassword);
                    setConfirmPopupVisible(false);
                    setSuccessPopupVisible(true);
                  } catch (e: any) {
                    setConfirmPopupVisible(false);
                    if (e?.response?.data?.new_password) {
                      setNewPasswordError('recentlyUsed');
                    } else if (e?.response?.data?.current_password) {
                      setCurrentPasswordError(true);
                    }
                  }
                }}
              >
                <Text style={styles.btnConfirmText}>변경</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={successPopupVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.resultOverlay}
          activeOpacity={1}
          onPress={async () => {
            setSuccessPopupVisible(false);
            await authApi.logout();
            router.dismissAll();
            router.replace('/');
          }}
        >
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>비밀번호가 변경되었습니다.</Text>
            <Text style={styles.resultSub1}>보안을 위해 다시 로그인해 주세요.</Text>
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
  passwordBox: {
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
  passwordBoxError: { borderColor: Colors.light.error },
  inputSection: { flex: 1 },
  inputLabel: { ...Typography.body1, color: Colors.light.grayLight, marginBottom: Spacing.v.small },
  inputLabelError: { color: Colors.light.error },
  passwordInput: { padding: 0, ...Typography.body3 },
  boxRightIcons: { flexDirection: 'row', alignItems: 'center' },
  errorIcon: { marginLeft: Spacing.h.small },
  errorRow: {
    marginTop: Spacing.v.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: { ...Typography.body2, color: Colors.light.error, marginLeft: Spacing.h.small },
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
  resultSub1: { ...Typography.body2, color: Colors.light.primary, marginTop: Spacing.v.medium, textAlign: 'center' },
});

export default PasswordEditScreen;
