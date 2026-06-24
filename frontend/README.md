#  Frontend

React Native (Expo) 기반 모바일 앱 프론트엔드입니다.

---

## 실행 방법

```bash
npm install
npm start        # Expo 개발 서버 시작
npm run android  # Android 실행
npm run ios      # iOS 실행
npm run web      # 웹 실행
```

---

## 화면 구조

```
app/
├── (tabs)/
│   ├── MainScreen.tsx         # 메인 홈 (추천 코스·명소)
│   ├── ScheduleScreen.tsx     # 내 일정 / 과거 일정 / 저장소
│   ├── SettingScreen.tsx      # 설정
│   └── _layout.tsx            # 탭 네비게이션 레이아웃
├── SearchScreen.tsx           # 검색 진입
├── SearchResultScreen.tsx     # 검색 결과 (코스·명소·포토스팟 탭)
├── CourseDetailScreen.tsx     # 코스 상세
├── PlaceDetailScreen.tsx      # 명소 상세
├── ScheduleDetailScreen.tsx   # 일정 상세 (슬라이딩 패널 + 지도)
└── AccountScreen.tsx          # 계정 관리
```

---

## 컴포넌트 구조

```
components/
├── ui/                  # 기본 UI 컴포넌트
│   ├── BackButton       # 뒤로가기 버튼
│   ├── MoreButton       # 더보기 버튼 (⋮)
│   ├── ScreenHeader     # 화면 상단 헤더
│   ├── SearchBar        # 검색 입력창
│   ├── Divider          # 가로 구분선 (height: 1, grayLight)
│   ├── TextSeparator    # 인라인 세로 구분선 (width: 1, height: 10)
│   ├── MetaRow          # 메타 정보 가로 줄 (평점·좋아요·카테고리 등)
│   └── TagRow           # 해시태그 가로 줄 (flexWrap)
├── modals/              # 팝업 및 알림
│   ├── MoreMenuAlert          # 저장/일정추가 드롭다운 메뉴
│   ├── ScheduleAlert          # 일정 선택 팝업
│   ├── NewScheduleAlert       # 일정 만들기 스텝 1 (제목·날짜)
│   ├── NewScheduleStep2Alert  # 일정 만들기 스텝 2 (코스 선택)
│   ├── NewScheduleStep3Alert  # 일정 만들기 스텝 3 (최종 확인)
│   └── CourseSelectPopup      # 코스 선택 팝업
├── navigation/          # 네비게이션
│   └── BottomTabBar     # 커스텀 하단 탭 바
└── icons/               # 커스텀 아이콘
    ├── SaveHeart        # 저장 하트 아이콘 (16px, 32px)
    └── UnSaveHeart      # 미저장 하트 아이콘 (16px, 32px)
```

### ScreenHeader Props

| Prop | 타입 | 설명 |
|------|------|------|
| `onBack` | `() => void` | 뒤로가기 콜백 (필수) |
| `title` | `string` | 중앙 텍스트 타이틀 |
| `right` | `ReactNode` | 우측 커스텀 요소 (MoreButton 등) |
| `children` | `ReactNode` | 커스텀 중앙 요소 (MarqueeText 등) |
| `style` | `StyleProp<ViewStyle>` | 추가 스타일 (zIndex 등) |

---

## 디자인 시스템

### Colors (`constants/Colors.ts`)

| 토큰 | 값 | 용도 |
|------|----|------|
| `primary` | `#1E9BAD` | 메인 포인트 색상 |
| `secondary` | `#A8EDEE` | 연한 포인트 |
| `dark` | `#0F7A8A` | 깊은 포인트 |
| `black` | `#0C0C0C` | 기본 텍스트 |
| `grayDark` | `#607073` | 부제목·설명 텍스트 |
| `grayLight` | `#D6D6D6` | 선·비활성화 |
| `white` | `#FFFFFF` | 배경 |

### Typography (`constants/Typography.ts`)

| 토큰 | 크기 | 굵기 | 용도 |
|------|------|------|------|
| `HeadLine5` | 24px | 800 | 화면 타이틀 |
| `title1` | 20px | 700 | 섹션 제목 |
| `title2` | 18px | 700 | 카드 제목 |
| `subtitle1` | 14px | 600 | 부제목·메타 정보 |
| `subtitle2` | 16px | 600 | 중간 강조 |
| `body2` | 14px | 500 | 본문·태그 |
| `body3` | 16px | 500 | 입력 텍스트 |
| `button4` | 14px | 500 | 텍스트 버튼 |

### Spacing (`constants/Spacing.ts`)

```
v.small   = 8     h.xsmall = 4
v.medium  = 16    h.small  = 8
v.large   = 32    h.medium = 16
v.xlarge  = 48    h.large  = 24
v.xxlarge = 56    h.xlarge = 32
r.small   = 8     (border-radius)
r.medium  = 16
```

---

## API 연동 (`services/`)

| 파일 | 설명 |
|------|------|
| `api.ts` | axios 기반 API 함수 모음 (`scheduleApi`, `mediaApi`, `placeApi`) |
| `types.ts` | 공통 타입 정의 (`Schedule`, `Media`, `Place`, `Tag` 등) |
| `mockData.ts` | 개발용 목 데이터 |
