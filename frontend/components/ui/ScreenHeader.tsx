import { BackButton } from '@/components/ui/BackButton';
import { Colors } from '@/constants/Colors';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ScreenHeaderProps {
  onBack?: () => void;
  title?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function ScreenHeader({ onBack, title, right, style, children }: ScreenHeaderProps) {
  const hasFlexContent = !!(children || right);
  return (
    <View style={[styles.header, style]}>
      {onBack ? <BackButton onPress={onBack} /> : <View style={styles.rightBalance} />}
      {title && <Text style={styles.title}>{title}</Text>}
      {hasFlexContent && <View style={styles.fill}>{children}</View>}
      {right && <View style={styles.rightSlot}>{right}</View>}
      {children && !right && <View style={styles.rightBalance} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    paddingHorizontal: Spacing.h.medium,
    height: Size.header,
  },
  title: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  fill: {
    flex: 1,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightBalance: {
    width: 48,
  },
});
