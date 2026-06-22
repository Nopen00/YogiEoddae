import { IconSize, IconStroke } from '@/constants/IconSize';
import { Heart } from 'lucide-react-native';
import React from 'react';

export const SaveHeart16 = () => {
  return (
    <Heart
      size={IconSize.xsmall}
      color="#F24C54"
      fill="#F24C54"
      strokeWidth={IconStroke.regular}

    />
  );
};

export const SaveHeart24 = () => {
  return (
    <Heart
      size={IconSize.large}
      color="#F24C54"
      fill="#F24C54"
      strokeWidth={IconStroke.regular}

    />
  );
};

export const SaveHeart32 = () => {
  return (
    <Heart
      size={IconSize.xlarge}
      color="#F24C54"
      fill="#F24C54"
      strokeWidth={IconStroke.thin}

    />
  );
};