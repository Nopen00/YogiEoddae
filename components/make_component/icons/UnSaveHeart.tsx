import { Colors } from '@/constants/Colors';
import { Heart } from 'lucide-react-native';
import React from 'react';

export const UnSaveHeart = () => {
  return (
    <Heart
      size={18}
      color={Colors.light.black}
      fill="none"
      strokeWidth={2}
    />
  );
};