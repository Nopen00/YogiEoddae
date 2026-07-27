import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useRouter } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignUpAgreementScreen = () => {
  const router = useRouter();
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const allAgreed = agreedTerms && agreedPrivacy;
  const isActive = allAgreed;

  const handleToggleAll = () => {
    const next = !allAgreed;
    setAgreedTerms(next);
    setAgreedPrivacy(next);
  };

  const handleNext = () => {
    if (!isActive) return;
    router.push('/SignUpScreen');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
        <View style={styles.body}>
          <Text style={styles.title}>미디어 속 경험을 현실에서</Text>
          <Text style={styles.subtitle}>서비스 이용을 위해 약관에 동의해주세요.</Text>

          <TouchableOpacity style={styles.allAgreeRow} activeOpacity={0.7} onPress={handleToggleAll}>
            <View style={[styles.checkbox, allAgreed && styles.checkboxActive]}>
              {allAgreed && <Check size={16} color={Colors.light.white} strokeWidth={IconStroke.regular} />}
            </View>
            <Text style={styles.allAgreeText}>전체 동의</Text>
          </TouchableOpacity>

          <View style={styles.agreeRowSpaced}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setAgreedTerms(!agreedTerms)}>
              <View style={[styles.checkbox, agreedTerms && styles.checkboxActive]}>
                {agreedTerms && <Check size={16} color={Colors.light.white} strokeWidth={IconStroke.regular} />}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.agreeLabelLink}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/PolicyScreen', params: { type: 'terms', fromPublic: '1' } })}
            >
              <Text style={styles.agreeText}>
                <Text style={styles.requiredTag}>[필수] </Text>
                이용약관 동의
              </Text>
              <ChevronRight size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} style={styles.agreeChevron} />
            </TouchableOpacity>
          </View>

          <View style={styles.agreeRowSpaced}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setAgreedPrivacy(!agreedPrivacy)}>
              <View style={[styles.checkbox, agreedPrivacy && styles.checkboxActive]}>
                {agreedPrivacy && <Check size={16} color={Colors.light.white} strokeWidth={IconStroke.regular} />}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.agreeLabelLink}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/PolicyScreen', params: { type: 'privacy', fromPublic: '1' } })}
            >
              <Text style={styles.agreeText}>
                <Text style={styles.requiredTag}>[필수] </Text>
                개인정보 처리방침 동의
              </Text>
              <ChevronRight size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} style={styles.agreeChevron} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.nextButton, !isActive && styles.nextButtonDisabled]}
            activeOpacity={0.8}
            disabled={!isActive}
            onPress={handleNext}
          >
            <Text style={[styles.nextButtonText, !isActive && styles.nextButtonTextDisabled]}>다음</Text>
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
  allAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.large,
  },
  allAgreeText: { ...Typography.subtitle2, color: Colors.light.black, marginLeft: Spacing.h.small },
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
  agreeLabelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.h.small,
  },
  agreeText: { ...Typography.body2, color: Colors.light.black },
  requiredTag: { color: Colors.light.primary },
  agreeChevron: { marginLeft: Spacing.h.small },
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
});

export default SignUpAgreementScreen;
