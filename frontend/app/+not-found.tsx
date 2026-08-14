import { Colors } from '@/constants/Colors';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.body}>
          <Text style={styles.title}>페이지를 찾을 수 없습니다.</Text>
          <Text style={styles.subtitle}>주소가 잘못되었거나 삭제된 페이지예요.</Text>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={() => router.replace('/MainScreen')}
          >
            <Text style={styles.buttonText}>홈으로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.medium,
    gap: Spacing.v.small,
  },
  title: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  subtitle: { ...Typography.body2, color: Colors.light.grayDark, textAlign: 'center' },
  button: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonMd,
    paddingHorizontal: Spacing.h.large,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { ...Typography.button2, color: Colors.light.white },
});
