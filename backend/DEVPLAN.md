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

### 외부 마감 일정 (한이음 공모전, 2026-07-21 확인)

- 05.20 ~ 09.21: 서비스 개발 및 지원 기간
- **09.21: 1차 심사 서류 제출 마감**
- 서비스 등록(구글플레이/원스토어/애플 중 최소 1곳) 링크 제출 필수 — 스토어 자체 심사기간(통상 ~1개월)을 고려해서 역산 필요
- **팀 목표: 늦어도 8월 20일 전까지 스토어 심사 제출**, 8월 안에 핵심 기능(Phase 6~9 포함) 완료

---

## 현재 구현 완료 상태 (2026-07-23 기준)

### DB 모델

| 앱 | 모델 | 주요 필드 | 상태 |
|---|---|---|---|
| places | `Tag` | category(대/소분류), name | ✅ 완료 |
| places | `Place` | name, address, lat/lng, content_id, image_url, category, is_verified, tags | ✅ 완료 |
| places | `Media` | title, media_type(drama/movie/youtube/etc), year, thumbnail_url, description, tags | ✅ 완료 |
| places | `MediaPlace` | media FK, place FK, scene_description, confidence_score(0.0~1.0), is_confirmed, status(inferred/admin_approved/rejected/quiz_confirmed) | ✅ 완료 |
| places | `Photo` | place FK, image_url, description(제목), content(상세설명), travel_date, likes, tags, uploaded_by FK, status(approved/pending/rejected), moderation_categories/reason/checked_at(AI 검열 결과) | ✅ 완료 (퀴즈 연동은 미구현, Phase 3) |
| users | `User` | device_id_hash(익명, 이제 nullable) + username/nickname/email/password_hash(실계정), token_balance, created_at, last_active_at | ✅ 완료 (Phase 6, 2026-07-21) |
| users | `PasswordHistory` | user FK, password_hash, created_at | ✅ 완료 (비밀번호 재사용 검사용) |
| users | `EmailVerificationCode` | user FK, email, code, purpose(link_email/reset_password), is_used, expires_at | ✅ 완료 |
| schedules | `Schedule` | user FK, title, media FK, start_date, end_date | ✅ 완료 |
| schedules | `DailyPlace` | schedule FK, place FK, day_number, order, memo | ✅ 완료 |
| schedules | `ScheduleBookmark` | user FK, schedule FK | ✅ 완료 |
| bookmarks | `MediaBookmark` / `PlaceBookmark` / `PhotoBookmark` | user FK + media/place/photo FK | ✅ 완료 |
| course_suggestions | `CourseSuggestion` | user FK, title, link, media_type(drama/movie/youtube), description, status(pending/reviewed) | ✅ 완료 (Phase 10-1, 2026-07-27) |
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

# places — 포토스팟 (Phase 10-2 신설, Phase 11에서 필드/엔드포인트 보강)
GET    /api/photos/                    전체 목록 (승인됨 + 내 글, keyword/author 필터)
GET    /api/photos/mine/               내가 올린 포토스팟 전체 (상태 무관, JWT)
GET    /api/photos/{id}/               상세 (장소 + 같은장소사진 + 관련사진)
POST   /api/photos/upload-image/       이미지 파일 업로드(multipart, JWT) → image_url 반환 (Phase 11)
POST   /api/photos/                    업로드 (JWT, AI 1차 검열 자동 실행 → approved/pending)
PATCH  /api/photos/{id}/               수정 (작성자 본인, 제목/상세설명/여행일/태그만)
DELETE /api/photos/{id}/               삭제 (작성자 본인)
POST/DELETE /api/photos/{id}/like/     좋아요 토글 (JWT)
# 북마크는 아래 bookmarks 섹션의 /api/photos/{id}/bookmark/ 참고

# users — 익명(구버전, device_id 필요)
POST /api/users/                          익명 유저 생성 (device_id → 해시 저장, 프론트 앱 부팅시 아직 호출 중)

