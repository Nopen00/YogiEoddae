import React, { useMemo, useState } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/Colors';
import { buildKakaoMapEmbedUrl, KakaoMapPlace } from './kakaoMapHtml';

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
  const [loadError, setLoadError] = useState<string | null>(null);
  const uri = useMemo(
    () => buildKakaoMapEmbedUrl({ latitude, longitude, markerTitle, places }),
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
        source={{ uri }}
        style={styles.webview}
        scrollEnabled={false}
        pointerEvents={active ? 'auto' : 'none'}
        onError={(event) => setLoadError(`페이지 로드 실패: ${event.nativeEvent.description}`)}
        onHttpError={(event) => setLoadError(`서버 응답 오류: HTTP ${event.nativeEvent.statusCode}`)}
      />
      {loadError && (
        <View style={styles.debugErrorBox} pointerEvents="none">
          <Text style={styles.debugErrorText}>{loadError}</Text>
        </View>
      )}
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
  debugErrorBox: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(220,38,38,0.92)',
    borderRadius: 8,
    padding: 8,
  },
  debugErrorText: {
    fontSize: 11,
    color: '#fff',
  },
});
