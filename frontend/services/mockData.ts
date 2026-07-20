import type { Media, Place, MediaPlace, Photo, Review, Schedule, PaginatedResponse, MailItem } from './types';

const MOCK_TAGS = [
  { id: 1, category: 'mood', name: '감성' },
  { id: 2, category: 'mood', name: '로맨스' },
  { id: 3, category: 'region', name: '서울' },
  { id: 4, category: 'region', name: '부산' },
  { id: 5, category: 'special', name: 'hype' },
  // CourseScreen PHOTO_TAGS와 매칭되는 포토스팟 필터용 태그
  { id: 6, category: 'place_type', name: '자연' },
  { id: 7, category: 'place_type', name: '음식' },
  { id: 8, category: 'place_type', name: '풍경' },
  { id: 9, category: 'place_type', name: '야경' },
  { id: 10, category: 'place_type', name: '카페' },
  { id: 11, category: 'place_type', name: '도심' },
  { id: 12, category: 'place_type', name: '계절' },
];

const MOCK_PLACE: Place = {
  id: 1,
  name: '광화문 광장',
  address: '서울특별시 종로구 세종대로 172',
  latitude: '37.5759',
  longitude: '126.9768',
  image_url: 'https://picsum.photos/seed/place1/400/300',
  category: '12',
  is_verified: true,
  is_bookmarked: false,
  rating: 4.3,
  like_count: 1200,
  tags: [MOCK_TAGS[0], MOCK_TAGS[2], MOCK_TAGS[10], MOCK_TAGS[8]],
  created_at: '2024-01-01T00:00:00Z',
};

const MOCK_PLACE_2: Place = {
  id: 2,
  name: '해운대 해수욕장',
  address: '부산광역시 해운대구 해운대해변로 264',
  latitude: '35.1587',
  longitude: '129.1604',
  image_url: 'https://picsum.photos/seed/place2/400/300',
  category: '12',
  is_verified: true,
  is_bookmarked: false,
  rating: 4.7,
  like_count: 3400,
  tags: [MOCK_TAGS[1], MOCK_TAGS[3], MOCK_TAGS[5], MOCK_TAGS[7]],
  created_at: '2024-01-01T00:00:00Z',
};

const MOCK_PLACE_3: Place = {
  id: 3,
  name: '경복궁',
  address: '서울특별시 종로구 사직로 161',
  latitude: '37.5796',
  longitude: '126.9770',
  image_url: 'https://picsum.photos/seed/place3/400/300',
  category: '14',
  is_verified: true,
  is_bookmarked: true,
  rating: 4.5,
  like_count: 8900,
  tags: [MOCK_TAGS[0], MOCK_TAGS[2], MOCK_TAGS[11], MOCK_TAGS[10]],
  created_at: '2024-01-01T00:00:00Z',
};

const MOCK_PLACE_4: Place = {
  id: 4,
  name: '북촌 한옥마을',
  address: '서울특별시 종로구 계동길 37',
  latitude: '37.5824',
  longitude: '126.9851',
  image_url: 'https://picsum.photos/seed/place4/400/300',
  category: '14',
  is_verified: true,
  is_bookmarked: false,
  rating: 4.2,
  like_count: 5600,
  tags: [MOCK_TAGS[0], MOCK_TAGS[2], MOCK_TAGS[9], MOCK_TAGS[11]],
  created_at: '2024-01-01T00:00:00Z',
};

const MOCK_PLACE_5: Place = {
  id: 5,
  name: '남산타워',
  address: '서울특별시 용산구 남산공원길 105',
  latitude: '37.5512',
  longitude: '126.9882',
  image_url: 'https://picsum.photos/seed/place5/400/300',
  category: '14',
  is_verified: true,
  is_bookmarked: false,
  rating: 4.6,
  like_count: 12300,
  tags: [MOCK_TAGS[1], MOCK_TAGS[2], MOCK_TAGS[8], MOCK_TAGS[5]],
  created_at: '2024-01-01T00:00:00Z',
};

