import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Spacing } from '@/constants/Spacing';

interface TagRowProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TagRow({ children, style }: TagRowProps) {
  return <View style={[styles.tagRow, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.h.xsmall,
    marginTop: Spacing.v.small,
  },
});
