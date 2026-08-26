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
| quiz | `QuizSubmission` / `QuizAnswer` | user+media(재제출 방지) / media_place FK, answer_text, is_correct | ✅ 완료 (Phase 3, 2026-07-27) |

### API 엔드포인트

```
# places (DRF ViewSet, /api/)
GET  /api/places/              전체 장소 목록 (keyword/category/unverified/tag 필터)
GET  /api/places/{id}/         장소 상세
GET  /api/places/map/          지도용 좌표 + 연결 미디어 (media_id 필터)
GET  /api/media/               전체 미디어 목록 (type/tag/ordering=popular 필터)
GET  /api/media/{id}/          미디어 상세 + 촬영지 목록
GET  /api/media/{id}/places/   특정 미디어의 촬영지만 조회
POST /api/media/{id}/quiz/submit/  퀴즈 제출 { answers: { media_place_id: 답안 } } (Phase 3, JWT 필요)
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

# course_suggestions (건의함 검토 포털, Phase 10-1 신설, 2026-07-27)
GET  /course-suggestions/review/          전체 코스 건의 목록 (한 페이지)
POST /course-suggestions/{id}/review/     개별 검토완료로 표시
POST /course-suggestions/{id}/delete/     개별 삭제

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

### ✅ Phase 3 — Quiz + 신뢰도 계산 (완료 2026-07-27)

**현황 (완료 전, 2026-06-22 기준):**  
`Photo` 모델은 이미 존재하고, `MediaPlace.status`에 `quiz_confirmed` 값도 정의돼 있지만 이 상태로 전환시키는 로직이 어디에도 없었음. `confidence_score`는 추출 시점에 한 번 세팅된 뒤 갱신되지 않았음.

**설계가 원안과 달라진 이유 (2026-07-27):** 프론트에 `QuizListScreen`/`QuizDetailScreen`이 이미 구현돼 있었는데, 원안("`GET /api/quiz/`로 미확정 장소 중 랜덤 객관식 퀴즈 반환")과 달리 실제로는 **미디어 하나당 그 미디어의 승인된 장소 전부를 한 번에 보여주고 각 장소를 자유서술로 맞히는 방식**이었음 — 그래서 API도 새로 만들지 않고 프론트가 이미 호출하던 계약(`GET /api/media/{id}/places/`로 문제 목록, `POST /api/media/{id}/quiz/submit/`로 일괄 제출)에 백엔드를 맞춤.

**구현 완료 (1차, 이름 맞히기 퀴즈):**

1. `quiz` 앱 신설. 별도 `Quiz` 모델(media_place FK + photo FK + 집계 필드) 대신 `QuizSubmission`(user+media, 재제출 방지용 unique)과 `QuizAnswer`(submission FK, media_place FK, answer_text, is_correct) 두 모델만 사용 — 집계는 매번 `QuizAnswer`를 카운트해서 계산(캐시 컬럼 없음, "힌트 사진"은 이미 화면에 쓰던 `place.image_url` 재사용이라 별도 Photo 연결 불필요).
2. **정답 판정**: `quiz/services.py`의 `is_answer_correct()` — 공백 제거 후 대소문자 무시하고 양방향 포함관계(`"해운대"` ⊂ `"해운대해수욕장"`)면 정답. 관리자 개입 없이 즉시 자동 채점(2026-07-27 결정, 관리자 수동 검수 방식은 기각).
3. **API**: `MediaViewSet`에 `POST /api/media/{id}/quiz/submit/` 액션 추가(JWT 필요) — `{ answers: { media_place_id: 답안 } }` 받아서 채점 후 `{ correct_count, total_count }` 반환. 이미 제출한 유저는 400. `MediaSerializer`/`MediaDetailSerializer`에 `is_submitted` 필드 추가(`QuizListScreen` 카드 잠금 표시용).
4. **보상**: 참여 시 3토큰(프론트 하드코딩 문구와 동일), 정답 개수당 5토큰 보너스 — 둘 다 우편함(`MailboxItem`)으로 지급.

**2026-07-27 추가 논의 — "방문 개연성" 가중치 (구현 완료):** 1차 구현 직후 원래 의도를 다시 확인해보니, 진짜 목표는 "장소 이름을 아는지 테스트"가 아니라 **"실제로 그 장소에 가봤을 사람의 응답으로 크라우드소싱 신뢰도를 얻는 것"**이었음 (일반 퀴즈 응답자는 사진만 보고 이름을 맞히는 거라 실제 방문 여부와 무관 — 검색해서 맞혀도 정답 처리됨). 이 간극을 메우기 위해 아래 로직 추가:

- **방문 개연성 판정** (`is_probable_visit()`): 유저가 그 장소를 자신의 일정(`DailyPlace`, 코스 연동 여부 무관 — 아무 일정에서든 인정)에 넣었고, **`일정 생성일 < 배정된 날짜(day_number 기준 그 하루) < 오늘`**이면 방문 개연성이 있다고 판단. "일정 생성일이 배정일보다 앞서야 한다"는 조건 덕분에, 퀴즈 문제를 보고 그 자리에서 과거 날짜로 급조한 일정은 걸러짐. (남은 허점: `DailyPlace`에 자체 생성/수정일이 없어서, 오래전에 만든 일정에 "오늘" 장소를 추가/수정하는 경우까지는 못 막음 — 지금 규모에선 감수하기로 함, 필요해지면 `DailyPlace`에 타임스탬프 추가 고려)
- **채점**: 방문 개연성이 있는 유저의 답변은 `place.name`과 매칭하지 않고 **무조건 정답 처리**(`grade_answer()`) — 지식 테스트가 아니라 데이터 수집이 목적이라 뭐라고 적든 상관없음.
- **가중치**: 일반 답변 1.0, 방문 개연성 답변 1.3. `recalculate_media_place()`가 `confidence_score = (가중 정답 합) / (가중 전체 합)`으로 계산 — 신뢰도 있는 응답 1개가 일반 응답 다수의 반대 의견을 뒤집지 못하도록 배율을 낮게 잡음. 단, **"응답 수 N개 이상" 게이트는 가중치와 무관하게 원본 응답 개수**로만 판정(가중치 합산으로 게이트를 채우는 걸 막기 위함).
- **보상**: 유저에게 두 유형을 구분해서 보여주지 않기로 했으므로(어떤 문제가 "방문 개연성" 문제인지 숨김), 정답 보상도 동일하게 5토큰 — 특별 취급 없음.
- `QuizAnswer`에 `weight`(FloatField)/`is_probable_visit`(BooleanField) 필드 추가, 관리자 화면에서는 확인 가능.
- 실서버로 검증: 실제 과거 방문(생성일<배정일<오늘) → 엉뚱한 답변도 강제 정답 처리 확인. 방금 급조한 백데이팅 일정 → 무시되고 일반 채점으로 폴백 확인. 가중 평균 계산도 "신뢰 응답 1개 + 반대 응답 2개"는 확정 안 되고 "신뢰 응답 1개 + 동의 응답 2개"는 정확히 confidence 1.0으로 확정되는 것까지 확인.

**남은 것:** `QUIZ_MIN_RESPONSES`(3)/`QUIZ_CONFIRM_THRESHOLD`(0.8)/`QUIZ_CORRECT_ANSWER_REWARD`(5)/`QUIZ_PROBABLE_VISIT_WEIGHT`(1.3) 값은 실제 서비스 트래픽 보고 조정 필요 — 지금은 사용자 수가 적은 프로젝트 특성을 감안한 잠정값. `DailyPlace` 타임스탬프 부재로 인한 잔여 어뷰징 허점(위 참고)도 후순위 검토 대상.

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
- ~~SMTP 실제 연동~~ — ✅ 완료 (2026-07-27, 위 항목 참고)
- 정식 로그인/회원가입 화면 디자인 반영 — 지금은 `frontend/app/DevAuthScreen.tsx` (디자인 없는 테스트 전용 화면, `SettingScreen` 하단에 임시로 연결됨)로 대체 중, Figma 디자인 나오면 이걸로 교체하고 DevAuthScreen은 삭제
- 아이디 변경 7일 재변경 제한 — 프론트 디자인 작업과 함께 나중에 추가 예정 (지금은 프론트/백엔드 둘 다 미구현, 매번 변경 가능)
- **개인정보 처리방침/이용약관 화면**(초안은 `docs/privacy-policy.md`/`docs/terms-of-service.md`로 작성해뒀으나 검토 전이라 미커밋 상태, 회원가입 플로우에 필요)
- `find-id`(아이디 찾기) API는 완료됐지만 아직 연결된 프론트 화면 없음
- **이메일 발송 버튼 중복 클릭 방지** (2026-07-27 실기 테스트 중 발견) — `EmailSetupScreen.tsx`/`EmailChangeScreen.tsx`의 "인증 메일 발송" 버튼이 요청 중에도 비활성화되지 않아서, 응답이 늦으면 유저가 재클릭 → 중복 요청(두 번째는 60초 쿨다운 429) 발생. 기능 자체는 정상 동작(첫 요청은 성공)하지만 로딩 상태 표시 없음. 또한 400 에러 사유(빈 이메일/중복 이메일)를 구분 안 하고 항상 "이미 사용중인 이메일"로 표시하는 것도 같이 손볼 것.

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

1. ✅ **코스 추가 건의함** (완료 2026-07-27) — 프론트가 7/26에 `CourseSuggestionWriteScreen` + `courseSuggestionApi`를 먼저 구현해두고 백엔드 엔드포인트만 미착수 상태였음. `course_suggestions` 앱 신설(`reviews`/`mailbox`와 동일하게 독립 앱), `CourseSuggestion` 모델(user FK, title, link, media_type(drama/movie/youtube), description, status(pending/reviewed)) 추가. `POST /api/course-suggestions/` (JWT 필요) — 토큰 100개(`COURSE_SUGGESTION_TOKEN_COST`, 프론트와 동일값 유지 필요) 차감 후 생성, 잔액 부족 시 400. 실서버로 회원가입→로그인→토큰충전→건의생성 전체 플로우 curl로 검증 완료.
   - **커스텀 검토 포털 추가** (2026-07-27) — Django 기본 admin(슈퍼유저 필요)이 아니라 포토스팟 검수 포털과 동일한 스타일로 `/course-suggestions/review/` 페이지 신설. 전체 건의를 한 페이지에서 확인, 건별 "검토완료로 표시"/"삭제" 가능. 관리 포털 대시보드(`/`)에도 카드 추가(대기 건수 배지 포함). 로그인 없이 접근 가능(다른 관리자 포털 페이지들과 동일한 보안 수준 — 로컬/소규모 배포 전제).
   - **버그로 발견한 것**: fetch로 POST하는 관리자 페이지들(`document.cookie`에서 csrftoken 직접 읽는 패턴)은 템플릿에 `{% csrf_token %}` 태그가 없으면 Django가 쿠키 자체를 안 심어줘서 CSRF 403이 남 — 포토스팟 검수 포털도 동일한 잠재 버그 보유(지금까지 우연히 다른 경로로 쿠키가 있었을 가능성). 이번 신규 페이지는 뷰에 `@ensure_csrf_cookie` 데코레이터를 붙여 해결. **포토스팟 검수 포털도 언젠가 같은 방식으로 고쳐야 함** (지금 당장 문제가 없다면 후순위).
   - **버그 수정**: `admin_photo_review.html`의 "← 관리 포털" 링크가 존재하지 않는 `/places/`를 가리켜서 404 나던 것을 `/`로 수정 (2026-07-27, 코스 건의함 포털 테스트 중 발견한 기존 버그).
   - **후속 아이디어 — 건의함 → 장소 추출 원클릭 연동** (2026-07-27, 미착수): 코스 건의함 검토 포털에서 건의 항목을 바로 `/places/extract/`(YouTube 장소 추출 도구)로 넘겨서 폼을 미리 채워주는 기능. 지금은 관리자가 건의 내용(링크·제목·미디어유형)을 보고 추출 화면에 수동으로 옮겨 입력해야 하는데, 건의의 `link`→`url`, `title`→`media_title`, `media_type`→`media_type`, `description`→참고용 `scene` 정도로 매핑해서 자동 프리필하면 검토→추출 처리 속도가 빨라질 것. `admin_extract_view`가 이미 `?media_id=`로 기존 Media를 프리필하는 유사 패턴을 갖고 있어서(GET 쿼리파라미터로 폼 필드 채우기) 참고해서 확장하면 될 듯.
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

### ✅ Phase 12 — 유튜브 재생목록/채널 일괄 추출 (백엔드 구현 완료 2026-07-30)

**왜 필요한가:** 지금 `/places/extract/`는 영상 1개 URL만 받아 처리 가능. 예능/여행 유튜버처럼 촬영지가 재생목록 단위로 흩어진 콘텐츠는 영상마다 URL을 일일이 복사해서 반복 실행해야 해서 비효율적.

**결정된 사항 (2026-07-30):**
- 기존 단일 영상 추출 폼(`admin_extract.html`)은 그대로 두고, 옆에 "재생목록" / "유튜버 전체(채널)" 버튼 추가
  - 두 버튼 모두 미디어 유형이 "유튜브"일 때만 활성화(평소 회색 비활성 표시, 유튜브 선택 시 색상 활성화)
  - **"재생목록" 버튼**: 이번 Phase에서 완전 구현
  - **"유튜버 전체(채널)" 버튼**: **보류** — 버튼만 만들어두고 클릭 시 동작은 미구현. 이유: 앱이 국내 촬영지만 취급하는데, 채널 전체를 가져오면 유튜버가 올린 해외 여행 영상까지 섞여 들어올 수 있어(국내/해외 구분 방안 미정) 별도 논의 필요.
- 재생목록 URL 입력 시 `playlistItems.list`(YouTube Data API v3)로 videoId/제목/순번/썸네일/업로드일 조회 → 목록 표시
- 목록 화면:
  - 이미 DB(`Media.source_url` 기준)에 등록된 영상은 "이미 처리됨" 뱃지 표시
  - 자막 유무를 사전 조회해서 표시(자막 없는 영상은 추론 정확도 낮음을 경고)
  - 업로드일 기준 필터 제공(제목 키워드 필터는 이번 범위 밖)
  - 체크박스로 원하는 영상만 선택해 일괄 추출 시작
- 일괄 추출 실행 방식:
  - 순차 처리 + 진행 상황 모달(예: "20개 중 13번째 처리 중")
  - 취소 버튼 1개(**2026-07-30 단순화**: 처음엔 "즉시취소"/"완료후종료" 2개로 설계했으나, 처리 중이던 영상의 AI 응답을 기다리는 시간은 취소 여부와 무관하게 그대로 흐르기 때문에 "즉시 중단하고 결과를 버리는" 옵션은 대기 시간을 전혀 줄여주지 못해 실효성이 없다고 판단 — 사용자 확인 후 제거) — 처리 중이던 영상은 끝까지 완료(결과 저장)하고 다음 영상부터 중단. 특정 영상 결과를 버리고 싶으면 완료 후 관리자 화면에서 수동 삭제
  - 실패한 영상은 별도 "실패 목록"으로 분리해서 개별 재시도 가능
- AI 선택 확인 절차(재생목록/채널 일괄 실행에만 적용):
  - 기본 AI는 Gemini
  - Gemini가 아닌 다른 AI가 선택된 상태로 일괄 실행을 시작하면 확인 팝업 표시
  - 팝업에 "토큰/크레딧 소진 시 대체할 AI" 드롭박스 포함(기본값 Gemini) — 배치 도중 API 한도 초과 시 자동 폴백용

**검토 후 기각한 항목 (2026-07-30):**
- **API 쿼터 사용량 게이지**: YouTube Data API는 실시간 잔여 쿼터를 조회하는 공식 엔드포인트가 없음(Google Cloud Console에서만 확인 가능). 자체 호출 카운팅으로 추정치를 보여주는 방식만 가능한데 실제 쿼터와 어긋날 수 있어 "다루기 애매한 데이터"로 판단해 기각(사용자 지정 조건 — "다루기 애매하면 기각" — 에 따름).
- **일괄 결과 요약 리포트**(처리/성공/실패/발견 장소 수 요약 화면): 이번 범위에서 제외.

**구현 완료 (2026-07-30):**
1. `MediaPlace`에 `source_video_id` 필드 추가 — `run_extraction()`이 항상 이 값을 채워서, 재생목록 조회 시 "이미 처리된 영상"을 `Media.source_url` 휴리스틱이 아니라 정확히 판정할 수 있게 함.
2. `PlaylistExtractionJob` 모델 신설(`places/models.py`) — 선택된 영상별 진행 상태를 `videos` JSONField에 통째로 저장, 관리자 화면이 이 레코드를 폴링해서 진행률을 그림.
3. `places/services.py`: `fetch_playlist_videos()`(playlistItems.list + videos.list로 목록/길이/업로드일/자막유무/중복여부 조회, 최대 200개 캡), `run_batch_job()`(백그라운드 스레드에서 순차 처리).
   - **취소**: 취소 요청이 들어오면 처리 중이던 영상은 끝까지 완료(결과 정상 커밋)하고, 다음 영상을 시작하기 전에 멈춤 — 처음엔 "즉시취소(처리 중이던 영상 결과를 롤백)"까지 별도로 만들었으나, 그 영상의 AI 응답을 기다리는 시간 자체는 취소 여부와 무관하게 그대로 흐르기 때문에 실효성이 없다고 판단해 제거(2026-07-30).
   - **AI 폴백**: `run_extraction()`의 에러 문자열에서 쿼터/레이트리밋 관련 키워드를 감지하면(`_looks_like_quota_error`) 그 시점부터 대체 AI로 전환해 같은 영상부터 재시도.
   - 핵심 시나리오(정상완료/취소/AI폴백)를 실제 API 호출 없이 `run_extraction`을 모킹해서 검증 완료.
4. `places/views.py` + `places/urls.py`: 목록조회(`/places/extract/playlist/fetch/`)·시작(`/start/`)·상태폴링(`/job/<id>/status/`)·취소(`/job/<id>/cancel/`)·재시도(`/job/<id>/retry/`) 엔드포인트. fetch 기반 POST 페이지라 기존 검수 포털들과 같은 CSRF 쿠키 버그(DEVPLAN "다음 작업 우선순위" 4번 항목 참고)를 처음부터 피하려고 `@ensure_csrf_cookie`를 붙임.
5. `admin_extract.html`에 "재생목록으로 추출"/"유튜버 채널 전체(준비 중)" 버튼 추가 — 미디어 유형이 유튜브일 때만 색상 활성화, 채널 버튼은 클릭해도 안내 문구만 뜨고 이동하지 않음(보류 상태 유지).
6. `admin_playlist_extract.html` 신규 — URL 입력 → 목록(중복/자막없음 뱃지, 업로드일 필터) → 선택 → (Gemini 아닌 AI 선택 시 확인 팝업+폴백 AI 드롭다운) → 진행 모달(즉시취소/완료후종료) → 실패 목록(개별 재시도). 아이콘은 `backend/places/static/places/icons/`에 이미 있던 것만 사용(alert-circle/calendar/clock/search/x), 매칭되는 아이콘이 없는 요소(재생목록·채널·재시도·취소 버튼 등)는 아이콘 없이 텍스트만 사용.
7. 실제 YouTube Data API로 재생목록 조회(길이·업로드일·자막유무 파싱)까지 라이브로 확인, Django `check`/마이그레이션/페이지 200 응답/HTTP 뷰 통합 테스트까지 통과. 테스트 중 생성한 데이터는 전부 정리 완료.

**2026-07-30 추가 개선 — "목록 불러오기" 자체도 백그라운드 작업으로 전환:**
- 최초 구현은 "목록 불러오기" 버튼을 누르면 요청-응답 안에서 동기로 다 처리했는데(영상마다 자막 유무를 확인하느라 재생목록이 크면 수십 초~수 분 걸림), (a) 로딩 중인지 멈춘 건지 구분이 안 되고 (b) 페이지를 벗어나면(다른 관리자 화면에서 딴 작업하면) 진행 상황을 알 방법이 없어서 실사용성이 떨어진다는 피드백으로 개선.
- `PlaylistFetchJob` 모델 신설, `admin_playlist_fetch_api`가 이제 즉시 `fetch_job_id`만 반환하고 실제 조회는 `run_playlist_fetch_job()`이 백그라운드 스레드에서 수행. `GET /places/extract/playlist/fetch/<id>/status/`로 어디서든 진행 상황 조회 가능.
- "불러오는 중" 버튼 라벨에 점 개수가 0~3개로 순환하는 애니메이션 추가(멈춘 것처럼 보이는 문제 해결).
- `places/static/places/js/fetch_watcher.js` 공용 위젯 신설 — `localStorage`의 `playlistFetchJobId` 키를 재생목록 페이지와 공유. 관리 포털의 다른 화면들(대시보드/단일추출/추출내역/장소검토/포토스팟검수/코스건의함 검토, 총 6개 템플릿)에 이 스크립트를 포함시켜서, 재생목록 조회가 진행 중일 때 그 화면들에서도 하단 우측 구석에 진행 상황 팝업이 뜨고 완료 시 문구가 바뀜. 클릭하면 `/places/extract/playlist/`로 돌아가고, 그 페이지는 로드 시 `localStorage`를 확인해서 진행 중이던/막 끝난 조회를 자동으로 이어서 보여줌(URL 재입력 불필요).
- 실제 대형 재생목록으로 라이브 테스트 — 시작 요청이 즉시 응답하고(비동기 확인), 폴링이 몇 분간 오류 없이 계속되는 것까지 확인.

**2026-07-30 추가 개선 — 조회 기록을 최근 20개까지 저장:**
- `PlaylistFetchJob`에 `media_title` 필드 추가(`HISTORY_LIMIT = 20`). "목록 불러오기"는 이제 미디어 제목을 먼저 입력해야 버튼이 활성화됨(URL만으론 비활성 — 회색으로 표시, 둘 다 채워지면 파란색) — 저장 기록을 이 제목으로 구분하기 위함.
- 새 조회를 시작할 때마다 `created_at` 기준으로 최근 20개만 남기고 그보다 오래된 기록은 자동 삭제(`admin_playlist_fetch_api`). `GET /places/extract/playlist/fetch/history/`로 저장된 기록 목록(제목/URL/영상수/조회일시) 조회.
- 페이지 상단에 "저장된 재생목록" 카드 신설 — 클릭하면 YouTube API 재호출 없이 그 기록의 `videos`를 그대로 불러와 표시(`loadHistoryJob`).
- 25개를 연속 생성해서 정확히 최신 20개만 남고 오래된 5개가 삭제되는 것, `media_title` 없이 시작하면 거부되는 것까지 통합 테스트로 확인.

**2026-07-30 추가 개선 — "일괄 추출" 진행 상황도 페이지를 벗어나도 추적 가능하게:**
- 기존엔 재생목록 조회("목록 불러오기")만 페이지 이탈에 대응했고, 실제 장소 추출 배치(`PlaylistExtractionJob`)의 진행 모달은 `admin_playlist_extract.html`에만 종속된 인라인 구현이라 페이지를 벗어나면 추적 수단이 없었음.
- `places/static/places/js/extraction_watcher.js` 신설 — 기존에 그 페이지에 하드코딩돼 있던 진행 모달 전체(헤더/영상별 상태 리스트/취소·재시도 버튼)를 이 공유 스크립트가 **동적으로 DOM에 직접 그려서** 어느 관리자 페이지에서도 동일하게 뜨도록 이전(Tailwind 유무와 무관하게 보이도록 순수 인라인 `<style>`만 사용, `fetch_watcher.js`와 동일한 방식).
- `localStorage('extractionJobId'/'extractionJobViewState')`로 두 가지 표시 상태(펼침/축소)를 관리 — 축소하면 화면 우측 하단에 작은 위젯(다른 관리자 화면 어디서든 노출)으로, 위젯을 클릭하면 **페이지 이동 없이** 같은 자리에서 전체 진행 모달이 다시 뜸(기존 재생목록 조회 위젯은 클릭 시 페이지로 이동하는 방식이라 이것과는 의도적으로 다르게 구현 — 조회는 "결과를 보러 그 페이지로 가야 하는 일"이고 추출은 "그 자리에서 확인만 하고 하던 일을 이어가는 게 목적"이라는 차이 반영).
- 모달에 "축소" 버튼 추가(기존엔 취소/닫기만 있었음) — 눌러도 작업은 계속 진행되고 위젯으로만 줄어듦. 실패한 영상의 "재시도" 버튼도 원래 페이지 하단 별도 섹션이었던 걸 모달의 영상별 행에 인라인으로 통합(어느 페이지에서 보든 바로 재시도 가능하게).
- `admin_playlist_extract.html`의 기존 진행 모달/실패 목록 인라인 코드는 전부 제거하고 `window.YgeExtractionWatcher.start(jobId)` 호출로 위임 — 코드 중복 없이 그 페이지도 동일한 공유 컴포넌트를 사용.
- 서버 쪽 엔드포인트(시작/상태/취소/재시도)는 변경 없음(이미 검증됨). 새로 추가된 JS 3개 파일 전부 `node --check`로 문법 검증, 관리자 페이지 7개 전부 200 응답 확인.

**2026-07-30 버그 수정 — 저장된 재생목록 재열람 시 "이미 처리됨" 표시가 최신 상태를 반영 못 하던 문제:**
- 원인: `is_duplicate`가 최초 조회 시점에 한 번 계산돼 `PlaylistFetchJob.videos`에 스냅샷으로 저장되는데, 그 이후 실제로 장소 추출이 끝난 영상이 있어도 저장된 기록을 다시 열람하면 옛날 값을 그대로 보여주고 있었음.
- `services.py`에 `_compute_duplicate_ids()`(대량 쿼리 1~2번으로 여러 영상의 처리 여부를 한 번에 계산)와 `refresh_duplicate_flags()` 추가. `admin_playlist_fetch_status_view`가 완료된 job을 응답할 때마다 이 함수로 `is_duplicate`를 다시 계산해서 내려주고 DB에도 갱신해서 저장 — 저장된 기록을 다시 열 때뿐 아니라 페이지를 벗어났다 위젯으로 돌아올 때도 항상 최신 상태로 보임.
- 겸사겸사 `fetch_playlist_videos()`의 기존 영상별 N+1 중복 쿼리(영상당 2번씩)도 이 대량 쿼리 함수로 통합해서 최초 조회 자체도 더 가벼워짐.
- 회귀 테스트: 조회 당시엔 미처리였던 영상을 이후 MediaPlace로 추출 완료 처리한 뒤 저장된 기록을 다시 열람 → `is_duplicate=True`로 정확히 갱신되는 것 확인.

**2026-07-30 버그 수정 + 기능 분리 — 일괄 추출이 영상별이 아니라 재생목록 전체가 하나로 뭉쳐서 저장되던 문제:**
- 원인: 배치 시작 시 입력한 "미디어 제목" 하나를 선택된 영상 전부에 그대로 넘겨서 `run_extraction()`을 호출하고 있었음 → `Media.objects.get_or_create(title=media_title, ...)`가 매번 같은 제목으로 걸려서 24개 영상 결과가 전부 Media 하나로 합쳐짐(실사용 중 "폭간트 국내여행" 하나에 37개 장소가 뭉친 것으로 발견, 2026-07-30).
- **개별 추출(기본, 신규)**: 영상마다 그 영상 자체의 YouTube 제목으로 별도 Media 생성. 재생목록 속 영상들이 보통 서로 다른 주제(여행 유튜버의 각기 다른 여행지 등)라는 실사용 케이스에 맞춤.
- **통합 추출(별도 버튼, 기존 동작 보존)**: "여러 회차가 한 작품인 경우"(예: 1박2일 시즌4)를 위해 기존 방식(선택 영상 전부를 미디어 제목 하나로 묶기)을 그대로 남겨둠 — 두 버튼을 나란히 배치해서 배치마다 선택 가능.
- `PlaylistExtractionJob.merge_videos`(BooleanField, 기본 False) 추가. `_run_one_video()`가 이 값에 따라 `video['title']`(개별) 또는 `job.media_title`(통합) 중 하나를 `run_extraction()`에 넘기도록 분기.
- "삭제 후 재조회 시 이미처리됨 딱지가 정확히 사라지는지"도 별도로 검증 — 지난 턴에 만든 `refresh_duplicate_flags()`가 이미 양방향(처리됨→해제, 미처리→처리됨) 모두 정확히 반영하는 것 확인(추가 코드 변경 불필요, 회귀 테스트로 확인만).
- 개별/통합 두 시나리오 모두 mock으로 실제 Media 그룹핑 결과까지 회귀 테스트로 확인.
- 기존에 잘못 합쳐져 저장된 "폭간트 국내여행" 등은 사용자가 직접 삭제 후 재추출하기로 함(별도 마이그레이션/정리 작업 없음).

**남은 것:** 실제 관리자 화면에서 브라우저로 눌러보는 육안 테스트는 아직 안 함(요청 시 진행). "유튜버 채널 전체" 버튼 뒤 실제 로직은 계속 보류.

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
| MediaPlace | ✅ 있음 | Quiz 연결 완료 — Phase 3 |
| Tag | ✅ 있음 | Phase 1 완료 |
| Photo | ✅ 있음 | (퀴즈는 Photo 대신 place.image_url 재사용으로 연결 — Phase 3 완료) |
| Quiz | ✅ `QuizSubmission`/`QuizAnswer`로 구현 (`quiz` 앱) | Phase 3 완료 (2026-07-27) |
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
| confidence_score 업데이트 로직 없음 | ✅ 해결됨 | Phase 3(퀴즈 정답 집계로 자동 갱신) 완료, 2026-07-27 |
| 사용자 인증 없음 | ✅ 해결됨 | `users` 앱에 익명 device_id 기반 인증 구현 완료 (Phase 4), Phase 6에서 JWT 실계정으로 전환 |
| 이메일 SMTP 미연동 | ✅ 해결됨 | Gmail SMTP 연동 완료, 실기 수신까지 확인(2026-07-27) — Phase 6 항목 참고 |
| 장소 매칭 시 동명 구/군 오매칭으로 좌표가 엉뚱한 도시에 찍힘 | 근본 원인 미해결, 관리자 수동 도구는 추가됨 (2026-08-25) | 아래 상세 참고 |

---

### 미해결 — 장소 매칭 지역 오매칭 버그 (2026-07-30 발견, 원인 추정만 해둠)

**증상:** 지도에서 "세명빈대떡"(주소 표시는 "부산 중구", 확신도 100%)의 마커가 실제로는 대구 근처에 찍힘 — 주소 텍스트와 실제 좌표가 다른 도시를 가리킴.

**추정 원인 (`places/services.py`):**
- `_address_matches()`(36행)가 정규식 `[가-힣]+(?:시|도|구|군|동|읍|면|로|길)`로 `address_hint`에서 지역 토큰을 뽑는데, "부산 중구"처럼 시/도 이름 뒤에 "시"를 안 붙이고 쓰는 흔한 표기(부산, 대구, 서울 등)는 이 정규식에 안 걸림(부산은 "산"으로 끝나서 접미사 목록에 없음) — 그래서 "중구"만 토큰으로 남는데, **"중구"는 서울·부산·대구·인천·울산·대전에 전부 있는 흔한 구 이름**이라 지역 필터링이 사실상 안 됨.
- `_pick_kto_match()`(55행)/`_pick_kakao_match()`(66행)가 이 함수로 후보를 거르기 때문에, 엉뚱한 도시의 동명 구에 있는 후보가 "일치"로 잘못 판정돼 선택될 수 있음.
- 게다가 KTO 매칭이 아예 없어서 카카오 좌표로 미확정 저장하는 경로(`resolve_place()` 168~183행)는 `address` 필드를 카카오가 실제로 찾아준 주소가 아니라 **AI가 준 `address_hint` 원문을 그대로** 저장하기 때문에("부산 중구"), 좌표만 엉뚱한 도시로 잘못 찍혀도 주소 텍스트는 멀쩡해 보여서 눈치채기 더 어려움.

**다음에 손볼 방향(제안, 미착수):**
1. `_address_matches()`의 정규식에 시/도 이름 자체(부산/대구/서울/인천/광주/대전/울산/세종 등, "시" 접미사 없이도)를 별도로 인식하도록 보강해서 광역 단위까지 비교하게 하기.
2. 카카오 폴백 경로에서 `place.address`를 `address_hint` 원문 대신 실제 매칭된 카카오 후보의 주소로 저장하도록 수정(불일치를 애초에 눈에 안 보이게 만들지 않기).

**2026-08-25 업데이트:** "부산의 횟집"(관리자 승인까지 됐던 건) 사례로 이 문제가 다시 확인됨 — `kakao_geocode()`가 카카오 후보의 좌표만 반환하고 name/address/kakao_place_id/url은 버리는 게 근본 원인. `resolve_place()`의 카카오 폴백 경로가 정확한 좌표를 찾아놓고도 `name`/`address`는 AI의 원본 추측 텍스트를 그대로 저장해서 생김. 아직 위 1·2번 자체는 고치지 않았고, 대신 관리자가 수동으로 빠르게 바로잡을 수 있도록 "위치 수정" 모달에 좌표 역지오코딩 + 근처 실제 업체 지도(클릭 선택) + 지도 직접 클릭 조회 기능을 추가함(`kakao_reverse_geocode`/`kakao_nearby_search`, [places/services.py](../backend/places/services.py)). **다음 작업(내일): 이 보조 도구 말고 `resolve_place()`/`kakao_geocode()` 자체를 고쳐서, 애초에 이런 불일치가 안 생기게 하기.**

---

## 다음 작업 우선순위 (2026-07-27 기준)

Phase 3(Quiz), Phase 8(인기 코스 정렬), Phase 10-1(코스 건의함), SMTP 연동까지 전부 완료(2026-07-27) — 로드맵 원안의 Phase 1~9 핵심 단계가 모두 끝났습니다. 남은 건 아래처럼 전부 "확정 필요/후순위" 항목뿐입니다.

1. **아이디 변경 7일 재변경 제한** (Phase 6 잔여) — 프론트 디자인 작업과 함께 나중에 추가 예정, 지금은 매번 변경 가능.
2. **Phase 10-1 코스 건의함 — 남은 건 토큰 값 확정뿐** — 관리자 검토 포털은 완료(`/course-suggestions/review/`). `COURSE_SUGGESTION_TOKEN_COST`(현재 100, 임시값) 확정만 남음.
3. **Phase 3 퀴즈 상수 튜닝 + 잔여 허점** — `QUIZ_MIN_RESPONSES`(3)/`QUIZ_CONFIRM_THRESHOLD`(0.8)/`QUIZ_CORRECT_ANSWER_REWARD`(5)/`QUIZ_PROBABLE_VISIT_WEIGHT`(1.3) 실사용 트래픽 보고 조정. `DailyPlace`에 생성/수정일 타임스탬프가 없어서 "방문 개연성" 판정을 완전히 어뷰징 방지하진 못하는 잔여 허점도 필요시 검토(위 Phase 3 항목 참고).
4. **포토스팟 검수 포털(`/places/photos/review/`) CSRF 쿠키 버그 점검** — 코스 건의함 포털 만들다 발견. `{% csrf_token %}` 없이 `document.cookie`로만 읽는 패턴이라 쿠키가 안 심어질 수 있음. 지금까지 문제 없었다면 우연히 다른 경로로 쿠키가 있었을 가능성 — 같은 방식(`@ensure_csrf_cookie`)으로 고쳐야 함.
4. Naver Maps 전환 여부 (Phase 5, 낮은 우선순위), 추천/유행 로직 + 테마 노출 시스템 (보류, 별도 설계 필요), User 아바타 필드(이미지 업로드 프론트 연동 검증 후).
5. ~~Phase 12 유튜브 재생목록 일괄 추출~~ — ✅ 백엔드 구현 완료 (2026-07-30), 상세는 위 Phase 12 섹션 참고. 브라우저 육안 테스트만 남음.
6. **장소 매칭 지역 오매칭 버그** (2026-07-30 발견, 미착수) — "부산 중구"인데 대구에 마커가 찍히는 등 동명 구/군 때문에 지역 필터링이 뚫리는 문제. 원인 추정과 고칠 방향은 위 "알려진 이슈" 아래 상세 섹션 참고.

**✅ 완료 (2026-07-28):** 개인정보 처리방침/이용약관 — 백엔드 정적 페이지(`/privacy/`, `/terms/`)로 신설, 설정/회원가입동의/회원탈퇴 화면 링크를 전부 여기로 연결. 문구는 아직 법률 검토 전 초안 상태.

---

## 콘솔 빌드 실기기 테스트에서 발견한 버그 목록 (2026-08-14 발견)

`eas build --profile preview`로 뽑은 APK를 실제 폰에 설치해서 테스트하다 발견한 것들.

**상태 표시**: ✅ 완료(실기기 검증까지 끝남) / 🧪 테스트 중(코드 수정은 끝났고, 실기기 재테스트 결과 기다리는 중 — 결과 나오기 전까지는 후속 작업 보류) / 🔧 백엔드 필요 / (표시 없음) 미착수

1. ~~**프로필 이미지 추가 시 권한 요청 누락**~~ — 🧪 테스트 중 (2026-08-15 수정, 재검증 대기). [AccountScreen.tsx](../frontend/app/AccountScreen.tsx)에 다른 화면들과 동일한 `ensureMediaLibraryPermission` 패턴 추가.
2. ~~**"아이디 변경" 기능을 빼기로 했었는데 안 빠져있음**~~ — 🧪 테스트 중 (2026-08-15 수정, 재검증 대기). 6번과 함께 처리, 아래 참고.
3. **MY페이지 토큰 개수 ≠ "건의하기" 화면에 보이는 토큰 개수** — 🧪 테스트 중 (2026-08-15 부분 수정, 재검증 대기): 둘 다 `userApi.getMe()`로 동일 소스를 읽고 있어서 코드상 불일치 원인은 못 찾음. 다만 [CourseSuggestionWriteScreen.tsx](../frontend/app/CourseSuggestionWriteScreen.tsx)가 조회 실패 시 조용히 무시(`catch(() => {})`)하고 있던 걸 401(로그인 만료) 시 로그인 화면으로 보내도록 고침 — SettingScreen.tsx와 동일하게 맞춤. 이번 불일치 제보가 env var 누락으로 API가 아예 안 붙던 구버전 preview APK에서 나온 증상일 가능성도 있어서, 재테스트 후에도 재현되면 다시 조사.
4. ~~**장소 이미지가 일부만 로드됨**~~ — 🧪 수정 완료, 배포 대기 (2026-08-15). 원인은 버그가 아니라 데이터 한계: 운영 DB 확인 결과 전체 장소 284개 중 122개(빈 문자열 21 + NULL 101)가 애초에 `image_url`이 없음 — KTO(관광공사) API에 사진이 없거나, 카카오 지오코딩 폴백으로만 확정된 장소(카카오 로컬 API엔 사진 필드가 없음)라 구조적으로 이미지가 없는 게 정상. 새 공용 컴포넌트 [PlaceThumb.tsx](../frontend/components/ui/PlaceThumb.tsx)를 만들어서 `image_url`이 없으면 회색 박스+아이콘 플레이스홀더를 보여주도록, 장소 이미지를 쓰는 6개 화면(CourseDetailScreen 2곳/PlaceDetailScreen 2곳/PhotoSpotDetailScreen/QuizDetailScreen/ScheduleDetailScreen)에 전부 적용. (참고: ScheduleScreen의 `SmallCircle`은 원래부터 이미 자체 플레이스홀더 처리가 돼 있어서 손 안 댐)
5. **지도가 안 불러와짐**
   5.1. **카카오 관련 정보(장소 정보 등)도 안 불러와짐** — 미착수이지만 원인 유력 후보 찾음: preview APK 빌드에 `EXPO_PUBLIC_KAKAO_JS_KEY`를 포함한 env var가 전부 누락되어 있었음(`.env`가 `.gitignore`에 걸려서 EAS 빌드에 미포함). 2026-08-14에 EAS project의 `preview`/`production` 환경변수로 등록 완료 — 새 빌드로 재테스트해서 해결됐는지 확인.
6. ~~**"내 정보"의 메뉴명 "아이디 변경" → "아이디 확인"으로 변경**~~ — 🧪 테스트 중 (2026-08-15 수정, 재검증 대기). [AccountScreen.tsx](../frontend/app/AccountScreen.tsx)에서 해당 행을 클릭 불가능한 순수 표시(라벨 "아이디 확인" + 아이디 값)로 변경, [IdChangeScreen.tsx](../frontend/app/IdChangeScreen.tsx) 파일과 `_layout.tsx`의 라우트 등록 전부 삭제.
7. ~~**코스 리뷰 좋아요(따봉) 버튼 — 눌러도 저장 안 됨**~~ — 🧪 수정 완료, 배포 대기 (2026-08-15): [CourseDetailScreen.tsx:545](../frontend/app/CourseDetailScreen.tsx#L545)의 `onToggleLike`가 로컬 state만 토글하던 문제. `reviews` 앱에 `PlaceReviewLike`/`MediaReviewLike`/`PhotoReviewLike` 모델(각각 `photos` 앱의 `PhotoLike` 패턴 참고, user+review unique_together) 신규 추가하고, `POST/DELETE /api/reviews/<type>/<id>/like/`(`ReviewLikeView`) 신규 구현, 시리얼라이저에 `isLiked` 필드 추가. 프론트 3곳(CourseDetailScreen/PlaceDetailScreen/PhotoSpotDetailScreen)의 로컬 전용 토글도 실제 API 호출로 교체 완료 — 기존에 좋아요 여부 없이 `likeCount`에 로컬로 +1만 하던 "가짜 낙관적 업데이트"(`getReviewLikeCount`의 offset)도 이제 서버 값이 정확해져서 제거함.
8. ~~**포토스팟 업로드 — 장소/날짜/사진 다 입력해도 "작성 완료" 버튼이 안 켜짐**~~ — 🧪 테스트 중 (2026-08-15 수정, 재검증 대기). 원래도 로직 자체는 정상(메인 이미지·제목·태그·설명 10자 이상·장소 5개 모두 필수인데 제목/태그/설명을 안 채웠던 것으로 추정)이었지만, 뭐가 부족한지 안내가 없었던 게 진짜 문제라 [PhotoSpotWriteScreen.tsx](../frontend/app/PhotoSpotWriteScreen.tsx) 버튼 아래에 부족한 항목을 나열하는 안내 텍스트 추가.
9. **포토스팟 AI 검수가 이미지를 못 불러와서 "검사 불가 → 검토 대기"로 빠짐** — 🧪 원인 확정 + 수정 완료, 배포 대기 (2026-08-15). 13번과 동일 원인이었음, 아래 13번 설명 참고.

### 추가 발견 (2026-08-15, 프론트 작업 중 새로 올라옴)

10. ~~**포토스팟 상세 페이지 — 내가 작성한 포토스팟인데 디폴트 별점이 4.0으로 표시됨**~~ — 🧪 원인 확정 + 수정 완료, 배포 대기 (2026-08-15). 11번과 원인이 같았음, 아래 참고.
11. ~~**코스/장소/포토스팟 카드 및 상세화면 — 별점·하트 수가 0일 때 아이콘/숫자 자체가 안 보임**~~ — 🧪 원인 확정 + 수정 완료, 배포 대기 (2026-08-15). 진짜 원인은 falsy(0) 체크가 아니라 **`Place`/`Media`/`Photo`의 `rating`/`like_count`를 백엔드가 애초에 응답에 넣어준 적이 없었던 것**(`PlaceSerializer`/`MediaSerializer`에 필드 자체가 없었음, `PhotoSerializer`도 `rating` 없음) — 프론트는 `!= null` 체크로 이미 올바르게 작성돼 있었는데 값이 늘 `undefined`라 항상 숨겨졌던 것. `places/serializers.py`에 세 시리얼라이저 전부 `get_rating`(관련 리뷰 평점 평균, 리뷰 없으면 0)·`get_like_count`(북마크 수) 신규 추가로 해결. 포토스팟 쪽은 그동안 `services/mockData.ts`의 `pseudoRating()`(id 기반 가짜 랜덤값, 3.8~4.9)으로 눈속임하던 것도 걷어내고 실제 `photo.rating`을 쓰도록 5개 파일(CourseScreen/CourseDetailScreen/SearchResultScreen/UserPhotoSpotsScreen/PhotoSpotDetailScreen) 전부 정리, `pseudoRating` 자체도 삭제 — 이게 10번(디폴트 4.0) 버그의 진짜 원인이었음.
12. ~~**"작성한 리뷰" 화면 — 코스리뷰의 코스 카드에 표시되는 장소 카운트가 실제 데이터와 불일치**~~ — 🧪 원인 확정 + 수정 완료, 배포 대기 (2026-08-15): 백엔드 `MediaReviewSerializer.get_media()`가 애초에 `place_count` 필드를 응답에 안 넣고 있었음. 프론트 [labels.ts:36](../frontend/constants/labels.ts#L36)의 `` `${media.place_count ?? 0}개 장소` ``가 `undefined`를 항상 0으로 fallback 처리해서 **실제 값과 무관하게 무조건 "0개 장소"로 표시**되던 것. `places/serializers.py`의 `MediaSerializer.get_place_count()`와 동일한 계산식(`media_places.filter(status='admin_approved').count()`)을 `reviews/serializers.py`에도 추가해서 고침.
13. ~~**리뷰 작성 시 이미지 업로드가 적용 안 됨 (포토스팟 작성과 동일한 오류)**~~ — 🧪 원인 확정 + 수정 완료, 배포 대기 (2026-08-15): 진짜 원인은 이미지 업로드 자체가 아니라 **업로드된 이미지를 다시 불러오는 게 전부 실패**하고 있었음.
    - **원인 1**: `YogiEoddae/urls.py`가 `if settings.DEBUG: urlpatterns += static(...)` 식으로 media 서빙을 DEBUG 모드에서만 켜뒀는데, 운영 서버는 `DEBUG=False`라서 **`/media/` URL 자체가 항상 404**였음 (파일은 Railway 볼륨에 멀쩡히 있었음 — 라우팅만 안 됨). 게다가 Django의 `static()` 헬퍼는 내부적으로 `DEBUG=False`면 무조건 빈 리스트를 반환해버려서 바깥의 if문만 지워선 안 고쳐지고, `django.views.static.serve`를 직접 등록해야 했음.
    - **원인 2**: 업로드 시 `request.build_absolute_uri()`로 image_url을 만드는데(`places/views.py:889`), Railway가 바깥엔 HTTPS·내부엔 HTTP로 프록시하는 구조라 `SECURE_PROXY_SSL_HEADER` 없이는 `http://`로 저장돼버림 → 안드로이드가 cleartext(http) 요청을 기본 차단해서 앱에서 이미지를 못 불러옴. `settings.py`에 `SECURE_PROXY_SSL_HEADER` 추가로 해결.
    - 기존에 이미 `http://`로 저장돼 있던 사진 5건(Photo 2 + PhotoImage 3)도 운영 DB에서 `https://`로 직접 백필해둠.
