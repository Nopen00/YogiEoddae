// components/modals/ProfileImageMenuAlert.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

interface ProfileImageMenuAlertProps {
  onEditPress: () => void;
  // 현재 프로필 사진이 없으면 지울 게 없으므로 undefined로 넘겨서 항목 자체를 숨긴다.
  onDeletePress?: () => void;
}

export const ProfileImageMenuAlert = ({ onEditPress, onDeletePress }: ProfileImageMenuAlertProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuItem} onPress={onEditPress} activeOpacity={0.7}>
        <Pencil size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
        <Text style={styles.menuText}>수정하기</Text>
      </TouchableOpacity>

      {onDeletePress && (
        <>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={onDeletePress} activeOpacity={0.7}>
            <Trash2 size={IconSize.large} color={Colors.light.error} strokeWidth={IconStroke.regular} />
            <Text style={[styles.menuText, { color: Colors.light.error }]}>삭제하기</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: Spacing.v.small,
    minWidth: 130,
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.medium,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.small,
    zIndex: 9999,
    ...Shadows.dropdown,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.h.small,
  },
  menuText: {
    ...Typography.button4,
    color: Colors.light.black,
  },
  separator: {
    height: Spacing.lw.small,
    backgroundColor: Colors.light.grayLight,
    marginHorizontal: -Spacing.h.medium,
    marginVertical: Spacing.v.small,
  },
});
