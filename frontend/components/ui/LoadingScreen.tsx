// 네이티브 스플래시가 사라진 직후 ~ 로그인 여부 확인이 끝날 때까지의 공백을 채우는 화면.
// app/(tabs)/index.tsx의 AuthGateScreen에서 사용.
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { X } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MASCOT = require('@/assets/images/mascot/mascot_full_transparent.png');

interface LoadingScreenProps {
  onClose?: () => void;
  message?: string;
}

export const LoadingScreen = ({ onClose, message }: LoadingScreenProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.overlay} />

      {onClose && (
        <SafeAreaView style={styles.closeArea} edges={['top']}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          >
            <X size={IconSize.large} color={Colors.light.white} strokeWidth={IconStroke.bold} />
          </TouchableOpacity>
        </SafeAreaView>
      )}

      <View style={styles.content}>
        <Image source={MASCOT} style={styles.mascot} resizeMode="contain" />
        <Text style={styles.loadingText}>Loading...</Text>
        {message && (
          <View>
            {message.split('\n').map((line, i) => (
              <Text key={i} style={[styles.messageText, i > 0 && styles.messageLineSpacing]}>{line}</Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.light.overlay,
  },
  closeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  closeButton: {
    width: Size.buttonSm,
    height: Size.buttonSm,
    marginTop: Spacing.v.small,
    marginLeft: Spacing.h.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.v.medium,
  },
  mascot: {
    width: 220,
    height: 220,
  },
  loadingText: {
    fontFamily: 'LoadingFont',
    fontSize: 34,
    color: Colors.light.white,
  },
  messageText: {
    fontFamily: 'LoadingFont',
    fontSize: 16,
    color: Colors.light.white,
    opacity: 0.85,
    textAlign: 'center',
  },
  messageLineSpacing: {
    marginTop: Spacing.v.small,
  },
});