const MOCK_PLACE_6: Place = {
  id: 6,
  name: '인사동 거리',
  address: '서울특별시 종로구 인사동길 44',
  latitude: '37.5744',
  longitude: '126.9855',
  image_url: 'https://picsum.photos/seed/place6/400/300',
  category: '15',
  is_verified: true,
  is_bookmarked: false,
  rating: 4.0,
  like_count: 3200,
  tags: [MOCK_TAGS[0], MOCK_TAGS[2], MOCK_TAGS[6], MOCK_TAGS[9]],
  created_at: '2024-01-01T00:00:00Z',
};

export const MOCK_MEDIA_LIST: Media[] = [
  {
    id: 1,
    title: '도깨비',
    media_type: 'drama',
    year: 2016,
    thumbnail_url: 'https://picsum.photos/seed/media1/400/300',
    description: '불멸의 삶을 끝내줄 신부를 기다리는 도깨비와 기억을 잃은 저승사자, 그리고 도깨비 신부를 자처하는 소녀의 신비로운 러브스토리.',
    tags: [MOCK_TAGS[0], MOCK_TAGS[1]],
    is_bookmarked: false,
    place_count: 5,
    rating: 4.8,
    like_count: 3241,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: '이상한 변호사 우영우',
    media_type: 'drama',
    year: 2022,
    thumbnail_url: 'https://picsum.photos/seed/media2/400/300',
    description: '자폐 스펙트럼 장애를 가진 천재 변호사 우영우의 성장 이야기.',
    tags: [MOCK_TAGS[0], MOCK_TAGS[2]],
    is_bookmarked: true,
    place_count: 5,
    rating: 4.6,
    like_count: 2187,
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    title: '범죄도시',
    media_type: 'movie',
    year: 2017,
    thumbnail_url: 'https://picsum.photos/seed/media3/400/300',
    description: '서울 금천구를 배경으로 한 형사 마석도의 액션 영화.',
    tags: [MOCK_TAGS[2]],
    is_bookmarked: false,
    place_count: 3,
    rating: 4.3,
    like_count: 1542,
    created_at: '2024-01-03T00:00:00Z',
  },
  {
    id: 4,
    title: '응답하라 1988',
    media_type: 'drama',
    year: 2015,
    thumbnail_url: 'https://picsum.photos/seed/media4/400/300',
    description: '1988년 서울 쌍문동 골목을 배경으로 한 청춘 성장 드라마.',
    tags: [MOCK_TAGS[0], MOCK_TAGS[1]],
    is_bookmarked: false,
    place_count: 6,
    rating: 4.9,
    like_count: 4801,
    created_at: '2024-01-04T00:00:00Z',
  },
  {
    id: 5,
    title: '부산행',
    media_type: 'movie',
    year: 2016,
    thumbnail_url: 'https://picsum.photos/seed/media5/400/300',
    description: '부산으로 향하는 KTX 열차 안에서 벌어지는 좀비 재난 영화.',
    tags: [MOCK_TAGS[3]],
    is_bookmarked: false,
    place_count: 4,
    rating: 4.1,
    like_count: 987,
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: 6,
    title: '사랑의 불시착',
    media_type: 'drama',
    year: 2019,
    thumbnail_url: 'https://picsum.photos/seed/media6/400/300',
    description: '패러글라이딩 사고로 북한에 불시착한 재벌 상속녀와 북한 장교의 로맨스.',
    tags: [MOCK_TAGS[1], MOCK_TAGS[2]],
    is_bookmarked: true,
    place_count: 3,
    rating: 4.7,
    like_count: 2934,
    created_at: '2024-01-06T00:00:00Z',
  },
  {
    id: 7,
    title: '기생충',
    media_type: 'movie',
    year: 2019,
    thumbnail_url: 'https://picsum.photos/seed/media7/400/300',
    description: '전원 백수인 기택 가족과 부유한 박 사장 가족의 이야기.',
    tags: [MOCK_TAGS[0], MOCK_TAGS[2]],
    is_bookmarked: false,
    place_count: 9,
    rating: 4.5,
    like_count: 2103,
    created_at: '2024-01-07T00:00:00Z',
  },
  {
    id: 8,
    title: '갯마을 차차차',
    media_type: 'drama',
    year: 2021,
    thumbnail_url: 'https://picsum.photos/seed/media8/400/300',
    description: '바닷마을 공진에서 펼쳐지는 치과의사와 백수건달의 로맨스.',
    tags: [MOCK_TAGS[1], MOCK_TAGS[3]],
    is_bookmarked: false,
    place_count: 6,
    rating: 4.4,
    like_count: 1678,
    created_at: '2024-01-08T00:00:00Z',
  },
  {
    id: 9,
    title: '서울 맛집 브이로그 - 종로 골목 투어',
    media_type: 'youtube',
    year: 2023,
    thumbnail_url: 'https://picsum.photos/seed/media9/400/300',
    description: '유튜버가 직접 다녀온 서울 종로 일대 맛집과 핫플레이스를 소개하는 여행 브이로그.',
    tags: [MOCK_TAGS[0], MOCK_TAGS[2]],
    is_bookmarked: false,
    place_count: 4,
    rating: 4.6,
    like_count: 5820,
    created_at: '2024-01-09T00:00:00Z',
  },
  {
    id: 10,
    title: '부산 여행 브이로그 - 해운대 감성 카페 투어',
    media_type: 'youtube',
    year: 2024,
    thumbnail_url: 'https://picsum.photos/seed/media10/400/300',
    description: '조회수 폭발 중인 부산 여행 브이로그. 해운대 일대 감성 카페와 핫플레이스를 소개합니다.',
    tags: [MOCK_TAGS[1], MOCK_TAGS[3], MOCK_TAGS[4]],
    is_bookmarked: false,
    place_count: 3,
    rating: 4.9,
    like_count: 12400,
    created_at: '2024-01-10T00:00:00Z',
  },
];

