import { BackButton } from '@/components/make_component/BackButton';
import { MoreButton } from '@/components/make_component/MoreButton';
import { MoreMenuAlert } from '@/components/make_component/MoreMenuAlert';
import { ScheduleAlert } from '@/components/make_component/ScheduleAlert';
import { SaveHeart32 } from '@/components/make_component/icons/SaveHeart'; // 기존 저장 아이콘 가정
import { UnSaveHeart32 } from '@/components/make_component/icons/UnSaveHeart'; // 기존 저장 아이콘 가정
import { Colors } from '@/constants/Colors';
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

const MEDIA_TYPE_LABEL: Record<string, string> = {
  drama: '드라마', movie: '영화', youtube: '유튜브', etc: '기타',
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

const CATEGORY_LABEL: Record<string, string> = {
  '12': '관광지', '14': '문화시설', '15': '축제/행사',
  '25': '여행코스', '28': '레포츠', '32': '숙박', '38': '쇼핑', '39': '음식점',
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
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.flexFill} />
          <View style={styles.moreButtonWrapper}>
            <MoreButton onPress={() => setIsMenuVisible(!isMenuVisible)} />
            {isMenuVisible && <MoreMenuAlert isSaved={isSaved} onSavePress={handleSaveToggle} onSchedulePress={handleSchedulePress} />}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* 메인 이미지 */}
          <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
            <Image source={{ uri: media?.thumbnail_url ?? undefined }} style={styles.mainImage} resizeMode="cover" />
          </View>

          {/* 정보 섹션 */}
          <View style={styles.infoContainer}>
            <Text style={styles.titleText}>{media?.title ?? '로딩 중...'}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{mediaPlaces.length}개 장소</Text>
              <Text style={styles.separator}>|</Text>
              <Text style={styles.metaText}>{MEDIA_TYPE_LABEL[media?.media_type ?? ''] ?? media?.media_type}</Text>
              {media?.rating != null && (
                <>
                  <Text style={styles.separator}>|</Text>
                  <Star size={16} color={Colors.light.grayDark} strokeWidth={2} />
                  <Text style={styles.metaText}> {media.rating.toFixed(1)}</Text>
                </>
              )}
              {media?.like_count != null && (
                <>
                  <Text style={styles.separator}>|</Text>
                  <Heart size={16} color={Colors.light.grayDark} strokeWidth={2} />
                  <Text style={styles.metaText}> {media.like_count.toLocaleString()}</Text>
                </>
              )}
            </View>

            <View style={styles.tagRow}>
              {media?.tags.map((tag) => (
                <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
              ))}
            </View>

            {/* 버튼 그룹 */}
            <View style={styles.actionButtonGroup}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSaveToggle} activeOpacity={0.7}>
                {isSaved ? <SaveHeart32 /> : <UnSaveHeart32 />}
                <Text style={styles.actionButtonText}>{isSaved ? '저장취소' : '저장하기'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSchedulePress} activeOpacity={0.7}>
                <Calendar size={32} color={Colors.light.grayDark} strokeWidth={1.5} />
                <Text style={styles.actionButtonText}>일정추가</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => {}} activeOpacity={0.7}>
                <Star size={32} color={Colors.light.grayDark} strokeWidth={1.5} />
                <Text style={styles.actionButtonText}>리뷰쓰기</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* 미디어 정보 */}
            <Text style={styles.mediaTitleText}>{media?.title}</Text>
            <View style={[styles.mediaImageContainer, { height: imageHeight }]}>
              <Image source={{ uri: media?.thumbnail_url ?? undefined }} style={styles.mediaImage} resizeMode="cover" />
            </View>
            <Text style={styles.mediaDescText}>{media?.description}</Text>

            <View style={styles.dividerBottom} />

            {/* 촬영지 섹션 타이틀 */}
            <Text style={styles.locationSectionTitle}>{media?.title} 속 촬영지</Text>
          </View>

          {/* 촬영지 이미지 슬라이드 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.locationScrollContent, { paddingHorizontal: Spacing.h.medium }]}
            style={{ marginTop: 16 }}
          >
            {mediaPlaces.map((mp) => (
              <View key={mp.id} style={[styles.locationImageBox, { width: smallImageWidth, height: smallImageHeight }]}>
                <Image source={{ uri: mp.place.image_url ?? undefined }} style={styles.locationImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>

          <View style={styles.infoContainer}>
            <View style={styles.dividerBottom} />

            {/* 코스 섹션 */}
            <Text style={styles.courseSectionTitle}>코스</Text>

            {sortedDays.map((dayNum, dayIndex) => (
              <View key={dayNum} style={dayIndex > 0 ? { marginTop: 32 } : undefined}>
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

                    <View style={{ width: 16 }} />

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
                              <Text style={styles.cardSeparator}>|</Text>
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
                <View style={styles.dividerBottom} />
                <Text style={styles.photoSpotTitle}>포토스팟</Text>
                {mediaPlaces.map((mp, index) => (
                  <View key={mp.id} style={[styles.photoSpotBox, index > 0 && { marginTop: 8 }]}>
                    <View style={styles.photoSpotItem}>
                      <Image source={{ uri: mp.place.image_url ?? undefined }} style={styles.photoSpotImage} />
                      <View style={{ width: 16 }} />
                      <View style={styles.photoSpotContent}>
                        <Text style={styles.photoSpotItemTitle}>{mp.place.name}</Text>
                        <View style={styles.photoSpotMetaRow}>
                          <Text style={styles.photoSpotAddress}>{shortAddress(mp.place.address)}</Text>
                          {mp.place.like_count != null && (
                            <>
                              <Text style={styles.photoSpotSeparator}>|</Text>
                              <Heart size={14} color={Colors.light.grayDark} strokeWidth={2} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    paddingHorizontal: Spacing.h.medium,
    height: 56,
    zIndex: 10,
  },
  flexFill: { flex: 1 },
  moreButtonWrapper: { position: 'relative', alignItems: 'flex-end' },
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
  separator: { ...Typography.body2, color: Colors.light.grayDark, marginHorizontal: 4 },
  iconTextRow: { flexDirection: 'row', alignItems: 'center' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tagText: { ...Typography.body2, color: Colors.light.primary, marginRight: 4 },
  
  // 버튼 그룹 스타일
  actionButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 화면 길이에 따라 간격 자동 조절
    marginTop: 16, // 태그 16pt 아래
    paddingHorizontal: 16, // 부모 컨테이너(16) + 이 패딩(16) = 전체화면 32pt 여백
  },
  actionButton: {
    alignItems: 'center', // 아이콘과 텍스트 한 그룹으로 정렬
    width: 64, // 텍스트 너비 고려
  },
  actionButtonText: {
    ...Typography.button4,
    color: Colors.light.grayDark,
    marginTop: 8,
  },
  divider: {
    marginTop: 16,
    height: 1,
    backgroundColor: Colors.light.grayLight,
  },
  mediaTitleText: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 16,
  },
  mediaImageContainer: {
    marginTop: 16,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  mediaImage: { width: '100%', height: '100%' },
  mediaDescText: {
    ...Typography.body2,
    color: Colors.light.black,
    marginTop: 16,
  },
  dividerBottom: {
    marginTop: 32,
    height: 1,
    backgroundColor: Colors.light.grayLight,
  },
  locationSectionTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 32,
  },
  locationScrollContent: {
    gap: 8,
  },
  locationImageBox: {
    borderRadius: 8,
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
    marginTop: 32,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dayText: {
    ...Typography.title2,
    color: Colors.light.black,
  },
  dayDateText: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    marginLeft: 8,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  placeNumberColumn: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  placeCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
    width: 1,
    backgroundColor: Colors.light.grayLight,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 102,
    backgroundColor: Colors.light.white,
    borderRadius: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
  },
  courseCardImage: {
    width: 86,
    height: 86,
    borderRadius: 4,
    backgroundColor: Colors.light.grayLight,
  },
  cardContent: {
    flex: 1,
    marginLeft: 8,
    alignSelf: 'stretch',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardSubText: {
    ...Typography.body2,
    color: Colors.light.grayDark,
  },
  cardSeparator: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    marginHorizontal: 8,
  },
  placeNameText: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    marginRight: 8,
  },
  routeButton: {
    position: 'absolute',
    bottom: 0,
    right: 8,
    height: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.white,
    borderWidth: 1,
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
    marginLeft: 2,
  },
  photoSpotTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 32,
  },
  photoSpotBox: {
    marginTop: 16,
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  photoSpotItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  photoSpotImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginTop: 8,
  },
  photoSpotAddress: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
  },
  photoSpotSeparator: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    marginHorizontal: 4,
  },
  photoSpotLikes: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    marginLeft: 2,
  },
  photoSpotTags: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  photoSpotTag: {
    ...Typography.body2,
    color: '#41737c',
  },
});

export default CourseDetailScreen;