# users — 실계정 (Phase 6, JWT)
POST /api/users/signup/                   회원가입 (username/nickname/password) → access+refresh 토큰 발급
POST /api/users/login/                    로그인 → access+refresh 토큰 발급
POST /api/users/token/refresh/            refresh 토큰으로 access 재발급
GET/PATCH /api/users/me/                  내 프로필/토큰 조회, PATCH로 닉네임·아이디 변경 (JWT 필요)
POST /api/users/verify-password/          현재 비밀번호 확인 (JWT 필요)
POST /api/users/change-password/          로그인 상태에서 현재+새비번으로 직접 변경 (JWT 필요)
POST /api/users/find-id/                  이메일+비밀번호 → 마스킹된 아이디 반환 (인증코드 없음)
POST /api/users/password-reset/request/   아이디 → 연동 이메일로 인증코드 발송 (마스킹 이메일 반환)
POST /api/users/password-reset/verify/    인증코드 확인
POST /api/users/password-reset/confirm/   새 비밀번호로 재설정
POST /api/users/email/request/            이메일 연동/변경용 인증코드 발송 (JWT 필요)
POST /api/users/email/confirm/            인증코드 확인 후 이메일 연동/변경 확정 (JWT 필요)
POST /api/users/withdraw/                 회원탈퇴, 비밀번호 재확인 (JWT 필요)
POST /api/users/charge-token/             토큰 충전 (mock PG, { package_id: p100/p500/p1000 }) (JWT 필요)
POST /api/users/reset-token/              토큰 잔액 0으로 초기화 (테스트용) (JWT 필요)

# schedules  (인증: JWT — Authorization: Bearer <access token>)
GET  /api/schedules/                      내 일정 목록 / POST 생성
GET  /api/schedules/bookmarked/           북마크한 일정 목록
GET  /api/schedules/{id}/                 일정 상세 / PATCH / DELETE
POST /api/schedules/{id}/places/          일정에 장소 추가
GET  /api/schedules/{id}/places/{dp_id}/  일정 내 장소 수정/삭제(순서 변경 포함)
POST /api/schedules/{id}/import/          다른 유저의 일정 복제해서 내 일정으로 가져오기
POST /api/media/{id}/import/              미디어의 촬영지들을 통째로 내 일정으로 가져오기
POST/DELETE /api/schedules/{id}/bookmark/ 일정 북마크 추가/삭제

# bookmarks  (인증: JWT — 명소/코스 조회 자체는 비로그인도 가능, 북마크 액션만 JWT 필요)
GET  /api/bookmarks/                      내 북마크 전체 목록 (일정/명소/포토스팟)
POST/DELETE /api/media/{id}/bookmark/     미디어 북마크 추가/삭제
POST/DELETE /api/places/{id}/bookmark/    장소 북마크 추가/삭제
POST/DELETE /api/photos/{id}/bookmark/    사진 북마크 추가/삭제

# course_suggestions (Phase 10-1, JWT)
POST /api/course-suggestions/             코스 건의 등록 { title, link, media_type, description } → 토큰 100개 차감 후 { token_balance } 반환, 잔액 부족 시 400

# places (관리자 포털, Django 템플릿)
GET/POST /places/extract/                 새 추출 (YouTube URL → AI 추론 → DB 저장)
GET      /places/extract/history/         검토 현황 목록 (+ 🗑 삭제 버튼)
POST     /places/extract/{id}/delete/     추출 내역(미디어) 삭제
GET/POST /places/extract/review/{id}/     장소 검토(승인/반려), 위치 수정, 주소 일괄갱신
POST     /places/mediaplace/{id}/revoke/  승인 취소

# places (포토스팟 검수 포털, Phase 11 신설)
GET  /places/photos/review/               AI가 보류(pending) 판정한 포토스팟 목록 + AI 사유/카테고리
POST /places/photos/review/recheck/       보류 전체 AI 재검수 (AI 호출 실패로 쌓인 건 재시도용)
POST /places/photos/{id}/approve/         개별 최종 승인
POST /places/photos/{id}/delete/          개별 최종 삭제(반려)

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

**현황 (2026-07-19 갱신):** Naver Maps API 오류로 Kakao Maps로 임시 전환, 마커 표시는 작동 중. 프론트에서 일정 상세화면(2026-07-19, 여러 장소 마커 지원)까지 KakaoMap 연동이 이미 진행돼 있어 아래 "추후 할 것" 중 지도 자체는 placeholder 단계를 벗어난 상태 — 남은 건 Naver 전환 여부 결정과 경로 안내/주변 탐색 정도.

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

### ✅ Phase 6 — 로그인 시스템 (익명 인증 → 실 계정 전환) (완료 2026-07-21)

**현황 (2026-07-19):** 팀원이 정리한 확인 필요 목록 검토 중 발견 — 리뷰 작성자 구분을 하려면 지금의 `device_id_hash` 익명 시스템(기기 종속, 복구 수단 없음)으론 부족해서 선행 필요.

**현황 (2026-07-21 완료):** 백엔드(회원가입/로그인/JWT/아이디찾기/비밀번호찾기/회원탈퇴/닉네임·아이디변경/이메일연동)와 프론트 계정관리 화면 8개(AccountScreen/EmailChangeScreen/EmailVerifyScreen/IdChangeScreen/PasswordEditScreen/PasswordChangeScreen/PasswordResetScreen/WithdrawalScreen) 실연동까지 실기 테스트로 확인 완료. `schedules`/`bookmarks`/`places`(북마크 액션)/`users`(me·토큰충전·초기화)는 전부 X-Device-ID에서 JWT 인증으로 전환됨.

