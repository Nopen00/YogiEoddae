#  Frontend

React Native (Expo) 기반 모바일 앱 프론트엔드입니다.

---

## 알려진 버그

| 화면 | 증상 | 비고 |
|------|------|------|
| ScheduleScreen / SettingScreen | 상단 뒤로가기 버튼 눌러도 이전 화면으로 미이동 | BottomTabBar `router.navigate()` 전환 후에도 미해결 |
| AccountScreen | 상단 뒤로가기 버튼 눌러도 설정 화면으로 미복귀 | `router.back()` / `router.navigate()` 모두 미작동 |

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
| `onBack` | `() => void` | 뒤로가기 콜백. 생략하면 백버튼이 표시되지 않음 (탭 화면 등) |
| `title` | `string` | 중앙 텍스트 타이틀 |
| `right` | `ReactNode` | 우측 커스텀 요소 (MoreButton 등) |
| `children` | `ReactNode` | 커스텀 중앙 요소 (MarqueeText 등) |
| `style` | `StyleProp<ViewStyle>` | 추가 스타일 (zIndex 등) |

---

## 디자인 시스템

모든 스타일 값은 아래 상수 파일에서 가져옵니다. 숫자 리터럴은 토큰으로 교체 불가한 경우(레이아웃 계산, 컴포넌트 전용 규격 등)에만 허용합니다.

### Colors (`constants/Colors.ts`)

`Colors.light.*` 를 사용합니다.

| 토큰 | 값 | 용도 |
|------|----|------|
| `primary` | `#1E9BAD` | 메인 포인트 색상, 활성 탭·선택 상태 |
| `secondary` | `#A8EDEE` | 연한 포인트 |
| `dark` | `#0F7A8A` | 깊은 포인트 (버튼 배경 등) |
| `black` | `#0C0C0C` | 기본 텍스트 |
| `white` | `#FFFFFF` | 카드·입력 배경 |
| `grayDark` | `#607073` | 부제목·설명·아이콘 |
| `grayLight` | `#D6D6D6` | 선·비활성화·플레이스홀더 |
| `error` | `#F24C54` | 에러·경고 |
| `heart` | `#F24C54` | 좋아요 하트 |
| `skyBlue` | `#33A7EA` | 보조 포인트 |
| `overlay` | `rgba(0,0,0,0.25)` | 모달 배경 딤 처리 |

### Typography (`constants/Typography.ts`)

폰트는 SUIT를 사용합니다. `...Typography.토큰` 스프레드로 적용합니다.

| 토큰 | 크기 | 굵기 | 용도 |
|------|------|------|------|
| `HeadLine5` | 24px | 800 | 화면 타이틀·카드 대제목 |
| `HeadLine7` | 24px | 700 | 헤더 타이틀 (일반) |
| `title1` | 20px | 700 | 섹션 제목·카드 이름 |
| `title2` | 18px | 700 | 서브 섹션 제목 |
| `subtitle1` | 14px | 600 | 부제목·메타 정보·탭 레이블 |
| `subtitle2` | 16px | 600 | 중간 강조 |
| `body1` | 12px | 500 | 보조 텍스트 |
| `body2` | 14px | 500 | 본문·태그·주소 |
| `body3` | 16px | 500 | 입력창 텍스트 |
| `button1` | 14px | 800 | 강조 버튼 레이블 |
| `button2` | 16px | 800 | 기본 버튼 레이블 |
| `button3` | 12px | 600 | 소형 버튼 레이블 |
| `button4` | 14px | 500 | 텍스트 버튼·링크 |

### Spacing (`constants/Spacing.ts`)

요소 **사이의 간격**(margin, padding, gap)에만 사용합니다. UI 요소 자체의 높이·너비는 `Size`를 사용합니다.

```
수직 (v)                  수평 (h)             모서리 (r)
v.small       =  8       h.xsmall =  4       r.xsmall =  4
v.medium      = 16       h.small  =  8       r.small  =  8
v.large24     = 24       h.medium = 16       r.medium = 16
v.large       = 32       h.large  = 24
v.xlarge      = 48       h.xlarge = 32
v.xxlarge     = 56
v.screenBottom = 32  ← 스크롤 가능한 화면의 하단 패딩 전용

선 두께 (lw)
lw.small  =  1
```

> **규칙:** 스크롤 가능한 화면(`ScrollView`, `FlatList`)의 `contentContainerStyle`에는 반드시 `paddingBottom: Spacing.v.screenBottom`을 적용합니다. 숫자 리터럴(`32`, `64` 등) 직접 사용 금지.

### Size (`constants/Size.ts`)

UI 요소 **자체의 크기**(width, height)에 사용합니다. Spacing과 개념이 다릅니다.

| 토큰 | 값 | 용도 |
|------|----|------|
| `buttonSm` | 40px | 소형 버튼 · BackButton 터치 타겟 |
| `buttonMd` | 48px | 기본 액션 버튼 (일정 추가, 다음 단계 등) |
| `header` | 56px | ScreenHeader · SearchBar 고정 높이 |
| `circleMd` | 48px | 원형 썸네일 직경 — `borderRadius: Size.circleMd / 2` |

### IconSize / IconStroke (`constants/IconSize.ts`)

| 토큰 | 값 | 용도 |
|------|----|------|
| `xsmall` | 16px | 인라인 아이콘 (평점·좋아요) |
| `medium` | 20px | 보조 버튼 아이콘 |
| `large` | 24px | 기본 아이콘 (헤더·버튼) |
| `xlarge` | 32px | 상세 화면 강조 아이콘 |
| `xxlarge` | 48px | 빈 상태 일러스트 아이콘 |

| 스트로크 | 값 | 용도 |
|---------|----|----|
| `thin` | 1.5 | xlarge 초과 아이콘 |
| `regular` | 2 | large 이하 아이콘 |
| `bold` | 2.5 | 뒤로가기 화살표 |

### 공통 레이블 상수 (`constants/labels.ts`)

API 데이터를 한국어로 변환하는 매핑 상수입니다. 각 화면에서 직접 선언하지 않고 여기서 import합니다.

| 내보내기 | 용도 |
|---------|------|
| `MEDIA_TYPE_LABEL` | `drama` → `드라마` 등 미디어 타입 변환 |
| `CATEGORY_LABEL` | `'12'` → `관광지` 등 장소 카테고리 변환 |
| `CITY_SHORT` | `서울특별시` → `서울` 등 시도 축약 |
| `shortAddress(address)` | 주소 문자열을 `시도 시군구` 2단계로 축약 |

---

## API 연동 (`services/`)

| 파일 | 설명 |
|------|------|
| `api.ts` | axios 기반 API 함수 모음 (`scheduleApi`, `mediaApi`, `placeApi`) |
| `types.ts` | 공통 타입 정의 (`Schedule`, `Media`, `Place`, `Tag` 등) |
| `mockData.ts` | 개발용 목 데이터 |
