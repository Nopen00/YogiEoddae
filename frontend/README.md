#  Frontend

React Native (Expo) 기반 모바일 앱 프론트엔드입니다.

## TODO

- [x] **Photo에 `travel_date`/`content` 필드 (백엔드 완료 2026-07-23)** — 백엔드 `Photo` 모델에 두 필드 모두 추가되고 `PhotoSerializer`/업로드·수정 API에도 반영됨. **프론트 할 일**: `services/api.ts`의 mock 우회 코드(`travel_date`/`content` 관련) 제거하고 실 API 응답 그대로 사용하도록 정리.
- [ ] **포토스팟 업로더 프로필(아바타) 실 연동 (백엔드 대기)** — `author`(닉네임)는 연동 완료(아래 항목 참고)했지만 아바타는 아직. `User` 모델에 프로필 이미지 필드 자체가 없어서, 아래 이미지 업로드 파이프라인이 실전 검증되면 같은 방식으로 avatar 필드 추가 예정. 그때까지 프론트는 mock 전역 상태(`mockProfileImage`)로 `authorAvatar`를 흉내내는 것 유지.
- [x] **`photoApi.getList`의 `author` 필터 / `photoApi.getMine` (백엔드 완료 2026-07-23)** — `GET /api/photos/?author=닉네임` 필터와 `GET /api/photos/mine/` 엔드포인트 신규 추가됨. `PhotoSerializer`에 `author`(닉네임), `isMine` 필드도 추가돼서 `photo.author`/`photo.isMine`이 실제로 값이 옴. **프론트 할 일**: 없음, 그대로 쓰면 됨.
- [ ] **포토스팟 이미지 실제 업로드 파이프라인 연결 (백엔드 완료, 프론트 작업 필요, 2026-07-23)** — 지금 `PhotoSpotWriteScreen`의 `handlePickMainImage`/`handlePickExtraImages`가 `ImagePicker` 결과의 로컬 기기 URI(`result.assets[0].uri`)를 그대로 `image_url`로 서버에 보내고 있어서, 서버(AI 검열 포함)가 그 이미지에 접근할 수 없음. 백엔드에 `POST /api/photos/upload-image/`(multipart, JWT, 필드명 `image`) 엔드포인트가 새로 생겼으니, `handleCreate` 제출 시점에 `mainImage`/`extraImages` uri들을 이 엔드포인트로 먼저 업로드해서 받은 `image_url`들로 교체한 뒤 `photoApi.upload`를 호출하도록 수정. 업로드 여러 장이라 제출 버튼에 로딩 표시 고려.
- [ ] **코스 상세화면 4탭 리디자인** — 저장/일정추가 버튼 이미지 오버레이화 + 탭 스와이프. 백엔드 논의 전까지 착수 보류.
- [ ] **포토스팟 인기순 정렬(백엔드 로드맵 Phase 8)** — 백엔드 미착수. 완료되면 `CourseScreen`/`SearchResultScreen` 정렬 옵션에 연결.


---

## 실행 방법

```bash
npm install
npm start        # Expo 개발 서버 시작
npm run android  # Android 실행
npm run ios      # iOS 실행
npm run web      # 웹 실행
```

`.env`는 git에 커밋되지 않으므로 각자 로컬에 아래 값을 채워야 합니다.

```
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_USE_MOCK=
EXPO_PUBLIC_KAKAO_JS_KEY=   # PlaceDetailScreen 카카오맵 표시용. backend/.env의 KAKAO_JS_KEY와 동일한 값
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
├── PlaceDetailScreen.tsx      # 명소 상세 (카카오맵 포함)
├── PhotoSpotDetailScreen.tsx  # 포토스팟 상세 (장소·태그별 관련 포토스팟, 리뷰 목록, 업로더 프로필)
├── PhotoSpotWriteScreen.tsx   # 포토스팟 작성/수정 (제목·태그·장소·설명·부사진)
├── PhotoSpotManageScreen.tsx  # 내가 작성한 포토스팟 관리 (수정/삭제)
├── UserPhotoSpotsScreen.tsx   # 특정 유저가 작성한 포토스팟 목록 (업로더 프로필 카드에서 진입)
├── ReviewWriteScreen.tsx      # 리뷰 작성/수정 (별점·방문일·사진 첨부)
├── ReviewManageScreen.tsx     # 내가 작성한 리뷰 관리 (수정/삭제)
├── ScheduleDetailScreen.tsx   # 일정 상세 (슬라이딩 패널 + 지도)
├── ScheduleScreen.tsx         # 내 일정 / 과거 일정 / 저장소
├── SettingScreen.tsx          # 설정 (MY 탭)
├── AccountScreen.tsx          # 계정 관리 (내 정보)
└── TokenChargeScreen.tsx      # 토큰 충전 (광고 시청 쿨타임, 인앱결제 데모)
```

