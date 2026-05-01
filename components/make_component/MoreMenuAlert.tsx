import { Colors } from '@/constants/Colors'; // 색상 상수
import { Spacing } from '@/constants/Spacing'; // 🚀 간격 상수 추가
import { Typography } from '@/constants/Typography'; // 타이포그래피 상수
import { Calendar, Heart, Star } from 'lucide-react-native'; // 아이콘 임포트
import React from 'react'; // React 라이브러리 임포트
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Native UI 컴포넌트 임포트

export const MoreMenuAlert = () => {
  const MenuItem = ({ Icon, label }: { Icon: any; label: string }) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
      <Icon size={18} color={Colors.light.black} strokeWidth={2} /> 
      <Text style={styles.menuText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.alertContainer}>
      <MenuItem Icon={Heart} label="저장하기" />
      <View style={styles.separator} />
      
      <MenuItem Icon={Calendar} label="일정추가" />
      <View style={styles.separator} />
      
      <MenuItem Icon={Star} label="리뷰쓰기" />
    </View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    width: 107,
    height: 122, // 이전 단계에서 계산된 높이 유지
    backgroundColor: Colors.light.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    position: 'absolute',
    top: 48, // 버튼 하단 8pt 위치
    
    right: Spacing.h.medium, 
    
    paddingTop: 8,
    zIndex: 100,
    ...Platform.select({
      ios: { 
        shadowColor: Colors.light.black, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 4 
      },
      android: { elevation: 4 },
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
    backgroundColor: Colors.light.grayLight,
    marginVertical: 8,
    width: '100%',
  },
});