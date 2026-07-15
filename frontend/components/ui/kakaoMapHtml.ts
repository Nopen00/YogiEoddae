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
