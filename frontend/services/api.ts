import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Media, Place, Photo, MediaPlace, PhotoSpotDetail, Review, ReviewTarget, ReviewTargetType, Schedule, PaginatedResponse, MailItem } from './types';
import {
  MOCK_MEDIA_LIST, MOCK_MEDIA_PLACES_MAP, MOCK_PHOTOS, MOCK_PHOTOS_BY_PLACE, mockPhotoStore, mockPhotoPlaceName,
  mockPhotoPlaceId, mockScheduleStore, mockPlaceStore, mockReviewStore, mockMailStore, mockSettlementStore, paginatedOf,
  mockTokenBalance, setMockTokenBalance,
  mockNickname, setMockNickname,
  mockProfileImage, setMockProfileImage,
  mockUserId, setMockUserId,
  mockEmail, setMockEmail,
  mockPassword, setMockPassword, resetMockAccount,
} from './mockData';

// 토큰 충전 상품 카탈로그 — 백엔드 TOKEN_PACKAGES(users/views.py)와 동일하게 유지
export const TOKEN_PACKAGES: { id: string; tokens: number; price: number }[] = [
  { id: 'p100', tokens: 100, price: 1000 },
  { id: 'p500', tokens: 500, price: 4500 },
  { id: 'p1000', tokens: 1000, price: 8000 },
];

