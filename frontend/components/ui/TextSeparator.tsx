import { Colors } from '@/constants/Colors';
import React from 'react';
import { View } from 'react-native';

export function TextSeparator() {
  return (
    <View style={{ width: 1, height: 10, backgroundColor: Colors.light.grayLight, marginHorizontal: 4, alignSelf: 'center' }} />
  );
}
