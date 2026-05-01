import { Colors } from '@/constants/Colors'; // 프로젝트 공통 색상 상수
import { Spacing } from '@/constants/Spacing'; // 프로젝트 공통 간격 상수
import { ArrowLeft } from 'lucide-react-native'; // 화살표 아이콘 임포트
import React from 'react'; // React 라이브러리 임포트
import { StyleSheet, TouchableOpacity } from 'react-native'; // 리액트 네이티브 기본 컴포넌트 임포트

// 컴포넌트에서 받을 프로퍼티(Props) 정의
interface BackButtonProps {
  onPress?: () => void; // 클릭 시 실행될 함수
  color?: string;       // 필요한 경우 아이콘 색상 커스텀
}

const BackButton = ({ onPress, color = Colors.light.black }: BackButtonProps) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={styles.button} 
      activeOpacity={0.7} // 클릭 시 불투명도 효과 추가
    >
      <ArrowLeft 
        size={24}           // 아이콘 크기 설정
        color={color}       // 전달받은 색상 혹은 기본 검정색 적용
        strokeWidth={2.5}   // 선 굵기 조절
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 32,              // 클릭 영역 확보를 위한 너비
    height: 32,             // 클릭 영역 확보를 위한 높이
    justifyContent: 'center', // 아이콘 수직 중앙 정렬
    alignItems: 'center',    // 아이콘 수평 중앙 정렬
    marginRight: Spacing.h.small, // 기존 SearchBar 레이아웃 유지를 위한 우측 간격
  },
});

export default BackButton;