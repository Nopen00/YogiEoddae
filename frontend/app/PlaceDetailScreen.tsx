import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { MoreButton } from '@/components/ui/MoreButton';
import { MoreMenuAlert } from '@/components/modals/MoreMenuAlert';
import { ScheduleAlert } from '@/components/modals/ScheduleAlert';
import { SaveHeart32 } from '@/components/icons/SaveHeart';
import { UnSaveHeart32 } from '@/components/icons/UnSaveHeart';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Heart, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { placeApi, scheduleApi } from '../services/api';
import type { Photo, Place, Schedule } from '../services/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';

const CATEGORY_LABEL: Record<string, string> = {
  '12': '관광지', '14': '문화시설', '15': '축제/행사',
  '25': '여행코스', '28': '레포츠', '32': '숙박', '38': '쇼핑', '39': '음식점',
};

const CITY_SHORT: Record<string, string> = {
  '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구',
  '인천광역시': '인천', '광주광역시': '광주', '대전광역시': '대전',
  '울산광역시': '울산', '세종특별자치시': '세종', '경기도': '경기',
  '강원특별자치도': '강원', '강원도': '강원', '충청북도': '충북',
  '충청남도': '충남', '전라북도': '전북', '전북특별자치도': '전북',
  '전라남도': '전남', '경상북도': '경북', '경상남도': '경남',
  '제주특별자치도': '제주',
};

const shortAddress = (address: string) => {
  const parts = address.split(' ');
  if (parts[0] && CITY_SHORT[parts[0]]) parts[0] = CITY_SHORT[parts[0]];
  return parts.slice(0, 2).join(' ');
};

const formatLikeCount = (count: number): string => {
  if (count < 100) return count.toString();
  return (Math.floor(count / 100) * 100).toLocaleString() + '+';
};

const PlaceDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const imageWidth = width - Spacing.h.medium * 2;
  const imageHeight = (imageWidth * 3) / 4;
  const smallImageWidth = imageWidth / 2;
  const smallImageHeight = (smallImageWidth * 3) / 4;

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isScheduleVisible, setIsScheduleVisible] = useState(false);
  const [savedNearby, setSavedNearby] = useState<Record<number, boolean>>({});
  const [isToggled, setIsToggled] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    if (!id) return;
    placeApi.getDetail(Number(id))
      .then(res => { setPlace(res.data); setIsSaved(res.data.is_bookmarked); })
      .catch(() => {});
    placeApi.getPhotos(Number(id))
      .then(res => setPhotos(res.data))
      .catch(() => {});
    placeApi.getList()
      .then(res => setNearbyPlaces(res.data.results.filter(p => String(p.id) !== id).slice(0, 4)))
      .catch(() => {});
    scheduleApi.getList()
      .then(res => setSchedules(res.data))
      .catch(() => {});
  }, [id]);

  const toggleNearby = (index: number) => {
    setSavedNearby(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const closeMenu = () => { if (isMenuVisible) setIsMenuVisible(false); };

  const handleSaveToggle = async () => {
    if (!id) return;
    try {
      if (isSaved) await placeApi.unbookmark(Number(id));
      else await placeApi.bookmark(Number(id));
      setIsSaved(!isSaved);
    } catch {}
  };

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 헤더 */}
        <ScreenHeader
          onBack={() => router.back()}
          style={{ zIndex: 10 }}
          right={
            <>
              <View style={styles.toggleGroup}>
                <TouchableOpacity
                  style={[styles.toggle, { backgroundColor: isToggled ? Colors.light.primary : Colors.light.grayLight }]}
                  onPress={() => setIsToggled(!isToggled)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.toggleCircle, { left: isToggled ? 26 : 2 }]} />
                </TouchableOpacity>
                <Text style={styles.toggleLabel}>{isToggled ? '카카오' : '관광공사'}</Text>
              </View>
              <View style={[styles.moreButtonWrapper, { marginLeft: 16 }]}>
                <MoreButton onPress={() => setIsMenuVisible(!isMenuVisible)} />
                {isMenuVisible && (
                  <MoreMenuAlert
                    isSaved={isSaved}
                    onSavePress={handleSaveToggle}
                    onSchedulePress={() => { setIsMenuVisible(false); setIsScheduleVisible(true); }}
                  />
                )}
              </View>
            </>
          }
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* 대표 이미지 */}
          <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
            <Image source={{ uri: place?.image_url ?? undefined }} style={styles.mainImage} resizeMode="cover" />
          </View>

          <View style={styles.infoContainer}>
            {/* 장소명 */}
            <Text style={styles.titleText}>{place?.name ?? '로딩 중...'}</Text>

            {/* 카테고리 | 주소 | 별점 | 좋아요 */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{CATEGORY_LABEL[place?.category ?? ''] ?? place?.category}</Text>
              {place?.address && (
                <>
                  <TextSeparator />
                  <Text style={styles.metaText}>{shortAddress(place.address)}</Text>
                </>
              )}
              {place?.rating != null && (
                <>
                  <TextSeparator />
                  <Star size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  <Text style={[styles.metaText, { marginLeft: 3 }]}>{place.rating.toFixed(1)}</Text>
                </>
              )}
              {place?.like_count != null && (
                <>
                  <TextSeparator />
                  <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  <Text style={[styles.metaText, { marginLeft: 3 }]}>{formatLikeCount(place.like_count)}</Text>
                </>
              )}
            </View>

            {/* 태그 */}
            <View style={styles.tagRow}>
              {place?.tags.map((tag) => (
                <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
              ))}
            </View>

            {/* 액션 버튼 그룹 */}
            <View style={styles.actionButtonGroup}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSaveToggle} activeOpacity={0.7}>
                {isSaved ? <SaveHeart32 /> : <UnSaveHeart32 />}
                <Text style={styles.actionButtonText}>{isSaved ? '저장취소' : '저장하기'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => setIsScheduleVisible(true)} activeOpacity={0.7}>
                <Calendar size={IconSize.xlarge} color={Colors.light.grayDark} strokeWidth={IconStroke.thin} />
                <Text style={styles.actionButtonText}>일정추가</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => {}} activeOpacity={0.7}>
                <Star size={IconSize.xlarge} color={Colors.light.grayDark} strokeWidth={IconStroke.thin} />
                <Text style={styles.actionButtonText}>리뷰쓰기</Text>
              </TouchableOpacity>
            </View>

            <Divider />

            {/* 기본 정보 */}
            <Text style={styles.basicInfoTitle}>기본 정보</Text>
            <View style={[styles.mapContainer, { height: imageHeight }]} />
            <View style={{ marginTop: 16 }}>
              <Shadow distance={4} startColor="rgba(0, 0, 0, 0.15)" offset={[0, 0]} stretch>
                <View style={styles.infoGroup}>
                  <View style={styles.infoGroupRow}>
                    <Text style={styles.infoLabel}>주소</Text>
                    <Text style={styles.infoValue}>{place?.address ?? '-'}</Text>
                  </View>
                  <View style={[styles.infoGroupRow, { marginTop: 16 }]}>
                    <Text style={styles.infoLabel}>영업시간</Text>
                    <Text style={styles.infoValue}>-</Text>
                  </View>
                  <View style={[styles.infoGroupRow, { marginTop: 16 }]}>
                    <Text style={styles.infoLabel}>전화</Text>
                    <Text style={styles.infoValue}>-</Text>
                  </View>
                </View>
              </Shadow>
            </View>

            <Divider marginTop={32} />

            {/* 소개 / 카카오 리뷰 */}
            <Text style={styles.placeTitle}>{isToggled ? '이용자 리뷰' : place?.name}</Text>
            {isToggled ? (
              place?.kakao_place_url ? (
                <TouchableOpacity style={styles.kakaoLinkButton} onPress={() => Linking.openURL(place.kakao_place_url!)}>
                  <Text style={styles.kakaoLinkText}>카카오맵에서 리뷰 보기</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.placeDesc}>카카오맵 정보가 없습니다.</Text>
              )
            ) : (
              <Text style={styles.placeDesc}>{place?.address}</Text>
            )}

            {/* 포토스팟 */}
            {photos.length > 0 && (
              <>
                <Divider marginTop={32} />
                <Text style={styles.nearbyTitle}>포토스팟</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}
                  contentContainerStyle={{ gap: 8 }}>
                  {photos.map((photo) => (
                    <View key={photo.id} style={[styles.nearbyImageBox, { width: smallImageWidth, height: smallImageHeight }]}>
                      <Image source={{ uri: photo.image_url }} style={styles.nearbyImage} resizeMode="cover" />
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            <Divider marginTop={32} />
            <Text style={styles.nearbyTitle}>근처 추천 장소</Text>
          </View>

          {/* 근처 추천 장소 */}
          <View style={{ marginTop: 16, marginHorizontal: Spacing.h.medium }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScrollContent}>
              {nearbyPlaces.map((nearby, i) => (
                <TouchableOpacity
                  key={nearby.id}
                  style={{ width: smallImageWidth }}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/PlaceDetailScreen', params: { id: nearby.id, name: nearby.name } })}
                >
                  <View style={[styles.nearbyImageBox, { height: smallImageHeight }]}>
                    <Image source={{ uri: nearby.image_url ?? undefined }} style={styles.nearbyImage} resizeMode="cover" />
                    <TouchableOpacity style={styles.nearbyHeart} onPress={(e) => { e.stopPropagation(); toggleNearby(i); }} activeOpacity={0.8}>
                      <Heart
                        size={IconSize.large}
                        color={savedNearby[i] ? Colors.light.heart : Colors.light.white}
                        fill={savedNearby[i] ? Colors.light.heart : 'transparent'}
                        strokeWidth={IconStroke.thin}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.nearbyPlaceName} numberOfLines={1}>{nearby.name}</Text>
                  <Text style={styles.nearbyCategory}>{CATEGORY_LABEL[nearby.category] ?? nearby.category}</Text>
                  <Text style={styles.nearbyAddress} numberOfLines={1}>{shortAddress(nearby.address)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <ScheduleAlert
          visible={isScheduleVisible}
          onClose={() => setIsScheduleVisible(false)}
          schedules={schedules}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  moreButtonWrapper: { position: 'relative', alignItems: 'flex-end' },
  toggleGroup: { flexDirection: 'row', alignItems: 'center' },
  toggle: {
    width: 48,
    height: 24,
    borderRadius: 12,
  },
  toggleCircle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.white,
    top: 2,
  },
  toggleLabel: {
    ...Typography.button3,
    color: Colors.light.black,
    marginLeft: 8,
  },
  imageContainer: {
    marginTop: 8,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  mainImage: { width: '100%', height: '100%' },
  infoContainer: { paddingHorizontal: Spacing.h.medium, marginTop: 16 },
  titleText: { ...Typography.HeadLine5, color: Colors.light.black },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  metaText: { ...Typography.body2, color: Colors.light.grayDark },
  iconTextRow: { flexDirection: 'row', alignItems: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tagText: { ...Typography.body2, color: Colors.light.primary, marginRight: 4 },
  actionButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  actionButton: { alignItems: 'center', width: 64 },
  actionButtonText: {
    ...Typography.button4,
    color: Colors.light.grayDark,
    marginTop: 8,
  },
  basicInfoTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 16,
  },
  mapContainer: {
    marginTop: 16,
    width: '100%',
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
  },
  infoGroup: {
    borderRadius: Spacing.r.small,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.white,
  },
  infoGroupRow: {
    flexDirection: 'row',
  },
  infoLabel: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    width: 56,
  },
  infoValue: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    marginLeft: 16,
    flex: 1,
  },
  placeTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 32,
  },
  placeDesc: {
    ...Typography.body2,
    color: Colors.light.black,
    marginTop: 16,
  },
  nearbyTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 32,
  },
  reviewCard: {
    flexDirection: 'row',
    height: 102,
    borderRadius: 8,
    backgroundColor: Colors.light.white,
    padding: 8,
  },
  reviewImageBox: {
    width: 86,
    height: 86,
    borderRadius: 8,
    backgroundColor: Colors.light.grayLight,
  },
  reviewContent: {
    flex: 1,
    marginLeft: 8,
  },
  reviewNickname: {
    ...Typography.subtitle2,
    color: Colors.light.black,
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewSep: {
    ...Typography.body2,
    color: Colors.light.grayDark,
  },
  reviewMetaText: {
    ...Typography.body2,
    color: Colors.light.grayDark,
  },
  reviewText: {
    ...Typography.body2,
    color: Colors.light.grayDark,
  },
  reviewMoreButton: { alignSelf: 'flex-end', paddingVertical: 8 },
  reviewMoreText: { ...Typography.button4, color: Colors.light.primary },
  kakaoLinkButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Spacing.r.small,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    alignSelf: 'flex-start',
  },
  kakaoLinkText: { ...Typography.button3, color: Colors.light.primary },
  nearbyScrollContent: {
    gap: 8,
  },
  nearbyImageBox: {
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  nearbyImage: { width: '100%', height: '100%' },
  nearbyHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  nearbyPlaceName: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    marginTop: 8,
  },
  nearbyCategory: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    marginTop: 2,
  },
  nearbyAddress: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    marginTop: 2,
  },
});

export default PlaceDetailScreen;