**✅ SMTP 실연동 완료 (2026-07-27, 실기 수신까지 확인):** `users/email_service.py`의 `send_verification_email()`이 Django `send_mail`(Gmail SMTP)로 실제 발송하도록 교체됨. `settings.py`에 `EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD`(`.env`)가 비어있으면 콘솔 출력(`EMAIL_BACKEND=console`)으로 자동 대체되어 로컬 개발은 계속 크래시 없이 동작. `.env`에 실제 Gmail 계정+앱 비밀번호를 채운 뒤 인증코드 메일을 보내 Gmail 받은편지함 수신까지 직접 확인 완료. 발송 실패 시 예외를 그대로 올려서 호출한 뷰가 500으로 응답함(성공 여부 불확실한 상태에서 200을 보내지 않기 위함).

**왜 필요한가:**
Review 신설(Phase 7)에서 작성자를 구분하려면 실 계정이 필요합니다. 지금은 기기를 바꾸거나 앱을 재설치하면 계정(토큰잔액·북마크·일정)이 통째로 사라지는 구조라, 로그인/복구 수단이 먼저 있어야 합니다.

**결정된 사항 (2026-07-21 Figma 5종 화면 반영 — 아래로 갱신, 취소선 항목은 폐기):**
- 아이디 / 이메일 / 비밀번호 분리 (아이디≠이메일).
- ~~닉네임은 가입 시 자동생성 후 마이페이지에서 수정 가능~~ → **닉네임은 회원가입 시 필수 입력 필드** (한글+영문+숫자, 2~10자). 자동생성 방식 폐기.
- 아이디: 영문+숫자만, 5~20자 (Figma 에러 문구 기준. 기존 계획에 있던 `_`/`.` 허용, 4자 하한은 폐기)
- 비밀번호: 8자 이상 + 영문/숫자/특수문자 3종류 모두 필수, 아이디와 동일한 비밀번호 금지, **최근 사용했던 비밀번호 재사용 금지**(비밀번호 변경/재설정 시, 신규)
- ~~이메일: 가입 시 필수 수집~~ → **이메일은 완전히 선택.** 회원가입 화면엔 이메일 필드 자체가 없고, 가입 완료 직후 팝업("이메일 연동을 진행하시겠습니까?")에서 연동 여부 선택. 스킵해도 MY페이지에서 언제든 연동 가능. 이메일 1개당 계정 1개(unique, null 허용)
- 이메일 인증코드: 가입 시점엔 안 함. **MY페이지 이메일 연동/변경** 및 **비밀번호 재설정** 두 곳에서 공통 사용 (6자리 숫자, 유효 5분, 재발송 제한 60초)
- **아이디 찾기**(신규 API, 기존 계획에 없었음): 이메일+비밀번호 입력 → 일치하면 마스킹된 아이디 즉시 반환 (인증코드 불필요, 계정 존재 여부는 노출 안 함)
- **비밀번호 재설정**: 아이디 입력 → 계정 존재 확인 → 연동된 이메일로 인증코드 발송(마스킹 표시, 예 `12****@n****.com`) → 코드 확인 → 새 비밀번호 입력
- **이메일 미연동 계정이 아이디 찾기/비밀번호 재설정 시도 시**(2026-07-21 결정): 인증코드를 보낼 이메일이 없으므로 **에러 메시지로 막음** ("입력하신 정보와 일치하는 계정을 찾을 수 없습니다" 문구 재사용). 별도 복구 수단은 지금 단계에선 안 만듦.
- 로그인 실패 시 "등록되지 않은 아이디이거나, 비밀번호가 올바르지 않습니다" — 계정 존재 여부 비노출
- 이메일 발송: SMTP 실제 연동은 보류, 지금은 발송 함수를 인터페이스로 추상화만 해두고 나중에 붙임
- 세션 관리: 기존 `X-Device-ID` 헤더 인증 → JWT(access+refresh) 방식으로 전환
- 기존 `device_id_hash` 익명 테스트 데이터는 보존 불필요 — `User` 모델 새로 설계
- 회원탈퇴: 동일 아이디/이메일로 재가입 가능, 탈퇴 시 데이터·토큰 소멸 및 환불 불가 (Figma 문구 기준)

