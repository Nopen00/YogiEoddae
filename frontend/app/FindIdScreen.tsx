import { LabeledInputBox } from '@/components/ui/LabeledInputBox';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { authApi } from '@/services/api';
import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FindIdScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [findError, setFindError] = useState(false);

  const isActive = email.trim().length > 0 && password.trim().length > 0;

  const handleChangeEmail = (text: string) => {
    setEmail(text);
    if (findError) setFindError(false);
  };

  const handleChangePassword = (text: string) => {
    setPassword(text);
    if (findError) setFindError(false);
  };

  const handleFindId = async () => {
    if (!isActive) return;
    try {
      const res = await authApi.findId(email, password);
      router.push({ pathname: '/FindIdResultScreen', params: { maskedUsername: res.data.masked_username } });
    } catch (e: any) {
      setFindError(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
          <View style={styles.body}>
            <Text style={styles.title}>아이디를 잊으셨나요?</Text>
            <Text style={styles.subtitle}>등록하신 정보를 입력하여 본인 확인을 진행합니다.</Text>

            <LabeledInputBox
              label="이메일 주소"
              placeholder="example@email.com"
              value={email}
              onChangeText={handleChangeEmail}
              hasError={findError}
            />

            <LabeledInputBox
              label="비밀번호"
              placeholder="비밀번호"
              value={password}
              onChangeText={handleChangePassword}
              secure
              visible={passwordVisible}
              onToggleVisible={() => setPasswordVisible(!passwordVisible)}
              hasError={findError}
            />

            {findError && (
              <View style={styles.findErrorRow}>
                <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
                <Text style={styles.findErrorText}>입력하신 정보와 일치하는 계정을 찾을 수 없습니다.</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.findButton, findError && styles.findButtonWithError, !isActive && styles.findButtonDisabled]}
              activeOpacity={0.8}
              disabled={!isActive}
              onPress={handleFindId}
            >
              <Text style={[styles.findButtonText, !isActive && styles.findButtonTextDisabled]}>아이디 찾기</Text>
            </TouchableOpacity>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomLinkText} onPress={() => router.push('/SignUpScreen')}>회원가입</Text>
              <View style={styles.bottomDivider} />
              <Text style={styles.bottomLinkText} onPress={() => router.push('/SignInScreen')}>로그인</Text>
              <View style={styles.bottomDivider} />
              <Text style={styles.bottomLinkText} onPress={() => router.push('/FindPasswordScreen')}>비밀번호 재설정</Text>
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
    // ScreenHeader가 없는 화면이지만, 다른 화면(SignUpStep2Screen 등)의 헤더+16 위치와
    // 동일한 세로 위치에 맞추기 위해 헤더의 marginTop(8)+height(56)만큼 미리 띄움
    marginTop: Spacing.v.small + Size.header + Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  title: { ...Typography.title1, color: Colors.light.black },
  subtitle: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  findErrorRow: {
    marginTop: Spacing.v.large,
    flexDirection: 'row',
    alignItems: 'center',
  },
  findErrorText: { ...Typography.body2, color: Colors.light.error, marginLeft: Spacing.h.small },
  findButton: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonMd,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  findButtonWithError: { marginTop: Spacing.v.medium },
  findButtonDisabled: { backgroundColor: Colors.light.grayLight },
  findButtonText: { ...Typography.button2, color: Colors.light.white },
  findButtonTextDisabled: { color: Colors.light.grayDark },
  bottomRow: {
    marginTop: Spacing.v.large,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomLinkText: { ...Typography.button1, color: Colors.light.grayDark },
  bottomDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.light.grayLight,
    marginHorizontal: Spacing.h.small,
  },
});

export default FindIdScreen;