export const MOCK_MEDIA_PLACES: MediaPlace[] = [
  {
    id: 1,
    place: MOCK_PLACE,
    day: 1,
    scene_description: '주인공이 처음 만나는 장소',
    confidence_score: 0.95,
    is_confirmed: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    place: MOCK_PLACE_2,
    day: 1,
    scene_description: '바다를 바라보는 장면',
    confidence_score: 0.88,
    is_confirmed: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    place: MOCK_PLACE_3,
    day: 2,
    scene_description: '역사적인 배경 장면',
    confidence_score: 0.92,
    is_confirmed: true,
    created_at: '2024-01-01T00:00:00Z',
  },
];

// 미디어 ID별 장소 목록 — importToSchedule 시 daily_places 생성에 사용
export const MOCK_MEDIA_PLACES_MAP: Record<number, MediaPlace[]> = {
  1: [ // 도깨비
    { id: 1, place: MOCK_PLACE,    day: 1, scene_description: '', confidence_score: 0.95, is_confirmed: true, created_at: '' },
    { id: 2, place: MOCK_PLACE_4,  day: 1, scene_description: '', confidence_score: 0.90, is_confirmed: true, created_at: '' },
    { id: 3, place: MOCK_PLACE_5,  day: 1, scene_description: '', confidence_score: 0.88, is_confirmed: true, created_at: '' },
    { id: 4, place: MOCK_PLACE_2,  day: 2, scene_description: '', confidence_score: 0.85, is_confirmed: true, created_at: '' },
    { id: 5, place: MOCK_PLACE_6,  day: 2, scene_description: '', confidence_score: 0.82, is_confirmed: true, created_at: '' },
  ],
  2: [ // 이상한 변호사 우영우
    { id: 6, place: MOCK_PLACE_3,  day: 1, scene_description: '', confidence_score: 0.93, is_confirmed: true, created_at: '' },
    { id: 7, place: MOCK_PLACE_6,  day: 1, scene_description: '', confidence_score: 0.88, is_confirmed: true, created_at: '' },
    { id: 8, place: MOCK_PLACE,    day: 2, scene_description: '', confidence_score: 0.85, is_confirmed: true, created_at: '' },
    { id: 9, place: MOCK_PLACE_5,  day: 2, scene_description: '', confidence_score: 0.80, is_confirmed: true, created_at: '' },
    { id: 10, place: MOCK_PLACE_4, day: 3, scene_description: '', confidence_score: 0.78, is_confirmed: true, created_at: '' },
  ],
  5: [ // 부산행
    { id: 14, place: MOCK_PLACE_2, day: 1, scene_description: '', confidence_score: 0.92, is_confirmed: true, created_at: '' },
    { id: 15, place: MOCK_PLACE_5, day: 1, scene_description: '', confidence_score: 0.88, is_confirmed: true, created_at: '' },
    { id: 16, place: MOCK_PLACE_3, day: 2, scene_description: '', confidence_score: 0.85, is_confirmed: true, created_at: '' },
    { id: 17, place: MOCK_PLACE_6, day: 2, scene_description: '', confidence_score: 0.80, is_confirmed: true, created_at: '' },
  ],
  6: [ // 사랑의 불시착
    { id: 11, place: MOCK_PLACE_5, day: 1, scene_description: '', confidence_score: 0.91, is_confirmed: true, created_at: '' },
    { id: 12, place: MOCK_PLACE,   day: 2, scene_description: '', confidence_score: 0.87, is_confirmed: true, created_at: '' },
    { id: 13, place: MOCK_PLACE_3, day: 2, scene_description: '', confidence_score: 0.84, is_confirmed: true, created_at: '' },
  ],
  9: [ // 서울 맛집 브이로그 - 종로 골목 투어
    { id: 18, place: MOCK_PLACE,   day: 1, scene_description: '', confidence_score: 0.90, is_confirmed: true, created_at: '' },
    { id: 19, place: MOCK_PLACE_3, day: 1, scene_description: '', confidence_score: 0.88, is_confirmed: true, created_at: '' },
    { id: 20, place: MOCK_PLACE_6, day: 1, scene_description: '', confidence_score: 0.86, is_confirmed: true, created_at: '' },
    { id: 21, place: MOCK_PLACE_4, day: 1, scene_description: '', confidence_score: 0.82, is_confirmed: true, created_at: '' },
  ],
  10: [ // 부산 여행 브이로그 - 해운대 감성 카페 투어
    { id: 22, place: MOCK_PLACE_2, day: 1, scene_description: '', confidence_score: 0.94, is_confirmed: true, created_at: '' },
    { id: 23, place: MOCK_PLACE_5, day: 1, scene_description: '', confidence_score: 0.90, is_confirmed: true, created_at: '' },
    { id: 24, place: MOCK_PLACE_6, day: 1, scene_description: '', confidence_score: 0.85, is_confirmed: true, created_at: '' },
  ],
};

