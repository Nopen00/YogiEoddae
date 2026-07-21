import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Heart } from 'lucide-react-native';
import React from 'react';

export const SaveHeart16 = () => {
  return (
    <Heart
      size={IconSize.xsmall}
      color={Colors.light.heart}
      fill={Colors.light.heart}
      strokeWidth={IconStroke.regular}

    />
  );
};

export const SaveHeart24 = () => {
  return (
    <Heart
      size={IconSize.large}
      color={Colors.light.heart}
      fill={Colors.light.heart}
      strokeWidth={IconStroke.regular}

    />
  );
};

export const SaveHeart32 = () => {
  return (
    <Heart
      size={IconSize.xlarge}
      color={Colors.light.heart}
      fill={Colors.light.heart}
      strokeWidth={IconStroke.thin}

    />
  );
};