// 서버 없이 UI 테스트할 때 true로 설정
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// mock 데이터 id 생성기 — Date.now()는 같은 ms 안에 여러 번 호출되면(반복문 등) 값이 겹쳐 중복 id를 만들 수 있어 카운터로 대체
let mockIdCounter = Date.now();
const nextMockId = () => ++mockIdCounter;

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
console.log('API BASE_URL:', BASE_URL, USE_MOCK ? '(MOCK MODE)' : '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  // Cache-Control 없으면 웹(브라우저)에서 GET 요청이 캐시되어, 서버 데이터가 바뀌어도
  // 화면엔 예전 응답이 그대로 뜨는 문제가 생긴다 (예: 닉네임 변경 후에도 MY페이지에 옛 값 표시).
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

// 로그인 토큰 저장/조회 — access는 매 요청 헤더에 붙이고, refresh는 access 만료시 갱신용
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const setTokens = (access: string, refresh: string) =>
  AsyncStorage.multiSet([[ACCESS_TOKEN_KEY, access], [REFRESH_TOKEN_KEY, refresh]]);

export const clearTokens = () => AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;
      try {
        const res = await axios.post<{ access: string }>(`${BASE_URL}/api/users/token/refresh/`, { refresh: refreshToken });
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, res.data.access);
        return res.data.access;
      } catch {
        await clearTokens();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

apiClient.interceptors.request.use(async (config) => {
  const deviceId = await AsyncStorage.getItem('device_id');
  if (deviceId) {
    config.headers['X-Device-ID'] = deviceId;
  }
  const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!USE_MOCK && error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        original.headers['Authorization'] = `Bearer ${newAccess}`;
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  }
);

const mock = <T>(data: T): Promise<{ data: T }> => Promise.resolve({ data });

export const authApi = {
  signup: async (data: { username: string; nickname: string; password: string }) => {
    if (USE_MOCK) {
      setMockUserId(data.username);
      setMockNickname(data.nickname);
      setMockPassword(data.password);
      return mock({ id: 1, username: data.username, nickname: data.nickname, access: 'mock-access', refresh: 'mock-refresh' });
    }
    const res = await apiClient.post<{ id: number; username: string; nickname: string; access: string; refresh: string }>(
      '/api/users/signup/', data
    );
    await setTokens(res.data.access, res.data.refresh);
    return res;
  },
  login: async (data: { username: string; password: string }) => {
    if (USE_MOCK) {
      if (data.username !== mockUserId || data.password !== mockPassword) {
        return Promise.reject({
          response: { data: { detail: '등록되지 않은 아이디이거나, 비밀번호가 올바르지 않습니다.' } },
        });
      }
      return mock({ id: 1, username: data.username, nickname: mockNickname, access: 'mock-access', refresh: 'mock-refresh' });
    }
    const res = await apiClient.post<{ id: number; username: string; nickname: string; access: string; refresh: string }>(
      '/api/users/login/', data
    );
    await setTokens(res.data.access, res.data.refresh);
    return res;
  },
  logout: () => clearTokens(),
  findId: (email: string, password: string) => {
    if (USE_MOCK) {
      if (!mockEmail || email !== mockEmail || password !== mockPassword) {
        return Promise.reject({
          response: { data: { detail: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.' } },
        });
      }
      return mock({ masked_username: `${mockUserId.slice(0, 4)}******` });
    }
    return apiClient.post<{ masked_username: string }>('/api/users/find-id/', { email, password });
  },
  requestPasswordReset: (username: string) => {
    if (USE_MOCK) {
      if (username !== mockUserId || !mockEmail) {
        return Promise.reject({
          response: { data: { detail: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.' } },
        });
      }
      return mock({ masked_email: '12****@n****.com' });
    }
    return apiClient.post<{ masked_email: string }>('/api/users/password-reset/request/', { username });
  },
  verifyPasswordReset: (username: string, code: string) => {
    if (USE_MOCK) {
      return mock({ verified: code === '1111' });
    }
    return apiClient.post<{ verified: boolean }>('/api/users/password-reset/verify/', { username, code });
  },
  confirmPasswordReset: (username: string, newPassword: string) => {
    if (USE_MOCK) {
      setMockPassword(newPassword);
      return mock({ detail: '비밀번호 재설정이 완료되었습니다.' });
    }
    return apiClient.post<{ detail: string }>('/api/users/password-reset/confirm/', {
      username,
      new_password: newPassword,
    });
  },
};

export const userApi = {
  createUser: () =>
    USE_MOCK ? mock({ device_id: 'mock-device' }) : apiClient.post<{ device_id: string }>('/api/users/'),
  getMe: () =>
    USE_MOCK
      ? mock({ token_balance: mockTokenBalance, nickname: mockNickname, username: mockUserId, email: mockEmail, profile_image: mockProfileImage })
      : apiClient.get<{ id: number; token_balance: number; nickname: string; username: string; email: string; profile_image: string | null }>('/api/users/me/'),
  chargeToken: (packageId: string) => {
    if (USE_MOCK) {
      const pkg = TOKEN_PACKAGES.find(p => p.id === packageId);
      setMockTokenBalance(mockTokenBalance + (pkg?.tokens ?? 0));
      return mock({ token_balance: mockTokenBalance });
    }
    return apiClient.post<{ token_balance: number }>('/api/users/charge-token/', { package_id: packageId });
  },
  resetToken: () => {
    if (USE_MOCK) {
      setMockTokenBalance(0);
      return mock({ token_balance: mockTokenBalance });
    }
    return apiClient.post<{ token_balance: number }>('/api/users/reset-token/');
  },
  watchAd: (reward: number) => {
    if (USE_MOCK) {
      setMockTokenBalance(mockTokenBalance + reward);
      return mock({ token_balance: mockTokenBalance });
    }
    return apiClient.post<{ token_balance: number }>('/api/users/watch-ad/');
  },
  verifyPassword: (password: string) => {
    if (USE_MOCK) {
      return mock({ success: password === mockPassword });
    }
    return apiClient.post<{ success: boolean }>('/api/users/verify-password/', { password });
  },
  changePassword: (currentPassword: string, newPassword: string) => {
    if (USE_MOCK) {
      setMockPassword(newPassword);
      return mock({ detail: '비밀번호가 변경되었습니다.' });
    }
    return apiClient.post<{ detail: string }>('/api/users/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
  updateNickname: (nickname: string) => {
    if (USE_MOCK) {
      setMockNickname(nickname);
      return mock({ nickname: mockNickname });
    }
    return apiClient.patch<{ nickname: string }>('/api/users/me/', { nickname });
  },
  updateProfileImage: (imageUri: string) => {
    if (USE_MOCK) {
      setMockProfileImage(imageUri);
      return mock({ profile_image: mockProfileImage });
    }
    return apiClient.patch<{ profile_image: string }>('/api/users/me/', { profile_image: imageUri });
  },
  updateUserId: (userId: string) => {
    if (USE_MOCK) {
      setMockUserId(userId);
      return mock({ username: mockUserId });
    }
    return apiClient.patch<{ username: string }>('/api/users/me/', { username: userId });
  },
  requestEmailLink: (email: string) => {
    if (USE_MOCK) {
      return mock({ email });
    }
    return apiClient.post<{ email: string }>('/api/users/email/request/', { email });
  },
  confirmEmailLink: (email: string, code: string) => {
    if (USE_MOCK) {
      setMockEmail(email);
      return mock({ email: mockEmail });
    }
    return apiClient.post<{ email: string }>('/api/users/email/confirm/', { email, code });
  },
  withdraw: (password: string) => {
    if (USE_MOCK) {
      resetMockAccount();
      return mock({});
    }
    return apiClient.post('/api/users/withdraw/', { password });
  },
};

// 코스 추가 건의함 — 백엔드 미착수(DEVPLAN Phase 10-1) 상태라 mock 모드에서만 토큰 차감이 동작함
export const COURSE_SUGGESTION_TOKEN_COST = 100; // 임시

export const courseSuggestionApi = {
  create: (payload: { title: string; link: string; media_type: string; description: string }) => {
    if (USE_MOCK) {
      setMockTokenBalance(mockTokenBalance - COURSE_SUGGESTION_TOKEN_COST);
      return mock({ token_balance: mockTokenBalance });
    }
    return apiClient.post<{ token_balance: number }>('/api/course-suggestions/', payload);
  },
};

export const mailApi = {
  getList: () =>
    USE_MOCK ? mock([...mockMailStore]) : apiClient.get<MailItem[]>('/api/mailbox/'),
  claim: (id: number) => {
    if (USE_MOCK) {
      const idx = mockMailStore.findIndex(m => m.id === id);
      if (idx !== -1) {
        setMockTokenBalance(mockTokenBalance + mockMailStore[idx].tokenAmount);
        mockMailStore.splice(idx, 1);
      }
      return mock({ token_balance: mockTokenBalance });
    }
    return apiClient.post<{ token_balance: number }>(`/api/mailbox/${id}/claim/`);
  },
  claimAll: () => {
    if (USE_MOCK) {
      const total = mockMailStore.reduce((sum, m) => sum + m.tokenAmount, 0);
      setMockTokenBalance(mockTokenBalance + total);
      mockMailStore.length = 0;
      return mock({ token_balance: mockTokenBalance });
    }
    return apiClient.post<{ token_balance: number }>('/api/mailbox/claim-all/');
  },
};

export const mediaApi = {
  getList: (params?: { type?: string; tag?: string; keyword?: string }) => {
    if (USE_MOCK) {
      const filtered = params?.type
        ? MOCK_MEDIA_LIST.filter(m => m.media_type === params.type)
        : MOCK_MEDIA_LIST;
      return mock(paginatedOf(filtered));
    }
    return apiClient.get<PaginatedResponse<Media>>('/api/media/', { params });
  },
  getDetail: (id: number) =>
    USE_MOCK
      ? mock(MOCK_MEDIA_LIST.find(m => m.id === id) ?? MOCK_MEDIA_LIST[0])
      : apiClient.get<Media>(`/api/media/${id}/`),
  getPlaces: (id: number) =>
    USE_MOCK ? mock(MOCK_MEDIA_PLACES_MAP[id] ?? []) : apiClient.get<MediaPlace[]>(`/api/media/${id}/places/`),
  getBookmarked: () =>
    USE_MOCK ? mock(MOCK_MEDIA_LIST.filter(m => m.is_bookmarked)) : apiClient.get<Media[]>('/api/media/bookmarked/'),
  bookmark: (id: number) => {
    if (USE_MOCK) {
      const item = MOCK_MEDIA_LIST.find(m => m.id === id);
      if (item) item.is_bookmarked = true;
      return mock({});
    }
    return apiClient.post(`/api/media/${id}/bookmark/`);
  },
  unbookmark: (id: number) => {
    if (USE_MOCK) {
      const item = MOCK_MEDIA_LIST.find(m => m.id === id);
      if (item) item.is_bookmarked = false;
      return mock({});
    }
    return apiClient.delete(`/api/media/${id}/bookmark/`);
  },
  submitQuiz: (id: number, answers: Record<number, string>) => {
    if (USE_MOCK) {
      const item = MOCK_MEDIA_LIST.find(m => m.id === id);
      if (item) item.is_submitted = true;
      return mock({});
    }
    return apiClient.post(`/api/media/${id}/quiz/submit/`, { answers });
  },
  importToSchedule: (id: number, data?: { title?: string; start_date?: string; end_date?: string }) => {
    if (USE_MOCK) {
      const mediaPlaces = MOCK_MEDIA_PLACES_MAP[id] ?? [];
      const media = MOCK_MEDIA_LIST.find(m => m.id === id) ?? null;
      const newSchedule: Schedule = {
        id: nextMockId(),
        title: data?.title ?? media?.title ?? '새 일정',
        media: media ? { id: media.id, title: media.title, thumbnail_url: media.thumbnail_url, media_type: media.media_type, tags: media.tags, place_count: media.place_count } : null,
        start_date: data?.start_date ?? null,
        end_date: data?.end_date ?? null,
        is_bookmarked: false,
        daily_places: mediaPlaces.map((mp, i) => ({
          id: nextMockId(),
          day_number: mp.day ?? 1,
          order: i + 1,
          memo: '',
          place: mp.place,
        })),
        created_at: new Date().toISOString(),
      };
      mockScheduleStore.push(newSchedule);
      return mock(newSchedule);
    }
    return apiClient.post<Schedule>(`/api/media/${id}/import/`, data);
  },
};

export const placeApi = {
  getList: (params?: { keyword?: string; category?: string; tag?: string }) =>
    USE_MOCK ? mock(paginatedOf(mockPlaceStore)) : apiClient.get<PaginatedResponse<Place>>('/api/places/', { params }),
  getDetail: (id: number) =>
    USE_MOCK
      ? mock(mockPlaceStore.find(p => p.id === id) ?? mockPlaceStore[0])
      : apiClient.get<Place>(`/api/places/${id}/`),
  getPhotos: (id: number) =>
    USE_MOCK ? mock(MOCK_PHOTOS_BY_PLACE[id] ?? MOCK_PHOTOS) : apiClient.get<Photo[]>(`/api/places/${id}/photos/`),
  getBookmarked: () =>
    USE_MOCK
      ? mock(mockPlaceStore.filter(p => p.is_bookmarked))
      : apiClient.get<Place[]>('/api/places/bookmarked/'),
  bookmark: (id: number) => {
    if (USE_MOCK) {
      const item = mockPlaceStore.find(p => p.id === id);
      if (item) item.is_bookmarked = true;
      return mock({});
    }
    return apiClient.post(`/api/places/${id}/bookmark/`);
  },
  unbookmark: (id: number) => {
    if (USE_MOCK) {
      const item = mockPlaceStore.find(p => p.id === id);
      if (item) item.is_bookmarked = false;
      return mock({});
    }
    return apiClient.delete(`/api/places/${id}/bookmark/`);
  },
};

export const photoApi = {
  uploadImage: (uri: string) => {
    if (USE_MOCK) return mock({ image_url: uri });
    const form = new FormData();
    form.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
    return apiClient.post<{ image_url: string }>('/api/photos/upload-image/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getList: (params?: { keyword?: string; author?: string }) => {
    if (USE_MOCK) {
      const list = params?.author ? mockPhotoStore.filter(p => p.author === params.author) : [...mockPhotoStore];
      return mock(list);
    }
    return apiClient.get<Photo[]>('/api/photos/', { params });
  },
  getDetail: (id: number) => {
    if (USE_MOCK) {
      const photo = mockPhotoStore.find(p => p.id === id) ?? mockPhotoStore[0];
      const placeId = mockPhotoPlaceId[photo.id] ?? 1;
      const place = mockPlaceStore.find(p => p.id === placeId) ?? mockPlaceStore[0];
      const placePhotos = (MOCK_PHOTOS_BY_PLACE[placeId] ?? []).filter(p => p.id !== photo.id);
      const tagNames = photo.tags.map(t => t.name);
      const relatedPhotos = mockPhotoStore.filter(
        p => p.id !== photo.id && p.tags.some(t => tagNames.includes(t.name))
      );
      return mock<PhotoSpotDetail>({ photo, place, placePhotos, relatedPhotos });
    }
    return apiClient.get<PhotoSpotDetail>(`/api/photos/${id}/`);
  },
  upload: (data: { place_id: number; image_url: string; sub_image_urls?: string[]; description?: string; content?: string; tags?: string[]; tag_ids?: number[]; travel_date?: string }) => {
    if (USE_MOCK) {
      const newPhoto: Photo = {
        id: nextMockId(),
        image_url: data.image_url,
        description: data.description ?? '',
        content: data.content ?? '',
        likes: 0,
        tags: (data.tags ?? []).map(name => ({ id: nextMockId(), category: 'custom', name })),
        is_bookmarked: false,
        travel_date: data.travel_date ?? new Date().toISOString(),
        created_at: new Date().toISOString(),
        isMine: true,
        author: mockNickname,
        authorAvatar: mockProfileImage ?? undefined,
      };
      mockPhotoStore.unshift(newPhoto);
      const place = mockPlaceStore.find(p => p.id === data.place_id);
      if (place) {
        if (!MOCK_PHOTOS_BY_PLACE[data.place_id]) MOCK_PHOTOS_BY_PLACE[data.place_id] = [];
        MOCK_PHOTOS_BY_PLACE[data.place_id].unshift(newPhoto);
        mockPhotoPlaceId[newPhoto.id] = data.place_id;
        mockPhotoPlaceName[newPhoto.id] = place.name;
      }
      return mock(newPhoto);
    }
    return apiClient.post<Photo>('/api/photos/', data);
  },
  getMine: () =>
    USE_MOCK ? mock(mockPhotoStore.filter(p => p.isMine)) : apiClient.get<Photo[]>('/api/photos/mine/'),
  update: (id: number, data: { description?: string; content?: string; tags?: string[]; travel_date?: string }) => {
    if (USE_MOCK) {
      const photo = mockPhotoStore.find(p => p.id === id);
      if (photo) {
        if (data.description !== undefined) photo.description = data.description;
        if (data.content !== undefined) photo.content = data.content;
        if (data.tags !== undefined) photo.tags = data.tags.map(name => ({ id: nextMockId(), category: 'custom', name }));
        if (data.travel_date !== undefined) photo.travel_date = data.travel_date;
      }
      return mock(photo ?? null);
    }
    return apiClient.patch<Photo>(`/api/photos/${id}/`, data);
  },
  remove: (id: number) => {
    if (USE_MOCK) {
      const idx = mockPhotoStore.findIndex(p => p.id === id);
      if (idx !== -1) mockPhotoStore.splice(idx, 1);
      const placeId = mockPhotoPlaceId[id];
      const placePhotos = placeId ? MOCK_PHOTOS_BY_PLACE[placeId] : undefined;
      if (placePhotos) {
        const pIdx = placePhotos.findIndex(p => p.id === id);
        if (pIdx !== -1) placePhotos.splice(pIdx, 1);
      }
      return mock({});
    }
    return apiClient.delete(`/api/photos/${id}/`);
  },
  like: (id: number) => {
    if (USE_MOCK) {
      const item = mockPhotoStore.find(p => p.id === id);
      if (item) item.likes += 1;
      return mock({ likes: item?.likes ?? 0 });
    }
    return apiClient.post<{ likes: number }>(`/api/photos/${id}/like/`);
  },
  unlike: (id: number) => {
    if (USE_MOCK) {
      const item = mockPhotoStore.find(p => p.id === id);
      if (item) item.likes = Math.max(0, item.likes - 1);
      return mock({ likes: item?.likes ?? 0 });
    }
    return apiClient.delete<{ likes: number }>(`/api/photos/${id}/like/`);
  },
  bookmark: (id: number) => {
    if (USE_MOCK) {
      const item = mockPhotoStore.find(p => p.id === id);
      if (item) item.is_bookmarked = true;
      return mock({});
    }
    return apiClient.post(`/api/photos/${id}/bookmark/`);
  },
  unbookmark: (id: number) => {
    if (USE_MOCK) {
      const item = mockPhotoStore.find(p => p.id === id);
      if (item) item.is_bookmarked = false;
      return mock({});
    }
    return apiClient.delete(`/api/photos/${id}/bookmark/`);
  },
  report: (id: number, reason: string) => {
    if (USE_MOCK) return mock({});
    return apiClient.post(`/api/photos/${id}/report/`, { reason });
  },
};

export const settlementApi = {
  getList: () =>
    USE_MOCK ? mock([...mockSettlementStore]) : apiClient.get<MailItem[]>('/api/settlements/'),
  claim: (id: number) => {
    if (USE_MOCK) {
      const idx = mockSettlementStore.findIndex(m => m.id === id);
      if (idx !== -1) {
        setMockTokenBalance(mockTokenBalance + mockSettlementStore[idx].tokenAmount);
        mockSettlementStore.splice(idx, 1);
      }
      return mock({ token_balance: mockTokenBalance });
    }
    return apiClient.post<{ token_balance: number }>(`/api/settlements/${id}/claim/`);
  },
  claimAll: () => {
    if (USE_MOCK) {
      const total = mockSettlementStore.reduce((sum, m) => sum + m.tokenAmount, 0);
      setMockTokenBalance(mockTokenBalance + total);
      mockSettlementStore.length = 0;
      return mock({ token_balance: mockTokenBalance });
    }
    return apiClient.post<{ token_balance: number }>('/api/settlements/claim-all/');
  },
};

export const scheduleApi = {
  getList: () =>
    USE_MOCK ? mock([...mockScheduleStore]) : apiClient.get<Schedule[]>('/api/schedules/'),
  getBookmarked: () =>
    USE_MOCK ? mock(mockScheduleStore.filter(s => s.is_bookmarked)) : apiClient.get<Schedule[]>('/api/schedules/bookmarked/'),
  getDetail: (id: number) =>
    USE_MOCK
      ? mock(mockScheduleStore.find(s => s.id === id) ?? mockScheduleStore[0])
      : apiClient.get<Schedule>(`/api/schedules/${id}/`),
  create: (data: { title: string; start_date?: string; end_date?: string }) => {
    if (USE_MOCK) {
      const newSchedule: Schedule = {
        id: nextMockId(),
        title: data.title,
        media: null,
        start_date: data.start_date ?? null,
        end_date: data.end_date ?? null,
        is_bookmarked: false,
        daily_places: [],
        created_at: new Date().toISOString(),
      };
      mockScheduleStore.push(newSchedule);
      return mock(newSchedule);
    }
    return apiClient.post<Schedule>('/api/schedules/', data);
  },
  update: (id: number, data: { title?: string; start_date?: string; end_date?: string }) => {
    if (USE_MOCK) {
      const idx = mockScheduleStore.findIndex(s => s.id === id);
      if (idx !== -1) mockScheduleStore[idx] = { ...mockScheduleStore[idx], ...data };
      return mock(mockScheduleStore[idx] ?? mockScheduleStore[0]);
    }
    return apiClient.patch<Schedule>(`/api/schedules/${id}/`, data);
  },
  remove: (id: number) => {
    if (USE_MOCK) {
      const idx = mockScheduleStore.findIndex(s => s.id === id);
      if (idx !== -1) mockScheduleStore.splice(idx, 1);
      return mock({});
    }
    return apiClient.delete(`/api/schedules/${id}/`);
  },
  addPlace: (id: number, data: { place_id: number; day_number: number; order: number; memo?: string }) => {
    if (USE_MOCK) {
      const schedIdx = mockScheduleStore.findIndex(s => s.id === id);
      const place = mockPlaceStore.find(p => p.id === data.place_id);
      if (schedIdx !== -1 && place) {
        const newDp = {
          id: nextMockId(),
          day_number: data.day_number,
          order: data.order,
          memo: data.memo ?? '',
          place,
        };
        mockScheduleStore[schedIdx] = {
          ...mockScheduleStore[schedIdx],
          daily_places: [...mockScheduleStore[schedIdx].daily_places, newDp],
        };
      }
      return mock({});
    }
    return apiClient.post(`/api/schedules/${id}/places/`, data);
  },
  removePlace: (id: number, dpId: number) => {
    if (USE_MOCK) {
      const idx = mockScheduleStore.findIndex(s => s.id === id);
      if (idx !== -1) {
        mockScheduleStore[idx] = {
          ...mockScheduleStore[idx],
          daily_places: mockScheduleStore[idx].daily_places.filter(dp => dp.id !== dpId),
        };
      }
      return mock({});
    }
    return apiClient.delete(`/api/schedules/${id}/places/${dpId}/`);
  },
  reorderPlaces: (id: number, places: { id: number; day_number: number; order: number }[]) => {
    if (USE_MOCK) {
      const idx = mockScheduleStore.findIndex(s => s.id === id);
      if (idx !== -1) {
        const orig = mockScheduleStore[idx];
        const placeMap = new Map(orig.daily_places.map(dp => [dp.id, dp]));
        mockScheduleStore[idx] = {
          ...orig,
          daily_places: places
            .map(p => { const dp = placeMap.get(p.id); return dp ? { ...dp, day_number: p.day_number, order: p.order } : null; })
            .filter(Boolean) as typeof orig.daily_places,
        };
      }
      return mock({});
    }
    return apiClient.post(`/api/schedules/${id}/places/reorder/`, places);
  },
  importSchedule: (id: number, data?: { title?: string; start_date?: string; end_date?: string }) =>
    USE_MOCK ? mock(mockScheduleStore[0]) : apiClient.post<Schedule>(`/api/schedules/${id}/import/`, data),
  bookmark: (id: number) => {
    if (USE_MOCK) {
      const item = mockScheduleStore.find(s => s.id === id);
      if (item) item.is_bookmarked = true;
      return mock({});
    }
    return apiClient.post(`/api/schedules/${id}/bookmark/`);
  },
  unbookmark: (id: number) => {
    if (USE_MOCK) {
      const item = mockScheduleStore.find(s => s.id === id);
      if (item) item.is_bookmarked = false;
      return mock({});
    }
    return apiClient.delete(`/api/schedules/${id}/bookmark/`);
  },
};

export const bookmarkApi = {
  getAll: () => {
    if (USE_MOCK) {
      return mock({
        saved_media: MOCK_MEDIA_LIST.filter(m => m.is_bookmarked),
        saved_places: mockPlaceStore.filter(p => p.is_bookmarked),
        saved_photos: mockPhotoStore
          .filter(p => p.is_bookmarked)
          .map(p => ({
            id: p.id,
            image_url: p.image_url,
            description: p.description,
            place_name: mockPhotoPlaceName[p.id] ?? '',
            tags: p.tags,
            saved_at: p.created_at,
          })),
      });
    }
    return apiClient.get('/api/bookmarks/');
  },
};

const formatDateDots = (date: Date) =>
  `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

// 프론트 화면들이 쓰는 타입 이름 ↔ 백엔드 리뷰 엔드포인트 type 파라미터
const REVIEW_TYPE_TO_BACKEND: Record<ReviewTargetType, string> = {
  course: 'media',
  place: 'place',
  photospot: 'photo',
};

// 백엔드가 리뷰마다 같이 내려주는 대상(장소/코스/포토스팟) 정보를 화면에서 쓰기 편한 ReviewTarget 모양으로 정리
const normalizeReview = (raw: any, type: ReviewTargetType): Review => {
  const backendKey = REVIEW_TYPE_TO_BACKEND[type];
  const t = raw[backendKey];
  let target: ReviewTarget | undefined;
  if (t) {
    if (backendKey === 'media') {
      target = { type: 'course', id: t.id, title: t.title, subtitle: t.media_type, placeCount: t.place_count, imageUrl: t.thumbnail_url, tags: t.tags };
    } else if (backendKey === 'place') {
      target = { type: 'place', id: t.id, title: t.name, subtitle: t.address, category: t.category, imageUrl: t.image_url, tags: t.tags };
    } else {
      target = { type: 'photospot', id: t.id, title: t.description, subtitle: t.place_name, imageUrl: t.image_url, tags: t.tags };
    }
  }
  return {
    id: raw.id,
    author: raw.author,
    travelDate: raw.travelDate,
    writtenDate: raw.writtenDate,
    rating: Number(raw.rating),
    content: raw.content,
    images: raw.images,
    hasPhoto: raw.hasPhoto,
    likeCount: raw.likeCount,
    isMine: raw.isMine,
    target,
  };
};

// mock 모드에서 리뷰 작성 시 대상 정보를 채워줌 — 없으면 "리뷰 관리" 화면 탭 필터링에서 걸러져 안 보임
const buildMockReviewTarget = (type: ReviewTargetType, targetId: number): ReviewTarget | undefined => {
  if (type === 'course') {
    const media = MOCK_MEDIA_LIST.find(m => m.id === targetId);
    if (!media) return undefined;
    return { type, id: targetId, title: media.title, subtitle: media.media_type, placeCount: media.place_count, imageUrl: media.thumbnail_url, tags: media.tags };
  }
  if (type === 'place') {
    const place = mockPlaceStore.find(p => p.id === targetId);
    if (!place) return undefined;
    return { type, id: targetId, title: place.name, subtitle: place.address, category: place.category, imageUrl: place.image_url, tags: place.tags };
  }
  const photo = mockPhotoStore.find(p => p.id === targetId);
  if (!photo) return undefined;
  return { type, id: targetId, title: photo.description, subtitle: mockPhotoPlaceName[targetId], imageUrl: photo.image_url, tags: photo.tags };
};

export const reviewApi = {
  getList: (type: ReviewTargetType, id: number) => {
    if (USE_MOCK) return mock(mockReviewStore.filter(r => !r.target || (r.target.type === type && r.target.id === id)));
    return apiClient
      .get<any[]>('/api/reviews/', { params: { type: REVIEW_TYPE_TO_BACKEND[type], id } })
      .then(res => ({ ...res, data: res.data.map(r => normalizeReview(r, type)) }));
  },
  getMine: (type: ReviewTargetType) => {
    if (USE_MOCK) return mock(mockReviewStore.filter(r => r.isMine && (!r.target || r.target.type === type)));
    return apiClient
      .get<any[]>('/api/reviews/mine/', { params: { type: REVIEW_TYPE_TO_BACKEND[type] } })
      .then(res => ({ ...res, data: res.data.map(r => normalizeReview(r, type)) }));
  },
  getDetail: (type: ReviewTargetType, id: number) => {
    if (USE_MOCK) return mock(mockReviewStore.find(r => r.id === id) ?? null);
    return apiClient
      .get<any>(`/api/reviews/${REVIEW_TYPE_TO_BACKEND[type]}/${id}/`)
      .then(res => ({ ...res, data: normalizeReview(res.data, type) }));
  },
  create: (type: ReviewTargetType, targetId: number, data: { rating: number; content: string; images: string[]; visitDate?: string }) => {
    if (USE_MOCK) {
      const newReview: Review = {
        id: nextMockId(),
        author: '나',
        travelDate: data.visitDate ?? '',
        writtenDate: formatDateDots(new Date()),
        rating: data.rating,
        content: data.content,
        images: data.images,
        hasPhoto: data.images.length > 0,
        likeCount: 0,
        isMine: true,
        target: buildMockReviewTarget(type, targetId),
      };
      mockReviewStore.unshift(newReview);
      return mock(newReview);
    }
    return apiClient
      .post<any>('/api/reviews/', {
        type: REVIEW_TYPE_TO_BACKEND[type],
        id: targetId,
        rating: data.rating,
        content: data.content,
        images: data.images,
        visit_date: data.visitDate,
      })
      .then(res => ({ ...res, data: normalizeReview(res.data, type) }));
  },
  update: (type: ReviewTargetType, id: number, data: { rating: number; content: string; images: string[]; visitDate?: string }) => {
    if (USE_MOCK) {
      const idx = mockReviewStore.findIndex(r => r.id === id);
      if (idx !== -1) {
        mockReviewStore[idx] = {
          ...mockReviewStore[idx],
          rating: data.rating,
          content: data.content,
          images: data.images,
          hasPhoto: data.images.length > 0,
          travelDate: data.visitDate ?? mockReviewStore[idx].travelDate,
        };
      }
      return mock(mockReviewStore[idx] ?? null);
    }
    return apiClient
      .patch<any>(`/api/reviews/${REVIEW_TYPE_TO_BACKEND[type]}/${id}/`, {
        rating: data.rating,
        content: data.content,
        images: data.images,
        visit_date: data.visitDate,
      })
      .then(res => ({ ...res, data: normalizeReview(res.data, type) }));
  },
  remove: (type: ReviewTargetType, id: number) => {
    if (USE_MOCK) {
      const idx = mockReviewStore.findIndex(r => r.id === id);
      if (idx !== -1) mockReviewStore.splice(idx, 1);
      return mock({});
    }
    return apiClient.delete(`/api/reviews/${REVIEW_TYPE_TO_BACKEND[type]}/${id}/`);
  },
  report: (type: ReviewTargetType, id: number, reason: string) => {
    if (USE_MOCK) return mock({});
    return apiClient.post(`/api/reviews/${REVIEW_TYPE_TO_BACKEND[type]}/${id}/report/`, { reason });
  },
};
