import React, { useMemo, useState } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/Colors';
import { buildKakaoMapHtml, buildKakaoMapHtmlMulti, KakaoMapPlace } from './kakaoMapHtml';

interface KakaoMapProps {
  latitude?: number;
  longitude?: number;
  markerTitle?: string;
  places?: KakaoMapPlace[];
  height?: number;
  style?: StyleProp<ViewStyle>;
  // 지도가 부모 ScrollView 안에 있을 때, 드래그 중엔 부모 스크롤을 잠깐 꺼줘야
  // 스크롤 제스처가 지도의 드래그(팬)를 가로채지 않는다.
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
}

export function KakaoMap({ latitude, longitude, markerTitle, places, height, style, onTouchStart, onTouchEnd }: KakaoMapProps) {
  // 지도가 스크롤 제스처를 가로채지 않도록, 탭하기 전까진 터치를 아예 안 받는다.
  const [active, setActive] = useState(false);
  const html = useMemo(
    () => (places ? buildKakaoMapHtmlMulti(places) : buildKakaoMapHtml(latitude ?? 0, longitude ?? 0, markerTitle)),
    [places, latitude, longitude, markerTitle]
  );

  return (
    <View
      style={[styles.wrapper, height != null ? { height } : { flex: 1 }, style]}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <WebView
        originWhitelist={['*']}
        // baseUrl 없이 인라인 html만 로드하면 WebView의 origin이 비어서(about:blank 등)
        // 카카오 JS SDK 도메인 화이트리스트에 걸린 도메인이 하나도 아닌 걸로 처리돼 조용히 막힌다.
        // 카카오 콘솔에 등록해둔 도메인으로 baseUrl을 지정해서 그 도메인에서 로드된 것처럼 맞춰준다.
        source={{ html, baseUrl: 'http://localhost' }}
        style={styles.webview}
        scrollEnabled={false}
        pointerEvents={active ? 'auto' : 'none'}
      />
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
  webview: { flex: 1, backgroundColor: 'transparent' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  overlayText: {
    fontSize: 12,
    color: Colors.light.grayDark,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