**구현 완료:**
1. ~~`User` 모델 재설계~~ — ✅ `password_hash`/`username`/`nickname`/`email` 추가, `device_id_hash`는 nullable로 전환(익명 계정과 공존)
2. ✅ `PasswordHistory`(재사용 검사), `EmailVerificationCode`(연동/재설정 공용, purpose 필드로 구분) 모델 추가
3. ✅ 회원가입 / 로그인 / 아이디 찾기 / 비밀번호 찾기(이메일 인증코드 3단계) / 회원탈퇴 / 비밀번호 확인·직접변경 / 이메일 연동 API
4. ✅ JWT(PyJWT 직접 구현, access 30분/refresh 14일) 발급·갱신, `schedules`/`bookmarks`/`places`(북마크 액션)/`users`(me·토큰충전·초기화) X-Device-ID → JWT 전환 완료. 단 익명 계정 생성(`POST /api/users/`)과 `users/middleware.py`는 프론트 앱 부팅 로직이 아직 의존 중이라 유지
5. ✅ 프론트 `api.ts`에 토큰 저장소+`Authorization` 인터셉터+401 자동갱신 구축, 계정관리 화면 8개 실연동 완료

**남은 것:**
- **SMTP 실제 연동** (위 경고 참고 — 현재 콘솔 출력으로 대체 중)
- 정식 로그인/회원가입 화면 디자인 반영 — 지금은 `frontend/app/DevAuthScreen.tsx` (디자인 없는 테스트 전용 화면, `SettingScreen` 하단에 임시로 연결됨)로 대체 중, Figma 디자인 나오면 이걸로 교체하고 DevAuthScreen은 삭제
- 아이디 변경 7일 재변경 제한 — 프론트 디자인 작업과 함께 나중에 추가 예정 (지금은 프론트/백엔드 둘 다 미구현, 매번 변경 가능)
- **개인정보 처리방침/이용약관 화면**(아직 Figma 디자인 없음, 회원가입 플로우에 필요)
- `find-id`(아이디 찾기) API는 완료됐지만 아직 연결된 프론트 화면 없음

---

### Phase 6.5 — 명소 상세화면 정보출처 UI 마무리 (2026-07-21 확정, 미착수)

**현황:** "장소 소개문 섹션 삭제"는 프론트에 반영 완료(커밋 `709d0ed`). 아래 세부 사항은 아직 미반영.

**결정된 사항:**
- 출처 하이퍼링크 차등화: **카카오** 소스는 "카카오맵에서 보기" 같은 버튼으로 딥링크 연결 / **관광공사** 소스는 하이퍼링크 없이 출처 표시만 (관광공사는 기본 데이터 제공용, 카카오는 실사용 지도 앱 연결용이라는 역할 구분)
- 관광공사/카카오 전환 토글 스팸클릭 방지: 1초 내 5회 이상 클릭 감지 시 5초간 잠금
- 헤더 레이아웃: 토글 버튼을 헤더에 상시 노출하지 않고 "더보기" 메뉴 안으로 이동 (모바일 헤더 공간 부족 문제로 결정)

---

### ✅ Phase 7 — 리뷰 시스템 (완료 2026-07-21)

**현황 (2026-07-19):** 프론트 `reviewApi`는 대상 구분 없이 전체 리뷰를 반환하는데, 실제로는 **백엔드에 Review 모델 자체가 없어서** `/api/reviews/`는 404 — 지금은 전부 mock 데이터(`mockReviewStore`)로만 동작 중.

**왜 필요한가:** 코스/명소/포토스팟 상세화면과 마이 탭 리뷰관리창에서 실제 리뷰 데이터를 다루려면 필요.

**구현 완료:**
- `reviews` 앱 신설. 리뷰 대상: 장소 / 코스(Media) / 포토스팟 3종. 북마크와 동일한 패턴으로 `PlaceReview` / `MediaReview` / `PhotoReview` 3개 모델 분리
- 필드: 작성자(User FK), 작성일자, 다녀온 날짜(텍스트, `Schedule` FK 아님), 별점(0.5~5, 0.5단위 검증), 본문, 사진(JSONField로 URL 배열), 좋아요
- API: `GET /api/reviews/?type=&id=`(대상별 목록, 공개), `POST /api/reviews/`(작성, JWT), `GET/PATCH/DELETE /api/reviews/<type>/<pk>/`(본인만 수정·삭제), `GET /api/reviews/mine/?type=`(마이 탭용 — 대상 무관 내 리뷰 전체, 대상 정보 포함해서 반환)
- 프론트: `CourseDetailScreen`/`PlaceDetailScreen`/`PhotoSpotDetailScreen`/`ReviewManageScreen`/`ReviewWriteScreen` 5개 화면 전부 mock에서 실연동 전환. `ReviewManageScreen`은 원래 "대상 구분 필드 없어서 대표 항목 1개로 자리표시"하던 걸 실제 리뷰별 대상 정보로 교체, 카드 탭하면 해당 코스/장소/포토스팟 상세로 이동하는 것도 추가
- 리뷰 작성 시 토큰 지급 — 아래 "우편함/정산함" 항목 참고 (10토큰으로 확정)

