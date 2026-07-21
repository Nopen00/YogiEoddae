import React, { useMemo, useState } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { buildKakaoMapHtml, buildKakaoMapHtmlMulti, KakaoMapPlace } from './kakaoMapHtml';

interface KakaoMapProps {
  latitude?: number;
  longitude?: number;
  markerTitle?: string;
  places?: KakaoMapPlace[];
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function KakaoMap({ latitude, longitude, markerTitle, places, height, style }: KakaoMapProps) {
  // 지도가 페이지 스크롤을 가로채지 않도록, 클릭하기 전까진 iframe이 터치/마우스 이벤트를 안 받는다.
  const [active, setActive] = useState(false);
  const html = useMemo(
    () => (places ? buildKakaoMapHtmlMulti(places) : buildKakaoMapHtml(latitude ?? 0, longitude ?? 0, markerTitle)),
    [places, latitude, longitude, markerTitle]
  );

  return (
    <View style={[styles.wrapper, height != null ? { height } : { flex: 1 }, style]}>
      {React.createElement('iframe', {
        srcDoc: html,
        style: { width: '100%', height: '100%', border: 0, pointerEvents: active ? 'auto' : 'none' },
        title: 'kakao-map',
      })}
      {!active && (
        <TouchableOpacity style={styles.overlay} activeOpacity={0.8} onPress={() => setActive(true)}>
          <Text style={styles.overlayText}>지도를 눌러 조작하기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', overflow: 'hidden' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  overlayText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