export const MOCK_PHOTOS: Photo[] = [
  {
    id: 1,
    image_url: 'https://picsum.photos/seed/photo1/400/300',
    description: '아름다운 일몰',
    likes: 120,
    tags: [MOCK_TAGS[0]],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    image_url: 'https://picsum.photos/seed/photo2/400/300',
    description: '도심 야경',
    likes: 85,
    tags: [MOCK_TAGS[2]],
    created_at: '2024-01-02T00:00:00Z',
  },
];

// 장소별 포토스팟 목데이터 — placeApi.getPhotos(id)가 장소마다 다른 사진을 반환하도록 함
export const MOCK_PHOTOS_BY_PLACE: Record<number, Photo[]> = {
  1: [ // 광화문 광장
    { id: 101, image_url: 'https://picsum.photos/seed/gwanghwamun1/400/300', description: '광화문 야경', likes: 210, tags: [MOCK_TAGS[8]], created_at: '2024-01-01T00:00:00Z' },
    { id: 102, image_url: 'https://picsum.photos/seed/gwanghwamun2/400/300', description: '광화문 앞 도심 풍경', likes: 96, tags: [MOCK_TAGS[10]], created_at: '2024-01-01T00:00:00Z' },
  ],
  2: [ // 해운대 해수욕장
    { id: 103, image_url: 'https://picsum.photos/seed/haeundae1/400/300', description: '해운대 일몰', likes: 340, tags: [MOCK_TAGS[7]], created_at: '2024-01-01T00:00:00Z' },
    { id: 104, image_url: 'https://picsum.photos/seed/haeundae2/400/300', description: '탁 트인 바다 풍경', likes: 188, tags: [MOCK_TAGS[5]], created_at: '2024-01-01T00:00:00Z' },
  ],
  3: [ // 경복궁
    { id: 105, image_url: 'https://picsum.photos/seed/gyeongbok1/400/300', description: '경복궁 단풍', likes: 275, tags: [MOCK_TAGS[11]], created_at: '2024-01-01T00:00:00Z' },
    { id: 106, image_url: 'https://picsum.photos/seed/gyeongbok2/400/300', description: '한복 입고 궁궐 산책', likes: 152, tags: [MOCK_TAGS[10]], created_at: '2024-01-01T00:00:00Z' },
  ],
  4: [ // 북촌 한옥마을
    { id: 107, image_url: 'https://picsum.photos/seed/bukchon1/400/300', description: '북촌 골목 카페', likes: 130, tags: [MOCK_TAGS[9]], created_at: '2024-01-01T00:00:00Z' },
    { id: 108, image_url: 'https://picsum.photos/seed/bukchon2/400/300', description: '한옥 지붕 풍경', likes: 98, tags: [MOCK_TAGS[11]], created_at: '2024-01-01T00:00:00Z' },
  ],
  5: [ // 남산타워
    { id: 109, image_url: 'https://picsum.photos/seed/namsan1/400/300', description: '남산타워 야경', likes: 420, tags: [MOCK_TAGS[8]], created_at: '2024-01-01T00:00:00Z' },
    { id: 110, image_url: 'https://picsum.photos/seed/namsan2/400/300', description: '전망대에서 본 자연 풍경', likes: 201, tags: [MOCK_TAGS[5]], created_at: '2024-01-01T00:00:00Z' },
  ],
  6: [ // 인사동 거리
    { id: 111, image_url: 'https://picsum.photos/seed/insadong1/400/300', description: '인사동 전통 디저트', likes: 87, tags: [MOCK_TAGS[6]], created_at: '2024-01-01T00:00:00Z' },
    { id: 112, image_url: 'https://picsum.photos/seed/insadong2/400/300', description: '골목 찻집', likes: 64, tags: [MOCK_TAGS[9]], created_at: '2024-01-01T00:00:00Z' },
  ],
};

