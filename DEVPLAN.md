# 요기어때? — 개발 로드맵

> **백엔드:** 이태용 (Django) · **프론트:** 강혜진 (React Native)  
> 이 문서는 둘 다 보는 기준 문서입니다. 백엔드가 새 API를 추가하거나 응답 형식이 바뀌면 여기를 먼저 업데이트합니다.

---

## 프로젝트 개요

**앱 이름:** 요기어때?  
**핵심 컨셉:** 드라마·영화·유튜브 속 촬영 장소를 테마별로 묶어 실제 방문 코스로 안내하는 여행 앱  
**목표 발표:** 캡스톤 디자인 + 한이음 공모전

### 기술 스택

| 영역 | 기술 |
|---|---|
| 백엔드 | Python 3.x, Django, Django REST Framework |
| DB | MySQL |
| 프론트 | React Native + Expo Router |
| 지도 | Kakao Maps JS API |
| 외부 API | 한국관광공사(KorService2), YouTube Data API, Kakao/Naver Maps |

---

## Phase 진행 현황

| Phase | 내용 | 상태 |
|---|---|---|
| Phase 1 | Tag 시스템 | ✅ 완료 |
| Phase 2 | YouTube API 장소 추출 | ✅ 완료 |
| Phase 3 | Photo 모델 + Quiz | ✅ Photo 완료 / Quiz 미구현 |
| Phase 4 | User/Auth + 일정(Schedule) | 🔜 진행 예정 |
| Phase 5 | 지도 고도화 | ⏸ 보류 |

---

## ✅ 현재 구현 완료 — DB 모델

| 모델 | 주요 필드 |
|---|---|
| `Tag` | category(media_type/genre/place_type), name |
| `Place` | name, address, lat/lng, content_id, image_url, category, is_verified, tags |
| `Media` | title, media_type(drama/movie/youtube/etc), year, thumbnail_url, description, tags |
| `MediaPlace` | media FK, place FK, scene_description, confidence_score, is_confirmed, status |

---

## ✅ 현재 구현 완료 — API 엔드포인트

> **베이스 URL:** `http://<서버IP>:8000`  
> 현재는 로컬에서 `python manage.py runserver` 후 `http://127.0.0.1:8000` 으로 접근

### 장소 (Places)

```
GET  /api/places/                 전체 장소 목록
GET  /api/places/{id}/            장소 상세
GET  /api/places/map/             지도용 좌표 + 연결 미디어
GET  /api/places/?keyword=이태원  이름 검색
GET  /api/places/?category=12     관광공사 카테고리 필터
GET  /api/places/?tag=로맨스      태그 필터
```

**응답 예시 — `GET /api/places/`**
```json
[
  {
    "id": 1,
    "content_id": "126508",
    "name": "이태원 세계음식거리",
    "address": "서울특별시 용산구 이태원로",
    "latitude": "37.53440000000000",
    "longitude": "126.99440000000000",
    "image_url": "http://tong.visitkorea.or.kr/...",
    "category": "12",
    "is_verified": true,
    "tags": [
      { "id": 1, "category": "place_type", "name": "거리" }
    ],
    "created_at": "2026-05-16T10:00:00Z"
  }
]
```

---

### 미디어 (Media)

```
GET  /api/media/                  전체 미디어 목록
GET  /api/media/{id}/             미디어 상세 + 촬영지 목록
GET  /api/media/{id}/places/      해당 미디어의 촬영지만 조회
GET  /api/media/?type=drama       타입 필터 (drama/movie/youtube/etc)
GET  /api/media/?tag=드라마       태그 필터
```

**응답 예시 — `GET /api/media/`** (목록)
```json
[
  {
    "id": 1,
    "title": "이태원 클라쓰",
    "media_type": "drama",
    "year": 2020,
    "thumbnail_url": "https://...",
    "description": "JTBC 드라마 ...",
    "tags": [
      { "id": 2, "category": "media_type", "name": "드라마" }
    ],
    "created_at": "2026-05-16T10:00:00Z"
  }
]
```

**응답 예시 — `GET /api/media/{id}/`** (상세, 촬영지 포함)
```json
{
  "id": 1,
  "title": "이태원 클라쓰",
  "media_type": "drama",
  "year": 2020,
  "thumbnail_url": "https://...",
  "description": "JTBC 드라마 ...",
  "places": [
    {
      "id": 1,
      "place": {
        "id": 3,
        "name": "이태원 세계음식거리",
        "address": "서울특별시 용산구 이태원로",
        "latitude": "37.53440000000000",
        "longitude": "126.99440000000000",
        "image_url": "https://...",
        "category": "12",
        "is_verified": true,
        "tags": [],
        "created_at": "2026-05-16T10:00:00Z"
      },
      "scene_description": "박새로이가 처음 이태원을 걷는 장면",
      "confidence_score": 0.95,
      "is_confirmed": true,
      "created_at": "2026-05-16T10:00:00Z"
    }
  ],
  "created_at": "2026-05-16T10:00:00Z"
}
```

---

### 태그 (Tags)

```
GET  /api/tags/                   전체 태그 목록
GET  /api/tags/?category=genre    대분류 필터 (media_type / genre / place_type)
```

---

## 프론트 화면별 API 연결 가이드

> 현재 프론트 화면은 모두 mock 데이터 상태. 아래 순서로 실제 API로 교체하면 됩니다.

