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
| Phase 4 | 익명 유저 + 일정 + 북마크 | ✅ 완료 (2026-06-04) |
| Phase 5 | 지도 고도화 | ⏸ 보류 |

---

## ✅ 현재 구현 완료 — DB 모델

### places 앱

| 모델 | 주요 필드 |
|---|---|
| `Tag` | category(media_type/genre/place_type), name |
| `Place` | name, address, lat/lng, content_id, image_url, category, is_verified, kakao_place_id, kakao_place_url, tags |
| `Media` | title, media_type(drama/movie/youtube/etc), year, thumbnail_url, description, tags |
| `Photo` | place FK, image_url, description, likes, tags |
| `MediaPlace` | media FK, place FK, **day**, scene_description, confidence_score, is_confirmed, status |

### users 앱

| 모델 | 주요 필드 |
|---|---|
| `User` | device_id(UUID), created_at, last_active_at |

### schedules 앱

| 모델 | 주요 필드 |
|---|---|
| `Schedule` | user FK, title, media FK(nullable), start_date, end_date, created_at |
| `DailyPlace` | schedule FK, place FK, day_number, order, memo |
| `ScheduleBookmark` | user FK, schedule FK, created_at |

### bookmarks 앱

| 모델 | 주요 필드 |
|---|---|
| `MediaBookmark` | user FK, media FK, created_at |
| `PlaceBookmark` | user FK, place FK, created_at |
| `PhotoBookmark` | user FK, photo FK, created_at |

---

## ✅ 현재 구현 완료 — API 엔드포인트

> **베이스 URL:** `http://<서버IP>:8000`  
> 현재는 로컬에서 `python manage.py runserver` 후 `http://127.0.0.1:8000` 으로 접근

### 유저 인증

> 로그인 없는 익명 유저 시스템. 모든 인증 필요 요청에 헤더 필수:  
> `X-Device-ID: <device_id>`

```
POST /api/users/    앱 첫 실행 시 익명 유저 생성 → device_id 반환
```

**응답 예시**
```json
{ "device_id": "550e8400-e29b-41d4-a716-446655440000" }
```

---

### 장소 (Places)

```
GET  /api/places/                 전체 장소 목록
GET  /api/places/{id}/            장소 상세
GET  /api/places/map/             지도용 좌표 + 연결 미디어
GET  /api/places/?keyword=이태원  이름 검색
GET  /api/places/?category=12     관광공사 카테고리 필터
GET  /api/places/?tag=로맨스      태그 필터
GET  /api/places/{id}/photos/     장소의 포토스팟 목록
```

---

### 미디어 (Media)

```
GET  /api/media/                  전체 미디어 목록
GET  /api/media/{id}/             미디어 상세 + 촬영지 목록
GET  /api/media/{id}/places/      해당 미디어의 촬영지만 조회
GET  /api/media/?type=drama       타입 필터 (drama/movie/youtube/etc)
GET  /api/media/?tag=드라마       태그 필터
POST /api/media/{id}/import/      미디어 코스 → 내 일정으로 가져오기 🔒
POST /api/media/{id}/bookmark/    코스 저장 🔒
DELETE /api/media/{id}/bookmark/  코스 저장 취소 🔒
```

---

### 태그 (Tags)

```
GET  /api/tags/                   전체 태그 목록
GET  /api/tags/?category=genre    대분류 필터 (media_type / genre / place_type)
```

---

### 일정 (Schedules) 🔒 전체 인증 필요

```
GET    /api/schedules/                          내 일정 목록
POST   /api/schedules/                          일정 생성
GET    /api/schedules/bookmarked/               저장한 일정 목록
GET    /api/schedules/{id}/                     일정 상세 + Day별 장소
PATCH  /api/schedules/{id}/                     일정 제목/날짜 수정
DELETE /api/schedules/{id}/                     일정 삭제
POST   /api/schedules/{id}/places/              일정에 장소 추가
PATCH  /api/schedules/{id}/places/{dp_id}/      장소 순서/일차 수정
DELETE /api/schedules/{id}/places/{dp_id}/      장소 제거
POST   /api/schedules/{id}/import/              다른 일정 내 일정으로 가져오기
POST   /api/schedules/{id}/bookmark/            일정 저장
DELETE /api/schedules/{id}/bookmark/            일정 저장 취소
```

**일정 생성 요청 예시**
```json
{ "title": "부산 여행", "start_date": "2026-07-01", "end_date": "2026-07-03" }
```

**일정 상세 응답 예시**
```json
{
  "id": 1,
  "title": "부산 여행",
  "media": null,
  "start_date": "2026-07-01",
  "end_date": "2026-07-03",
  "is_bookmarked": false,
  "daily_places": [
    {
      "id": 1,
      "day_number": 1,
      "order": 0,
      "memo": "",
      "place": { "id": 3, "name": "해운대", "address": "...", "image_url": "..." }
    }
  ]
}
```

**장소 추가 요청 예시**
```json
{ "place_id": 3, "day_number": 1, "order": 0, "memo": "꼭 가야 함" }
```

---

### 북마크 (Bookmarks) 🔒 전체 인증 필요

