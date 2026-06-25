import { Divider } from '@/components/ui/Divider';
import { MetaRow } from '@/components/ui/MetaRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { MoreButton } from '@/components/ui/MoreButton';
import { MoreMenuAlert } from '@/components/modals/MoreMenuAlert';
import { ScheduleAlert } from '@/components/modals/ScheduleAlert';
import { SaveHeart32 } from '@/components/icons/SaveHeart'; // 기존 저장 아이콘 가정
import { UnSaveHeart32 } from '@/components/icons/UnSaveHeart'; // 기존 저장 아이콘 가정
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Heart, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { mediaApi, scheduleApi } from '../services/api';
import type { Media, MediaPlace, Schedule } from '../services/types';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';
import { CATEGORY_LABEL, MEDIA_TYPE_LABEL, shortAddress } from '@/constants/labels';
import { Size } from '@/constants/Size';

const formatLikeCount = (count: number): string => {
  if (count < 100) return count.toString();
  return (Math.floor(count / 100) * 100).toLocaleString() + '+';
};

const CourseDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const imageWidth = width - Spacing.h.medium * 2;
  const imageHeight = (imageWidth * 3) / 4;
  const smallImageWidth = imageWidth / 2;
  const smallImageHeight = (smallImageWidth * 3) / 4;

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isScheduleVisible, setIsScheduleVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [media, setMedia] = useState<Media | null>(null);
  const [mediaPlaces, setMediaPlaces] = useState<MediaPlace[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    if (!id) return;
    mediaApi.getDetail(Number(id))
      .then(res => { setMedia(res.data); setIsSaved(res.data.is_bookmarked); })
      .catch(() => {});
    mediaApi.getPlaces(Number(id))
      .then(res => setMediaPlaces(res.data))
      .catch(() => {});
    scheduleApi.getList()
      .then(res => setSchedules(res.data))
      .catch(() => {});
  }, [id]);

  // day 번호 기준으로 장소 그룹핑
  const dayGroups = mediaPlaces.reduce<Record<number, MediaPlace[]>>((acc, mp) => {
    const key = mp.day ?? 1;
    if (!acc[key]) acc[key] = [];
    acc[key].push(mp);
    return acc;
  }, {});
  const sortedDays = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);

  const closeMenu = () => { if (isMenuVisible) setIsMenuVisible(false); };

  const handleSaveToggle = async () => {
    if (!id) return;
    try {
      if (isSaved) await mediaApi.unbookmark(Number(id));
      else await mediaApi.bookmark(Number(id));
      setIsSaved(!isSaved);
    } catch {}
  };

  const handleSchedulePress = () => {
    setIsMenuVisible(false);
    setIsScheduleVisible(true);
  };

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 헤더 */}
        <ScreenHeader
          onBack={() => router.back()}
          style={{ zIndex: 10 }}
          right={
            <View style={styles.moreButtonWrapper}>
              <MoreButton onPress={() => setIsMenuVisible(!isMenuVisible)} />
              {isMenuVisible && <MoreMenuAlert isSaved={isSaved} onSavePress={handleSaveToggle} onSchedulePress={handleSchedulePress} />}
            </View>
          }
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
          {/* 메인 이미지 */}
          <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
            <Image source={{ uri: media?.thumbnail_url ?? undefined }} style={styles.mainImage} resizeMode="cover" />
          </View>

          {/* 정보 섹션 */}
          <View style={styles.infoContainer}>
            <Text style={styles.titleText}>{media?.title ?? '로딩 중...'}</Text>

            <MetaRow>
              <Text style={styles.metaText}>{mediaPlaces.length}개 장소</Text>
              <TextSeparator />
              <Text style={styles.metaText}>{MEDIA_TYPE_LABEL[media?.media_type ?? ''] ?? media?.media_type}</Text>
              {media?.rating != null && (
                <>
                  <TextSeparator />
                  <Star size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  <Text style={styles.metaText}> {media.rating.toFixed(1)}</Text>
                </>
              )}
              {media?.like_count != null && (
                <>
                  <TextSeparator />
                  <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  <Text style={styles.metaText}> {media.like_count.toLocaleString()}</Text>
                </>
              )}
            </MetaRow>

            <TagRow>
              {media?.tags.map((tag) => (
                <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
              ))}
            </TagRow>

            {/* 버튼 그룹 */}
            <View style={styles.actionButtonGroup}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSaveToggle} activeOpacity={0.7}>
                {isSaved ? <SaveHeart32 /> : <UnSaveHeart32 />}
                <Text style={styles.actionButtonText}>{isSaved ? '저장취소' : '저장하기'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSchedulePress} activeOpacity={0.7}>
                <Calendar size={IconSize.xlarge} color={Colors.light.grayDark} strokeWidth={IconStroke.thin} />
                <Text style={styles.actionButtonText}>일정추가</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => {}} activeOpacity={0.7}>
                <Star size={IconSize.xlarge} color={Colors.light.grayDark} strokeWidth={IconStroke.thin} />
                <Text style={styles.actionButtonText}>리뷰쓰기</Text>
              </TouchableOpacity>
            </View>

            <Divider />

            {/* 미디어 정보 */}
            <Text style={styles.mediaTitleText}>{media?.title}</Text>
            <View style={[styles.mediaImageContainer, { height: imageHeight }]}>
              <Image source={{ uri: media?.thumbnail_url ?? undefined }} style={styles.mediaImage} resizeMode="cover" />
            </View>
            <Text style={styles.mediaDescText}>{media?.description}</Text>

            <Divider marginTop={Spacing.v.large} />

            {/* 촬영지 섹션 타이틀 */}
            <Text style={styles.locationSectionTitle}>{media?.title} 속 촬영지</Text>
          </View>

          {/* 촬영지 이미지 슬라이드 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.locationScrollContent, { paddingHorizontal: Spacing.h.medium }]}
            style={{ marginTop: Spacing.v.medium }}
          >
            {mediaPlaces.map((mp) => (
              <View key={mp.id} style={[styles.locationImageBox, { width: smallImageWidth, height: smallImageHeight }]}>
                <Image source={{ uri: mp.place.image_url ?? undefined }} style={styles.locationImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>

          <View style={styles.infoContainer}>
            <Divider marginTop={Spacing.v.large} />

            {/* 코스 섹션 */}
            <Text style={styles.courseSectionTitle}>코스</Text>

            {sortedDays.map((dayNum, dayIndex) => (
              <View key={dayNum} style={dayIndex > 0 ? { marginTop: Spacing.v.large } : undefined}>
                <View style={styles.dayRow}>
                  <Text style={styles.dayText}>Day {dayNum}</Text>
                </View>

                {dayGroups[dayNum].map((mp, placeIndex) => (
                  <View key={mp.id} style={styles.placeRow}>
                    <View style={styles.placeNumberColumn}>
                      <View style={styles.placeCircle}>
                        <Text style={styles.placeCircleText}>{placeIndex + 1}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={{ flex: 1 }}
                      activeOpacity={0.8}
                      onPress={() => router.push({ pathname: '/PlaceDetailScreen', params: { id: mp.place.id, name: mp.place.name } })}
                    >
                      <Shadow distance={4} startColor="rgba(0, 0, 0, 0.15)" offset={[0, 0]} stretch>
                        <View style={styles.courseCard}>
                          <Image
                            source={{ uri: mp.place.image_url ?? undefined }}
                            style={styles.courseCardImage}
                            resizeMode="cover"
                          />
                          <View style={styles.cardContent}>
                            <View style={styles.cardNameRow}>
                              <Text style={styles.placeNameText}>{mp.place.name}</Text>
                            </View>
                            <View style={styles.cardSubRow}>
                              <Text style={styles.cardSubText}>{CATEGORY_LABEL[mp.place.category] ?? mp.place.category}</Text>
                              <TextSeparator />
                              <Text style={styles.cardSubText} numberOfLines={1}>{shortAddress(mp.place.address)}</Text>
                            </View>
                            <TouchableOpacity style={styles.routeButton} activeOpacity={0.7}>
                              <Text style={styles.routeButtonText}>경로 확인</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Shadow>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}

            {/* 포토스팟 섹션 */}
            {mediaPlaces.length > 0 && (
              <>
                <Divider marginTop={Spacing.v.large} />
                <Text style={styles.photoSpotTitle}>포토스팟</Text>
                {mediaPlaces.map((mp, index) => (
                  <View key={mp.id} style={[styles.photoSpotBox, index > 0 && { marginTop: Spacing.v.small }]}>
                    <View style={styles.photoSpotItem}>
                      <Image source={{ uri: mp.place.image_url ?? undefined }} style={styles.photoSpotImage} />
                      <View style={{ width: Spacing.h.medium }} />
                      <View style={styles.photoSpotContent}>
                        <Text style={styles.photoSpotItemTitle}>{mp.place.name}</Text>
                        <View style={styles.photoSpotMetaRow}>
                          <Text style={styles.photoSpotAddress}>{shortAddress(mp.place.address)}</Text>
                          {mp.place.like_count != null && (
                            <>
                              <TextSeparator />
                              <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                              <Text style={styles.photoSpotLikes}>{formatLikeCount(mp.place.like_count)}</Text>
                            </>
                          )}
                        </View>
                        <View style={styles.photoSpotTags}>
                          {mp.place.tags.map((tag) => (
                            <Text key={tag.id} style={styles.photoSpotTag}>#{tag.name}</Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
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
  actionButton: {
    alignItems: 'center',
    width: 64,
  },
  actionButtonText: {
    ...Typography.button4,
    color: Colors.light.grayDark,
    marginTop: Spacing.v.small,
  },
  mediaTitleText: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.medium,
  },
  mediaImageContainer: {
    marginTop: Spacing.v.medium,
    width: '100%',
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  mediaImage: { width: '100%', height: '100%' },
  mediaDescText: {
    ...Typography.body2,
    color: Colors.light.black,
    marginTop: Spacing.v.medium,
  },
  locationSectionTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.large,
  },
  locationScrollContent: {
    gap: Spacing.v.small,
  },
  locationImageBox: {
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  locationImage: { width: '100%', height: '100%' },
  locationDescText: {
    ...Typography.body2,
    color: Colors.light.black,
  },
  courseSectionTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.large,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
  },
  dayText: {
    ...Typography.title2,
    color: Colors.light.black,
  },
  dayDateText: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    marginLeft: Spacing.h.small,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
  },
  placeNumberColumn: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  placeCircle: {
    width: Spacing.h.medium,
    height: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeCircleText: {
    ...Typography.body1,
    color: Colors.light.black,
  },
  connectingLine: {
    flex: 1,
    width: Spacing.lw.small,
    backgroundColor: Colors.light.grayLight,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    paddingVertical: Spacing.v.small,
    paddingLeft: Spacing.h.small,
  },
  courseCardImage: {
    width: 86,
    height: 86,
    borderRadius: Spacing.r.xsmall,
    backgroundColor: Colors.light.grayLight,
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.h.small,
    alignSelf: 'stretch',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
  },
  cardSubText: {
    ...Typography.body2,
    color: Colors.light.grayDark,
  },
  placeNameText: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    marginRight: Spacing.h.small,
  },
  routeButton: {
    position: 'absolute',
    bottom: 0,
    right: Spacing.h.small,
    height: 24,
    paddingHorizontal: Spacing.h.medium,
    backgroundColor: Colors.light.white,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeButtonText: {
    ...Typography.button4,
    color: Colors.light.grayDark,
  },
  ratingText: {
    ...Typography.body1,
    color: Colors.light.grayDark,
    marginLeft: Spacing.h.xsmall,
  },
  photoSpotTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.large,
  },
  photoSpotBox: {
    marginTop: Spacing.v.medium,
    backgroundColor: Colors.light.white,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
    paddingHorizontal: Spacing.h.medium,
    paddingTop: Spacing.v.medium,
    paddingBottom: Spacing.v.medium,
  },
  photoSpotItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  photoSpotImage: {
    width: Size.circleMd,
    height: Size.circleMd,
    borderRadius: Size.circleMd / 2,
    backgroundColor: Colors.light.grayLight,
  },
  photoSpotContent: {
    flex: 1,
  },
  photoSpotItemTitle: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  photoSpotMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
  },
  photoSpotAddress: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
  },
  photoSpotLikes: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    marginLeft: Spacing.h.xsmall,
  },
  photoSpotTags: {
    flexDirection: 'row',
    marginTop: Spacing.v.small,
    gap: Spacing.h.xsmall,
  },
  photoSpotTag: {
    ...Typography.body2,
    color: Colors.light.primary,
  },
});

export default CourseDetailScreen;