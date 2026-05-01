import { Colors } from '@/constants/Colors'; // 프로젝트 정의 색상 상수
import { Spacing } from '@/constants/Spacing'; // 프로젝트 정의 간격 상수
import { ArrowLeft } from 'lucide-react-native'; // 뒤로가기 화살표 아이콘 임포트
import React from 'react'; // React 라이브러리 임포트
import { StyleSheet, TouchableOpacity } from 'react-native'; // 터치 이벤트 및 스타일 생성을 위한 컴포넌트 임포트

// 컴포넌트 인터페이스 정의: 확장성을 위해 onPress와 선택적 color를 받음
interface BackButtonProps {
  onPress?: () => void; // 버튼 클릭 시 실행될 콜백 함수
  color?: string;       // 아이콘 색상 (기본값: Colors.light.black)
}

/**
 * 공통 뒤로가기 버튼 컴포넌트
 * @param onPress - 클릭 이벤트 핸들러
 * @param color - 아이콘 색상 커스텀
 */
const BackButton = ({ onPress, color = Colors.light.black }: BackButtonProps) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={styles.button} 
      activeOpacity={0.7} // 클릭 시 시각적 피드백 제공
    >
      <ArrowLeft 
        size={24}           // 디자인 가이드에 맞춘 아이콘 크기
        color={color}       // 전달받은 색상 적용
        strokeWidth={2.5}   // 아이콘 선 두께 설정
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,               // 터치 영역 확보를 위한 너비
    height: 40,              // 터치 영역 확보를 위한 높이
    justifyContent: 'center', // 아이콘 수직 중앙 정렬
    alignItems: 'center',    // 아이콘 수평 중앙 정렬
    marginRight: Spacing.h.small, // 인접 요소와의 기본 간격 설정
  },
});

export default BackButton;