import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Spacing } from '@/constants/Spacing';

interface MetaRowProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function MetaRow({ children, style }: MetaRowProps) {
  return <View style={[styles.metaRow, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
  },
});