### 탭 화면 스와이프 전환 (`react-native-pager-view`)

상단 탭 바가 있는 화면(`CourseScreen`, `SearchResultScreen`, `ScheduleScreen`)은 탭 클릭뿐 아니라 좌우 스와이프로도 전환됩니다.

- 탭 콘텐츠는 `PagerView`의 페이지(`key="0"`, `"1"`, ...)로 분리되어 있고, 각 페이지가 독립된 `ScrollView`입니다.
- 탭 클릭은 `pagerRef.current?.setPage(index)`를 호출하고, 스와이프든 클릭이든 `onPageSelected`에서 `selectedIndex` 갱신과 탭 인디케이터 애니메이션을 동기화합니다.
- `PagerView`는 일반 `View`와 달리 자체 `style`의 `padding`을 반영하지 않으므로, 탭 바와 콘텐츠 사이 여백은 각 페이지 `ScrollView`의 `contentContainerStyle`에 둡니다 (`PagerView` 자체 스타일에 padding 금지).
- 탭이 화면 너비를 넘어가는 `CourseScreen`은 탭 전환 시 상단 탭 바도 선택된 탭이 보이도록 자동으로 가로 스크롤됩니다(`scrollTabIntoView`).
- 각 탭 내부의 가로 스크롤(코스 리스트, pick 카드 이미지 슬라이드 등)과 페이지 스와이프 제스처 충돌 여부는 실기기 확인 결과 문제 없음.

### 정렬 기능 (`SortAlert`, `utils/sortByOption.ts`)

`CourseScreen`·`SearchResultScreen`의 검색바 옆 정렬 버튼, `UserPhotoSpotsScreen`의 헤더 정렬 버튼으로 진입하는 공용 정렬 팝업입니다.

- `components/modals/SortAlert.tsx`: 옵션 목록(`options`)과 선택 불가 옵션(`disabledOptions`, 회색 처리 + "(선택 불가)" 표기)을 props로 받는 범용 팝업. `options`를 좁혀서 넘기면 그 화면에 맞는 정렬 기준만 노출할 수 있습니다 (예: `UserPhotoSpotsScreen`은 "이름순·별점 높은 순·하트 많은 순" 3개만 사용).
- `utils/sortByOption.ts`: `SortOption`에 따라 배열을 정렬하는 공용 비교 함수. 화면마다 정렬 대상 배열에 적용.
- `CourseScreen`은 추천 탭에서 정렬 버튼 자체를 비활성화(회색)하고, `CourseScreen`·`SearchResultScreen` 모두 포토스팟 탭에서는 "장소 많은/적은 순" 옵션만 선택 불가 처리합니다.

### 포토스팟 카드 & 태그 필터 (`CourseScreen`)

포토스팟 탭은 2열 그리드 카드(`photoSpotCard`)로 구성되고, **장소(Place) 단위가 아니라 개별 사진(Photo) 단위**로 카드가 그려집니다 — `placeApi.getList()`로 가져온 모든 장소마다 `placeApi.getPhotos(placeId)`를 호출해 사진을 전부 펼친(`flat`) 뒤 사진 하나당 카드 하나(`photoSpots` state)를 만듭니다. 즉 사진이 2장인 장소는 카드 2개로 보입니다.

