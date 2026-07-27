import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { PRIVACY_POLICY_TEXT, TERMS_OF_SERVICE_TEXT } from '@/constants/PolicyContent';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PolicyScreen = () => {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? '개인정보 처리방침' : '이용약관';
  const content = isPrivacy ? PRIVACY_POLICY_TEXT : TERMS_OF_SERVICE_TEXT;

  const lines = content.split('\n');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={title} onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {lines.map((line, index) => {
          if (!line.trim()) return null;
          if (line.startsWith('# ')) {
            return <Text key={index} style={styles.headline}>{line.slice(2)}</Text>;
          }
          if (line.startsWith('## ')) {
            return <Text key={index} style={styles.sectionTitle}>{line.slice(3)}</Text>;
          }
          if (line.startsWith('⚠️')) {
            return <Text key={index} style={styles.notice}>{line}</Text>;
          }
          if (line.startsWith('- ')) {
            return <Text key={index} style={styles.bullet}>{`•  ${line.slice(2)}`}</Text>;
          }
          return <Text key={index} style={styles.paragraph}>{line}</Text>;
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  body: {
    paddingHorizontal: Spacing.h.medium,
    paddingBottom: Spacing.v.screenBottom,
  },
  headline: { ...Typography.title1, color: Colors.light.black, marginTop: Spacing.v.large },
  sectionTitle: { ...Typography.subtitle2, color: Colors.light.black, marginTop: Spacing.v.large },
  notice: { ...Typography.body2, color: Colors.light.error, marginTop: Spacing.v.medium },
  bullet: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  paragraph: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.medium },
});

export default PolicyScreen;