---

### ✅ Phase 8 — 인기 코스 정렬 (완료 2026-07-27)

**현황 (완료 전):** `MainScreen`이 `mediaApi.getList()` 결과를 그대로 `slice(0,4)`/`slice(4,8)`로 잘라서 "인기"/"추천"으로 표시 중 (실제 정렬 아님).

**결정된 사항 (2026-07-27 확정):** Media에는 실제 "좋아요" 기능이 없다는 게 확인돼(Photo/리뷰에만 likes 필드가 있고, 리뷰 likes는 증가시키는 API 자체가 없어 항상 0) "좋아요+북마크 수" 원안 대신 **북마크 수 + 리뷰 개수 합산**으로 확정 — 실제로 존재하는 신호만 사용.

**구현 완료:**
- `MediaViewSet.get_queryset`(`places/views.py`)에 `?ordering=popular` 지원 추가 — `Count('bookmarks', distinct=True)` + `Count('reviews', distinct=True)` 합산 내림차순(동점 시 최신순). 실서버에서 북마크 추가 시 순위가 실제로 바뀌는 것까지 확인.
- 프론트 `mediaApi.getList`에 `ordering` 파라미터 추가(mock 모드는 `like_count` 목업값으로 대체 정렬).
- `MainScreen.tsx`의 "인기 코스"와 `CourseScreen.tsx`의 "실시간 인기 코스" 두 곳을 하드코딩 slice 대신 `ordering: 'popular'` 결과로 교체.
- **"추천"/"맞춤형 여행 코스" 섹션은 그대로 둠** — 개인화 추천 로직은 별도 설계 대상(아래 "보류 — 추천/유행 로직" 항목)이라 Phase 8 범위 밖.

---

### ✅ Phase 9 — 포토스팟 키워드 검색 (완료 2026-07-21, Phase 10-2 작업 중 같이 처리됨)

**현황 (2026-07-19):** `photoApi.getList()`가 파라미터를 받지 않아 `SearchResultScreen`의 포토스팟 탭 검색이 동작하지 않음. 백엔드에도 Photo 전용 검색 엔드포인트 없음.

**구현 완료:** `PhotoViewSet` 신설(아래 Phase 10-2 항목 참고)에 `keyword` 필터 포함 — 포토스팟 설명(description) + 소속 장소 이름 둘 다 검색. `SearchResultScreen`도 `photoApi.getList({ keyword })`로 실제 검색되게 수정.

---

### Phase 10 — 신규 요구사항 (2026-07-21 논의)

1. ✅ **코스 추가 건의함** (완료 2026-07-27) — 프론트가 7/26에 `CourseSuggestionWriteScreen` + `courseSuggestionApi`를 먼저 구현해두고 백엔드 엔드포인트만 미착수 상태였음. `course_suggestions` 앱 신설(`reviews`/`mailbox`와 동일하게 독립 앱), `CourseSuggestion` 모델(user FK, title, link, media_type(drama/movie/youtube), description, status(pending/reviewed)) 추가. `POST /api/course-suggestions/` (JWT 필요) — 토큰 100개(`COURSE_SUGGESTION_TOKEN_COST`, 프론트와 동일값 유지 필요) 차감 후 생성, 잔액 부족 시 400. Django Admin에 목록/필터 + "검토완료로 표시" 일괄 액션 등록(커스텀 검토 포털은 아직 없음, 필요해지면 포토스팟 검수 포털처럼 추가 가능). 실서버로 회원가입→로그인→토큰충전→건의생성 전체 플로우 curl로 검증 완료.
2. ✅ **포토스팟 사용자 업로드** (완료 2026-07-21) — `Photo`에 `uploaded_by`/`is_approved`/`last_rewarded_likes` 추가. `POST /api/photos/`로 업로드하면 승인 대기(`is_approved=False`) 상태로 생성, 목록/상세 API는 승인된 것만 노출. Django Admin에 `Photo` 등록 + "선택한 포토스팟 승인" 일괄 액션으로 관리자 승인. `PhotoViewSet` 신설(목록/상세/업로드/좋아요, `GET /api/photos/{id}/`가 장소+같은장소사진+관련사진까지 포함하는 `PhotoSpotDetail` 모양). 좋아요는 `PhotoLike`(user+photo unique)로 중복 방지, `POST/DELETE /api/photos/{id}/like/`. **프론트는 업로드 화면 자체가 아직 없어서(디자인 미정) API만 준비된 상태** — `PhotoSpotDetailScreen`의 기존 "저장" 버튼은 북마크와 함께 좋아요도 같이 호출하도록만 연결해둠.
3. ✅ **우편함/정산함 보상 시스템** (완료 2026-07-21, 원래 로드맵엔 없던 신규 항목) — `mailbox` 앱 신설. `MailboxItem`(1회성 고정보상, 예: 리뷰 작성 10토큰 — 리뷰 생성 API에서 자동 지급)과 `SettlementItem`(누적/마일스톤 보상, 예: 유저 업로드 포토스팟이 좋아요 50개 달성 시 100토큰, 이후 10개마다 10토큰 — `Photo.last_rewarded_likes`로 중복 지급 방지)을 별도 모델로 분리(하나로 합치면 마일스톤 중복지급 버그 위험이 있어서 분리 결정). 각각 목록/개별수령/일괄수령 API. 프론트는 이미 있던 `MailboxScreen`이 API 계약과 정확히 일치해서 코드 수정 없이 바로 연동됨. **정산함 화면은 아직 없음**(`settlementApi`만 준비, `MailboxScreen` 구조 재사용하면 될 듯).

