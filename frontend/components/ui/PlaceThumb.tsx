// 장소 대표 이미지(image_url)가 없는 장소가 많아서(KTO 미제공/카카오 폴백) 빈 이미지 대신 보여주는 플레이스홀더
import { Colors } from '@/constants/Colors';
import { MapPin } from 'lucide-react-native';
import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface PlaceThumbProps {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  iconSize?: number;
}

export const PlaceThumb = ({ uri, style, iconSize = 20 }: PlaceThumbProps) => {
  if (uri) return <Image source={{ uri }} style={style} resizeMode="cover" />;
  return (
    <View style={[style as StyleProp<ViewStyle>, styles.placeholder]}>
      <MapPin size={iconSize} color={Colors.light.grayDark} strokeWidth={1.5} />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.light.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
