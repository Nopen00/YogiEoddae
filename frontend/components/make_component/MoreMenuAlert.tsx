// components/make_component/MoreMenuAlert.tsx

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

import { SaveHeart18 } from '@/components/make_component/icons/SaveHeart';
import { UnSaveHeart18 } from '@/components/make_component/icons/UnSaveHeart';

import { Colors } from '@/constants/Colors';
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
          <SaveHeart18 />
        ) : (
          <UnSaveHeart18 />
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
          size={18}
          color={Colors.light.black}
          strokeWidth={2}
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
          size={18}
          color={Colors.light.black}
          strokeWidth={2}
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
    width: 107,
    height: 122,

    backgroundColor: Colors.light.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,

    position: 'absolute',
    top: 48,
    right: Spacing.h.medium,

    paddingTop: 8,
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
    paddingLeft: 16,
    height: 24,
  },

  menuText: {
    marginLeft: 8,
    ...Typography.button4,
    color: Colors.light.black,
  },

  separator: {
    height: 1,
    width: '100%',
    marginVertical: 8,
    backgroundColor: Colors.light.grayLight,
  },
});