---

### ✅ Phase 11 — 포토스팟 AI 검열 + 실제 이미지 업로드 (완료 2026-07-23)

**왜 필요한가:** 유저가 포토스팟에 사진을 올릴 때 선정성/폭력성/도박/혐오표현/마약 등 부적절한 사진이 그대로 게시되면 안 됨. 또한 프론트가 `ImagePicker` 결과(로컬 기기 URI)를 그대로 `image_url`로 보내고 있어서, 실제로는 서버가 접근 가능한 이미지가 하나도 없는 상태였음(AI 검열도, 다른 유저 노출도 전부 불가능).

**구현 완료:**

1. **AI 1차 검열** (`places/moderation.py`) — Gemini 2.5 Flash 비전으로 대표사진+부사진 전체를 검사해 선정성/폭력성/도박/혐오표현/마약 여부 판단(JSON 구조화 출력). 업로드 직후 자동 실행 → 안전하면 즉시 `approved`+게시 보상 지급, 의심되면 `pending`(관리자 검토 대기)으로 저장. **AI 호출 실패(API 에러 등) 시 무조건 `pending`으로 fail-safe** — 검열 없이 자동 승인되는 사고 방지.
2. **관리자 포토스팟 검수 포털** — `/places/photos/review/`에서 보류 목록 + AI 사유/카테고리 확인, 항목별 최종승인/삭제. "AI 전체 재검수" 버튼으로 API 오류 등으로 쌓인 보류 건 일괄 재시도 가능.
3. Django admin의 반려 액션을 상태 변경이 아니라 **완전 삭제**로 변경 (관리자 최종 결정은 승인 또는 삭제 둘 중 하나).
4. `Photo` 모델 필드 보강: `travel_date`(CharField, 프론트가 보내는 `'YYYY.MM.DD'` 문자열 그대로 저장), `content`(TextField, 상세설명) 추가 — 프론트는 이미 이 필드들을 보내고 상세화면에서 읽고 있었는데 백엔드에 없어서 `formatDateDots(undefined)` 크래시 발생하던 문제 해결.
5. `PhotoSerializer`에 `author`(닉네임), `isMine` 필드 추가. `GET /api/photos/?author=` 필터와 `GET /api/photos/mine/` 엔드포인트 신규 추가 — `UserPhotoSpotsScreen`/`PhotoSpotManageScreen`이 mock에서만 동작하던 문제 해결.
6. **이미지 업로드 엔드포인트** (`POST /api/photos/upload-image/`) — multipart 파일을 받아 로컬 디스크(`MEDIA_ROOT`)에 저장하고 절대 URL 반환. `settings.py`에 `MEDIA_URL`/`MEDIA_ROOT` 추가, 개발 서버(`DEBUG=True`)에서 `/media/` 경로로 정적 서빙하도록 `YogiEoddae/urls.py`에 `static()` 추가. `backend/media/`는 `.gitignore` 처리.

