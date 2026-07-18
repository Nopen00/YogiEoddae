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
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PasswordConfirmScreen = () => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isActive = password.trim().length > 0;

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (hasError) setHasError(false);
  };

  const handleConfirm = async () => {
    if (!isActive) return;
    try {
      const res = await userApi.verifyPassword(password);
      if (res.data.success) {
        router.replace('/AccountScreen');
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} title="비밀번호 재확인" />

      <View style={styles.body}>
        <Text style={styles.title}>비밀번호를 다시 확인해 주세요.</Text>
        <Text style={styles.subtitle}>회원님의 정보를 보호하기 위해 인증이 필요합니다.</Text>

        <View style={[styles.passwordBox, hasError && styles.passwordBoxError]}>
          <TextInput
            style={[styles.passwordInput, { color: password ? Colors.light.black : Colors.light.grayLight }]}
            placeholder="비밀번호"
            placeholderTextColor={Colors.light.grayLight}
            value={password}
            onChangeText={handleChangePassword}
            secureTextEntry={!isVisible}
          />
          <View style={styles.boxRightIcons}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setIsVisible(!isVisible)}>
              {isVisible ? (
                <EyeOff size={IconSize.large} color={Colors.light.grayLight} />
              ) : (
                <Eye size={IconSize.large} color={Colors.light.grayLight} />
              )}
            </TouchableOpacity>
            {hasError && (
              <AlertCircle size={IconSize.large} color={Colors.light.error} style={styles.errorIcon} />
            )}
          </View>
        </View>

        {hasError && (
          <View style={styles.errorRow}>
            <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
            <Text style={styles.errorText}>현재 비밀번호와 일치하지 않습니다.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.confirmButton, !isActive && styles.confirmButtonDisabled]}
          activeOpacity={0.8}
          disabled={!isActive}
          onPress={handleConfirm}
        >
          <Text style={[styles.confirmButtonText, !isActive && styles.confirmButtonTextDisabled]}>확인</Text>
        </TouchableOpacity>

        <View style={styles.changeRow}>
          <Text style={styles.changeText}>비밀번호가 기억나지 않으신가요?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/PasswordChangeScreen')}>
            <Text style={styles.changeLink}>비밀번호 변경</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dummyRow}>
          <Text style={styles.changeText}>더미 비밀번호</Text>
          <Text style={styles.changeLink}>123456</Text>
        </View>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordBoxError: { borderColor: Colors.light.error },
  passwordInput: { flex: 1, padding: 0, ...Typography.body3 },
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
  changeRow: {
    marginTop: Spacing.v.large,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeText: { ...Typography.body2, color: Colors.light.grayDark },
  changeLink: { ...Typography.button2, color: Colors.light.grayDark, marginLeft: Spacing.h.small },
  dummyRow: {
    marginTop: Spacing.v.small,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PasswordConfirmScreen;
