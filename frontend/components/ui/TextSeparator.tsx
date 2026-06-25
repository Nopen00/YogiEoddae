import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import React from 'react';
import { View } from 'react-native';

export function TextSeparator() {
  return (
    <View style={{ width: Spacing.lw.small, height: 10, backgroundColor: Colors.light.grayLight, marginHorizontal: Spacing.h.xsmall, alignSelf: 'center' }} />
  );
}
