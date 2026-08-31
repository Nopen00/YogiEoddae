// 장소/포토스팟/코스 등 원격 이미지 공용 래퍼.
// "이미지 URL이 아예 없음"과 "URL은 있는데 로드 실패"를 다른 아이콘으로 구분해서 보여준다
// (둘 다 똑같은 회색 화면으로 보이면 로드 실패가 아닌데도 오류로 오인되기 쉬움).
import { Colors } from '@/constants/Colors';
import { logEvent } from '@/services/logger';
import { ImageOff, MapPin, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

// 'avatar'는 실제 유저 프로필 사진 자리(리뷰 작성자, 포토스팟 업로더 등)에만 쓴다.
// 'circle'은 장소/코스 썸네일처럼 사람이 아닌 이미지를 원형으로만 자르는 경우.
interface PlaceThumbProps {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  iconSize?: number;
  shape?: 'rect' | 'circle' | 'avatar';
  seedKey?: string;
}

const MASCOT_AVATAR = require('@/assets/images/mascot/mascot_face_transparent.png');
const MASCOT_ROTATIONS = [90, 180, 270];

// 같은 유저는 항상 같은 회전값을 받도록 seedKey(닉네임/아이디 등)로 결정.
// 9% 확률로만 회전시켜서 대부분은 원본 그대로, 가끔 재미로 돌아간 아바타가 보임.
const getMascotRotation = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);
  if (hash % 100 >= 9) return 0;
  return MASCOT_ROTATIONS[Math.floor(hash / 100) % MASCOT_ROTATIONS.length];
};

export const PlaceThumb = ({ uri, style, iconSize = 20, shape = 'rect', seedKey }: PlaceThumbProps) => {
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [mascotFailed, setMascotFailed] = useState(false);
  const [fallbackRotation] = useState(() => (Math.random() < 0.09 ? MASCOT_ROTATIONS[Math.floor(Math.random() * 3)] : 0));

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const isCircular = shape === 'circle' || shape === 'avatar';
  const placeholderStyle = [style as StyleProp<ViewStyle>, styles.placeholder, isCircular && styles.circlePlaceholder];

  if (!uri) {
    if (shape === 'avatar') {
      if (mascotFailed) {
        return (
          <View style={placeholderStyle}>
            <User size={iconSize + 12} color={Colors.light.grayDark} strokeWidth={1.5} />
          </View>
        );
      }
      const rotation = seedKey ? getMascotRotation(seedKey) : fallbackRotation;
      return (
        <View style={placeholderStyle}>
          <Image
            source={MASCOT_AVATAR}
            style={[style as StyleProp<ImageStyle>, { transform: [{ rotate: `${rotation}deg` }] }]}
            resizeMode="cover"
            onError={(e) => {
              logEvent('error', 'PlaceThumb 마스코트 이미지', e.nativeEvent?.error || '로드 실패');
              setMascotFailed(true);
            }}
            onLoad={() => logEvent('info', 'PlaceThumb 마스코트 이미지', '로드 성공')}
          />
        </View>
      );
    }
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