const PLACE_NAME_BY_ID: Record<number, string> = {
  1: MOCK_PLACE.name, 2: MOCK_PLACE_2.name, 3: MOCK_PLACE_3.name,
  4: MOCK_PLACE_4.name, 5: MOCK_PLACE_5.name, 6: MOCK_PLACE_6.name,
};

// 전체 포토스팟 mutable store — bookmark/unbookmark 시 is_bookmarked를 실제로 변경
export const mockPhotoStore: Photo[] = [
  ...MOCK_PHOTOS,
  ...Object.values(MOCK_PHOTOS_BY_PLACE).flat(),
];

// 저장소(북마크) 응답에 place_name을 채우기 위한 포토스팟 id → 장소명 매핑
export const mockPhotoPlaceName: Record<number, string> = Object.fromEntries(
  Object.entries(MOCK_PHOTOS_BY_PLACE).flatMap(([placeId, photos]) =>
    photos.map((p) => [p.id, PLACE_NAME_BY_ID[Number(placeId)] ?? ''])
  )
);

// PhotoSpotDetailScreen에서 사진이 속한 장소를 조회하기 위한 포토스팟 id → 장소 id 매핑
export const mockPhotoPlaceId: Record<number, number> = Object.fromEntries(
  Object.entries(MOCK_PHOTOS_BY_PLACE).flatMap(([placeId, photos]) =>
    photos.map((p) => [p.id, Number(placeId)])
  )
);

