// constants/Colors.ts

const tintColorLight = '#41737C';

export const Colors = {
  light: {
    // 기본 배경 및 텍스트 (요청 사항 반영)
    background: '#FFFFFF',      // 메인 배경: White
    text: '#0C0C0C',            // 기본 글자색: Black

    // 기존 푸른색 포인트 컬러
    primary: '#41737C',         // 메인 푸른색
    secondary: '#C2F2F2',       // 연한 푸른색
    dark: '#356267',            // 깊은 푸른색
    tint: tintColorLight,
    
    // 추가된 무채색 계열
    black: '#0C0C0C',
    white: '#FFFFFF',
    grayDark: '#6B606D',        // 부제목/설명용 회색
    grayLight: '#D6D6D6',       // 선/비활성화용 회색

    // 아이콘 및 탭 바 관련
    icon: '#41737C',
    tabIconDefault: '#41737C',
    tabIconSelected: tintColorLight,
  },
  dark: {
    // 다크모드는 현재 배경과 텍스트를 반전시킨 기본값입니다.
    text: '#FFFFFF',
    background: '#0C0C0C',
    primary: '#C2F2F2',
    // ... 필요에 따라 추가 설정
  },
};