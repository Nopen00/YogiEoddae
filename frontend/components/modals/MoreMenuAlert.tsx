// components/modals/MoreMenuAlert.tsx

import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Calendar,
  Star,
} from 'lucide-react-native';

import { SaveHeart16 } from '@/components/icons/SaveHeart';
import { UnSaveHeart16 } from '@/components/icons/UnSaveHeart';

import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

// ✅ props 인터페이스 추가
interface MoreMenuAlertProps {
  isSaved: boolean;
  onSavePress: () => void;
  onSchedulePress?: () => void;
}

export const MoreMenuAlert = ({ isSaved, onSavePress, onSchedulePress }: MoreMenuAlertProps) => {

  return (
    <View style={styles.alertContainer}>
      {/* 저장 */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onSavePress}
        activeOpacity={0.7}
      >
        {isSaved ? (
          <SaveHeart16 />
        ) : (
          <UnSaveHeart16 />
        )}
        <Text style={styles.menuText}>
          {isSaved ? '저장취소' : '저장하기'}
        </Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      {/* 일정추가 ✅ onSchedulePress 연결 */}
      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.7}
        onPress={onSchedulePress}
      >
        <Calendar
          size={IconSize.xsmall}
          color={Colors.light.black}
          strokeWidth={IconStroke.regular}
        />
        <Text style={styles.menuText}>
          일정추가
        </Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      {/* 리뷰쓰기 */}
      <TouchableOpacity
        style={styles.menuItem}
        activeOpacity={0.7}
      >
        <Star
          size={IconSize.xsmall}
          color={Colors.light.black}
          strokeWidth={IconStroke.regular}
        />
        <Text style={styles.menuText}>
          리뷰쓰기
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,

    position: 'absolute',
    top: Spacing.v.xlarge,
    right: Spacing.h.medium,

    paddingVertical: Spacing.v.small,
    paddingRight: Spacing.h.medium,
    zIndex: 9999,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 2,
      },
      android: {
        elevation: 30,
      },
    }),
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.h.medium,
    height: IconSize.large,
  },

  menuText: {
    marginLeft: Spacing.h.small,
    ...Typography.button4,
    color: Colors.light.black,
  },

  separator: {
    height: Spacing.lw.small,
    width: '100%',
    marginVertical: Spacing.v.small,
    backgroundColor: Colors.light.grayLight,
  },
});