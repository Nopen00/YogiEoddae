import { Divider } from '@/components/ui/Divider';
import { MetaRow } from '@/components/ui/MetaRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
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
import { CATEGORY_LABEL, shortAddress } from '@/constants/labels';

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
  const [savedPhotoSpots, setSavedPhotoSpots] = useState<Record<number, boolean>>({});
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
      .then(res => {
        const nearby = res.data.results.filter(p => String(p.id) !== id).slice(0, 4);
        setNearbyPlaces(nearby);
        const map: Record<number, boolean> = {};
        nearby.forEach(p => { map[p.id] = p.is_bookmarked; });
        setSavedNearby(map);
      })
      .catch(() => {});
    scheduleApi.getList()
      .then(res => setSchedules(res.data))
      .catch(() => {});
  }, [id]);

  const toggleNearby = async (placeId: number) => {
    const isSavedNow = savedNearby[placeId];
    try {
      if (isSavedNow) await placeApi.unbookmark(placeId);
      else await placeApi.bookmark(placeId);
      setSavedNearby(prev => ({ ...prev, [placeId]: !prev[placeId] }));
    } catch {}
  };

  const closeMenu = () => { if (isMenuVisible) setIsMenuVisible(false); };

  const handleSaveToggle = async () => {
    if (!id) return;
    try {
      if (isSaved) await placeApi.unbookmark(Number(id));
      else await placeApi.bookmark(Number(id));
      setIsSaved(!isSaved);
      setPlace(prev => prev ? { ...prev, like_count: (prev.like_count ?? 0) + (isSaved ? -1 : 1) } : prev);
    } catch {}
  };

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 헤더 */}
        <ScreenHeader
          onBack={() => router.dismiss()}
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
              <View style={[styles.moreButtonWrapper, { marginLeft: Spacing.h.medium }]}>
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
          {/* 대표 이미지 */}
          <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
            <Image source={{ uri: place?.image_url ?? undefined }} style={styles.mainImage} resizeMode="cover" />
          </View>

          <View style={styles.infoContainer}>
            {/* 장소명 */}
            <Text style={styles.titleText}>{place?.name ?? '로딩 중...'}</Text>

            {/* 카테고리 | 주소 | 별점 | 좋아요 */}
            <MetaRow>
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
                  <Text style={[styles.metaText, { marginLeft: Spacing.h.xsmall }]}>{place.rating.toFixed(1)}</Text>
                </>
              )}
              {place?.like_count != null && (
                <>
                  <TextSeparator />
                  <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  <Text style={[styles.metaText, { marginLeft: Spacing.h.xsmall }]}>{formatLikeCount(place.like_count)}</Text>
                </>
              )}
            </MetaRow>

            {/* 태그 */}
            <TagRow>
              {place?.tags.map((tag) => (
                <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
              ))}
            </TagRow>

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
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: 'place', id } })}
                activeOpacity={0.7}
              >
                <Star size={IconSize.xlarge} color={Colors.light.grayDark} strokeWidth={IconStroke.thin} />
                <Text style={styles.actionButtonText}>리뷰쓰기</Text>
              </TouchableOpacity>
            </View>

            <Divider />

            {/* 기본 정보 */}
            <Text style={styles.basicInfoTitle}>기본 정보</Text>
            <View style={[styles.mapContainer, { height: imageHeight }]} />
            <View style={{ marginTop: Spacing.v.medium }}>
              <Shadow distance={4} startColor="rgba(0, 0, 0, 0.15)" offset={[0, 0]} stretch>
                <View style={styles.infoGroup}>
                  <View style={styles.infoGroupRow}>
                    <Text style={styles.infoLabel}>주소</Text>
                    <Text style={styles.infoValue}>{place?.address ?? '-'}</Text>
                  </View>
                  <View style={[styles.infoGroupRow, { marginTop: Spacing.v.medium }]}>
                    <Text style={styles.infoLabel}>영업시간</Text>
                    <Text style={styles.infoValue}>-</Text>
                  </View>
                  <View style={[styles.infoGroupRow, { marginTop: Spacing.v.medium }]}>
                    <Text style={styles.infoLabel}>전화</Text>
                    <Text style={styles.infoValue}>-</Text>
                  </View>
                </View>
              </Shadow>
            </View>

            <Divider marginTop={Spacing.v.large} />

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
                <Divider marginTop={Spacing.v.large} />
                <View style={styles.photoSectionHeader}>
                  <Text style={[styles.nearbyTitle, { marginTop: 0 }]}>포토스팟</Text>
                  <Text style={styles.photoSectionDesc}>이 장소의 포토스팟이에요.</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.v.medium }}
                  contentContainerStyle={styles.nearbyScrollContent}>
                  {photos.map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={{ width: smallImageWidth }}
                      activeOpacity={0.9}
                      onPress={() => router.push({ pathname: '/PhotoSpotDetailScreen', params: { id: photo.id } })}
                    >
                      <View style={[styles.nearbyImageBox, { width: smallImageWidth, height: smallImageHeight }]}>
                        <Image source={{ uri: photo.image_url }} style={styles.nearbyImage} resizeMode="cover" />
                        <TouchableOpacity
                          style={styles.nearbyHeart}
                          onPress={(e) => { e.stopPropagation(); setSavedPhotoSpots(prev => ({ ...prev, [photo.id]: !prev[photo.id] })); }}
                          activeOpacity={0.8}
                        >
                          <Heart
                            size={IconSize.large}
                            color={savedPhotoSpots[photo.id] ? Colors.light.heart : Colors.light.white}
                            fill={savedPhotoSpots[photo.id] ? Colors.light.heart : 'transparent'}
                            strokeWidth={IconStroke.thin}
                          />
                        </TouchableOpacity>
                      </View>
                      {photo.description ? (
                        <Text style={styles.nearbyPlaceName} numberOfLines={1}>{photo.description}</Text>
                      ) : null}
                      {photo.tags.length > 0 && (
                        <TagRow>
                          {photo.tags.map((tag) => (
                            <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                          ))}
                        </TagRow>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Divider marginTop={Spacing.v.large} />
            <Text style={styles.nearbyTitle}>근처 추천 장소</Text>
          </View>

          {/* 근처 추천 장소 */}
          <View style={{ marginTop: Spacing.v.medium, marginHorizontal: Spacing.h.medium }}>
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
                    <TouchableOpacity style={styles.nearbyHeart} onPress={(e) => { e.stopPropagation(); toggleNearby(nearby.id); }} activeOpacity={0.8}>
                      <Heart
                        size={IconSize.large}
                        color={savedNearby[nearby.id] ? Colors.light.heart : Colors.light.white}
                        fill={savedNearby[nearby.id] ? Colors.light.heart : 'transparent'}
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
          onConfirm={async (scheduleId, dayNumber) => {
            if (!place) return;
            try {
              await scheduleApi.addPlace(scheduleId, {
                place_id: place.id,
                day_number: dayNumber,
                order: 999,
              });
            } catch {}
          }}
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
    marginLeft: Spacing.h.small,
  },
  imageContainer: {
    marginTop: Spacing.v.small,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  mainImage: { width: '100%', height: '100%' },
  infoContainer: { paddingHorizontal: Spacing.h.medium, marginTop: Spacing.v.medium },
  titleText: { ...Typography.HeadLine5, color: Colors.light.black },
  metaText: { ...Typography.body2, color: Colors.light.grayDark },
  iconTextRow: { flexDirection: 'row', alignItems: 'center' },
  tagText: { ...Typography.body2, color: Colors.light.primary },
  actionButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  actionButton: { alignItems: 'center', width: 64 },
  actionButtonText: {
    ...Typography.button4,
    color: Colors.light.grayDark,
    marginTop: Spacing.v.small,
  },
  basicInfoTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.medium,
  },
  mapContainer: {
    marginTop: Spacing.v.medium,
    width: '100%',
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
  },
  infoGroup: {
    borderRadius: Spacing.r.small,
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
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
    marginLeft: Spacing.h.medium,
    flex: 1,
  },
  placeTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.large,
  },
  placeDesc: {
    ...Typography.body2,
    color: Colors.light.black,
    marginTop: Spacing.v.medium,
  },
  nearbyTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.large,
  },
  photoSectionHeader: {
    marginTop: Spacing.v.large,
  },
  photoSectionDesc: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.h.small },
  reviewCard: {
    flexDirection: 'row',
    height: 102,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.white,
    padding: Spacing.v.small,
  },
  reviewImageBox: {
    width: 86,
    height: 86,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
  },
  reviewContent: {
    flex: 1,
    marginLeft: Spacing.h.small,
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
  reviewMoreButton: { alignSelf: 'flex-end', paddingVertical: Spacing.v.small },
  reviewMoreText: { ...Typography.button4, color: Colors.light.primary },
  kakaoLinkButton: {
    marginTop: Spacing.v.medium,
    paddingVertical: 12,
    paddingHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.primary,
    alignSelf: 'flex-start',
  },
  kakaoLinkText: { ...Typography.button3, color: Colors.light.primary },
  nearbyScrollContent: {
    gap: Spacing.h.medium,
  },
  nearbyImageBox: {
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  nearbyImage: { width: '100%', height: '100%' },
  nearbyHeart: {
    position: 'absolute',
    top: Spacing.v.small,
    right: Spacing.h.small,
  },
  nearbyPlaceName: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    marginTop: Spacing.v.small,
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
