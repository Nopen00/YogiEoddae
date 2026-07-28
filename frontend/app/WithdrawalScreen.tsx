import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { PRIVACY_POLICY_URL } from '@/constants/PolicyContent';
import { Shadows } from '@/constants/Shadows';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { authApi, userApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { AlertCircle, Check, ChevronRight, Eye, EyeOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WithdrawalScreen = () => {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [agreedDeletion, setAgreedDeletion] = useState(false);
  const [agreedTokenLoss, setAgreedTokenLoss] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [withdrawConfirmVisible, setWithdrawConfirmVisible] = useState(false);

  const isWithdrawActive =
    password.trim().length > 0 && agreed && agreedDeletion && agreedTokenLoss;

  useEffect(() => {
    userApi.getMe().then((res) => {
      setUserId(res.data.username);
      setTokenBalance(res.data.token_balance);
    });
  }, []);

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(false);
  };

  const handleBlurPassword = async () => {
    if (!password.trim()) return;
    const res = await userApi.verifyPassword(password);
    setPasswordError(!res.data.success);
  };

  const handleWithdraw = async () => {
    if (!isWithdrawActive) return;
    const res = await userApi.verifyPassword(password);
    if (!res.data.success) {
      setPasswordError(true);
      return;
    }
    setWithdrawConfirmVisible(true);
  };

  const handleConfirmWithdraw = async () => {
    setWithdrawConfirmVisible(false);
    try {
      await userApi.withdraw(password);
      await authApi.logout();
      router.dismissAll();
      router.replace('/');
    } catch (e: any) {
      setPasswordError(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} title="회원탈퇴" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
          <View style={styles.body}>
            <Text style={styles.title}>다음 유의사항을 꼭 확인해 주세요.</Text>
          <Text style={styles.subtitle}>
            회원 탈퇴를 신청하시기 전에 아래 내용을 숙지하시기 바라며, 탈퇴 시 발생하는 결과에 대한 모든 책임은 이용자 본인에게 있음을 알려드립니다.
          </Text>

          <Text style={styles.noticeTitle}>1. 개인정보 및 데이터의 파기</Text>
          <Text style={styles.noticeBody}>
            - 회원탈퇴가 완료되면 서비스 내에 저장된 이용자의 개인정보(프로필, 이메일 등) 및 활동 데이터(작성 게시물, 댓글, 사진 등)는 영구적으로 파기됩니다.
          </Text>
          <Text style={styles.noticeBodySpaced}>- 파기된 데이터는 어떠한 경우에도 복구가 불가능합니다.</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxLabel}>탈퇴 대상 계정(아이디)</Text>
            <Text style={styles.infoBoxValue}>{userId}</Text>
          </View>

          <Text style={styles.noticeTitle}>2. 잔여 재화 및 유료 서비스</Text>
          <Text style={styles.noticeBody}>- 탈퇴 시점에 보유한 유료 재화(토큰 등)과 유료 이용권 등은 즉시 소멸합니다.</Text>
          <Text style={styles.noticeBodySpaced}>- 탈퇴 이후에는 환불하거나 재지급받을 수 없습니다.</Text>
          <Text style={styles.noticeBodySpaced}>- 결제 내역은 법령에 따라 보관되나, 이를 근거로 한 재화의 복구는 지원되지 않습니다.</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxLabel}>잔여 토큰</Text>
            <Text style={styles.infoBoxValue}>{tokenBalance.toLocaleString()} 토큰</Text>
          </View>

          <Text style={styles.noticeTitle}>3. 법령에 따른 개인정보 보관</Text>
          <Text style={styles.noticeBody}>- 회원탈퇴가 완료되면 계정 정보가 삭제되며 복구할 수 없습니다.</Text>
          <Text style={styles.noticeBodySpaced}>- 다만 법령에 의하여 보관해야 하는 경우 또는 회원가입 남용, 부정 거래 방지 및 대응 목적으로 일부 정보는 7일간 보관 후 삭제됩니다.</Text>
          <Text style={styles.noticeBodySpaced}>- 자세한 내용은 개인정보 처리방침에서 확인하실 수 있습니다.</Text>

          <TouchableOpacity style={styles.policyRow} activeOpacity={0.7} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <ChevronRight size={IconSize.xsmall} color={Colors.light.primary} />
            <Text style={styles.policyText}>개인정보 처리방침</Text>
          </TouchableOpacity>

          <Text style={styles.noticeTitle}>4. 서비스 재이용 및 제한</Text>
          <Text style={styles.noticeBody}>
            - 탈퇴 후 동일한 이메일 주소나 소셜 계정으로 재가입할 경우, 기존의 활동 내역(활동 데이터 등)은 연동되지 않으며 완전히 새로운 회원으로 간주됩니다.
          </Text>
          <Text style={styles.noticeBodySpaced}>- 부정 이용 방지 및 서비스 악용 차단을 위해 탈퇴 후 7일 동안 동일한 아이디/이메일로 신규가입이 불가합니다.</Text>

          <Text style={styles.confirmTitle}>본인 확인을 위해 계정의 비밀번호를 입력해 주세요.</Text>

          <View style={[styles.passwordBox, passwordError && styles.passwordBoxError]}>
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, passwordError && styles.inputLabelError]}>비밀번호</Text>
              <TextInput
                style={[styles.passwordInput, { color: password ? Colors.light.black : Colors.light.grayLight }]}
                placeholder="현재 사용중인 비밀번호"
                placeholderTextColor={Colors.light.grayLight}
                value={password}
                onChangeText={handleChangePassword}
                onBlur={handleBlurPassword}
                secureTextEntry={!passwordVisible}
              />
            </View>
            <View style={styles.boxRightIcons}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setPasswordVisible(!passwordVisible)}>
                {passwordVisible ? (
                  <EyeOff size={IconSize.large} color={Colors.light.grayLight} />
                ) : (
                  <Eye size={IconSize.large} color={Colors.light.grayLight} />
                )}
              </TouchableOpacity>
              {passwordError && (
                <AlertCircle size={IconSize.large} color={Colors.light.error} style={styles.errorIcon} />
              )}
            </View>
          </View>

          {passwordError && (
            <View style={styles.errorRow}>
              <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
              <Text style={styles.errorText}>현재 비밀번호와 일치하지 않습니다.</Text>
            </View>
          )}

          <TouchableOpacity style={styles.agreeRow} activeOpacity={0.7} onPress={() => setAgreed(!agreed)}>
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Check size={16} color={Colors.light.white} strokeWidth={IconStroke.regular} />}
            </View>
            <Text style={styles.agreeText}>위 내용을 모두 확인하였으며, 이에 동의합니다.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.agreeRowSpaced} activeOpacity={0.7} onPress={() => setAgreedDeletion(!agreedDeletion)}>
            <View style={[styles.checkbox, agreedDeletion && styles.checkboxActive]}>
              {agreedDeletion && <Check size={16} color={Colors.light.white} strokeWidth={IconStroke.regular} />}
            </View>
            <Text style={styles.agreeText}>탈퇴 시 계정 내 모든 데이터가 즉시 삭제되며 복구가 불가능함을 확인하였습니다.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.agreeRowSpaced} activeOpacity={0.7} onPress={() => setAgreedTokenLoss(!agreedTokenLoss)}>
            <View style={[styles.checkbox, agreedTokenLoss && styles.checkboxActive]}>
              {agreedTokenLoss && <Check size={16} color={Colors.light.white} strokeWidth={IconStroke.regular} />}
            </View>
            <Text style={styles.agreeText}>잔여 재화(토큰, 쿠폰 등)가 소멸됨에 동의하며, 이에 대한 환불 요청을 하지 않을 것에 동의합니다.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.withdrawButton, !isWithdrawActive && styles.withdrawButtonDisabled]}
            activeOpacity={0.8}
            disabled={!isWithdrawActive}
            onPress={handleWithdraw}
          >
            <Text style={[styles.withdrawButtonText, !isWithdrawActive && styles.withdrawButtonTextDisabled]}>탈퇴하기</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={withdrawConfirmVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>회원탈퇴를 진행하시겠습니까?</Text>
            <Text style={styles.popupDesc}>모든 데이터가 사라지며 복구 할 수 없습니다.{'\n'}계속 진행하시겠습니까?</Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity style={styles.btnCancel} activeOpacity={0.8} onPress={() => setWithdrawConfirmVisible(false)}>
                <Text style={styles.btnCancelText}>아니오</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnComplete} activeOpacity={0.8} onPress={handleConfirmWithdraw}>
                <Text style={styles.btnCompleteText}>예</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  noticeTitle: { ...Typography.subtitle2, color: Colors.light.black, marginTop: Spacing.v.large },
  noticeBody: { ...Typography.body2, color: Colors.light.black, marginTop: Spacing.v.medium },
  noticeBodySpaced: { ...Typography.body2, color: Colors.light.black, marginTop: Spacing.v.small },
  infoBox: {
    marginTop: Spacing.v.small,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
  },
  infoBoxLabel: { ...Typography.body2, color: Colors.light.black },
  infoBoxValue: { ...Typography.subtitle2, color: Colors.light.black, marginTop: Spacing.v.small },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.h.small,
    marginTop: Spacing.v.small,
    marginLeft: Spacing.h.medium,
    alignSelf: 'flex-start',
  },
  policyText: { ...Typography.button4, color: Colors.light.primary },
  confirmTitle: { ...Typography.title1, color: Colors.light.black, marginTop: Spacing.v.large },
  passwordBox: {
    marginTop: Spacing.v.medium,
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
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.large,
  },
  agreeRowSpaced: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.large,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxActive: { backgroundColor: Colors.light.primary },
  agreeText: { ...Typography.subtitle2, color: Colors.light.black, marginLeft: Spacing.h.small, flexShrink: 1 },
  withdrawButton: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonMd,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawButtonDisabled: { backgroundColor: Colors.light.grayLight },
  withdrawButtonText: { ...Typography.button2, color: Colors.light.white },
  withdrawButtonTextDisabled: { color: Colors.light.grayDark },

  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: SCREEN_WIDTH - 64,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: Spacing.v.medium,
    paddingBottom: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    ...Shadows.card,
  },
  popupTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    textAlign: 'center',
  },
  popupDesc: {
    ...Typography.body2,
    color: Colors.light.error,
    marginTop: Spacing.v.medium,
    textAlign: 'center',
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.h.medium,
    marginTop: Spacing.v.medium,
  },
  btnComplete: {
    width: 80,
    height: Size.buttonSm,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCompleteText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: {
    width: 80,
    height: Size.buttonSm,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },
});

export default WithdrawalScreen;