**남은 것:**
- **프론트 연동 필요**: `PhotoSpotWriteScreen`이 여전히 `ImagePicker` 결과(`result.assets[0].uri`, 로컬 기기 경로)를 그대로 `image_url`로 보내고 있음. 사진 선택 직후(또는 업로드 제출 시) 각 이미지를 `POST /api/photos/upload-image/`로 먼저 보내고, 응답으로 받은 `image_url`을 `photoApi.upload`/`update`에 넘기도록 수정 필요. (프론트 담당 영역이라 이번엔 보류)
- **업로더 아바타** — `User` 모델에 프로필 이미지 필드 자체가 없음. 위 이미지 업로드 엔드포인트가 실제로 쓰이기 시작하면(=이미지 저장 방식이 검증되면) `User`에도 같은 방식으로 avatar 필드 추가 예정.
- 아래 "이미지 스토리지 배포 전환 가이드" 참고 — 지금은 로컬 디스크 저장, 실 서버 배포 시 전환 필요.

**사용법 (프론트 참고용):**
```
1. POST /api/photos/upload-image/  (multipart, field name: "image", JWT 필요)
   → { "image_url": "http://<서버>/media/photos/<uuid>.jpg" }
   대표사진 1장 + 부사진 최대 10장, 총 최대 11번 호출
2. 받은 image_url들을 POST /api/photos/ 의 image_url / sub_image_urls에 그대로 사용
```

---

#### 이미지 스토리지 배포 전환 가이드 (S3 / R2 등으로)

**지금 상태:** 로컬 디스크(`backend/media/`)에 저장, Django 개발 서버가 `/media/`로 직접 서빙 (`DEBUG=True`일 때만 동작). "내 PC = 서버"인 지금 개발 단계에는 문제 없지만, 실제 클라우드 호스팅(Heroku/Railway 등)에 배포하면 디스크가 휘발성이라 재배포 시 업로드된 이미지가 사라질 수 있음.

**전환이 쉬운 이유:** `views.py`의 `upload_image`는 Django의 `default_storage` 추상화(`django.core.files.storage`)만 사용하고 있어서, **스토리지 백엔드를 바꿔도 이 코드는 한 줄도 안 고쳐도 됨** — `settings.py`에서 어떤 스토리지를 쓸지 설정만 바꾸면 `default_storage.save()`/`.url()`이 알아서 새 백엔드를 씀.

**전환 절차 (배포 시점에 진행):**
1. `pip install django-storages boto3` (S3 계열이면 이걸로 충분 — Cloudflare R2도 S3 호환 API라 동일하게 사용 가능)
2. 클라우드에서 버킷 생성 (S3 버킷 또는 R2 버킷) + 접근 키 발급
3. `.env`에 추가: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME` (R2면 `AWS_S3_ENDPOINT_URL`도 추가)
4. `settings.py`에 추가:
   ```python
   INSTALLED_APPS += ['storages']
   STORAGES = {
       'default': {'BACKEND': 'storages.backends.s3.S3Storage'},
       'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
   }
   ```
5. `YogiEoddae/urls.py`의 `if settings.DEBUG: urlpatterns += static(...)` 부분은 그대로 둬도 무해함(로컬 개발 시 계속 필요) — 배포 환경에선 `DEBUG=False`라 자동으로 안 쓰임.
6. 기존에 로컬 `media/`에 쌓인 파일이 있으면 배포 전에 버킷으로 한 번 복사(`aws s3 sync backend/media/ s3://<버킷명>/`).

이렇게 하면 `upload_image` 액션도, `moderate_photo`의 이미지 다운로드 로직도 코드 변경 없이 그대로 동작함(둘 다 최종적으로 "HTTP로 접근 가능한 URL"만 있으면 되는 구조).

---

### 보류 — 추천/유행 로직 + 테마 노출 시스템 (Phase 6~9 이후 별도 설계)

- **추천 로직**: (a) 최근 조회한 장소/일정의 태그 합산 상위 방식, (b) 최근 저장(북마크) 급증 감지 = "유행" 방식 — 두 후보 모두 태그 유사도 계산·트렌드 스코어링 등 설계가 필요해 별도 세션으로 미룸
- **"이 달의 테마"**: `CourseScreen`이 `allMedia[1]`/`allMedia[5]` 인덱스 하드코딩 중. 단순 `is_theme` boolean으론 부족 — "무한 확장되는 테마 종류 + 인기/추천/유행 등 여러 슬롯에 노출" 구조가 필요해 `Theme` 모델을 별도로 설계해야 함

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
| User/Auth | ✅ 있음 (`users` 앱, 실계정 username/nickname/email/password_hash + JWT) | Phase 4·6 완료 |
| MediaBookmark/PlaceBookmark/PhotoBookmark/ScheduleBookmark | ✅ 있음 (`bookmarks`, `schedules` 앱) | 원래 로드맵엔 없던 보너스 구현 |

---

## 2026-07-21 실기 테스트로 발견/수정한 버그 (Phase 6·7 작업 중)

