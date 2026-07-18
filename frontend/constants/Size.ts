// constants/Size.ts
// Spacing.v/h 는 요소 사이의 간격(gap)이고, Size 는 UI 요소 자체의 크기입니다.

export const Size = {
  buttonSm: 40,  // 소형 버튼 · 터치 타겟 (BackButton, 팝업 확인/취소 버튼)
  buttonMd: 48,  // 기본 액션 버튼 (일정 추가, 다음 단계 등)
  header: 56,    // ScreenHeader · SearchBar 고정 높이
  circleMd: 48,  // 원형 썸네일 직경 — borderRadius: Size.circleMd / 2
  avatarLg: 50,  // MY 페이지 유저 프로필 이미지 직경
  avatarXl: 100, // 내 정보 화면 프로필 이미지 직경
  thumbSquare: 86, // 리스트 카드용 정사각 썸네일 (코스/장소/일정 상세)
  reviewUpload: 90, // 리뷰 작성 화면 업로드 그리드 정사각 썸네일
  reviewThumbW: 120, // 리뷰 카드 표시용 썸네일 너비 (고정, 가로 스크롤 나열용이라 반응형 미적용)
  reviewThumbH: 90,  // 리뷰 카드 표시용 썸네일 높이
};
