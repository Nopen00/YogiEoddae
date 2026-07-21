import { Divider } from '@/components/ui/Divider';
import { KakaoMap } from '@/components/ui/KakaoMap';
import { MetaRow } from '@/components/ui/MetaRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { MoreButton } from '@/components/ui/MoreButton';
import { MoreMenuAlert } from '@/components/modals/MoreMenuAlert';
import { ScheduleAlert } from '@/components/modals/ScheduleAlert';
import { SortAlert } from '@/components/modals/SortAlert';
import { getReviewLikeCount, ReviewCard } from '@/components/ui/ReviewCard';
import PagerView from '@/components/ui/PagerViewWrapper';
import { SaveHeart32 } from '@/components/icons/SaveHeart';
import { UnSaveHeart32 } from '@/components/icons/UnSaveHeart';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Check, ChevronDown, Edit3, Heart, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { placeApi, reviewApi, scheduleApi } from '../services/api';
import type { Photo, Place, Review, Schedule } from '../services/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';
import { CATEGORY_LABEL, shortAddress } from '@/constants/labels';

const REVIEW_SORT_OPTIONS = ['추천순', '최신 여행 순', '최신 리뷰 순', '별점 높은 순', '별점 낮은 순'] as const;
type ReviewSortOption = typeof REVIEW_SORT_OPTIONS[number];

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

  useFocusEffect(
    useCallback(() => {
      reviewApi.getList('place', Number(id)).then(res => setReviews(res.data)).catch(() => {});
    }, [id])
  );

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

        {isMenuVisible && (
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={styles.menuBackdrop} />
          </TouchableWithoutFeedback>
        )}

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
            {place && (
              <View style={styles.mapContainer}>
                <KakaoMap
                  latitude={Number(place.latitude)}
                  longitude={Number(place.longitude)}
                  height={imageHeight}
                  markerTitle={place.name}
                />
              </View>
            )}
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

            {/* 근처 추천 장소 */}
            <Divider marginTop={Spacing.v.large} />
            <Text style={styles.nearbyTitle}>근처 추천 장소</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.v.medium }}
              contentContainerStyle={styles.nearbyScrollContent}>
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
                onPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: 'place', id } })}
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
                onEditPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: 'place', id, reviewId: review.id } })}
                onDeletePress={() => setReviewDeleteTarget(review)}
              />
            ))}
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
                      await reviewApi.remove('place', target.id);
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  moreButtonWrapper: { position: 'relative', alignItems: 'flex-end' },
  menuBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
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
    overflow: 'hidden',
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
    width: Size.thumbSquare,
    height: Size.thumbSquare,
    borderRadius: Spacing.r.xsmall,
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

export default PlaceDetailScreen;