- **JWT 만료 시 403으로 응답되던 문제**: `JWTAuthentication`에 `authenticate_header()`가 없어서 DRF가 인증 실패를 401 대신 403으로 내려보냈고, 프론트의 401 기준 자동 refresh 로직이 못 걸려서 만료된 토큰이 공개 API까지 전부 막아버렸음. `authenticate_header()` 추가로 해결.
- **웹에서 GET 캐시로 최신 데이터 미반영**: `apiClient`에 `Cache-Control: no-cache` 헤더 추가 (단, 이것 때문에 CORS 프리플라이트가 막히는 부작용 있었음 — 아래 항목 참고).
- **CORS 프리플라이트 실패(웹)**: 위 `Cache-Control`/`Pragma` 헤더가 Django `CORS_ALLOW_HEADERS`에 없어서 웹에서 모든 API 호출이 막힘. 헤더 목록에 추가해서 해결.
- **카카오맵이 화면 스크롤을 가로채는 문제**: `CourseDetailScreen`/`PlaceDetailScreen`/`PhotoSpotDetailScreen` 전체를 `TouchableWithoutFeedback`(더보기 메뉴 바깥탭 닫기용)으로 감싸놓은 게 스크롤 제스처 우선권을 계속 가져가던 게 근본 원인. 메뉴 열려있을 때만 오버레이 뜨도록 수정. 추가로 `KakaoMap`도 기본적으로 터치를 안 받다가(`pointerEvents: none`) 탭하면 그 안에서만 조작 가능하도록 변경.
- **카카오맵 SDK 도메인 화이트리스트**: 카카오 JS 키는 등록된 도메인에서만 동작하는데, 앱(WebView)에서 인라인 HTML로 지도를 로드하면 origin이 없어서(about:blank 등) 화이트리스트 어디에도 안 걸려 조용히 실패함. `WebView`의 `source.baseUrl`을 카카오 콘솔에 등록해둔 도메인(`http://localhost`)으로 지정해서 그 도메인에서 로드된 것처럼 맞춰 해결. **다른 곳에서 카카오맵을 새로 붙일 때도 이 baseUrl 지정을 빠뜨리면 똑같이 조용히 실패하니 주의.**

---

## 알려진 이슈

| 이슈 | 상태 | 비고 |
|---|---|---|
| Naver Maps API 작동 안 함 | 미해결 | Kakao로 임시 대체. **신규 정보:** Ncloud "Application Services > Maps" 콘솔(2025-03-20 출시)에서 재등록 필요 가능성 — Phase 5 항목 참고 |
| YouTube API 미연동 | ✅ 구현 완료 | Phase 2 완료, 최근 주소 교차검증으로 정확도 개선 |
| confidence_score 업데이트 로직 없음 | 필드만 있음 | Phase 3, 현재 유일하게 남은 핵심 작업 |
| 사용자 인증 없음 | ✅ 해결됨 | `users` 앱에 익명 device_id 기반 인증 구현 완료 (Phase 4), Phase 6에서 JWT 실계정으로 전환 |
| 이메일 SMTP 미연동 | ✅ 해결됨 | Gmail SMTP 연동 완료, 실기 수신까지 확인(2026-07-27) — Phase 6 항목 참고 |

---

## 다음 작업 우선순위 (2026-07-27 기준)

Phase 10-1(코스 건의함), SMTP 연동(실기 수신 확인까지)까지 완료(2026-07-27). 아래 순서대로 진행 예정.

1. **🟡 Phase 3 — Quiz + 신뢰도 계산** — 유일하게 남은 핵심 로직 단계. `Quiz` 모델 + 퀴즈 API + `confidence_score` 갱신 로직.
2. **🟢 Phase 8 — 인기 코스 정렬** — `MediaViewSet`에 좋아요+북마크 합산 정렬 파라미터만 추가하면 됨, 비교적 가벼움.
3. 완료됨 — ✅ Phase 10-1 코스 건의함, ✅ SMTP 실연동 (둘 다 2026-07-27, 위 항목 참고). 코스 건의함은 `COURSE_SUGGESTION_TOKEN_COST`(현재 100) 값 확정 및 관리자 검토 포털 필요 여부가 아직 미정 — 필요 시 추가 논의.
4. 그 외 미착수: 아이디 변경 7일 제한(Phase 6 잔여), Phase 10-1 코스 추가 건의함(설계 전), User 아바타 필드(이미지 업로드 프론트 연동 검증 후), Naver Maps 전환 여부(Phase 5, 낮은 우선순위), 추천/유행 로직(보류, 별도 설계 필요).

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
