import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface DividerProps {
  marginTop?: number;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ marginTop = 16, style }: DividerProps) {
  return <View style={[styles.divider, { marginTop }, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: Colors.light.grayLight,
  },
});
