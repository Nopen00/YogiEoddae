import { SaveHeart32 } from '@/components/icons/SaveHeart';
import { UnSaveHeart32 } from '@/components/icons/UnSaveHeart';
import { Divider } from '@/components/ui/Divider';
import { MetaRow } from '@/components/ui/MetaRow';
import { MoreButton } from '@/components/ui/MoreButton';
import { MoreMenuAlert } from '@/components/modals/MoreMenuAlert';
import { PhotoSpotScheduleAlert } from '@/components/modals/PhotoSpotScheduleAlert';
import { ScheduleAlert } from '@/components/modals/ScheduleAlert';
import { SortAlert } from '@/components/modals/SortAlert';
import { getReviewLikeCount, ReviewCard } from '@/components/ui/ReviewCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import PagerView from '@/components/ui/PagerViewWrapper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Check, ChevronDown, Edit3, Heart, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { photoApi, scheduleApi } from '../services/api';
import type { Schedule } from '../services/types';

// TODO: 목데이터. 실제 데이터 연동 시 photoApi로 교체
const MOCK_PHOTO = {
  title: '포토스팟 이름',
  image_url: 'https://picsum.photos/seed/photospot-hero/800/600',
  rating: 4.8,
  like_count: 128,
  tags: ['로맨스', '드라마', '야경'],
};

// TODO: 목데이터. 실제 데이터 연동 시 포토스팟이 속한 장소(place)로 교체
const MOCK_PLACE = {
  name: '장소 이름',
  image_url: 'https://picsum.photos/seed/photospot-place/200/200',
  category: '관광지',
  address: '서울 종로구',
  tags: ['로맨스', '드라마'],
};

// TODO: 목데이터. 실제 데이터 연동 시 해당 장소의 포토스팟 목록(photoApi)으로 교체
const MOCK_PLACE_PHOTOS = [
  { id: 1, title: '포토스팟 1', image_url: 'https://picsum.photos/seed/photospot-place1/400/300', tags: ['야경', '로맨스'] },
  { id: 2, title: '포토스팟 2', image_url: 'https://picsum.photos/seed/photospot-place2/400/300', tags: ['드라마'] },
  { id: 3, title: '포토스팟 3', image_url: 'https://picsum.photos/seed/photospot-place3/400/300', tags: ['영화', '데이트'] },
];

// TODO: 목데이터. 실제 데이터 연동 시 같은 태그를 가진 포토스팟 목록(photoApi)으로 교체
const MOCK_TAG_PHOTOS = [
  { id: 4, title: '포토스팟 4', image_url: 'https://picsum.photos/seed/photospot-tag4/400/300', tags: ['로맨스'] },
  { id: 5, title: '포토스팟 5', image_url: 'https://picsum.photos/seed/photospot-tag5/400/300', tags: ['로맨스', '드라마'] },
  { id: 6, title: '포토스팟 6', image_url: 'https://picsum.photos/seed/photospot-tag6/400/300', tags: ['야경', '로맨스'] },
];

const REVIEW_SORT_OPTIONS = ['추천순', '최신 여행 순', '최신 리뷰 순', '별점 높은 순', '별점 낮은 순'] as const;
type ReviewSortOption = typeof REVIEW_SORT_OPTIONS[number];

// TODO: 목데이터. 실제 데이터 연동 시 리뷰 API로 교체
const MOCK_REVIEWS = [
  {
    id: 1,
    author: '여행자1',
    travelDate: '2026.04.02',
    writtenDate: '2026.05.01',
    rating: 5,
    content:
      '분위기가 정말 좋았어요. 사진 찍기 딱 좋은 곳이에요. 주변에 카페도 많고 산책하기도 좋아서 하루 종일 있어도 지루하지 않았어요. 특히 노을 질 때 색감이 예술이었습니다. 사람이 몰리는 시간대만 피하면 여유롭게 사진도 찍을 수 있고, 근처 맛집도 많아서 같이 둘러보기 좋아요. 아이와 함께 가도 무리 없을 정도로 동선이 편했습니다. 다음에 또 오고 싶어요. 강력 추천합니다!',
    images: [
      'https://picsum.photos/seed/review1-1/400/300',
      'https://picsum.photos/seed/review1-2/400/300',
      'https://picsum.photos/seed/review1-3/400/300',
    ],
    hasPhoto: true,
    likeCount: 24,
  },
  {
    id: 2,
    author: '여행자2',
    travelDate: '2026.03.15',
    writtenDate: '2026.03.20',
    rating: 3,
    content: '생각보다 사람이 많아서 아쉬웠지만 뷰는 최고였어요.',
    images: [],
    hasPhoto: false,
    likeCount: 3,
  },
  {
    id: 3,
    author: '여행자3',
    travelDate: '2026.02.10',
    writtenDate: '2026.02.14',
    rating: 4,
    content:
      '해질녘에 가면 더 예뻐요! 노을이 지기 시작할 때 딱 맞춰서 도착하는 걸 추천해요. 주차 공간이 넉넉하지 않아서 대중교통으로 가는 게 편했습니다.',
    images: ['https://picsum.photos/seed/review3-1/400/300'],
    hasPhoto: true,
    likeCount: 11,
  },
];

