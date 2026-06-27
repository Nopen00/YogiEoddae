// components/modals/ScheduleMoreMenuAlert.tsx
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

interface ScheduleMoreMenuAlertProps {
  onEditPress: () => void;
  onDeletePress: () => void;
}

export const ScheduleMoreMenuAlert = ({ onEditPress, onDeletePress }: ScheduleMoreMenuAlertProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuItem} onPress={onEditPress} activeOpacity={0.7}>
        <Pencil size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
        <Text style={styles.menuText}>수정하기</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity style={styles.menuItem} onPress={onDeletePress} activeOpacity={0.7}>
        <Trash2 size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
        <Text style={styles.menuText}>삭제하기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: IconSize.large + 16,
    right: 0,
    alignSelf: 'flex-start',
    minWidth: 130,
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.medium,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.small,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
      },
      android: { elevation: 30 },
    }),
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
