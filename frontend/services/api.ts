import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Media, Place, Photo, MediaPlace, Schedule, PaginatedResponse } from './types';
import {
  MOCK_MEDIA_LIST, MOCK_MEDIA_PLACES, MOCK_MEDIA_PLACES_MAP, MOCK_PHOTOS, mockScheduleStore, mockPlaceStore, paginatedOf,
} from './mockData';

// 서버 없이 UI 테스트할 때 true로 설정
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
console.log('API BASE_URL:', BASE_URL, USE_MOCK ? '(MOCK MODE)' : '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
});

apiClient.interceptors.request.use(async (config) => {
  const deviceId = await AsyncStorage.getItem('device_id');
  if (deviceId) {
    config.headers['X-Device-ID'] = deviceId;
  }
  return config;
});

const mock = <T>(data: T): Promise<{ data: T }> => Promise.resolve({ data });

export const userApi = {
  createUser: () =>
    USE_MOCK ? mock({ device_id: 'mock-device' }) : apiClient.post<{ device_id: string }>('/api/users/'),
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
    USE_MOCK ? mock(MOCK_MEDIA_PLACES) : apiClient.get<MediaPlace[]>(`/api/media/${id}/places/`),
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
  importToSchedule: (id: number, data?: { title?: string; start_date?: string; end_date?: string }) => {
    if (USE_MOCK) {
      const mediaPlaces = MOCK_MEDIA_PLACES_MAP[id] ?? [];
      const media = MOCK_MEDIA_LIST.find(m => m.id === id) ?? null;
      const newSchedule: Schedule = {
        id: Date.now(),
        title: data?.title ?? media?.title ?? '새 일정',
        media: media ? { id: media.id, title: media.title, thumbnail_url: media.thumbnail_url, media_type: media.media_type, tags: media.tags, place_count: media.place_count } : null,
        start_date: data?.start_date ?? null,
        end_date: data?.end_date ?? null,
        is_bookmarked: false,
        daily_places: mediaPlaces.map((mp, i) => ({
          id: Date.now() + i + 1,
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
    USE_MOCK ? mock(MOCK_PHOTOS) : apiClient.get<Photo[]>(`/api/places/${id}/photos/`),
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
        id: Date.now(),
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
  addPlace: (id: number, data: { place_id: number; day_number: number; order: number; memo?: string }) =>
    USE_MOCK ? mock({}) : apiClient.post(`/api/schedules/${id}/places/`, data),
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
    return mock({});
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
  getAll: () =>
    USE_MOCK ? mock([]) : apiClient.get('/api/bookmarks/'),
};
