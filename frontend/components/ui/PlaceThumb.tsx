// 장소/포토스팟/코스 등 원격 이미지 공용 래퍼.
// "이미지 URL이 아예 없음"과 "URL은 있는데 로드 실패"를 다른 아이콘으로 구분해서 보여준다
// (둘 다 똑같은 회색 화면으로 보이면 로드 실패가 아닌데도 오류로 오인되기 쉬움).
import { Colors } from '@/constants/Colors';
import { ImageOff, MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface PlaceThumbProps {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  iconSize?: number;
  shape?: 'rect' | 'circle';
}

export const PlaceThumb = ({ uri, style, iconSize = 20, shape = 'rect' }: PlaceThumbProps) => {
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const placeholderStyle = [style as StyleProp<ViewStyle>, styles.placeholder, shape === 'circle' && styles.circlePlaceholder];

  if (!uri) {
    return (
      <View style={placeholderStyle}>
        {shape === 'rect' && <MapPin size={iconSize} color={Colors.light.grayDark} strokeWidth={1.5} />}
      </View>
    );
  }

  if (failed) {
    return (
      <Pressable
        style={placeholderStyle}
        onPress={() => {
          setFailed(false);
          setRetryKey((k) => k + 1);
        }}
      >
        {shape === 'rect' && <ImageOff size={iconSize} color={Colors.light.error} strokeWidth={1.5} />}
      </Pressable>
    );
  }

  return (
    <Image
      key={retryKey}
      source={{ uri }}
      style={style}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.light.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePlaceholder: {
    overflow: 'hidden',
  },
});
