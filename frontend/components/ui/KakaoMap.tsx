import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { buildKakaoMapHtml } from './kakaoMapHtml';

interface KakaoMapProps {
  latitude: number;
  longitude: number;
  height: number;
  markerTitle?: string;
}

export function KakaoMap({ latitude, longitude, height, markerTitle }: KakaoMapProps) {
  return (
    <View style={[styles.wrapper, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildKakaoMapHtml(latitude, longitude, markerTitle) }}
        style={styles.webview}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
