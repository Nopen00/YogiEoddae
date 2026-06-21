# 요기어때? — 개발 로드맵

> 이 문서는 개발자(이태용)와 Claude 둘 다 참고하는 개발 방향 지표입니다.
> 매일 개발이 어려운 환경을 감안해, 어디서 멈췄든 이 문서를 보면 다음 할 일을 바로 알 수 있도록 작성했습니다.

---

## 프로젝트 개요

**앱 이름:** 요기어때?  
**핵심 컨셉:** 드라마·영화·유튜브 속 촬영 장소를 테마별로 묶어 실제 방문 코스로 안내하는 여행 앱  
**팀:** 이태용 (백엔드/Django), 강혜진 (프론트/React Native)  
**목표 발표:** 캡스톤 디자인 + 한이음 공모전

### 기술 스택

| 영역 | 기술 |
|---|---|
| 백엔드 | Python 3.x, Django, Django REST Framework |
| DB | MySQL |
| 프론트 | React Native (팀원 담당) |
| 지도 | Kakao Maps JS API (Naver Maps 오류로 임시 대체, Naver 복구 시 전환 예정 — 아래 "알려진 이슈" 참고) |
| 외부 API | 한국관광공사(KorService2), YouTube Data API, Kakao/Naver Maps |

---

## 현재 구현 완료 상태 (2026-06-22 기준)

### DB 모델

| 앱 | 모델 | 주요 필드 | 상태 |
|---|---|---|---|
| places | `Tag` | category(대/소분류), name | ✅ 완료 |
| places | `Place` | name, address, lat/lng, content_id, image_url, category, is_verified, tags | ✅ 완료 |
| places | `Media` | title, media_type(drama/movie/youtube/etc), year, thumbnail_url, description, tags | ✅ 완료 |
| places | `MediaPlace` | media FK, place FK, scene_description, confidence_score(0.0~1.0), is_confirmed, status(inferred/admin_approved/rejected/quiz_confirmed) | ✅ 완료 |
| places | `Photo` | place FK, image_url, description, likes, tags | ✅ 완료 (퀴즈 연동은 미구현, Phase 3) |
| users | `User` | device_id_hash(익명 기기 식별 HMAC), created_at, last_active_at | ✅ 완료 |
| schedules | `Schedule` | user FK, title, media FK, start_date, end_date | ✅ 완료 |
| schedules | `DailyPlace` | schedule FK, place FK, day_number, order, memo | ✅ 완료 |
| schedules | `ScheduleBookmark` | user FK, schedule FK | ✅ 완료 |
| bookmarks | `MediaBookmark` / `PlaceBookmark` / `PhotoBookmark` | user FK + media/place/photo FK | ✅ 완료 |
| - | `Quiz` | (미정 — 정답 집계 필드 등) | ❌ 미구현 (Phase 3) |

### API 엔드포인트

```
# places (DRF ViewSet, /api/)
GET  /api/places/              전체 장소 목록 (keyword/category/unverified/tag 필터)
GET  /api/places/{id}/         장소 상세
GET  /api/places/map/          지도용 좌표 + 연결 미디어 (media_id 필터)
GET  /api/media/               전체 미디어 목록 (type/tag 필터)
GET  /api/media/{id}/          미디어 상세 + 촬영지 목록
GET  /api/media/{id}/places/   특정 미디어의 촬영지만 조회
GET  /api/tags/                태그 목록

# users
POST /api/users/                          익명 유저 생성 (device_id → 해시 저장)

# schedules  (인증: 요청 헤더 X-Device-ID 필요)
GET  /api/schedules/                      내 일정 목록 / POST 생성
GET  /api/schedules/bookmarked/           북마크한 일정 목록
GET  /api/schedules/{id}/                 일정 상세 / PATCH / DELETE
POST /api/schedules/{id}/places/          일정에 장소 추가
GET  /api/schedules/{id}/places/{dp_id}/  일정 내 장소 수정/삭제(순서 변경 포함)
POST /api/schedules/{id}/import/          다른 유저의 일정 복제해서 내 일정으로 가져오기
POST /api/media/{id}/import/              미디어의 촬영지들을 통째로 내 일정으로 가져오기
POST/DELETE /api/schedules/{id}/bookmark/ 일정 북마크 추가/삭제

# bookmarks  (인증: 요청 헤더 X-Device-ID 필요)
GET  /api/bookmarks/                      내 북마크 전체 목록 (일정/명소/포토스팟)
POST/DELETE /api/media/{id}/bookmark/     미디어 북마크 추가/삭제
POST/DELETE /api/places/{id}/bookmark/    장소 북마크 추가/삭제
POST/DELETE /api/photos/{id}/bookmark/    사진 북마크 추가/삭제

# places (관리자 포털, Django 템플릿)
GET/POST /places/extract/                 새 추출 (YouTube URL → AI 추론 → DB 저장)
GET      /places/extract/history/         검토 현황 목록 (+ 🗑 삭제 버튼)
POST     /places/extract/{id}/delete/     추출 내역(미디어) 삭제
GET/POST /places/extract/review/{id}/     장소 검토(승인/반려), 위치 수정, 주소 일괄갱신
POST     /places/mediaplace/{id}/revoke/  승인 취소

GET  /places/fetch/            KTO API → DB 저장 (keyword 파라미터)
GET  /places/list/             DB 장소 목록 JSON (name 검색)
GET  /places/map-test/         지도 테스트 페이지 (Naver, 현재 미작동 — 알려진 이슈 참고)
GET  /places/demo/             데모 페이지 (Kakao)
```