- 카드 구조: 4:3 이미지(`photoSpotImageWrapper`, 하단 모서리 각짐) + 하단 정보 박스(`photoSpotInfoBox`, 타이틀·태그). 이미지 위에는 저장 하트 아이콘(우상단)과 별점·하트수(좌하단, 메인 화면 캐러셀과 동일한 하단 그라데이션 오버레이 위에 화이트 텍스트)가 겹쳐집니다.
- 카드에 쓰이는 타이틀·태그·평점·좋아요 수는 모두 **사진(Photo) 자체의 데이터**입니다 — 타이틀은 `photo.description`, 태그는 `photo.tags`(장소 태그와 별개), 좋아요 수는 `photo.likes`, 평점은 `photo.rating`(백엔드에서 해당 포토스팟 리뷰 평점 평균으로 계산, 리뷰 없으면 `null` → 0으로 표시).
- 저장 하트는 `photoApi.bookmark`/`unbookmark` + 로컬 상태(`savedPhotos`)로 토글되며, 저장 시 채워진 빨간 하트(`#F24C54`)로 바뀌고 좋아요 수도 즉시 ±1 반영됩니다.
- 상단 포토태그 목록(원형 아이템)을 탭하면 `selectedPhotoTag`가 설정되어 포토태그 박스가 알약형 필터 박스로 교체되고(`renderPhotoTagSection`), 포토스팟 그리드는 해당 태그를 가진 사진만(`filteredPhotoSpots`, `photo.tags` 기준)으로 필터링됩니다. 필터 박스의 X 아이콘으로 해제합니다.
- 전체 탭의 포토태그 박스도 동일한 선택 상태를 공유해 같이 알약형으로 바뀌지만, 실제 필터링은 포토스팟 탭에서만 동작합니다.
- 카드 탭 시 `photo.id`로 바로 `PhotoSpotDetailScreen`에 연결됩니다.

### 포토스팟 작성/수정/관리 (`PhotoSpotWriteScreen`, `PhotoSpotManageScreen`, `UserPhotoSpotsScreen`)

`CourseScreen` 포토스팟 탭의 FAB로 진입하는 작성 화면과, 이를 관리·열람하는 화면들입니다.

- **작성** (`PhotoSpotWriteScreen`, `id` 파라미터 없음): 메인 이미지, 제목, 태그(`TagAddAlert` 팝업으로 추가, 알약형 칩 + X로 제거), 장소(`PlaceSelectAlert`로 검색·선택, 필수), 방문 날짜, 설명(`content`), 부사진(최대 10장, 선택)을 입력받습니다. 작성 완료 버튼은 메인 이미지·제목·태그 1개 이상·장소·설명(10자 이상)이 모두 채워져야 활성화됩니다.
- **수정** (`PhotoSpotWriteScreen?id=...`): 기존 값을 프리필하되 **사진(메인/부사진)은 변경 불가**(텍스트 필드만 수정 가능, 사진 추가를 시도하면 안내 팝업). 상세화면 "더보기" 메뉴는 본인 포토스팟이면 "신고하기" 대신 "수정하기"를 보여줍니다(`MoreMenuAlert`의 `onEditPress`).
- **관리** (`PhotoSpotManageScreen`): `ReviewManageScreen`과 동일한 레이아웃으로 내가 작성한 포토스팟을 나열하고, 카드별 더보기(`ScheduleMoreMenuAlert` 재사용)로 수정/삭제.
- **업로더 프로필 목록** (`UserPhotoSpotsScreen`): 포토스팟 상세화면의 업로더 프로필 카드를 누르면 이동. 헤더에 정렬 버튼이 있고, 프로필(아바타·닉네임·작성 개수) 아래 구분선, 그 아래 해당 유저가 작성한 포토스팟(이미지·명칭·별점·하트수·태그)이 나열됩니다. `photoApi.getList({ author })`로 조회(mock 전용, 위 TODO 참고).
- **태그 간략화**: 카드에 태그가 많으면 3개까지만 보여주고 나머지는 `+n`으로 표시하는 로직이 `utils/getProcessedTags.ts`로 공용화되어 있습니다 (`CourseScreen`·`SearchResultScreen`·`PhotoSpotManageScreen`·`UserPhotoSpotsScreen`에서 사용).

### 리뷰 작성/수정 (`ReviewWriteScreen`, `VisitDateAlert`)

`PlaceDetailScreen`·`CourseDetailScreen`·`PhotoSpotDetailScreen`의 "리뷰쓰기" 버튼과 `PhotoSpotDetailScreen`의 "리뷰 작성" 버튼, 그리고 `ReviewCard`의 "수정" 버튼이 모두 `ReviewWriteScreen`으로 연결됩니다 (`params: { type, id, reviewId? }`, `reviewId`가 있으면 수정 모드).

