import { BASE_URL } from '@/services/api';

export interface KakaoMapPlace {
  name: string;
  latitude: string | number;
  longitude: string | number;
}

// 카카오 지도는 인라인 HTML(WebView baseUrl 트릭)로 로드하면 안드로이드에서 Referer가
// 안 실려 카카오 도메인 인증이 조용히 실패한다(2026-08-18 실기기 확인). 그래서 백엔드가
// 서빙하는 실제 페이지(/places/map-embed/)로 진짜 내비게이션시켜서 로드한다 — 이미 정상
// 동작이 확인된 places/demo.html과 동일한 방식.
export const buildKakaoMapEmbedUrl = (
  { latitude, longitude, markerTitle, places }:
  { latitude?: number; longitude?: number; markerTitle?: string; places?: KakaoMapPlace[] }
) => {
  const params = new URLSearchParams();
  if (places && places.length > 0) {
    const markers = places
      .map(p => ({ name: p.name, lat: Number(p.latitude), lng: Number(p.longitude) }))
      .filter(p => p.lat && p.lng);
    params.set('places', JSON.stringify(markers));
  } else {
    params.set('lat', String(latitude ?? 0));
    params.set('lng', String(longitude ?? 0));
    if (markerTitle) params.set('title', markerTitle);
  }
  return `${BASE_URL}/places/map-embed/?${params.toString()}`;
};