### 기타

- `python manage.py seed_data` — 샘플 미디어/장소 데이터 생성 (KTO API 호출 포함)
- `python manage.py fetch_youtube_place` — YouTube 영상 → Claude/Gemini API 장소 추론 → DB 저장 (최근 주소 교차검증으로 매칭 정확도 개선)
- KTO API 연동: 키워드 검색 → Place 자동 저장
- Kakao 지도 마커 표시: MediaPlace로 연결된 장소만 지도에 표시
- 익명 유저: 기기 식별값(device_id)을 HMAC 해시로 저장 (원본 device_id는 DB에 남기지 않음)

---

## 개발 우선순위 및 순서

아래 순서대로 진행하는 것을 권장합니다. 각 Phase는 독립적으로 완결되도록 설계해서, 중간에 멈춰도 이전 Phase까지는 작동하는 상태로 유지됩니다.

---

### ✅ Phase 1 — Tag 시스템 (완료 2026-05-15)


**왜 먼저 해야 하나:**  
앱의 핵심 차별점이 "테마별 성지 연결"인데, Tag 없이는 필터링이 불가합니다.  
또한 이후 YouTube 장소 추출, 퀴즈, 일정 기능 모두 Tag와 연결되므로 기반 작업입니다.

**구현할 것:**

1. `Tag` 모델 추가
   - 대분류 (예: 드라마, 영화, 로맨스, 액션, 힐링, 서울, 지방 ...)
   - 소분류 (예: tvN드라마, 봉준호영화, 해안선, 골목길 ...)

2. `Place`와 `Media`에 Tag 연결 (ManyToMany)

3. API에 Tag 필터 추가
   - `GET /api/places/?tag=로맨스`
   - `GET /api/media/?tag=드라마`

**목표 모델 구조:**
```python
class Tag(models.Model):
    category = models.CharField(max_length=50)   # 대분류
    name = models.CharField(max_length=50)        # 소분류

# Place, Media에 tags = ManyToManyField(Tag) 추가
```

---

### ✅ Phase 2 — YouTube API 장소 추출 (완료 2026-05-16)

**구현 완료:**

1. `fetch_youtube_place` management command (`places/management/commands/fetch_youtube_place.py`)
   - YouTube URL → 영상 제목/설명/태그/댓글/자막 수집
   - Claude API (`claude-opus-4-7`, 스트리밍) → 촬영 장소 JSON 추론
   - KTO API 1차 검색 → `Place` 저장 (`is_verified=True`)
   - KTO 결과 없으면 AI 추론 결과로 저장 (`is_verified=False`, 좌표=0)
   - `Media` get_or_create + `MediaPlace` 연결

2. `confidence_score` 초기값 로직
   - KTO 확인 + confidence ≥ 0.9 → `is_confirmed=True`
   - 나머지 → `is_confirmed=False`

**사용법:**

```bash
# 기본 사용
python manage.py fetch_youtube_place \
    --url "https://www.youtube.com/watch?v=VIDEO_ID" \
    --media-title "이태원 클라쓰" \
    --media-type drama \
    --scene "박새로이가 처음 이태원을 걷는 장면"

# 저장 없이 분석 결과만 확인
python manage.py fetch_youtube_place \
    --url "..." --media-title "..." --dry-run
```

**사전 준비:**
- `.env`에 `ANTHROPIC_API_KEY`, `YOUTUBE_API_KEY` 실제 값 입력 필요
- 설치된 패키지: `anthropic`, `google-api-python-client`, `youtube-transcript-api`

**알려진 한계:**
- KTO에 없는 장소는 좌표가 0,0으로 저장됨 (Phase 3 또는 관리자 수동 입력 필요)
- 자막이 없는 영상은 제목/설명/댓글만으로 추론 (정확도 낮을 수 있음)

