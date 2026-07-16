import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
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
  const html = useMemo(
    () => (places ? buildKakaoMapHtmlMulti(places) : buildKakaoMapHtml(latitude ?? 0, longitude ?? 0, markerTitle)),
    [places, latitude, longitude, markerTitle]
  );

  return (
    <View style={[styles.wrapper, height != null ? { height } : { flex: 1 }, style]}>
      {React.createElement('iframe', {
        srcDoc: html,
        style: { width: '100%', height: '100%', border: 0 },
        title: 'kakao-map',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', overflow: 'hidden' },
});
