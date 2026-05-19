# 협업 규칙 (CONTRIBUTING)

> 이 파일을 먼저 읽고 작업을 시작하세요. 규칙을 바꿀 때는 두 사람이 합의 후 이 파일도 같이 수정합니다.

---

## 1. 프로젝트 구조

```
YogiEoddae/
├── backend/          ← Django (백엔드 담당)
│   ├── YogiEoddae/   ← Django 설정 (settings.py, urls.py)
│   └── places/       ← 메인 앱 (models, views, serializers, api_urls)
├── frontend/         ← React Native/Expo (프론트 담당)
│   ├── app/          ← 화면 파일 (라우팅)
│   ├── components/   ← 재사용 컴포넌트
│   ├── constants/    ← 디자인 시스템 (Colors, Spacing, Typography)
│   └── hooks/        ← 커스텀 훅
└── CONTRIBUTING.md   ← 지금 이 파일
```

- `backend/`와 `frontend/`는 서로의 파일을 직접 수정하지 않는다.
- 공유가 필요한 정보(API 명세 등)는 이 파일 하단 **API 명세** 섹션에 기록한다.

---

## 2. Git 규칙

### 브랜치 구조

```
main      ← 최종 완성본. 직접 push 금지.
dev       ← 통합 브랜치. 여기서 둘이 합친다.
feat/be-기능명   ← 백엔드 기능 개발
feat/fe-기능명   ← 프론트 기능 개발
fix/be-버그명
fix/fe-버그명
```

### 작업 흐름

```
1. dev에서 새 브랜치 생성
   git checkout dev
   git pull
   git checkout -b feat/be-장소검색API

2. 작업 후 dev로 PR
   (main으로 직접 merge 금지)

3. 상대방이 PR 확인 후 merge
```

### 커밋 메시지 형식

```
feat(be): 장소 검색 API 추가
feat(fe): 검색 결과 화면 구현
fix(be): 이미지 URL null 처리
fix(fe): 검색어 중복 제거 버그 수정
chore: 패키지 추가 / 설정 변경
```

- `(be)` / `(fe)` 태그 필수 — 누가 어디를 건드렸는지 바로 보인다.
- 한국어 설명 사용.

---

## 3. API 규칙

### 엔드포인트 형식

```
GET    /api/<리소스>/           목록 조회
GET    /api/<리소스>/<id>/      단건 조회
POST   /api/<리소스>/           생성
PUT    /api/<리소스>/<id>/      수정
DELETE /api/<리소스>/<id>/      삭제
```

현재 등록된 엔드포인트:
```
/api/places/
/api/media/
/api/tags/
```

### 필드명 — snake_case 통일

백엔드가 반환하는 JSON 필드명은 `snake_case`를 사용한다.
프론트도 API 응답을 받을 때는 `snake_case` 그대로 사용한다.

```ts
// 올바른 예
type Place = {
  content_id: string
  image_url: string
  media_type: string
  is_verified: boolean
}

// 금지 — 임의로 camelCase로 바꾸지 않는다
type Place = {
  contentId: string   // X
  imageUrl: string    // X
}
```

프론트 내부 state 변수명은 `camelCase` 사용 허용 (React 관습).

### 새 API 추가 시 순서

```
1. 백엔드가 이 파일 하단 [API 명세] 섹션에 엔드포인트/요청/응답 형식 먼저 기록
2. 커밋 메시지: feat(be): [API명세] 장소 즐겨찾기 API 추가
3. 프론트가 명세 확인 후 연동 개발 시작
```

백엔드 구현이 안 끝나도 프론트는 명세 보고 먼저 개발할 수 있다.

---

## 4. 백엔드 코드 규칙 (Django)

### 파일별 역할

| 파일 | 역할 |
|------|------|
| `models.py` | DB 테이블 정의만. 비즈니스 로직 금지. |
| `serializers.py` | API 입출력 형식 정의. |
| `views.py` | 요청 처리. 무거운 로직은 `services.py`로 분리. |
| `services.py` | 외부 API 호출, AI 추론 등 무거운 로직. |
| `api_urls.py` | REST API 라우팅만. |
| `urls.py` | 템플릿 뷰 라우팅만. |

### 네이밍