14. ~~**리뷰/포토스팟 작성 시 방문일이 작성일(오늘)보다 미래여도 막지 않음**~~ — 🧪 수정 완료, 배포 대기 (2026-08-15). [VisitDateAlert.tsx](../frontend/components/modals/VisitDateAlert.tsx)에 오늘 이후 날짜는 선택 자체가 안 되게(터치 비활성화 + 회색 표시) 하고, 다음 달로 넘어가는 화살표도 이번 달 이후로는 못 넘어가게 막음.
15. ~~**코스/장소 카드의 더보기(⋮) 메뉴 — "리뷰쓰기" 항목이 작동 안 함**~~ — 🧪 수정 완료, 배포 대기 (2026-08-15). [MoreMenuAlert.tsx:41](../frontend/components/modals/MoreMenuAlert.tsx#L41) "리뷰쓰기" 버튼에 애초에 `onPress` 자체가 없었음(다른 메뉴 항목들은 다 있는데 이것만 빠짐). `onReviewPress` prop 추가하고 Course/Place/PhotoSpotDetailScreen 3곳 모두 연결.
16. ~~**코스-유튜브 상세에서 유튜브 재생 버튼을 눌러도 유튜브로 이동 안 함**~~ — 🧪 수정 완료, 배포 대기 (2026-08-15). `Media.source_url`이 모델엔 있는데 `MediaSerializer`가 응답 필드에서 빠뜨리고 있었음 — 필드 목록에 추가.

**a. 커스텀 관리자 포탈 접속 제한 적용** — ✅ 완료. `staff_member_required`로 관리자 포털 전체에 로그인 보호 적용됨.

---

## 2026-08-25 작업 내역

### 완료
1. **장소 정보 lazy 최신화** — `Place.last_synced_at` 필드 추가. 조회 시점 기준 가장 최근 08:00(KST) 이전이면 백그라운드 스레드로 KTO 상세조회(`detailCommon2`)를 재호출해 갱신(stale-while-revalidate). 정기 배치가 아니라 실제 접근 시점에만 갱신되므로 특정 시각에 호출이 몰리지 않음. `refresh_place_if_stale()` ([places/services.py](../backend/places/services.py)), `PlaceViewSet.retrieve()`.
2. **근처 추천 장소** — 장소 상세 화면 하단에 KTO `locationBasedList2`로 좌표 주변 장소를 매 요청마다 실시간 조회(DB 저장 안 함). 카드를 탭하면 `POST /api/places/register/`로 그 순간 정식 `Place`로 등록 후 상세 페이지로 이동. `fetch_nearby_places()`/`get_or_create_place_by_content_id()`, [PlaceDetailScreen.tsx](../frontend/app/PlaceDetailScreen.tsx).
3. **한국관광공사 관광 데이터 활용 공모전 — 로컬 DB 저장 신청서 제출 및 승인 완료.** 신청 사유는 위 1·2번 구조(FK로 연결된 자체 데이터 + lazy 08:00 동기화 + 근처 추천은 완전 실시간)를 근거로 함. 1차 심사 마감 2026-09-21 16:00, 스토어 등록 예정 2026-09-06.
4. **관리자 "위치 수정" 모달 강화** — 좌표→실제 주소 역지오코딩 표시, 좌표 주변 실제 업체를 지도에 마커로 표시(클릭 시 장소명/주소 자동 채움), "핀을 이 주소로 이동" 버튼, 지도 직접 클릭으로 미등록 위치(전망 좋은 공터 등)도 주소 조회 가능. `kakao_reverse_geocode()`/`kakao_nearby_search()` ([places/services.py](../backend/places/services.py)), [admin_review.html](../backend/places/templates/places/admin_review.html). 근본 원인은 아래 "장소 매칭 지역 오매칭 버그" 섹션의 2026-08-25 업데이트 참고 — 이건 근본 수정이 아니라 관리자용 보조 도구.
5. **포토스팟 목록이 빈 화면으로 뜨던 버그 근본 원인 수정** — `GET /api/photos/`가 페이지네이션 응답(`{count,next,previous,results}`)인데 `photoApi.getList()`의 타입 선언과 호출부 3곳(CourseScreen/UserPhotoSpotsScreen/SearchResultScreen)이 전부 배열로 착각하고 `res.data.map()`을 호출해서 `catch(() => {})`에 조용히 먹히는 크래시가 나던 것. `res.data.results`로 수정.
6. **숨겨진 디버그 로그 화면 추가** — MY 화면 타이틀 5연타로 진입([DebugLogScreen.tsx](../frontend/app/DebugLogScreen.tsx)). API 요청 실패와 처리되지 않은 JS 예외를 자동으로 기록(최근 200건, 재부팅해도 유지), 화면에서 확인/복사/전체삭제 가능. [logger.ts](../frontend/services/logger.ts).
7. **앱 전역의 무음 `catch(() => {})` 40건(19개 파일) → 위 디버그 로그 기록으로 일괄 교체.** 동작은 그대로 두고 로깅만 추가.
8. **앱 아이콘 교체** — iOS/안드로이드/웹 파비콘이 전부 기본 Expo 템플릿 아이콘("A" 로고)이었던 것을 실제 브랜드 아이콘(`app_icon.png`)으로 교체. 안드로이드 적응형 아이콘은 남색 배경을 색상 키로 제거해 safe zone에 맞춘 전경 이미지를 새로 생성. **네이티브 빌드에 포함되는 값이라 `eas update`(OTA)로는 반영 안 되고, 다음 네이티브 빌드부터 적용됨.**
9. **검색창 "#태그" 필터** — "#국밥"처럼 `#`으로 시작하면 이름/설명이 아니라 태그 기준으로 코스/장소/포토스팟 공통 검색. 코스·장소는 기존 `tag` 파라미터 재사용, 포토스팟(`PhotoViewSet`)은 태그 필터가 아예 없어서 신규 추가.
10. **검색 결과 화면(코스/명소/포토스팟) 썸네일이 빈 회색 원만 뜨던 버그 수정** — 애초에 이미지 표시가 구현된 적이 없었음(`<View style={imageCircle}/>` 플레이스홀더만 렌더링, 포토스팟은 매핑에서 `image_url` 자체를 안 담고 있었음). `PlaceThumb`로 교체.

### 내일 할 일
1. **[최우선] 카카오 정보 매칭 파이프라인 근본 수정** — 위 "장소 매칭 지역 오매칭 버그" 섹션 2026-08-25 업데이트 참고. `kakao_geocode()`가 좌표만 반환하고 매칭된 후보의 실제 name/address/kakao_place_id/url을 버리는 부분, `resolve_place()`의 카카오 폴백 경로가 AI의 `address_hint` 원문을 그대로 저장하는 부분을 고쳐서, 오늘 추가한 관리자 수동 도구 없이도 애초에 정확한 데이터가 들어가게 만들기.
2. **근처 추천 장소 — 이미지가 안 뜨는 문제 원인 조사 + 해결방법 모색** — 오늘 추가한 "근처 추천 장소"(`fetch_nearby_places()`, KTO `locationBasedList2`)에서 이미지 쪽만 정상적으로 안 나옴. KTO 응답의 `firstimage` 필드 자체가 비어있는 경우가 많은 건지(위 "장소 이미지가 일부만 로드됨" 항목과 비슷한 구조적 한계일 수 있음), 아니면 다른 원인인지부터 확인 필요.

(Play Console production AAB 재빌드는 2026-08-25 저녁에 진행 — 내일 할 일 목록에서 제외)

---

## 2026-08-26 작업 내역

### 완료
1. **카카오 정보 매칭 파이프라인 근본 수정** — `kakao_geocode()`가 좌표만 반환하고 매칭 후보의 실제 name/address/kakao_place_id/url을 버리던 문제 수정. `kakao_geocode_full()` 신규 추가([places/services.py](../backend/places/services.py))해서 매칭 후보 전체를 반환하도록 하고, `resolve_place()`의 카카오 폴백 경로가 AI의 `address_hint` 원문 대신 실제 매칭된 name/address/kakao_place_id/url을 저장하도록 수정. `admin_place_update_view`도 주소 텍스트만 손으로 고쳐도(검색/지도로 좌표를 직접 안 골라도) 새 주소 기준으로 재지오코딩해서 좌표를 맞추도록 수정 — 기존엔 좌표가 이미 있으면(0이 아니면) 주소 텍스트만 바뀌고 핀 위치는 그대로 남는 버그가 있었음.
2. **카카오 검색에 좌표 반경(geo-bias) 필터 추가** — `_kakao_search_candidates()`에 `lat`/`lng`/`radius` 옵션 추가. 이미 좌표를 아는 장소를 이름으로 재검색할 때, "성균관"처럼 훨씬 유명한 동명의 다른 지역 후보(성균관대학교 계열)가 전국 검색 순위를 다 차지해서 진짜 후보가 검색 결과에 아예 안 잡히던 문제 해결.
3. **근처 추천 장소 이미지 우선순위** — `fetch_nearby_places()`가 KTO 후보 풀(최대 30개) 중 이미지 있는 걸 우선 채우도록 수정(부족할 때만 이미지 없는 후보로 채움). 실측: 수정 전 5개 중 최소 1개가 이미지 없을 확률 약 79% → 수정 후 반복 테스트 5/5 정상.
4. **운영 DB 기존 데이터 백필** — `backfill_kakao_ids`(kakao_place_id 233건), `backfill_business_hours`(138건), `backfill_phone`(167건) 관리 커맨드로 일괄 반영(전부 `--apply` 없으면 dry-run 지원). 지역/거리 불일치 후보는 자동 반영 안 하고 검토 목록으로만 표시 — 성균관(목포 촬영 세트장, 실제 서울 성균관과는 다른 곳)은 좌표 기준 반경 검색으로 정확한 로컬 카카오 ID 확인 후 수동 반영, 종점식당/굴국밥 전문점/선바위 폭포도 원인 확인 후 개별 수정(주소 텍스트는 맞는데 좌표가 완전히 딴 지역을 가리키던 사례들). 낙동강(강이라 여러 지역에 걸쳐 있어 애매함)은 보류.
5. **장소 상세화면 영업시간/전화번호 실데이터 연동** — `Place.business_hours`/`Place.phone` 필드 신규 추가. 영업시간은 실제 KTO content_id가 있는 장소에 한해 `detailIntro2`(카테고리별 필드명 매핑: 관광지 `usetime`/쇼핑 `opentime`/음식점 `opentimefood`/숙박 체크인·아웃 등, `<br>` 태그는 줄바꿈으로 정리)로, 전화번호는 카카오 로컬 API의 `phone` 필드(그동안 응답에서 받아놓고 버리고 있었음)로 채움. [PlaceDetailScreen.tsx](../frontend/app/PlaceDetailScreen.tsx)의 하드코딩된 `-` 두 곳을 실제 값으로 교체, 전화번호는 탭하면 `tel:` 연결.
6. **장소 상세 최신화를 동기 처리로 전환 + `yt_` 미확정 장소도 최신화되게 개선** — `PlaceViewSet.retrieve()`가 백그라운드 스레드 대신 응답 전에 동기적으로 최신화하도록 변경(첫 조회자가 옛날 캐시값 받던 문제 방지, 유저가 응답 대기 중 나가도 서버 쪽 저장은 계속 진행됨). `refresh_place_if_stale()`를 KTO/카카오 두 경로로 분기 — 실제 KTO content_id가 없는 `yt_` 장소는 그동안 최신화 대상에서 아예 빠져있었는데, 카카오로 재검증(`_refresh_via_kakao`)하고 확인된 이름+주소로 KTO 승격도 시도(`_try_promote_to_kto`, 승격되면 다음부터 KTO 경로를 탐)하도록 신규 구현. 로컬 테스트 중 "해운대해수욕장"으로 KTO 자체 검색 시 관련 상호명을 가진 안경점이 1순위로 반환되는 실제 오매칭 사례를 발견해서, 승격 후보는 이름이 정확히 일치하는 것을 최우선으로 하도록 안전장치 추가. 프론트: 조회가 5초 넘게 걸리면 "시간이 걸리고 있습니다" 안내 추가(헤더 뒤로가기는 로딩 중에도 항상 가능), 언마운트 후 setState 방지 가드 추가.

### 내일 할 일
1. **포토스팟 "사진 올리기" CTA 검토(미구현, 논의만 함)** — KTO/카카오 둘 다 이미지 API를 안 줘서(구조적 한계, API로 더 가져올 방법 없음) 이미지 없는 장소는 어차피 유저가 올린 승인된 포토스팟 사진으로 자동 대체되는 기존 로직([PlaceSerializer.get_image_url()](../backend/places/serializers.py))이 있음 — 그런데 지금은 이미지 없으면 그냥 회색 아이콘이라 유저가 사진을 올릴 유인이 없음. 이미지 빈 자리에 "아직 사진이 없어요 · 첫 사진 올리기" CTA를 넣어서 포토스팟 업로드 화면으로 유도할지 검토.
2. 백필 안 된 나머지 확인 — `backfill_kakao_ids`에서 매칭없음 57건(카카오에 등록 자체가 없는 곳들, 구조적 한계라 그대로 둠), `낙동강`(강이라 지역이 여러 곳에 걸쳐 있어 보류) — 급한 건 아니고 참고용.

(2026-08-26 프론트 변경사항 — 영업시간/전화번호 표시, 5초 로딩 안내 — `eas update --branch production`으로 오늘 저녁 반영 예정. 네이티브 빌드/Play Console 업로드는 팀원이 직접 진행.)

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
