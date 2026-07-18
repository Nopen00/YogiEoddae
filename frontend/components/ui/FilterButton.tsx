import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Filter } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface FilterButtonProps {
  onPress?: () => void;
  color?: string;
}

export const FilterButton = ({ onPress, color = Colors.light.black }: FilterButtonProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button} activeOpacity={0.7}>
      <Filter size={IconSize.large} color={color} strokeWidth={IconStroke.regular} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: Size.buttonSm,
    height: Size.buttonSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