```python
# 모델: PascalCase 단수형
class MediaPlace(models.Model): ...

# Serializer: 모델명 + Serializer
class PlaceSerializer(serializers.ModelSerializer): ...

# ViewSet: 모델명 + ViewSet
class PlaceViewSet(viewsets.ModelViewSet): ...

# 상수: UPPER_SNAKE_CASE
STATUS_ADMIN_APPROVED = 'admin_approved'
```

### 환경변수

민감한 키는 반드시 `.env`에서 관리, 코드에 직접 쓰지 않는다.
```python
# 올바른 예
settings.TOUR_API_KEY

# 금지
api_key = "AIzaSy..."  # X
```

---

## 5. 프론트엔드 코드 규칙 (React Native/Expo)

### 파일 네이밍

| 종류 | 형식 | 예시 |
|------|------|------|
| 화면 컴포넌트 | `PascalCase` + `Screen.tsx` | `SearchScreen.tsx` |
| 재사용 컴포넌트 | `PascalCase.tsx` | `SearchBar.tsx` |
| 훅 | `use-kebab-case.ts` | `use-color-scheme.ts` |
| 상수 파일 | `PascalCase.ts` | `Colors.ts` |

### 디자인 시스템 — 반드시 상수 사용

`constants/` 폴더의 값을 사용한다. 직접 색상 코드나 수치를 쓰지 않는다.

```ts
// 올바른 예
import { Colors } from '@/constants/Colors'
import { Spacing } from '@/constants/Spacing'
import { Typography } from '@/constants/Typography'

color: Colors.light.primary      // '#41737C'
padding: Spacing.md

// 금지
color: '#41737C'   // X — 상수 쓰기
padding: 16        // X — Spacing 쓰기
```

### 네비게이션

`navigation` 대신 `expo-router`의 `useRouter` 사용.

```ts
// 올바른 예
import { useRouter } from 'expo-router'
const router = useRouter()
router.push('/search')

// 금지
navigation.navigate('Search')  // X
```

### API 호출

API 호출 로직은 화면 컴포넌트 안에 직접 쓰지 않고 훅이나 서비스 함수로 분리한다.

```ts
// 올바른 예 — hooks/ 또는 별도 api 파일에서 관리
const { places } = usePlaces()

// 금지 — 화면 컴포넌트 안에 fetch 직접 쓰기
const res = await fetch('http://...')  // X
```

---

## 6. API 명세

> 백엔드에서 새 API 추가 시 여기에 기록. 프론트는 이걸 보고 개발.

### Place (장소)

**응답 필드 (PlaceSerializer)**
```json
{
  "id": 1,
  "content_id": "2733517",
  "name": "잠수교",
  "address": "서울특별시 서초구",
  "latitude": "37.51234567890000",
  "longitude": "127.01234567890000",
  "image_url": "https://...",
  "category": "12",
  "is_verified": true,
  "tags": [{ "id": 1, "category": "place_type", "name": "다리" }],
  "created_at": "2025-05-01T00:00:00Z"
}
```

**응답 필드 (PlaceMapSerializer — 지도 마커용)**
```json
{
  "id": 1,
  "name": "잠수교",
  "address": "서울특별시 서초구",
  "latitude": "37.51234567890000",
  "longitude": "127.01234567890000",
  "image_url": "https://...",
  "media": [
    {
      "media_id": 1,
      "title": "드라마 제목",
      "media_type": "drama",
      "scene_description": "주인공이 걷던 장면",
      "confidence_score": 0.95
    }
  ]
}
```

### Media (미디어)

**응답 필드 (MediaSerializer)**
```json
{
  "id": 1,
  "title": "드라마 제목",
  "media_type": "drama",
  "year": 2024,
  "thumbnail_url": "https://...",
  "description": "설명",
  "tags": [],
  "created_at": "2025-05-01T00:00:00Z"
}
```

`media_type` 가능한 값: `drama` / `movie` / `youtube` / `etc`

### Tag (태그)

**응답 필드**
```json
{ "id": 1, "category": "place_type", "name": "다리" }
```

`category` 가능한 값: `media_type` / `genre` / `place_type`

---

*새 API 추가 시 이 섹션에 같은 형식으로 추가.*
