import { Divider } from '@/components/ui/Divider';
import { KakaoMap } from '@/components/ui/KakaoMap';
import { MetaRow } from '@/components/ui/MetaRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { MoreButton } from '@/components/ui/MoreButton';
import { MoreMenuAlert } from '@/components/modals/MoreMenuAlert';
import { ReportReviewAlert } from '@/components/modals/ReportReviewAlert';
import { ScheduleAlert } from '@/components/modals/ScheduleAlert';
import { SortAlert } from '@/components/modals/SortAlert';
import { getReviewLikeCount, ReviewCard } from '@/components/ui/ReviewCard';
import { PlaceThumb } from '@/components/ui/PlaceThumb';
import PagerView from '@/components/ui/PagerViewWrapper';
import { useScrollHeaderTitle } from '@/hooks/useScrollHeaderTitle';
import { SaveHeart32 } from '@/components/icons/SaveHeart';
import { UnSaveHeart32 } from '@/components/icons/UnSaveHeart';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLargeIconMode } from '@/hooks/useLargeIconMode';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Check, ChevronDown, ChevronRight, Edit3, Heart, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

const DETAIL_TABS = ['기본 정보', '리뷰', '포토스팟'] as const;

const PlaceDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const imageWidth = width - Spacing.h.medium * 2;
  const imageHeight = (imageWidth * 3) / 4;
  const smallImageWidth = imageWidth / 2;
  const smallImageHeight = (smallImageWidth * 3) / 4;
  const detailTabWidth = width / DETAIL_TABS.length;

  const { visible: headerTitleVisible, onContainerLayout, onTitleLayout, onScroll } = useScrollHeaderTitle();
  const { isLargeIconMode } = useLargeIconMode();
  const [selectedDetailTab, setSelectedDetailTab] = useState(0);
  const detailTabTranslateX = useRef(new Animated.Value(0)).current;
  const [scrollY, setScrollY] = useState(0);
  const tabBarY = useRef(0);
  const [headerHeight, setHeaderHeight] = useState(Spacing.v.small + Size.header);
  const isDetailTabPinned = !isLargeIconMode && tabBarY.current > 0 && scrollY >= tabBarY.current;
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isScheduleVisible, setIsScheduleVisible] = useState(false);
  const [savedNearby, setSavedNearby] = useState<Record<number, boolean>>({});
  const [savedPhotoSpots, setSavedPhotoSpots] = useState<Record<number, boolean>>({});
  const [isToggled, setIsToggled] = useState(false);
  const [isMapTouching, setIsMapTouching] = useState(false);
  const toggleClickTimestamps = useRef<number[]>([]);
  const [isToggleLocked, setIsToggleLocked] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photoOnly, setPhotoOnly] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSortOption>('추천순');
  const [isReviewSortVisible, setIsReviewSortVisible] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [imagePopup, setImagePopup] = useState<{ reviewId: number; index: number } | null>(null);
  const [reviewDeleteTarget, setReviewDeleteTarget] = useState<Review | null>(null);
  const [reviewReportTarget, setReviewReportTarget] = useState<Review | null>(null);

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
          return getReviewLikeCount(b) - getReviewLikeCount(a);
      }
    });
  const popupReview = imagePopup ? reviews.find((r) => r.id === imagePopup.reviewId) : null;

  const fetchDetail = useCallback(() => {
    if (!id || Number.isNaN(Number(id))) {
      setLoadError(true);
      return;
    }
    setLoadError(false);
    placeApi.getDetail(Number(id))
      .then(res => { setPlace(res.data); setIsSaved(res.data.is_bookmarked); })
      .catch(() => setLoadError(true));
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

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

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

  const showDetailTab = (index: number) => isLargeIconMode || selectedDetailTab === index;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScroll(e);
    setScrollY(e.nativeEvent.contentOffset.y);
  };

  const handleDetailTabPress = (index: number) => {
    setSelectedDetailTab(index);
    Animated.spring(detailTabTranslateX, {
      toValue: index * detailTabWidth,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const handleSaveToggle = async () => {
    if (!id) return;
    try {
      if (isSaved) await placeApi.unbookmark(Number(id));
      else await placeApi.bookmark(Number(id));
      setIsSaved(!isSaved);
      setPlace(prev => prev ? { ...prev, like_count: (prev.like_count ?? 0) + (isSaved ? -1 : 1) } : prev);
    } catch {}
  };

  const handleToggleReviewLike = async (review: Review) => {
    try {
      const res = review.isLiked
        ? await reviewApi.unlike('place', review.id)
        : await reviewApi.like('place', review.id);
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, likeCount: res.data.likes, isLiked: res.data.isLiked } : r)));
    } catch {}
  };

  const handleSourceTogglePress = () => {
    if (isToggleLocked) return;
    const now = Date.now();
    const recentClicks = toggleClickTimestamps.current.filter(t => now - t < 1000);
    recentClicks.push(now);
    toggleClickTimestamps.current = recentClicks;

    if (recentClicks.length >= 5) {
      toggleClickTimestamps.current = [];
      setIsToggleLocked(true);
      setTimeout(() => setIsToggleLocked(false), 5000);
      return;
    }

    setIsToggled(!isToggled);
    setIsMenuVisible(false);
  };

  const detailTabBarInner = (
    <>
      <View style={styles.detailTabBackgroundLine} />
      {DETAIL_TABS.map((tab, index) => (
        <TouchableOpacity key={tab} style={styles.detailTabItem} onPress={() => handleDetailTabPress(index)}>
          <Text style={[styles.detailTabText, { color: selectedDetailTab === index ? Colors.light.black : Colors.light.grayLight }]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
      <Animated.View
        style={[styles.detailTabIndicator, { width: detailTabWidth, transform: [{ translateX: detailTabTranslateX }] }]}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        {/* 헤더 */}
        <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
          <ScreenHeader
            onBack={() => router.dismiss()}
            style={{ zIndex: 20 }}
            scrollTitle={headerTitleVisible ? (place?.name ?? '') : undefined}
            right={
              <View style={styles.moreButtonWrapper}>
                <MoreButton onPress={() => setIsMenuVisible(!isMenuVisible)} />
                {isMenuVisible && (
                  <MoreMenuAlert
                    isSaved={isSaved}
                    onSavePress={handleSaveToggle}
                    onSchedulePress={() => { setIsMenuVisible(false); setIsScheduleVisible(true); }}
                    onReviewPress={() => {
                      setIsMenuVisible(false);
                      router.push({ pathname: '/ReviewWriteScreen', params: { type: 'place', id } });
                    }}
                    isToggled={isToggled}
                    onTogglePress={handleSourceTogglePress}
                    isToggleLocked={isToggleLocked}
                  />
                )}
              </View>
            }
          />
        </View>

        {isMenuVisible && (
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={styles.menuBackdrop} />
          </TouchableWithoutFeedback>
        )}

        {loadError && !place ? (
          <View style={styles.loadErrorContainer}>
            <Text style={styles.loadErrorText}>정보를 불러오지 못했습니다.</Text>
            <Text style={styles.loadErrorSubText}>삭제되었거나 일시적인 오류일 수 있습니다.</Text>
            <TouchableOpacity style={styles.loadErrorRetryButton} activeOpacity={0.8} onPress={fetchDetail}>
              <Text style={styles.loadErrorRetryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}
          scrollEnabled={!isMapTouching}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* 대표 이미지 */}
          <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
            <PlaceThumb uri={place?.image_url} style={styles.mainImage} iconSize={48} />
            {!isLargeIconMode && (
              <>
                <TouchableOpacity style={styles.imageSaveButton} onPress={handleSaveToggle} activeOpacity={0.8}>
                  <Heart
                    size={IconSize.xlarge}
                    color={isSaved ? Colors.light.heart : Colors.light.white}
                    fill={isSaved ? Colors.light.heart : 'transparent'}
                    strokeWidth={IconStroke.thin}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageScheduleButton} onPress={() => setIsScheduleVisible(true)} activeOpacity={0.8}>
                  <Calendar size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  <Text style={styles.imageScheduleButtonText}>일정 추가</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={[styles.infoContainer, !isLargeIconMode && { paddingBottom: Spacing.v.medium }]} onLayout={onContainerLayout}>
            {/* 장소명 */}
            <Text style={styles.titleText} onLayout={onTitleLayout}>{place?.name ?? '로딩 중...'}</Text>

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

            {isLargeIconMode && (
              /* 액션 버튼 그룹 */
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
            )}
          </View>

          {!isLargeIconMode && (
            /* 3탭 카테고리바 — 스크롤 시 헤더 밑에 고정 */
            <View
              style={styles.detailTabRow}
              onLayout={(e) => { tabBarY.current = e.nativeEvent.layout.y; }}
            >
              {detailTabBarInner}
            </View>
          )}

          <View style={styles.infoContainerTight}>
            {showDetailTab(0) && (
              <>
                {isLargeIconMode && <Divider marginTop={Spacing.v.large} />}

                {/* 기본 정보 */}
                <Text style={styles.basicInfoTitle}>기본 정보</Text>
                {place && (
                  <View style={styles.mapContainer}>
                    <KakaoMap
                      latitude={Number(place.latitude)}
                      longitude={Number(place.longitude)}
                      height={imageHeight}
                      markerTitle={place.name}
                      onTouchStart={() => setIsMapTouching(true)}
                      onTouchEnd={() => setIsMapTouching(false)}
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
                      <View style={[styles.infoGroupRow, { marginTop: Spacing.v.medium }]}>
                        <Text style={styles.infoLabel}>출처</Text>
                        <Text style={styles.infoValue}>
                          {isToggled ? (place?.kakao_place_url ? '카카오' : '카카오 정보 없음') : '한국관광공사'}
                        </Text>
                      </View>
                      {isToggled && place?.kakao_place_url && (
                        <TouchableOpacity
                          style={styles.kakaoShortcutRow}
                          activeOpacity={0.7}
                          onPress={() => Linking.openURL(place.kakao_place_url!)}
                        >
                          <ChevronRight size={IconSize.xsmall} color={Colors.light.primary} strokeWidth={IconStroke.regular} />
                          <Text style={styles.kakaoShortcutText}>카카오 맵 바로가기</Text>
                        </TouchableOpacity>
                      )}
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
                        <PlaceThumb uri={nearby.image_url} style={styles.nearbyImage} />
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
              </>
            )}

            {/* 포토스팟 */}
            {showDetailTab(2) && photos.length > 0 && (
              <>
                {isLargeIconMode && <Divider marginTop={Spacing.v.large} />}
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

            {showDetailTab(1) && (
              <>
                {/* 리뷰 섹션 */}
                {isLargeIconMode && <Divider marginTop={Spacing.v.large} />}

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
                    isLiked={review.isLiked}
                    onToggleLike={() => handleToggleReviewLike(review)}
                    onImagePress={(index) => setImagePopup({ reviewId: review.id, index })}
                    onEditPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: 'place', id, reviewId: review.id } })}
                    onDeletePress={() => setReviewDeleteTarget(review)}
                    onReportPress={() => setReviewReportTarget(review)}
                  />
                ))}
              </>
            )}
          </View>
        </ScrollView>
        )}

        {isDetailTabPinned && (
          <View style={[styles.detailTabPinnedOverlay, { top: headerHeight }]}>
            <View style={styles.detailTabRow}>
              {detailTabBarInner}
            </View>
          </View>
        )}

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
                  <Text style={styles.btnConfirmText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <ReportReviewAlert
          visible={reviewReportTarget !== null}
          onClose={() => setReviewReportTarget(null)}
          onSubmit={async (reason) => {
            if (!reviewReportTarget) return;
            try {
              await reviewApi.report('place', reviewReportTarget.id, reason);
            } catch {}
          }}
        />
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadErrorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.h.medium, gap: Spacing.v.small },
  loadErrorText: { ...Typography.subtitle2, color: Colors.light.black },
  loadErrorSubText: { ...Typography.body2, color: Colors.light.grayDark },
  loadErrorRetryButton: {
    marginTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.large,
    paddingVertical: Spacing.v.small,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
  },
  loadErrorRetryText: { ...Typography.button2, color: Colors.light.white },
  moreButtonWrapper: { position: 'relative', alignItems: 'flex-end' },
  menuBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  imageContainer: {
    marginTop: Spacing.v.small,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  mainImage: { width: '100%', height: '100%' },
  imageSaveButton: { position: 'absolute', top: Spacing.v.small, right: Spacing.h.small },
  imageScheduleButton: {
    position: 'absolute',
    bottom: Spacing.v.small,
    right: Spacing.h.small,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.small,
    borderRadius: 999,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
  },
  imageScheduleButtonText: {
    ...Typography.button4,
    color: Colors.light.grayDark,
    marginLeft: Spacing.h.xsmall,
  },
  infoContainer: { paddingHorizontal: Spacing.h.medium, marginTop: Spacing.v.medium },
  infoContainerTight: { paddingHorizontal: Spacing.h.medium },
  titleText: { ...Typography.HeadLine5, color: Colors.light.black },
  metaText: { ...Typography.body2, color: Colors.light.grayDark },
  iconTextRow: { flexDirection: 'row', alignItems: 'center' },
  tagText: { ...Typography.body2, color: Colors.light.dark },
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
  detailTabRow: {
    flexDirection: 'row',
    position: 'relative',
    backgroundColor: Colors.light.background,
  },
  detailTabBackgroundLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Spacing.lw.small, backgroundColor: Colors.light.grayLight },
  detailTabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.v.small,
  },
  detailTabText: { ...Typography.subtitle1 },
  detailTabIndicator: { position: 'absolute', bottom: 0, left: 0, height: Spacing.lw.small, backgroundColor: Colors.light.black, zIndex: 1 },
  detailTabPinnedOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 15,
  },
  basicInfoTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.large,
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
  kakaoShortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: Spacing.v.medium,
  },
  kakaoShortcutText: { ...Typography.button4, color: Colors.light.dark, marginLeft: Spacing.h.small },
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
  reviewMoreText: { ...Typography.button4, color: Colors.light.dark },
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
    marginTop: Spacing.h.xsmall,
  },
  nearbyAddress: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    marginTop: Spacing.h.xsmall,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.v.large,
  },
  reviewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.h.small },
  reviewTitle: { ...Typography.title1, color: Colors.light.black },
  reviewCount: { ...Typography.title1, color: Colors.light.dark },
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
  deleteDesc: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.medium, textAlign: 'center' },
  deleteButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnConfirmText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },
});

export default PlaceDetailScreen;
