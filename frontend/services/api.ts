import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Media, Place, Photo, MediaPlace, Schedule, PaginatedResponse } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
console.log('API BASE_URL:', BASE_URL);

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

export const userApi = {
  createUser: () =>
    apiClient.post<{ device_id: string }>('/api/users/'),
};

export const mediaApi = {
  getList: (params?: { type?: string; tag?: string; keyword?: string }) =>
    apiClient.get<PaginatedResponse<Media>>('/api/media/', { params }),
  getDetail: (id: number) =>
    apiClient.get<Media>(`/api/media/${id}/`),
  getPlaces: (id: number) =>
    apiClient.get<MediaPlace[]>(`/api/media/${id}/places/`),
  bookmark: (id: number) =>
    apiClient.post(`/api/media/${id}/bookmark/`),
  unbookmark: (id: number) =>
    apiClient.delete(`/api/media/${id}/bookmark/`),
  importToSchedule: (id: number, data?: { title?: string; start_date?: string; end_date?: string }) =>
    apiClient.post<Schedule>(`/api/media/${id}/import/`, data),
};

export const placeApi = {
  getList: (params?: { keyword?: string; category?: string; tag?: string }) =>
    apiClient.get<PaginatedResponse<Place>>('/api/places/', { params }),
  getDetail: (id: number) =>
    apiClient.get<Place>(`/api/places/${id}/`),
  getPhotos: (id: number) =>
    apiClient.get<Photo[]>(`/api/places/${id}/photos/`),
  bookmark: (id: number) =>
    apiClient.post(`/api/places/${id}/bookmark/`),
  unbookmark: (id: number) =>
    apiClient.delete(`/api/places/${id}/bookmark/`),
};

export const scheduleApi = {
  getList: () =>
    apiClient.get<Schedule[]>('/api/schedules/'),
  getBookmarked: () =>
    apiClient.get<Schedule[]>('/api/schedules/bookmarked/'),
  getDetail: (id: number) =>
    apiClient.get<Schedule>(`/api/schedules/${id}/`),
  create: (data: { title: string; start_date?: string; end_date?: string }) =>
    apiClient.post<Schedule>('/api/schedules/', data),
  update: (id: number, data: { title?: string; start_date?: string; end_date?: string }) =>
    apiClient.patch<Schedule>(`/api/schedules/${id}/`, data),
  remove: (id: number) =>
    apiClient.delete(`/api/schedules/${id}/`),
  addPlace: (id: number, data: { place_id: number; day_number: number; order: number; memo?: string }) =>
    apiClient.post(`/api/schedules/${id}/places/`, data),
  removePlace: (id: number, dpId: number) =>
    apiClient.delete(`/api/schedules/${id}/places/${dpId}/`),
  importSchedule: (id: number, data?: { title?: string; start_date?: string; end_date?: string }) =>
    apiClient.post<Schedule>(`/api/schedules/${id}/import/`, data),
  bookmark: (id: number) =>
    apiClient.post(`/api/schedules/${id}/bookmark/`),
  unbookmark: (id: number) =>
    apiClient.delete(`/api/schedules/${id}/bookmark/`),
};

export const bookmarkApi = {
  getAll: () =>
    apiClient.get('/api/bookmarks/'),
};