### MainScreen (메인 화면)

| UI 요소 | 연결할 API | 비고 |
|---|---|---|
| 캐러셀 (인기 코스) | `GET /api/media/?type=drama` | 상위 N개 |
| 실시간 인기 코스 | `GET /api/media/` | created_at 최신순 |
| 맞춤형 여행 코스 | `GET /api/media/?tag=<태그>` | 태그 기반 필터 |

### SearchResultScreen (검색 결과)

| UI 요소 | 연결할 API |
|---|---|
| 미디어 검색 결과 | `GET /api/media/?tag=<keyword>` |
| 장소 검색 결과 | `GET /api/places/?keyword=<keyword>` |

### CourseDetailScreen (코스 상세)

| UI 요소 | 연결할 API | 상태 |
|---|---|---|
| 미디어 정보 (제목/설명/썸네일) | `GET /api/media/{id}/` | ✅ API 있음 |
| 촬영지 이미지 슬라이드 | `GET /api/media/{id}/places/` | ✅ API 있음 |
| 포토스팟 목록 | `GET /api/places/{id}/photos/` | ✅ 완료 |
| 코스(Day별 장소) | `GET /api/schedules/{id}/` | 🔜 Phase 4 개발 필요 |
| 저장하기 / 일정추가 | `/api/auth/` + `/api/schedules/` | 🔜 Phase 4 개발 필요 |

---

## CORS 설정 — ✅ 백엔드 완료 (2026-05-27)

`django-cors-headers` 설치 및 `settings.py` 적용 완료.

```python
# 현재 settings.py 적용 상태
INSTALLED_APPS = [..., 'corsheaders', ...]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CommonMiddleware 위에 위치
    ...
]

CORS_ALLOW_ALL_ORIGINS = True  # 개발용, 배포 시 실제 도메인으로 교체
```

> ⚠️ **이태용 + 강혜진 공동 작업 필요**  
> 실제 API 연결 테스트(프론트 mock 데이터 → 실제 API 교체)는 둘이 같이 진행해야 함.  
> 백엔드 서버 실행: `venv\Scripts\python.exe manage.py runserver`  
> 연결 순서는 위 "프론트 화면별 API 연결 가이드" 참고.

---

## ✅ Phase 3 — Photo 모델 (포토스팟) — 완료 2026-05-27

**목적:** CourseDetailScreen의 포토스팟 섹션에 실제 데이터 연결

**구현할 것:**

1. `Photo` 모델 추가
```python
class Photo(models.Model):
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='photos')
    image_url = models.URLField(max_length=500)
    description = models.TextField(blank=True)
    likes = models.IntegerField(default=0)
    tags = models.ManyToManyField(Tag, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

2. API 추가
```
GET  /api/places/{id}/photos/     특정 장소의 포토스팟 목록
```

**응답 예시**
```json
[
  {
    "id": 1,
    "image_url": "https://...",
    "description": "박새로이가 서 있던 골목",
    "likes": 89,
    "tags": [{ "id": 3, "category": "place_type", "name": "골목" }]
  }
]
```

---

## 🔜 Phase 4 — User/Auth + 일정 (Schedule)

**목적:** 저장하기, 일정추가, 코스(Day별 장소) 기능 구현

**순서:** User/Auth 먼저 → Schedule/DailyPlace

### 4-1. User 인증 (JWT)

```bash
pip install djangorestframework-simplejwt
```

```
POST /api/auth/register/    회원가입
POST /api/auth/login/       로그인 → access/refresh 토큰 반환
POST /api/auth/token/refresh/  토큰 갱신
```

**로그인 응답 예시**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

> 프론트는 이후 모든 인증 필요 요청에 헤더 추가:  
> `Authorization: Bearer <access_token>`

### 4-2. Schedule / DailyPlace 모델

```python
class Schedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    media = models.ForeignKey(Media, on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

class DailyPlace(models.Model):
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='daily_places')
    place = models.ForeignKey(Place, on_delete=models.CASCADE)
    day_number = models.IntegerField()   # 1, 2, 3 ...
    order = models.IntegerField()        # 하루 내 순서
```

```
GET    /api/schedules/              내 일정 목록 (로그인 필요)
POST   /api/schedules/              일정 생성
GET    /api/schedules/{id}/         일정 상세 + Day별 장소
POST   /api/schedules/{id}/places/  장소 추가
DELETE /api/schedules/{id}/places/{place_id}/  장소 삭제
```

---

## 개발 재개 체크리스트

```bash
# 서버 실행
python manage.py runserver

# DB 마이그레이션 확인
python manage.py showmigrations

# 샘플 데이터 재생성 (DB 비어있을 때)
python manage.py seed_data
```

---

## 알려진 이슈

| 이슈 | 상태 | 비고 |
|---|---|---|
| CORS 미설정 | 미적용 | Phase 3 전에 반드시 설정 |
| Naver Maps API 작동 안 함 | 미해결 | Kakao로 임시 대체 중, 우선순위 낮음 |
| confidence_score 업데이트 로직 없음 | 필드만 있음 | Phase 3 |
| 사용자 인증 없음 | 미구현 | Phase 4 전 선행 필요 |
| 프론트 전체 mock 데이터 | 미연결 | CORS 설정 후 순차 교체 |
