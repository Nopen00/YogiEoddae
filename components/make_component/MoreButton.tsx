import { Colors } from '@/constants/Colors'; // 색상 상수
import { MoreVertical } from 'lucide-react-native'; // 아이콘 임포트
import React from 'react'; // React 라이브러리 임포트
import { StyleSheet, TouchableOpacity } from 'react-native'; // Native 컴포넌트 임포트

interface MoreButtonProps {
  onPress?: () => void;
  color?: string;
}

// 🚀 Named Export: export const 형식을 사용합니다.
export const MoreButton = ({ onPress, color = Colors.light.black }: MoreButtonProps) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={styles.button} 
      activeOpacity={0.7} // 클릭 피드백
    >
      <MoreVertical size={24} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});