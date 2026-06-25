import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
}

export const BackButton = ({ onPress, color = Colors.light.black }: BackButtonProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button} activeOpacity={0.7}>
      <ArrowLeft size={IconSize.large} color={color} strokeWidth={IconStroke.bold} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.h.small,
  },
});
