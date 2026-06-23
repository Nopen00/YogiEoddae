// components/make_component/CourseSelectPopup.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { ArrowLeft, X } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CourseSelectPopupProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
}

export const CourseSelectPopup = ({ visible, onClose, onBack }: CourseSelectPopupProps) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <ArrowLeft size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
      </TouchableOpacity>
      <Text style={styles.text}>일정으로 가져올 코스를 선택하세요.</Text>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.h.medium,
    right: Spacing.h.medium,
    bottom: Spacing.v.large,
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  text: {
    flex: 1,
    ...Typography.subtitle2,
    color: Colors.light.black,
    textAlign: 'center',
  },
});