// 백엔드에 별점 필드가 아직 없어 임시로 사용하는 목데이터 전용 평점 — id 기반으로 고정값 산출
export const pseudoRating = (photo: Photo): number => {
  const val = 3.8 + ((photo.id * 7) % 12) / 10;
  return Math.min(5, Math.round(val * 10) / 10);
};

export const MOCK_SCHEDULES: Schedule[] = [
  {
    id: 1,
    title: '도깨비 여행코스',
    media: { id: 1, title: '도깨비', thumbnail_url: 'https://picsum.photos/seed/media1/400/300', media_type: 'drama', tags: [MOCK_TAGS[0], MOCK_TAGS[1]], place_count: 5 },
    start_date: '2026-06-13',
    end_date: '2026-06-15',
    is_bookmarked: true,
    daily_places: [
      { id: 1, day_number: 1, order: 1, memo: '', place: MOCK_PLACE },
      { id: 2, day_number: 1, order: 2, memo: '', place: MOCK_PLACE_4 },
      { id: 3, day_number: 1, order: 3, memo: '', place: MOCK_PLACE_5 },
      { id: 4, day_number: 2, order: 1, memo: '', place: MOCK_PLACE_2 },
      { id: 5, day_number: 2, order: 2, memo: '', place: MOCK_PLACE_6 },
      { id: 6, day_number: 3, order: 1, memo: '', place: MOCK_PLACE_3 },
      { id: 7, day_number: 3, order: 2, memo: '', place: MOCK_PLACE_4 },
    ],
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: '우영우 서울 탐방',
    media: { id: 2, title: '이상한 변호사 우영우', thumbnail_url: 'https://picsum.photos/seed/media2/400/300', media_type: 'drama', tags: [MOCK_TAGS[0], MOCK_TAGS[2]], place_count: 5 },
    start_date: '2026-07-05',
    end_date: '2026-07-07',
    is_bookmarked: false,
    daily_places: [
      { id: 8,  day_number: 1, order: 1, memo: '', place: MOCK_PLACE_3 },
      { id: 9,  day_number: 1, order: 2, memo: '', place: MOCK_PLACE_6 },
      { id: 10, day_number: 2, order: 1, memo: '', place: MOCK_PLACE },
      { id: 11, day_number: 2, order: 2, memo: '', place: MOCK_PLACE_5 },
      { id: 12, day_number: 3, order: 1, memo: '', place: MOCK_PLACE_4 },
    ],
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    title: '부산 영화 투어',
    media: { id: 5, title: '부산행', thumbnail_url: 'https://picsum.photos/seed/media5/400/300', media_type: 'movie', tags: [MOCK_TAGS[3]], place_count: 4 },
    start_date: '2026-08-10',
    end_date: '2026-08-11',
    is_bookmarked: false,
    daily_places: [],
    created_at: '2024-01-05T00:00:00Z',
  },
  {
    id: 4,
    title: '응답하라 1988 성지순례',
    media: { id: 4, title: '응답하라 1988', thumbnail_url: 'https://picsum.photos/seed/media4/400/300', media_type: 'drama', tags: [MOCK_TAGS[0], MOCK_TAGS[1]], place_count: 6 },
    start_date: '2026-05-01',
    end_date: '2026-05-03',
    is_bookmarked: false,
    daily_places: [
      { id: 5, day_number: 1, order: 1, memo: '', place: MOCK_PLACE },
      { id: 6, day_number: 2, order: 1, memo: '', place: MOCK_PLACE_3 },
    ],
    created_at: '2024-01-04T00:00:00Z',
  },
  {
    id: 5,
    title: '기생충 촬영지 투어',
    media: { id: 7, title: '기생충', thumbnail_url: 'https://picsum.photos/seed/media7/400/300', media_type: 'movie', tags: [MOCK_TAGS[0], MOCK_TAGS[2]], place_count: 9 },
    start_date: '2026-04-10',
    end_date: '2026-04-11',
    is_bookmarked: true,
    daily_places: [
      { id: 7, day_number: 1, order: 1, memo: '', place: MOCK_PLACE_2 },
    ],
    created_at: '2024-01-07T00:00:00Z',
  },
];