const PhotoSpotDetailScreen = () => {
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
  const [isScheduleSelectVisible, setIsScheduleSelectVisible] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [savedPlacePhotos, setSavedPlacePhotos] = useState<Record<number, boolean>>({});
  const [savedTagPhotos, setSavedTagPhotos] = useState<Record<number, boolean>>({});
  const [selectedTags, setSelectedTags] = useState([MOCK_PHOTO.tags[0]]);
  const [photoOnly, setPhotoOnly] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSortOption>('추천순');
  const [isReviewSortVisible, setIsReviewSortVisible] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [likedReviews, setLikedReviews] = useState<Record<number, boolean>>({});
  const [imagePopup, setImagePopup] = useState<{ reviewId: number; index: number } | null>(null);

  const filteredReviews = (photoOnly ? MOCK_REVIEWS.filter((r) => r.hasPhoto) : MOCK_REVIEWS)
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
  const popupReview = imagePopup ? MOCK_REVIEWS.find((r) => r.id === imagePopup.reviewId) : null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        if (prev.length === 1) return prev; // 최소 1개는 선택 유지
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  };

  const filteredTagPhotos = MOCK_TAG_PHOTOS.filter((photo) => selectedTags.every((tag) => photo.tags.includes(tag)));

  useEffect(() => {
    scheduleApi.getList().then(res => setSchedules(res.data)).catch(() => {});
  }, []);

  const closeMenu = () => { if (isMenuVisible) setIsMenuVisible(false); };

  const toggleSaved = async () => {
    if (!id) return;
    try {
      if (isSaved) await photoApi.unbookmark(Number(id));
      else await photoApi.bookmark(Number(id));
      setIsSaved(!isSaved);
    } catch {}
  };

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader
          onBack={() => router.dismiss()}
          style={{ zIndex: 10 }}
          right={
            <View style={styles.moreButtonWrapper}>
              <MoreButton onPress={() => setIsMenuVisible(!isMenuVisible)} />
              {isMenuVisible && (
                <MoreMenuAlert
                  isSaved={isSaved}
                  onSavePress={() => { toggleSaved(); setIsMenuVisible(false); }}
                  onSchedulePress={() => { setIsMenuVisible(false); setIsScheduleVisible(true); }}
                />
              )}
            </View>
          }
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
            <Image source={{ uri: MOCK_PHOTO.image_url }} style={styles.mainImage} resizeMode="cover" />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.titleText}>{MOCK_PHOTO.title}</Text>

            <MetaRow>
              <Star size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
              <Text style={styles.metaText}> {MOCK_PHOTO.rating.toFixed(1)}</Text>
              <TextSeparator />
              <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
              <Text style={styles.metaText}> {MOCK_PHOTO.like_count}</Text>
            </MetaRow>

            <TagRow>
              {MOCK_PHOTO.tags.map((tag) => (
                <Text key={tag} style={styles.tagText}>#{tag}</Text>
              ))}
            </TagRow>

            <View style={styles.actionButtonGroup}>
              <TouchableOpacity style={styles.actionButton} onPress={toggleSaved} activeOpacity={0.7}>
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

            <Text style={styles.sectionTitle}>장소</Text>
            <View style={styles.placeCard}>
              <View style={styles.placeImageWrapper}>
                <Image source={{ uri: MOCK_PLACE.image_url }} style={styles.placeImage} resizeMode="cover" />
              </View>
              <View style={styles.placeCardContent}>
                <Text style={styles.placeCardTitle} numberOfLines={1}>{MOCK_PLACE.name}</Text>
                <View style={styles.placeInfoRow}>
                  <Text style={styles.placeInfoText}>{MOCK_PLACE.category}</Text>
                  <Text style={styles.placeInfoSep}>|</Text>
                  <Text style={styles.placeInfoText} numberOfLines={1}>{MOCK_PLACE.address}</Text>
                </View>
                {MOCK_PLACE.tags.length > 0 && (
                  <TagRow>
                    {MOCK_PLACE.tags.map((tag) => (
                      <Text key={tag} style={styles.tagText}>#{tag}</Text>
                    ))}
                  </TagRow>
                )}
              </View>
            </View>

            <Divider marginTop={Spacing.v.large} />

            <View style={styles.placePhotoSectionHeader}>
              <Text style={styles.placePhotoSectionTitle}>장소 포토스팟</Text>
              <Text style={styles.placePhotoSectionDesc}>이 장소의 또 다른 포토스팟이에요.</Text>
            </View>
          </View>

          {/* 장소 포토스팟 */}
          <View style={{ marginTop: Spacing.v.medium, marginHorizontal: Spacing.h.medium }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScrollContent}>
              {MOCK_PLACE_PHOTOS.map((photo) => (
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
                      onPress={(e) => { e.stopPropagation(); setSavedPlacePhotos(prev => ({ ...prev, [photo.id]: !prev[photo.id] })); }}
                      activeOpacity={0.8}
                    >
                      <Heart
                        size={IconSize.large}
                        color={savedPlacePhotos[photo.id] ? Colors.light.heart : Colors.light.white}
                        fill={savedPlacePhotos[photo.id] ? Colors.light.heart : 'transparent'}
                        strokeWidth={IconStroke.thin}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.nearbyPlaceName} numberOfLines={1}>{photo.title}</Text>
                  <TagRow>
                    {photo.tags.map((tag) => (
                      <Text key={tag} style={styles.tagText}>#{tag}</Text>
                    ))}
                  </TagRow>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.tagPhotoSectionWrapper}>
            <Text style={styles.placePhotoSectionTitle}>관련 태그 포토스팟</Text>
            <Text style={styles.placePhotoSectionDesc}>태그를 선택하여 자유롭게 볼 수 있어요</Text>

            <View style={styles.tagFilterRow}>
              {MOCK_PHOTO.tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity key={tag} onPress={() => toggleTag(tag)} activeOpacity={0.7}>
                    <Text style={isSelected ? styles.tagFilterTextSelected : styles.tagFilterTextUnselected}>
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 관련 태그 포토스팟 */}
          {filteredTagPhotos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>해당 태그의 포토스팟이 없습니다.</Text>
              <Text style={styles.emptyDesc}>다른 태그를 확인해보세요.</Text>
            </View>
          ) : (
            <View style={{ marginTop: Spacing.v.medium, marginHorizontal: Spacing.h.medium }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScrollContent}>
                {filteredTagPhotos.map((photo) => (
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
                        onPress={(e) => { e.stopPropagation(); setSavedTagPhotos(prev => ({ ...prev, [photo.id]: !prev[photo.id] })); }}
                        activeOpacity={0.8}
                      >
                        <Heart
                          size={IconSize.large}
                          color={savedTagPhotos[photo.id] ? Colors.light.heart : Colors.light.white}
                          fill={savedTagPhotos[photo.id] ? Colors.light.heart : 'transparent'}
                          strokeWidth={IconStroke.thin}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.nearbyPlaceName} numberOfLines={1}>{photo.title}</Text>
                    <TagRow>
                      {photo.tags.map((tag) => (
                        <Text key={tag} style={styles.tagText}>#{tag}</Text>
                      ))}
                    </TagRow>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.reviewSectionWrapper}>
            <Divider marginTop={Spacing.v.large} />

            <View style={styles.reviewHeaderRow}>
              <View style={styles.reviewTitleRow}>
                <Text style={styles.reviewTitle}>리뷰</Text>
                <Text style={styles.reviewCount}>{MOCK_REVIEWS.length}</Text>
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
              <TouchableOpacity style={styles.writeReviewButton} onPress={() => {}} activeOpacity={0.7}>
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
              />
            ))}
          </View>
        </ScrollView>

        <PhotoSpotScheduleAlert
          visible={isScheduleVisible}
          onClose={() => setIsScheduleVisible(false)}
          onConfirm={() => {
            setIsScheduleVisible(false);
            setIsScheduleSelectVisible(true);
          }}
        />

        <ScheduleAlert
          visible={isScheduleSelectVisible}
          onClose={() => setIsScheduleSelectVisible(false)}
          schedules={schedules}
          onConfirm={async (scheduleId, dayNumber) => {
            // TODO: 목데이터 연동 중. 실제 포토스팟이 속한 place_id로 교체 필요
            try {
              await scheduleApi.addPlace(scheduleId, {
                place_id: Number(id),
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
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default PhotoSpotDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.white },
  moreButtonWrapper: { position: 'relative' },
  scrollContent: { paddingBottom: Spacing.v.screenBottom },
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
  sectionTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.medium,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
    backgroundColor: Colors.light.white,
  },
  placeImageWrapper: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', flexShrink: 0 },
  placeImage: { width: '100%', height: '100%' },
  placeCardContent: { flex: 1, marginLeft: Spacing.h.medium },
  placeCardTitle: { ...Typography.title1, color: Colors.light.black },
  placeInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small, gap: Spacing.h.xsmall },
  placeInfoText: { ...Typography.subtitle1, color: Colors.light.grayDark, flexShrink: 1 },
  placeInfoSep: { ...Typography.subtitle1, color: Colors.light.grayDark },
  placePhotoSectionHeader: {
    marginTop: Spacing.v.large,
  },
  placePhotoSectionTitle: { ...Typography.title1, color: Colors.light.black },
  placePhotoSectionDesc: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.h.small },
  tagPhotoSectionWrapper: {
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.large,
  },
  tagFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.h.small,
    marginTop: Spacing.v.medium,
  },
  tagFilterTextSelected: { ...Typography.button2, color: Colors.light.primary },
  tagFilterTextUnselected: { ...Typography.body2, color: Colors.light.grayLight },
  emptyState: { paddingTop: Spacing.v.medium, alignItems: 'center' },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  emptyDesc: { ...Typography.body2, color: Colors.light.grayLight, marginTop: Spacing.v.medium },
  reviewSectionWrapper: { paddingHorizontal: Spacing.h.medium },
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
  nearbyScrollContent: { gap: Spacing.h.medium },
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
});
