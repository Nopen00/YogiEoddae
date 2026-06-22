import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Heart } from 'lucide-react-native';
import React from 'react';

export const UnSaveHeart18 = () => {
  return (
    <Heart
      size={IconSize.small}
      color={Colors.light.black}
      fill="none"
      strokeWidth={IconStroke.regular}
    />
  );
};

export const UnSaveHeart24 = () => {
  return (
    <Heart
      size={IconSize.large}
      color={Colors.light.black}
      fill="none"
      strokeWidth={IconStroke.regular}
    />
  );
};

export const UnSaveHeart32 = () => {
  return (
    <Heart
      size={IconSize.xlarge}
      color={Colors.light.grayDark}
      fill="none"
      strokeWidth={IconStroke.thin}
    />
  );
};