import React from 'react';
import { StyleSheet, View } from 'react-native';
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
      {React.createElement('iframe', {
        srcDoc: buildKakaoMapHtml(latitude, longitude, markerTitle),
        style: { width: '100%', height: '100%', border: 0 },
        title: 'kakao-map',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', overflow: 'hidden' },
});