---

### Phase 3 — Quiz + 신뢰도 계산 (현재 유일하게 남은 핵심 단계)

**현황 (2026-06-22):**  
Phase 4·북마크가 먼저 완료되어 순서가 바뀌었지만, 핵심 로직 단계 중에서는 Phase 3만 손대지 않은 상태입니다.  
`Photo` 모델은 이미 존재하고(`GET /api/media/{id}/places/`에서 장소별 사진 조회 가능), `MediaPlace.status`에 `quiz_confirmed` 값도 정의돼 있지만 **이 상태로 전환시키는 로직이 어디에도 없습니다.**  
`confidence_score`는 추출(AI 추론) 시점에 한 번 세팅된 뒤로 다시는 갱신되지 않습니다 — 퀴즈 정답에 따라 올라가는 구조가 전혀 없습니다.

**왜 중요한가:**  
퀴즈는 앱의 핵심 UX이자 위치 확정의 유일한 수단입니다.  
`MediaPlace.confidence_score` 필드는 이미 있지만, 올라가는 로직이 전혀 없는 상태입니다.

**구현할 것:**

1. ~~`Photo` 모델 추가~~ — ✅ 이미 완료됨 (`place` FK, `image_url`, `description`, `likes`, `tags`)

2. `Quiz` 모델 추가
   - `media_place` FK (어떤 미디어-장소 쌍에 대한 퀴즈인지)
   - `photo` FK (힌트 사진)
   - 정답 집계 필드 (`correct_count`, `total_count`)

3. 퀴즈 API
   - `GET /api/quiz/` — 미확정 장소(`is_confirmed=False`) 중 랜덤 퀴즈 반환
   - `POST /api/quiz/{id}/answer/` — 정답 제출 → `confidence_score` 업데이트

4. 신뢰도 계산 로직
   - 정답률이 일정 기준(예: 80%) 이상이고 응답 수가 N개 이상이면 `is_confirmed=True`로 자동 전환, `status`를 `quiz_confirmed`로 전환

---

### ✅ Phase 4 — 일정 기능 (Schedule / DailyPlace) (완료)

Phase 3(퀴즈)보다 먼저 구현 완료된 단계입니다. `users` 앱에 익명 device_id 기반 `User` 모델을 먼저 만들어 선행 조건을 해결했습니다.

**구현 완료:**

1. `Schedule` 모델 — 사용자가 만드는 여행 일정 (제목, 날짜 범위, 연결 미디어)
2. `DailyPlace` 모델 — 일정 내 하루별 장소 목록 (day_number, place FK, order, memo)
3. API: 일정 CRUD, 일정에 장소 추가/수정/삭제, 미디어 코스 통째로 가져오기(`MediaImportView`), 다른 유저 일정 복제(`ScheduleImportView`)
4. 인증: 별도 로그인 없이 클라이언트가 `X-Device-ID` 헤더로 기기 UUID를 보내면 서버가 해시 매칭으로 유저 식별 (`users/utils.py`)

---

### ✅ 보너스 — 북마크 기능 (완료, 원래 로드맵엔 없던 항목)

일정/명소/포토스팟을 각각 북마크할 수 있는 기능이 `bookmarks` 앱(+ `schedules` 앱의 일정 북마크)으로 구현되어 있습니다. `GET /api/bookmarks/`에서 세 종류를 한 번에 조회 가능합니다.

---

### Phase 5 — 지도 고도화 (낮은 우선순위)

**현황:** Naver Maps API 오류로 Kakao Maps로 임시 전환, 마커 표시는 작동 중

**Naver Maps 관련 새 정보 (2026-06-22 확인):**  
네이버클라우드(Ncloud)의 Maps 상품이 개편되어, 기존에 쓰던 구버전 콘솔(AI·NAVER API > Maps, AppKey 발급 방식)과는 별개로 **"Application Services > Maps"라는 신규 콘솔(2025-03-20 출시)**이 생겼습니다. 현재 `.env`의 `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`가 구버전 콘솔에서 발급된 키라면 새 콘솔에서 재등록해야 동작할 가능성이 높습니다.

