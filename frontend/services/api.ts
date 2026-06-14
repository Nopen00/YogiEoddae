import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Media, Place, Photo, MediaPlace, Schedule, PaginatedResponse } from './types';
import {
  MOCK_MEDIA_LIST, MOCK_MEDIA_PLACES, MOCK_PHOTOS, MOCK_SCHEDULES, paginatedOf,
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
  bookmark: (id: number) =>
    USE_MOCK ? mock({}) : apiClient.post(`/api/media/${id}/bookmark/`),
  unbookmark: (id: number) =>
    USE_MOCK ? mock({}) : apiClient.delete(`/api/media/${id}/bookmark/`),
  importToSchedule: (id: number, data?: { title?: string; start_date?: string; end_date?: string }) =>
    USE_MOCK ? mock(MOCK_SCHEDULES[0]) : apiClient.post<Schedule>(`/api/media/${id}/import/`, data),
};

export const placeApi = {
  getList: (params?: { keyword?: string; category?: string; tag?: string }) =>
    USE_MOCK ? mock(paginatedOf(MOCK_MEDIA_PLACES.map(mp => mp.place))) : apiClient.get<PaginatedResponse<Place>>('/api/places/', { params }),
  getDetail: (id: number) =>
    USE_MOCK
      ? mock(MOCK_MEDIA_PLACES.find(mp => mp.place.id === id)?.place ?? MOCK_MEDIA_PLACES[0].place)
      : apiClient.get<Place>(`/api/places/${id}/`),
  getPhotos: (id: number) =>
    USE_MOCK ? mock(MOCK_PHOTOS) : apiClient.get<Photo[]>(`/api/places/${id}/photos/`),
  getBookmarked: () =>
    USE_MOCK
      ? mock(MOCK_MEDIA_PLACES.map(mp => mp.place).filter(p => p.is_bookmarked))
      : apiClient.get<Place[]>('/api/places/bookmarked/'),
  bookmark: (id: number) =>
    USE_MOCK ? mock({}) : apiClient.post(`/api/places/${id}/bookmark/`),
  unbookmark: (id: number) =>
    USE_MOCK ? mock({}) : apiClient.delete(`/api/places/${id}/bookmark/`),
};

export const scheduleApi = {
  getList: () =>
    USE_MOCK ? mock(MOCK_SCHEDULES) : apiClient.get<Schedule[]>('/api/schedules/'),
  getBookmarked: () =>
    USE_MOCK ? mock(MOCK_SCHEDULES.filter(s => s.is_bookmarked)) : apiClient.get<Schedule[]>('/api/schedules/bookmarked/'),
  getDetail: (id: number) =>
    USE_MOCK
      ? mock(MOCK_SCHEDULES.find(s => s.id === id) ?? MOCK_SCHEDULES[0])
      : apiClient.get<Schedule>(`/api/schedules/${id}/`),
  create: (data: { title: string; start_date?: string; end_date?: string }) =>
    USE_MOCK ? mock({ ...MOCK_SCHEDULES[0], ...data }) : apiClient.post<Schedule>('/api/schedules/', data),
  update: (id: number, data: { title?: string; start_date?: string; end_date?: string }) =>
    USE_MOCK ? mock({ ...MOCK_SCHEDULES[0], ...data }) : apiClient.patch<Schedule>(`/api/schedules/${id}/`, data),
  remove: (id: number) =>
    USE_MOCK ? mock({}) : apiClient.delete(`/api/schedules/${id}/`),
  addPlace: (id: number, data: { place_id: number; day_number: number; order: number; memo?: string }) =>
    USE_MOCK ? mock({}) : apiClient.post(`/api/schedules/${id}/places/`, data),
  removePlace: (id: number, dpId: number) =>
    USE_MOCK ? mock({}) : apiClient.delete(`/api/schedules/${id}/places/${dpId}/`),
  importSchedule: (id: number, data?: { title?: string; start_date?: string; end_date?: string }) =>
    USE_MOCK ? mock(MOCK_SCHEDULES[0]) : apiClient.post<Schedule>(`/api/schedules/${id}/import/`, data),
  bookmark: (id: number) =>
    USE_MOCK ? mock({}) : apiClient.post(`/api/schedules/${id}/bookmark/`),
  unbookmark: (id: number) =>
    USE_MOCK ? mock({}) : apiClient.delete(`/api/schedules/${id}/bookmark/`),
};

export const bookmarkApi = {
  getAll: () =>
    USE_MOCK ? mock([]) : apiClient.get('/api/bookmarks/'),
};
