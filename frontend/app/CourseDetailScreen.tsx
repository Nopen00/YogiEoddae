import { Divider } from '@/components/ui/Divider';
import { MetaRow } from '@/components/ui/MetaRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { MoreButton } from '@/components/ui/MoreButton';
import { MoreMenuAlert } from '@/components/modals/MoreMenuAlert';
import { ScheduleAlert } from '@/components/modals/ScheduleAlert';
import { SortAlert } from '@/components/modals/SortAlert';
import { getReviewLikeCount, ReviewCard } from '@/components/ui/ReviewCard';
import { KakaoMap } from '@/components/ui/KakaoMap';
import PagerView from '@/components/ui/PagerViewWrapper';
import { SaveHeart32 } from '@/components/icons/SaveHeart'; // 기존 저장 아이콘 가정
import { UnSaveHeart32 } from '@/components/icons/UnSaveHeart'; // 기존 저장 아이콘 가정
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Check, ChevronDown, Edit3, Heart, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { mediaApi, placeApi, photoApi, reviewApi, scheduleApi } from '../services/api';
import { pseudoRating } from '../services/mockData';
import type { Media, MediaPlace, Photo, Review, Schedule } from '../services/types';
import { Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORY_LABEL, MEDIA_TYPE_LABEL, shortAddress } from '@/constants/labels';