재등록 절차 (Ncloud 콘솔 기준):
1. NCP 콘솔 → **Services → Application Services → Maps → Application** 메뉴로 이동 (사용자가 공유해준 링크: https://www.ncloud.com/product/applicationService/maps#detail)
2. **[Application 등록]** → 이름 입력(최대 20자)
3. **API 선택**에서 `Dynamic Map`을 반드시 선택 — 선택하지 않으면 호출 시 **429 (Quota Exceed)** 오류 발생
4. `Dynamic Map` 선택 시 Web 서비스 URL / Android 패키지명 / iOS Bundle ID 중 하나 이상 입력 필수 (개발 중이면 로컬 서버 URL 또는 ngrok URL 등록)
5. 등록 후 **[인증 정보]**에서 `Client ID`(`X-NCP-APIGW-API-KEY-ID`)와 `Client Secret`(`X-NCP-APIGW-API-KEY`) 확인 → `.env`의 `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET` 교체

**확인 필요(미검증):** JS 스크립트 태그(`places/templates/places/map_test.html`)의 `ncpClientId` 쿼리 파라미터명이 신규 콘솔 키에서도 동일하게 동작하는지는 공식 문서에서 명확히 확인되지 않았습니다 — 새 키 발급 후 [NAVER Maps JavaScript API v3 가이드](https://navermaps.github.io/maps.js.ncp/docs/tutorial-1-Getting-Client-ID.html)에서 최신 script 태그 예시를 다시 확인할 것.

**추후 할 것:**
- 위 절차로 Naver Maps 재등록 후 정상 동작 확인 → Kakao에서 Naver로 전환할지 최종 결정
- 장소 간 경로 안내 (현재 위치 → 촬영지) — Ncloud Maps의 Directions5/15 API 사용 가능
- 내 위치 기반 주변 촬영지 탐색

---

## 목표 DB 스키마 (최종)

발표 슬라이드의 목표 스키마를 현재 구현과 맞춰 정리한 버전입니다.  
개발 여건에 따라 세부 필드는 바뀔 수 있지만, 이 구조를 지향합니다.

```
Place ──── Tag (ManyToMany)
  │
  └── MediaPlace ── Media ── Tag (ManyToMany)
        │
        └── Quiz ── Photo

Place ──── DailyPlace ── Schedule ── User
```

| 모델 | 현재 상태 | 목표 |
|---|---|---|
| Place | ✅ 있음 | Tag 연결 완료 |
| Media | ✅ 있음 (Media로 구현) | Tag 연결 완료 |
| MediaPlace | ✅ 있음 | Quiz 연결 — Phase 3 |
| Tag | ✅ 있음 | Phase 1 완료 |
| Photo | ✅ 있음 | Quiz 연결만 남음 — Phase 3 |
| Quiz | ❌ 없음 | Phase 3 (유일하게 남은 핵심 모델) |
| Schedule | ✅ 있음 (`schedules` 앱) | Phase 4 완료 |
| DailyPlace | ✅ 있음 (`schedules` 앱) | Phase 4 완료 |
| User/Auth | ✅ 있음 (`users` 앱, 익명 device_id) | Phase 4 완료 |
| MediaBookmark/PlaceBookmark/PhotoBookmark/ScheduleBookmark | ✅ 있음 (`bookmarks`, `schedules` 앱) | 원래 로드맵엔 없던 보너스 구현 |

---

## 알려진 이슈

| 이슈 | 상태 | 비고 |
|---|---|---|
| Naver Maps API 작동 안 함 | 미해결 | Kakao로 임시 대체. **신규 정보:** Ncloud "Application Services > Maps" 콘솔(2025-03-20 출시)에서 재등록 필요 가능성 — Phase 5 항목 참고 |
| YouTube API 미연동 | ✅ 구현 완료 | Phase 2 완료, 최근 주소 교차검증으로 정확도 개선 |
| confidence_score 업데이트 로직 없음 | 필드만 있음 | Phase 3, 현재 유일하게 남은 핵심 작업 |
| 사용자 인증 없음 | ✅ 해결됨 | `users` 앱에 익명 device_id 기반 인증 구현 완료 (Phase 4) |

---

## 개발 재개 체크리스트

오랜만에 돌아왔을 때 이것만 확인하면 됩니다:

```bash
# 0. (필수) 가상환경 활성화 — 먼저 backend/ 폴더로 이동
cd backend

#    PowerShell (".\" 접두사 필수 — 안 붙이면 모듈로 오인해서 못 찾음)
.\venv\Scripts\Activate.ps1
#    cmd
venv\Scripts\activate.bat
#    Git Bash
source venv/Scripts/activate

# 서버 실행
python manage.py runserver

# DB 마이그레이션 확인
python manage.py showmigrations

# 샘플 데이터 재생성 (DB 비어있을 때)
python manage.py seed_data
```

**가상환경 비활성화:** `deactivate`

그리고 이 문서의 **Phase 순서**에서 체크되지 않은 가장 앞 단계부터 시작하면 됩니다.
