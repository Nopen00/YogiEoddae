// components/modals/MoreMenuAlert.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SaveHeart24 } from '@/components/icons/SaveHeart';
import { UnSaveHeart24 } from '@/components/icons/UnSaveHeart';
import { AlertTriangle, Calendar, Edit2, Star } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

interface MoreMenuAlertProps {
  isSaved: boolean;
  onSavePress: () => void;
  onSchedulePress?: () => void;
  isToggled?: boolean;
  onTogglePress?: () => void;
  isToggleLocked?: boolean;
  onReportPress?: () => void;
  onEditPress?: () => void;
}

export const MoreMenuAlert = ({ isSaved, onSavePress, onSchedulePress, isToggled, onTogglePress, isToggleLocked, onReportPress, onEditPress }: MoreMenuAlertProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuItem} onPress={onSavePress} activeOpacity={0.7}>
        {isSaved ? <SaveHeart24 /> : <UnSaveHeart24 />}
        <Text style={styles.menuText}>{isSaved ? '저장취소' : '저장하기'}</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity style={styles.menuItem} onPress={onSchedulePress} activeOpacity={0.7}>
        <Calendar size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
        <Text style={styles.menuText}>일정추가</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
        <Star size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
        <Text style={styles.menuText}>리뷰쓰기</Text>
      </TouchableOpacity>

      {onTogglePress && (
        <>
          <View style={styles.separator} />
          <TouchableOpacity style={[styles.menuItem, isToggleLocked && styles.menuItemLocked]} onPress={onTogglePress} activeOpacity={0.7}>
            <View style={[styles.togglePill, { backgroundColor: isToggled ? Colors.light.primary : Colors.light.grayLight }]}>
              <View style={[styles.toggleCircle, { left: isToggled ? 26 : 2 }]} />
            </View>
            <Text style={styles.menuText}>{isToggled ? '카카오' : '관광공사'}</Text>
          </TouchableOpacity>
        </>
      )}

      {onEditPress ? (
        <>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={onEditPress} activeOpacity={0.7}>
            <Edit2 size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
            <Text style={styles.menuText}>수정하기</Text>
          </TouchableOpacity>
        </>
      ) : onReportPress && (
        <>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={onReportPress} activeOpacity={0.7}>
            <AlertTriangle size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
            <Text style={styles.menuText}>신고하기</Text>
          </TouchableOpacity>
        </>
      )}
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
  menuItemLocked: {
    opacity: 0.4,
  },
  separator: {
    height: Spacing.lw.small,
    backgroundColor: Colors.light.grayLight,
    marginHorizontal: -Spacing.h.medium,
    marginVertical: Spacing.v.small,
  },
  togglePill: {
    width: 48,
    height: 24,
    borderRadius: 12,
  },
  toggleCircle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.white,
    top: 2,
  },
});