```
GET    /api/bookmarks/                저장소 전체 (코스+장소+포토스팟)
POST   /api/places/{id}/bookmark/     장소 저장
DELETE /api/places/{id}/bookmark/     장소 저장 취소
POST   /api/photos/{id}/bookmark/     포토스팟 저장
DELETE /api/photos/{id}/bookmark/     포토스팟 저장 취소
```

**`GET /api/bookmarks/` 응답 예시**
```json
{
  "saved_media":  [
    { "id": 1, "title": "이태원 클라쓰", "media_type": "drama", "thumbnail_url": "...", "tags": [...], "saved_at": "..." }
  ],
  "saved_places": [
    { "id": 3, "name": "경복궁", "address": "...", "image_url": "...", "tags": [...], "saved_at": "..." }
  ],
  "saved_photos": [
    { "id": 2, "image_url": "...", "description": "...", "place_name": "한강", "tags": [...], "saved_at": "..." }
  ]
}
```

> 🔒 인증 필요 표시된 API는 모두 헤더에 `X-Device-ID` 필수

---

## 프론트 화면별 API 연결 가이드

### 앱 진입 (최초 실행 / 재실행)

| 상황 | 동작 |
|---|---|
| AsyncStorage에 device_id 없음 | 튜토리얼 화면 표시 |
| 튜토리얼 "시작하기" 버튼 클릭 | `POST /api/users/` → device_id 받아서 AsyncStorage 저장 → 메인 이동 |
| AsyncStorage에 device_id 있음 | 튜토리얼 스킵 → 바로 메인 이동 |

### MainScreen (메인 화면)

| UI 요소 | 연결할 API |
|---|---|
| 캐러셀 (인기 코스) | `GET /api/media/?type=drama` |
| 실시간 인기 코스 | `GET /api/media/` |
| 맞춤형 여행 코스 | `GET /api/media/?tag=<태그>` |

### SearchResultScreen (검색 결과)

| UI 요소 | 연결할 API |
|---|---|
| 미디어 검색 결과 | `GET /api/media/?tag=<keyword>` |
| 장소 검색 결과 | `GET /api/places/?keyword=<keyword>` |

### CourseDetailScreen (코스 상세 / 미디어)

| UI 요소 | 연결할 API |
|---|---|
| 미디어 정보 | `GET /api/media/{id}/` |
| 촬영지 목록 | `GET /api/media/{id}/places/` |
| 저장하기 버튼 | `POST/DELETE /api/media/{id}/bookmark/` |
| 일정 추가 버튼 | `POST /api/media/{id}/import/` |

### PlaceDetailScreen (장소 상세)

| UI 요소 | 연결할 API |
|---|---|
| 장소 정보 | `GET /api/places/{id}/` |
| 포토스팟 목록 | `GET /api/places/{id}/photos/` |
| 저장하기 버튼 | `POST/DELETE /api/places/{id}/bookmark/` |
| 리뷰 더보기 | Place의 `kakao_place_url` 로 외부 링크 |

### ScheduleScreen (일정)

| UI 요소 | 연결할 API |
|---|---|
| 내 일정 목록 | `GET /api/schedules/` |
| 저장한 일정 목록 | `GET /api/schedules/bookmarked/` |
| 일정 생성 | `POST /api/schedules/` |
| 일정 상세 | `GET /api/schedules/{id}/` |
| 장소 추가/삭제 | `POST/DELETE /api/schedules/{id}/places/` |
| 일정 가져오기 | `POST /api/schedules/{id}/import/` |

### 저장소 탭 (일정 화면 내)

| UI 요소 | 연결할 API |
|---|---|
| 저장한 일정/명소/포토스팟 전체 | `GET /api/bookmarks/` |

---

## CORS 설정 — ✅ 완료 (2026-05-27)

```python
CORS_ALLOW_ALL_ORIGINS = True  # 개발용, 배포 시 실제 도메인으로 교체
```

---

## 개발 재개 체크리스트

```bash
# venv 활성화
.\venv\Scripts\activate

# 서버 실행
python manage.py runserver

# DB 마이그레이션 확인
python manage.py showmigrations

# 샘플 데이터 재생성 (DB 비어있을 때)
python manage.py seed_data

# 고아 데이터 정리 (2년 미접속 유저 삭제)
python manage.py cleanup_orphaned_users --dry-run   # 미리보기
python manage.py cleanup_orphaned_users              # 실제 삭제
```

---

## 알려진 이슈 / 미구현

| 항목 | 상태 | 비고 |
|---|---|---|
| Quiz 기능 | 미구현 | Phase 3 잔여. MediaPlace status `quiz_confirmed` 로직 |
| is_bookmarked 필드 | 미추가 | Place/Media 상세 응답에 추가 필요 |
| Place serializer kakao_place_url 노출 | 미추가 | PlaceDetailScreen 리뷰 더보기에 필요 |
| 고아 데이터 정리 자동화 | 수동 | 배포 시 cron 설정 필요 |
| Naver Maps API | 미해결 | Kakao로 대체 중, 우선순위 낮음 |
| 프론트 전체 mock 데이터 | 미연결 | API 연결 순차 진행 필요 |
