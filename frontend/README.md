#  Frontend

React Native (Expo) 기반 모바일 앱 프론트엔드입니다.

## TODO

- 퀴즈 화면 구현 (MainScreen 퀴즈 버튼 연결 예정, 미구현)
- PlaceDetailScreen·CourseDetailScreen에 리뷰 리스트 UI 추가 (ReviewWriteScreen 작성 화면과 리뷰쓰기 버튼 연결은 완료됐고, PhotoSpotDetailScreen에는 리뷰 리스트가 있음. 하지만 PlaceDetailScreen·CourseDetailScreen에는 애초에 리뷰 리스트 UI 자체가 없어서, 작성한 리뷰를 보여줄 곳이 없음 — 리스트 UI 기획 필요)
- PlaceDetailScreen 지도 구현 (현재 빈 회색 박스, lat/lng 데이터는 존재)
- 포토태그 이미지 데이터 연동 (현재 태그 원형·필터 pill의 이미지는 회색 placeholder, 백엔드 태그 이미지 필드 필요)
- CourseScreen 포토스팟 탭을 실제 Photo 단위로 전환 (기획상 한 장소에 포토스팟이 여러 개 있을 수 있는 구조인데, 현재 `renderPhotoSpotCard`는 Place 단위로 그려짐 — 타이틀이 장소 이름, 이미지가 장소 대표 이미지. PhotoSpotDetailScreen은 이미 있고 탭 시 해당 장소의 대표 사진 id로 연결은 해뒀지만, 카드 자체는 여전히 장소 단위 데이터라 한 장소의 여러 포토스팟을 개별 카드로 보여주지 못함 — Photo 단위 카드로 전환 필요)

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
│   ├── index.tsx              # 온보딩 (4페이지 슬라이드 + 시작하기)
│   ├── MainScreen.tsx         # 메인 홈 (추천 코스·명소)
│   └── _layout.tsx            # 탭 네비게이션 레이아웃
├── SearchScreen.tsx           # 검색 진입
├── SearchResultScreen.tsx     # 검색 결과 (전체·코스·명소·포토스팟 탭)
├── CourseScreen.tsx           # 코스 탐색 (추천·유튜브/드라마/영화 PICK·포토스팟 탭)
├── CourseDetailScreen.tsx     # 코스 상세
├── PlaceDetailScreen.tsx      # 명소 상세
├── ScheduleDetailScreen.tsx   # 일정 상세 (슬라이딩 패널 + 지도)
├── ScheduleScreen.tsx         # 내 일정 / 과거 일정 / 저장소
├── SettingScreen.tsx          # 설정
└── AccountScreen.tsx          # 계정 관리
```

### 탭 화면 스와이프 전환 (`react-native-pager-view`)

상단 탭 바가 있는 화면(`CourseScreen`, `SearchResultScreen`, `ScheduleScreen`)은 탭 클릭뿐 아니라 좌우 스와이프로도 전환됩니다.

- 탭 콘텐츠는 `PagerView`의 페이지(`key="0"`, `"1"`, ...)로 분리되어 있고, 각 페이지가 독립된 `ScrollView`입니다.
- 탭 클릭은 `pagerRef.current?.setPage(index)`를 호출하고, 스와이프든 클릭이든 `onPageSelected`에서 `selectedIndex` 갱신과 탭 인디케이터 애니메이션을 동기화합니다.
- `PagerView`는 일반 `View`와 달리 자체 `style`의 `padding`을 반영하지 않으므로, 탭 바와 콘텐츠 사이 여백은 각 페이지 `ScrollView`의 `contentContainerStyle`에 둡니다 (`PagerView` 자체 스타일에 padding 금지).
- 탭이 화면 너비를 넘어가는 `CourseScreen`은 탭 전환 시 상단 탭 바도 선택된 탭이 보이도록 자동으로 가로 스크롤됩니다(`scrollTabIntoView`).
- 각 탭 내부의 가로 스크롤(코스 리스트, pick 카드 이미지 슬라이드 등)과 페이지 스와이프 제스처 충돌 여부는 실기기 확인 결과 문제 없음.

### 정렬 기능 (`SortAlert`, `utils/sortByOption.ts`)

`CourseScreen`·`SearchResultScreen`의 검색바 옆 정렬 버튼으로 진입하는 공용 정렬 팝업입니다.

- `components/modals/SortAlert.tsx`: 옵션 목록(`options`)과 선택 불가 옵션(`disabledOptions`, 회색 처리 + "(선택 불가)" 표기)을 props로 받는 범용 팝업.
- `utils/sortByOption.ts`: `SortOption`에 따라 배열을 정렬하는 공용 비교 함수. 화면마다 정렬 대상 배열에 적용.
- `CourseScreen`은 추천 탭에서 정렬 버튼 자체를 비활성화(회색)하고, 포토스팟 탭에서는 "장소 많은/적은 순" 옵션만 선택 불가 처리합니다.

### 포토스팟 카드 & 태그 필터 (`CourseScreen`)

포토스팟 탭은 2열 그리드 카드(`photoSpotCard`)로 구성됩니다.

- 카드 구조: 4:3 이미지(`photoSpotImageWrapper`, 하단 모서리 각짐) + 하단 정보 박스(`photoSpotInfoBox`, 타이틀·태그). 이미지 위에는 저장 하트 아이콘(우상단)과 별점·하트수(좌하단, 메인 화면 캐러셀과 동일한 하단 그라데이션 오버레이 위에 화이트 텍스트)가 겹쳐집니다.
- 저장 하트는 `placeApi.bookmark`/`unbookmark` + 로컬 상태(`savedPlaces`)로 토글되며, 저장 시 채워진 빨간 하트(`#F24C54`)로 바뀝니다.
- 상단 포토태그 목록(원형 아이템)을 탭하면 `selectedPhotoTag`가 설정되어 포토태그 박스가 알약형 필터 박스로 교체되고(`renderPhotoTagSection`), 포토스팟 그리드는 해당 태그를 가진 장소만(`filteredPlaces`)으로 필터링됩니다. 필터 박스의 X 아이콘으로 해제합니다.
- 전체 탭의 포토태그 박스도 동일한 선택 상태를 공유해 같이 알약형으로 바뀌지만, 실제 필터링은 포토스팟 탭에서만 동작합니다.

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
│   ├── CourseSelectPopup      # 코스 선택 팝업
│   ├── ScheduleEditNameAlert  # 일정 이름 수정 팝업 (편집 모드에서 제목 탭)
│   └── SortAlert              # 정렬 기준 선택 팝업 (CourseScreen·SearchResultScreen 공용)
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
| `star` | `#F2C94C` | 리뷰 별점 |
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

`utils/sortByOption.ts`는 화면 전반에서 재사용하는 정렬 비교 함수입니다 (위 정렬 기능 참고).