// 런타임에 생성된 일정을 포함하는 mutable store — getList/getDetail/importToSchedule이 공유
export const mockScheduleStore: Schedule[] = [...MOCK_SCHEDULES];

// 전체 장소 mutable store — bookmark/unbookmark 시 is_bookmarked를 실제로 변경
export const mockPlaceStore: Place[] = [
  MOCK_PLACE, MOCK_PLACE_2, MOCK_PLACE_3, MOCK_PLACE_4, MOCK_PLACE_5, MOCK_PLACE_6,
];

// TODO: 목데이터. 전체 포토스팟이 공유하는 임시 리뷰 목록 — 실제 데이터 연동 시 대상(장소/코스/포토스팟)별 리뷰 API로 교체
// 리뷰 작성 화면에서 새 리뷰를 앞에 추가(unshift)하는 mutable store
export const mockReviewStore: Review[] = [
  {
    id: 1,
    author: '여행자1',
    travelDate: '2026.04.02',
    writtenDate: '2026.05.01',
    rating: 5,
    content:
      '분위기가 정말 좋았어요. 사진 찍기 딱 좋은 곳이에요. 주변에 카페도 많고 산책하기도 좋아서 하루 종일 있어도 지루하지 않았어요. 특히 노을 질 때 색감이 예술이었습니다. 사람이 몰리는 시간대만 피하면 여유롭게 사진도 찍을 수 있고, 근처 맛집도 많아서 같이 둘러보기 좋아요. 아이와 함께 가도 무리 없을 정도로 동선이 편했습니다. 다음에 또 오고 싶어요. 강력 추천합니다!',
    images: [
      'https://picsum.photos/seed/review1-1/400/300',
      'https://picsum.photos/seed/review1-2/400/300',
      'https://picsum.photos/seed/review1-3/400/300',
    ],
    hasPhoto: true,
    likeCount: 24,
    isMine: false,
  },
  {
    id: 2,
    author: '여행자2',
    travelDate: '2026.03.15',
    writtenDate: '2026.03.20',
    rating: 3,
    content: '생각보다 사람이 많아서 아쉬웠지만 뷰는 최고였어요.',
    images: [],
    hasPhoto: false,
    likeCount: 3,
    isMine: false,
  },
  {
    id: 3,
    author: '여행자3',
    travelDate: '2026.02.10',
    writtenDate: '2026.02.14',
    rating: 4,
    content:
      '해질녘에 가면 더 예뻐요! 노을이 지기 시작할 때 딱 맞춰서 도착하는 걸 추천해요. 주차 공간이 넉넉하지 않아서 대중교통으로 가는 게 편했습니다.',
    images: ['https://picsum.photos/seed/review3-1/400/300'],
    hasPhoto: true,
    likeCount: 11,
    isMine: false,
  },
];

export function paginatedOf<T>(results: T[]): PaginatedResponse<T> {
  return { count: results.length, next: null, previous: null, results };
}

// 우편함 mutable store — 받기/일괄받기 시 실제로 항목이 제거됨
export const mockMailStore: MailItem[] = [
  { id: 1, action: '퀴즈 제출', tokenAmount: 3 },
  { id: 2, action: '리뷰 작성', tokenAmount: 5 },
];

// 보유 토큰 mutable store — 충전 시 실제로 값이 증가
export let mockTokenBalance = 120;
export function setMockTokenBalance(next: number) {
  mockTokenBalance = next;
}

// 닉네임 mutable store — 화면을 나갔다 들어와도 변경값 유지 (앱 재시작 시엔 초기화)
export let mockNickname = '내이름은김철수';
export function setMockNickname(next: string) {
  mockNickname = next;
}

// 아이디 mutable store — 화면을 나갔다 들어와도 변경값 유지 (앱 재시작 시엔 초기화)
export let mockUserId = 'id1234';
export function setMockUserId(next: string) {
  mockUserId = next;
}

// 이메일 mutable store — 화면을 나갔다 들어와도 변경값 유지 (앱 재시작 시엔 초기화)
export let mockEmail = '';
export function setMockEmail(next: string) {
  mockEmail = next;
}