- **별점**: `react-native-gesture-handler`의 `Gesture.Pan`으로 별 5개 영역을 드래그하면 터치 x좌표 기준으로 실시간 채워집니다 (`minDistance(0)`이라 탭만 해도 동작).
- **방문 날짜**: 날짜 행을 탭하면 `VisitDateAlert`가 뜹니다. `NewScheduleAlert`(일정 만들기 달력)와 동일한 달력 UI를 재사용하되, 범위 드래그 선택 로직은 빼고 한 칸 탭으로 단일 날짜만 고르도록 단순화한 컴포넌트입니다. 월 스크롤 피커(`MonthPickerRow`)는 `NewScheduleAlert`에서 export해서 그대로 씁니다.
- **이미지 첨부**: `expo-image-picker`로 최대 10장까지 첨부/삭제 가능. 90×90 정사각형 썸네일이 가로 스크롤로 나열됩니다.
- **수정 모드 프리필**: `reviewApi.getDetail(reviewId)`로 기존 별점·내용·이미지·방문일을 불러와 폼에 채웁니다.
- **미저장 경고**: 뒤로가기 시 처음 불러온 값(수정 모드) 또는 빈 값(새 작성)과 현재 값을 비교해 변경사항이 있으면 `ScheduleDetailScreen`과 동일한 형식의 경고 팝업이 뜹니다.
- 리뷰 데이터는 대상(장소/코스/포토스팟)별로 `reviewApi`(`getList`/`getMine`/`getDetail`/`create`/`update`/`remove`, 모두 `type` 인자를 받음)로 관리됩니다. `ReviewCard`가 `review.isMine`이면 "수정"/"삭제" 버튼을 노출하고, 삭제는 `ScheduleDetailScreen`의 일정 삭제 팝업과 동일한 형식의 확인 팝업을 거칩니다. mock 경로는 편의상 전체 대상이 공유하는 단일 배열(`mockData.ts`의 `mockReviewStore`)에 `target: { type, id }`로 필터를 걸어 흉내냅니다.
- **신고** (`ReportReviewAlert`): `ReviewCard`의 "신고" 버튼과 포토스팟 상세화면의 "더보기 → 신고하기"가 공유하는 팝업. 사유 선택(사진 포함 여부 등 알약형 체크박스 + "기타" 자유 입력) → "정말 신고하시겠습니까?" 확인 → "신고가 접수되었습니다." 완료까지 3단계.
- **관리** (`ReviewManageScreen`): "MY → 작성한 리뷰 관리"에서 대상별(장소/코스/포토스팟) 탭으로 내가 쓴 리뷰를 모아보고, 카드에서 바로 수정/삭제.

### 카카오맵 (`PlaceDetailScreen`, `components/ui/KakaoMap`)

`PlaceDetailScreen`의 "기본 정보" 지도는 카카오맵 JS SDK를 웹뷰에 띄우는 방식입니다.