const REVIEW_SORT_OPTIONS = ['추천순', '최신 여행 순', '최신 리뷰 순', '별점 높은 순', '별점 낮은 순'] as const;
type ReviewSortOption = typeof REVIEW_SORT_OPTIONS[number];
type PhotoSpotItem = Photo & { rating: number; like_count: number };

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
  const [savedPhotoSpots, setSavedPhotoSpots] = useState<Record<number, boolean>>({});
  const [media, setMedia] = useState<Media | null>(null);
  const [mediaPlaces, setMediaPlaces] = useState<MediaPlace[]>([]);
  const [photoSpots, setPhotoSpots] = useState<PhotoSpotItem[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photoOnly, setPhotoOnly] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSortOption>('추천순');
  const [isReviewSortVisible, setIsReviewSortVisible] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [likedReviews, setLikedReviews] = useState<Record<number, boolean>>({});
  const [imagePopup, setImagePopup] = useState<{ reviewId: number; index: number } | null>(null);
  const [reviewDeleteTarget, setReviewDeleteTarget] = useState<Review | null>(null);

  const filteredReviews = (photoOnly ? reviews.filter((r) => r.hasPhoto) : reviews)
    .slice()
    .sort((a, b) => {
      switch (reviewSort) {
        case '최신 여행 순':
          return b.travelDate.localeCompare(a.travelDate);
        case '최신 리뷰 순':
          return b.writtenDate.localeCompare(a.writtenDate);
        case '별점 높은 순':
          return b.rating - a.rating;
        case '별점 낮은 순':
          return a.rating - b.rating;
        case '추천순':
        default:
          return getReviewLikeCount(b, likedReviews[b.id] ?? false) - getReviewLikeCount(a, likedReviews[a.id] ?? false);
      }
    });
  const popupReview = imagePopup ? reviews.find((r) => r.id === imagePopup.reviewId) : null;

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

  useFocusEffect(
    useCallback(() => {
      reviewApi.getList().then(res => setReviews(res.data)).catch(() => {});
    }, [])
  );

  useEffect(() => {
    if (mediaPlaces.length === 0) return;
    Promise.all(mediaPlaces.map(mp => placeApi.getPhotos(mp.place.id).then(res => res.data)))
      .then(results => {
        const photos: PhotoSpotItem[] = results.flat().map(p => ({ ...p, rating: pseudoRating(p), like_count: p.likes }));
        setPhotoSpots(photos);
        setSavedPhotoSpots(prev => {
          const next = { ...prev };
          photos.forEach(p => { next[p.id] = p.is_bookmarked ?? false; });
          return next;
        });
      })
      .catch(() => {});
  }, [mediaPlaces]);

  const toggleSavedPhotoSpot = async (photoId: number) => {
    const isSavedNow = savedPhotoSpots[photoId];
    try {
      if (isSavedNow) await photoApi.unbookmark(photoId);
      else await photoApi.bookmark(photoId);
      setSavedPhotoSpots(prev => ({ ...prev, [photoId]: !isSavedNow }));
    } catch {}
  };

  // day 번호 기준으로 장소 그룹핑
  const dayGroups = mediaPlaces.reduce<Record<number, MediaPlace[]>>((acc, mp) => {
    const key = mp.day ?? 1;
    if (!acc[key]) acc[key] = [];
    acc[key].push(mp);
    return acc;
  }, {});
  const sortedDays = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);
  const mapPlaces = mediaPlaces.map((mp) => mp.place);

  const closeMenu = () => { if (isMenuVisible) setIsMenuVisible(false); };

  const handleRoutePress = (place: { name: string; latitude: string; longitude: string }) => {
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.latitude},${place.longitude}`;
    Linking.openURL(url);
  };

  const handleSaveToggle = async () => {
    if (!id) return;
    try {
      if (isSaved) await mediaApi.unbookmark(Number(id));
      else await mediaApi.bookmark(Number(id));
      setIsSaved(!isSaved);
      setMedia(prev => prev ? { ...prev, like_count: (prev.like_count ?? 0) + (isSaved ? -1 : 1) } : prev);
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
          onBack={() => router.dismiss()}
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
              <Text style={styles.metaText}>{MEDIA_TYPE_LABEL[media?.media_type ?? ''] ?? media?.media_type}</Text>
              <TextSeparator />
              <Text style={styles.metaText}>{mediaPlaces.length}개 장소</Text>
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
                  <Text style={styles.metaText}> {formatLikeCount(media.like_count)}</Text>
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
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: 'course', id } })}
                activeOpacity={0.7}
              >
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

            {/* 코스 지도 */}
            <View style={styles.mapWrapper}>
              <KakaoMap places={mapPlaces} />
            </View>

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
                          <TouchableOpacity style={styles.routeButton} activeOpacity={0.7} onPress={() => handleRoutePress(mp.place)}>
                            <Text style={styles.routeButtonText}>경로 확인</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}

            {/* 포토스팟 섹션 */}
            {photoSpots.length > 0 && (
              <>
                <Divider marginTop={Spacing.v.large} />
                <View style={styles.photoSpotSectionHeader}>
                  <Text style={[styles.photoSpotTitle, { marginTop: 0 }]}>등장 장소 포토스팟</Text>
                  <Text style={styles.photoSpotSectionDesc}>코스 속 장소의 인기 포토스팟이에요.</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.v.medium }}
                  contentContainerStyle={styles.photoSpotScrollContent}>
                  {photoSpots.map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={{ width: smallImageWidth }}
                      activeOpacity={0.9}
                      onPress={() => router.push({ pathname: '/PhotoSpotDetailScreen', params: { id: photo.id, name: photo.description } })}
                    >
                      <View style={[styles.photoSpotImageBox, { width: smallImageWidth, height: smallImageHeight }]}>
                        <Image source={{ uri: photo.image_url ?? undefined }} style={styles.photoSpotImage} resizeMode="cover" />
                        <TouchableOpacity
                          style={styles.photoSpotHeart}
                          onPress={(e) => { e.stopPropagation(); toggleSavedPhotoSpot(photo.id); }}
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
                      <Text style={styles.photoSpotItemTitle} numberOfLines={1}>{photo.description}</Text>
                      {photo.tags.length > 0 && (
                        <TagRow>
                          {photo.tags.map((tag) => (
                            <Text key={tag.id} style={styles.photoSpotTag}>#{tag.name}</Text>
                          ))}
                        </TagRow>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* 리뷰 섹션 */}
            <Divider marginTop={Spacing.v.large} />

            <View style={styles.reviewHeaderRow}>
              <View style={styles.reviewTitleRow}>
                <Text style={styles.reviewTitle}>리뷰</Text>
                <Text style={styles.reviewCount}>{reviews.length}</Text>
              </View>
              <TouchableOpacity style={styles.photoFilterRow} onPress={() => setPhotoOnly(!photoOnly)} activeOpacity={0.7}>
                <View style={[styles.checkbox, photoOnly && styles.checkboxActive]}>
                  {photoOnly && <Check size={14} color={Colors.light.white} strokeWidth={IconStroke.regular} />}
                </View>
                <Text style={styles.photoFilterText}>사진 포함</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reviewSortRow}>
              <TouchableOpacity style={styles.reviewSortTrigger} onPress={() => setIsReviewSortVisible(true)} activeOpacity={0.7}>
                <Text style={styles.reviewSortText}>{reviewSort}</Text>
                <ChevronDown size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: 'course', id } })}
                activeOpacity={0.7}
              >
                <Edit3 size={16} color={Colors.light.white} strokeWidth={IconStroke.regular} />
                <Text style={styles.writeReviewText}>리뷰 작성</Text>
              </TouchableOpacity>
            </View>

            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isExpanded={expandedReviews[review.id] ?? false}
                onToggleExpand={() => setExpandedReviews((prev) => ({ ...prev, [review.id]: !prev[review.id] }))}
                isLiked={likedReviews[review.id] ?? false}
                onToggleLike={() => setLikedReviews((prev) => ({ ...prev, [review.id]: !prev[review.id] }))}
                onImagePress={(index) => setImagePopup({ reviewId: review.id, index })}
                onEditPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: 'course', id, reviewId: review.id } })}
                onDeletePress={() => setReviewDeleteTarget(review)}
              />
            ))}
          </View>
        </ScrollView>

        <ScheduleAlert
          visible={isScheduleVisible}
          onClose={() => setIsScheduleVisible(false)}
          schedules={schedules}
          checkMedia
          onConfirm={async (scheduleId, dayNumber) => {
            for (let i = 0; i < mediaPlaces.length; i++) {
              await scheduleApi.addPlace(scheduleId, {
                place_id: mediaPlaces[i].place.id,
                day_number: dayNumber,
                order: i + 1,
              });
            }
          }}
        />

        <SortAlert
          visible={isReviewSortVisible}
          options={REVIEW_SORT_OPTIONS}
          selected={reviewSort}
          onClose={() => setIsReviewSortVisible(false)}
          onSelect={setReviewSort}
        />

        <Modal visible={!!imagePopup} transparent animationType="fade" onRequestClose={() => setImagePopup(null)}>
          <TouchableOpacity style={styles.imagePopupOverlay} activeOpacity={1} onPress={() => setImagePopup(null)}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.imagePopupContainer}>
                {popupReview && imagePopup && (
                  <>
                    <PagerView
                      style={{ width: imageWidth, height: imageHeight }}
                      initialPage={imagePopup.index}
                      onPageSelected={(e) => {
                        const position = e.nativeEvent.position;
                        setImagePopup((prev) => (prev ? { ...prev, index: position } : prev));
                      }}
                    >
                      {popupReview.images.map((img) => (
                        <Image key={img} source={{ uri: img }} style={styles.imagePopupImage} resizeMode="cover" />
                      ))}
                    </PagerView>
                    <Text style={styles.imagePopupIndexText}>
                      {imagePopup.index + 1}/{popupReview.images.length}
                    </Text>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        <Modal visible={reviewDeleteTarget !== null} transparent animationType="fade">
          <View style={styles.deleteOverlay}>
            <View style={[styles.deletePopup, { width: width - 64 }]}>
              <Text style={styles.deleteTitle}>리뷰를 삭제하시겠습니까?</Text>
              <Text style={styles.deleteDesc}>삭제된 리뷰는 되돌릴 수 없습니다.</Text>
              <View style={styles.deleteButtons}>
                <TouchableOpacity
                  style={styles.btnCancel}
                  activeOpacity={0.8}
                  onPress={() => setReviewDeleteTarget(null)}
                >
                  <Text style={styles.btnCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnConfirm}
                  activeOpacity={0.8}
                  onPress={async () => {
                    if (!reviewDeleteTarget) return;
                    const target = reviewDeleteTarget;
                    setReviewDeleteTarget(null);
                    try {
                      await reviewApi.remove(target.id);
                      setReviews((prev) => prev.filter((r) => r.id !== target.id));
                    } catch {}
                  }}
                >
                  <Text style={styles.btnConfirmText}>확인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  mapWrapper: {
    marginTop: Spacing.v.large,
    marginBottom: Spacing.v.medium,
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  courseSectionTitle: {
    ...Typography.title1,
    color: Colors.light.black,
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
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingVertical: Spacing.v.small,
    paddingLeft: Spacing.h.small,
  },
  courseCardImage: {
    width: Size.thumbSquare,
    height: Size.thumbSquare,
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
  photoSpotSectionHeader: {
    marginTop: Spacing.v.large,
  },
  photoSpotSectionDesc: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.h.small },
  photoSpotScrollContent: { gap: Spacing.h.medium },
  photoSpotImageBox: {
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  photoSpotImage: { width: '100%', height: '100%' },
  photoSpotHeart: {
    position: 'absolute',
    top: Spacing.v.small,
    right: Spacing.h.small,
  },
  photoSpotItemTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    marginTop: Spacing.v.small,
  },
  photoSpotTag: {
    ...Typography.body2,
    color: Colors.light.primary,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.v.large,
  },
  reviewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.h.small },
  reviewTitle: { ...Typography.title1, color: Colors.light.black },
  reviewCount: { ...Typography.title1, color: Colors.light.primary },
  photoFilterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.h.small },
  photoFilterText: { ...Typography.body2, color: Colors.light.black },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.light.primary },
  reviewSortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
  },
  reviewSortTrigger: { flexDirection: 'row', alignItems: 'center', gap: Spacing.h.small },
  reviewSortText: { ...Typography.button4, color: Colors.light.black },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.h.small,
    backgroundColor: Colors.light.primary,
    borderRadius: Spacing.r.small,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.small,
  },
  writeReviewText: { ...Typography.button4, color: Colors.light.white },
  imagePopupOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePopupContainer: { alignItems: 'center' },
  imagePopupImage: {
    width: '100%',
    height: '100%',
    borderRadius: Spacing.r.small,
  },
  imagePopupIndexText: {
    ...Typography.HeadLine5,
    color: Colors.light.white,
    marginTop: Spacing.v.small,
  },
  deleteOverlay: { flex: 1, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  deletePopup: {
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingBottom: Spacing.v.medium,
  },
  deleteTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  deleteDesc: { ...Typography.body2, color: Colors.light.primary, marginTop: Spacing.v.medium, textAlign: 'center' },
  deleteButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnConfirmText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },
});

export default CourseDetailScreen;