const KAKAO_JS_KEY = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;');

export const buildKakaoMapHtml = (latitude: number, longitude: number, markerTitle?: string) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
<div id="map"></div>
<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}"></script>
<script>
  var map = new kakao.maps.Map(document.getElementById('map'), {
    center: new kakao.maps.LatLng(${latitude}, ${longitude}),
    level: 3
  });
  map.setDraggable(false);
  map.setZoomable(false);
  var marker = new kakao.maps.Marker({ position: new kakao.maps.LatLng(${latitude}, ${longitude}) });
  marker.setMap(map);
  ${markerTitle ? `
  var iw = new kakao.maps.InfoWindow({ content: '<div style="padding:4px 8px;font-size:12px;white-space:nowrap;">${escapeHtml(markerTitle)}</div>' });
  iw.open(map, marker);
  ` : ''}
</script>
</body>
</html>
`;

export interface KakaoMapPlace {
  name: string;
  latitude: string | number;
  longitude: string | number;
}

// 여러 장소를 한 지도에 마커로 찍고 bounds에 맞춰 보여줄 때 사용 (예: 일정 상세화면)
export const buildKakaoMapHtmlMulti = (places: KakaoMapPlace[]) => {
  const markers = places
    .map(p => ({ name: p.name, lat: Number(p.latitude), lng: Number(p.longitude) }))
    .filter(p => p.lat && p.lng);
  const markersJson = JSON.stringify(markers);

  return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
<div id="map"></div>
<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}"></script>
<script>
  var places = ${markersJson};
  var map = new kakao.maps.Map(document.getElementById('map'), {
    center: new kakao.maps.LatLng(36.5, 127.8),
    level: 12
  });
  map.setDraggable(false);
  map.setZoomable(false);
  if (places.length > 0) {
    var bounds = new kakao.maps.LatLngBounds();
    places.forEach(function (p) {
      var pos = new kakao.maps.LatLng(p.lat, p.lng);
      new kakao.maps.Marker({ position: pos, map: map, title: p.name });
      bounds.extend(pos);
    });
    map.setBounds(bounds);
  }
</script>
</body>
</html>
`;
};