- `react-native-webview`가 웹을 지원하지 않아서, `KakaoMap.tsx`(네이티브, `WebView` 사용)와 `KakaoMap.web.tsx`(웹, `iframe` + `srcDoc` 직접 렌더링) 두 파일로 플랫폼을 분리했습니다. Metro가 파일명의 `.web.tsx`를 보고 자동으로 웹 빌드에서는 `KakaoMap.web.tsx`를 선택합니다.
- HTML 생성 로직(카카오맵 SDK 스크립트 + 마커 + 인포윈도우)은 `kakaoMapHtml.ts`에 공용으로 있습니다.
- 카카오 JS 키는 `EXPO_PUBLIC_KAKAO_JS_KEY` 환경변수로 주입됩니다(`backend/.env`의 `KAKAO_JS_KEY`와 동일한 값). **카카오 디벨로퍼스 콘솔의 Web 플랫폼 도메인 허용 목록에 테스트 도메인이 등록돼 있어야** 지도가 뜹니다 — 안 되어 있으면 401로 지도 스크립트 로드가 실패합니다.

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
│   ├── TagRow           # 해시태그 가로 줄 (flexWrap)
│   ├── ReviewCard       # 리뷰 카드 (별점·내용·이미지·좋아요, 내 리뷰면 수정/삭제)
│   ├── PagerViewWrapper # 탭 스와이프용 PagerView 웹 호환 래퍼 (.native.tsx로 네이티브 분리)
│   └── KakaoMap         # 카카오맵 (.tsx=네이티브 WebView, .web.tsx=iframe, kakaoMapHtml.ts=공용 HTML)
├── modals/              # 팝업 및 알림
│   ├── MoreMenuAlert          # 저장/일정추가 드롭다운 메뉴 (isMine 여부에 따라 신고하기/수정하기 중 하나만 노출)
│   ├── ReportReviewAlert      # 리뷰·포토스팟 신고 팝업 (사유 선택 → 확인 → 접수 완료 3단계)
│   ├── ScheduleAlert          # 일정 선택 팝업
│   ├── ScheduleMoreMenuAlert  # 카드 더보기 메뉴 (편집/삭제, 일정·포토스팟 관리 화면 공용)
│   ├── NewScheduleAlert       # 일정 만들기 스텝 1 (제목·날짜, 달력 UI를 VisitDateAlert와 공유)
│   ├── NewScheduleStep2Alert  # 일정 만들기 스텝 2 (코스 선택)
│   ├── NewScheduleStep3Alert  # 일정 만들기 스텝 3 (최종 확인)
│   ├── VisitDateAlert         # 리뷰 작성용 단일 날짜 선택 팝업 (NewScheduleAlert 달력 단순화)
│   ├── AddPlaceAlert          # 장소 추가 팝업
│   ├── AddPlaceConfirmAlert   # 장소 추가 확인 팝업 (title/questionText/confirmText로 문구 커스텀 가능)
│   ├── PlaceSelectAlert       # 포토스팟 작성용 장소 검색·선택 팝업 (검색+페이지네이션, 카드 탭 시 AddPlaceConfirmAlert로 확인)
│   ├── TagAddAlert            # 태그 추가 팝업 (스페이스로 알약형 칩 확정, X로 제거)
│   ├── PhotoSpotScheduleAlert # 포토스팟 일정추가 확인 팝업
│   ├── CourseSelectPopup      # 코스 선택 팝업
│   ├── ScheduleEditNameAlert  # 일정 이름 수정 팝업 (편집 모드에서 제목 탭)
│   └── SortAlert              # 정렬 기준 선택 팝업 (CourseScreen·SearchResultScreen·UserPhotoSpotsScreen 공용)
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
| `api.ts` | axios 기반 API 함수 모음 (`scheduleApi`, `mediaApi`, `placeApi`, `photoApi`, `reviewApi`, `userApi`, `bookmarkApi`) |
| `types.ts` | 공통 타입 정의 (`Schedule`, `Media`, `Place`, `Photo`, `PhotoSpotDetail`, `Review`, `Tag` 등) |
| `mockData.ts` | 개발용 목 데이터 + mutable store(`mockPlaceStore`, `mockPhotoStore`, `mockReviewStore` 등, 북마크/작성 등의 변경이 세션 내에서 유지되도록 함) |

`EXPO_PUBLIC_USE_MOCK=true`(`.env`)일 때 각 API 함수는 실제 axios 호출 대신 `mockData.ts`의 값을 반환합니다.

- `reviewApi`는 실제 백엔드에서도 대상(장소/코스/포토스팟)별로 분리된 엔드포인트(`/api/reviews/<review_type>/...`)를 씁니다. mock 경로는 구현 편의상 전체 대상이 공유하는 단일 리스트(`mockReviewStore`)에 `target: { type, id }`로 필터를 걸어 흉내냅니다.
- `photoApi`도 실제 `/api/photos/` CRUD·좋아요(`like`) 엔드포인트가 있지만, `getList`의 `author` 파라미터와 `getMine`은 **mock 전용**입니다 — 실제 백엔드는 `keyword` 파라미터만 지원합니다 (위 TODO 참고). 개별 장소에 속한 사진은 실제로 연결된 `placeApi.getPhotos(placeId)`(`GET /api/places/{id}/photos/`)를 쓰세요.

`utils/sortByOption.ts`는 화면 전반에서 재사용하는 정렬 비교 함수이고, `utils/getProcessedTags.ts`는 태그 목록을 3개 + `+n`으로 간략화하는 공용 함수입니다 (위 정렬 기능·포토스팟 섹션 참고).
