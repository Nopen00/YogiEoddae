import { SaveHeart32 } from '@/components/icons/SaveHeart';
import { UnSaveHeart32 } from '@/components/icons/UnSaveHeart';
import { Divider } from '@/components/ui/Divider';
import { MetaRow } from '@/components/ui/MetaRow';
import { MoreButton } from '@/components/ui/MoreButton';
import { MoreMenuAlert } from '@/components/modals/MoreMenuAlert';
import { PhotoSpotScheduleAlert } from '@/components/modals/PhotoSpotScheduleAlert';
import { ReportReviewAlert } from '@/components/modals/ReportReviewAlert';
import { ScheduleAlert } from '@/components/modals/ScheduleAlert';
import { SortAlert } from '@/components/modals/SortAlert';
import { getReviewLikeCount, ReviewCard } from '@/components/ui/ReviewCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CATEGORY_LABEL, shortAddress } from '@/constants/labels';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import PagerView from '@/components/ui/PagerViewWrapper';
import { useLargeIconMode } from '@/hooks/useLargeIconMode';
import { useScrollHeaderTitle } from '@/hooks/useScrollHeaderTitle';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Check, ChevronDown, Edit3, Heart, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { photoApi, reviewApi, scheduleApi } from '../services/api';
import { pseudoRating } from '../services/mockData';
import type { PhotoSpotDetail, Review, Schedule } from '../services/types';

const REVIEW_SORT_OPTIONS = ['추천순', '최신 여행 순', '최신 리뷰 순', '별점 높은 순', '별점 낮은 순'] as const;
type ReviewSortOption = typeof REVIEW_SORT_OPTIONS[number];

const formatDateDots = (dateStr: string) => dateStr.slice(0, 10).replace(/-/g, '.');

const DETAIL_TABS = ['기본 정보', '리뷰', '포토스팟'] as const;

const PhotoSpotDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const imageWidth = width - Spacing.h.medium * 2;
  const imageHeight = (imageWidth * 3) / 4;
  const smallImageWidth = imageWidth / 2;
  const smallImageHeight = (smallImageWidth * 3) / 4;
  const detailTabWidth = width / DETAIL_TABS.length;

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
  const [isScheduleSelectVisible, setIsScheduleSelectVisible] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [detail, setDetail] = useState<PhotoSpotDetail | null>(null);
  const [savedPlacePhotos, setSavedPlacePhotos] = useState<Record<number, boolean>>({});
  const [savedTagPhotos, setSavedTagPhotos] = useState<Record<number, boolean>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [photoOnly, setPhotoOnly] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSortOption>('추천순');
  const [isReviewSortVisible, setIsReviewSortVisible] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [likedReviews, setLikedReviews] = useState<Record<number, boolean>>({});
  const [imagePopup, setImagePopup] = useState<{ images: string[]; index: number } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewDeleteTarget, setReviewDeleteTarget] = useState<Review | null>(null);
  const [reviewReportTarget, setReviewReportTarget] = useState<Review | null>(null);
  const [isPhotoReportVisible, setIsPhotoReportVisible] = useState(false);
  const { visible: headerTitleVisible, onContainerLayout, onTitleLayout, onScroll } = useScrollHeaderTitle();

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
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        if (prev.length === 1) return prev; // 최소 1개는 선택 유지
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  };

  const relatedPhotos = detail?.relatedPhotos ?? [];
  const filteredTagPhotos = relatedPhotos.filter((photo) =>
    selectedTags.every((tag) => photo.tags.some((t) => t.name === tag))
  );

  useEffect(() => {
    scheduleApi.getList().then(res => setSchedules(res.data)).catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      reviewApi.getList('photospot', Number(id)).then(res => setReviews(res.data)).catch(() => {});
    }, [id])
  );

  useEffect(() => {
    if (!id) return;
    photoApi.getDetail(Number(id)).then(res => {
      setDetail(res.data);
      setIsSaved(res.data.photo.is_bookmarked ?? false);
      setSelectedTags(res.data.photo.tags.length ? [res.data.photo.tags[0].name] : []);
    }).catch(() => {});
  }, [id]);

  const photo = detail?.photo;
  const place = detail?.place;
  const placePhotos = detail?.placePhotos ?? [];
  const photoTags = photo?.tags.map((t) => t.name) ?? [];
  const placeTags = place?.tags.map((t) => t.name) ?? [];

  const closeMenu = () => { if (isMenuVisible) setIsMenuVisible(false); };

  const toggleSaved = async () => {
    if (!id) return;
    try {
      if (isSaved) {
        await Promise.all([photoApi.unbookmark(Number(id)), photoApi.unlike(Number(id))]);
      } else {
        await Promise.all([photoApi.bookmark(Number(id)), photoApi.like(Number(id))]);
      }
      setIsSaved(!isSaved);
      setDetail(prev => prev ? { ...prev, photo: { ...prev.photo, likes: prev.photo.likes + (isSaved ? -1 : 1) } } : prev);
    } catch {}
  };

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
        <View onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
          <ScreenHeader
            onBack={() => router.dismiss()}
            style={{ zIndex: 10 }}
            scrollTitle={headerTitleVisible ? (photo?.description ?? '') : undefined}
            right={
              <View style={styles.moreButtonWrapper}>
                <MoreButton onPress={() => setIsMenuVisible(!isMenuVisible)} />
                {isMenuVisible && (
                  <MoreMenuAlert
                    isSaved={isSaved}
                    onSavePress={() => { toggleSaved(); setIsMenuVisible(false); }}
                    onSchedulePress={() => { setIsMenuVisible(false); setIsScheduleVisible(true); }}
                    onReportPress={photo?.isMine ? undefined : () => { setIsMenuVisible(false); setIsPhotoReportVisible(true); }}
                    onEditPress={photo?.isMine ? () => { setIsMenuVisible(false); router.push({ pathname: '/PhotoSpotWriteScreen', params: { id } }); } : undefined}
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
            <Image source={{ uri: photo?.image_url }} style={styles.mainImage} resizeMode="cover" />
            {!isLargeIconMode && (
              <>
                <TouchableOpacity style={styles.imageSaveButton} onPress={toggleSaved} activeOpacity={0.8}>
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
            <Text style={styles.titleText} onLayout={onTitleLayout}>{photo?.description ?? '로딩 중...'}</Text>

            <MetaRow>
              <Star size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
              <Text style={styles.metaText}> {photo ? pseudoRating(photo).toFixed(1) : '-'}</Text>
              <TextSeparator />
              <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
              <Text style={styles.metaText}> {photo?.likes ?? 0}</Text>
            </MetaRow>

            <TagRow>
              {photoTags.map((tag) => (
                <Text key={tag} style={styles.tagText}>#{tag}</Text>
              ))}
            </TagRow>

            {isLargeIconMode && (
              <View style={styles.actionButtonGroup}>
                <TouchableOpacity style={styles.actionButton} onPress={toggleSaved} activeOpacity={0.7}>
                  {isSaved ? <SaveHeart32 /> : <UnSaveHeart32 />}
                  <Text style={styles.actionButtonText}>{isSaved ? '저장취소' : '저장하기'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => setIsScheduleVisible(true)} activeOpacity={0.7}>
                  <Calendar size={IconSize.xlarge} color={Colors.light.grayDark} strokeWidth={IconStroke.thin} />
                  <Text style={styles.actionButtonText}>일정추가</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: 'photospot', id } })}
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

                <Text style={styles.photoInfoTitle}>기본 정보</Text>
                {photo && (
                  <TouchableOpacity
                    style={styles.uploaderCard}
                    activeOpacity={0.7}
                    onPress={() => router.push({ pathname: '/UserPhotoSpotsScreen', params: { author: photo.author ?? '익명 여행자', authorAvatar: photo.authorAvatar ?? '' } })}
                  >
                    {photo.authorAvatar ? (
                      <Image source={{ uri: photo.authorAvatar }} style={styles.uploaderAvatar} />
                    ) : (
                      <View style={styles.uploaderAvatar} />
                    )}
                    <View style={styles.uploaderInfo}>
                      <Text style={styles.uploaderName}>{photo.author ?? '익명 여행자'}</Text>
                      <View style={styles.uploaderDateRow}>
                        <Text style={styles.uploaderDateText}>{formatDateDots(photo.travel_date)} 여행</Text>
                        <TextSeparator color={Colors.light.grayDark} />
                        <Text style={styles.uploaderDateText}>{formatDateDots(photo.created_at)} 작성</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {photo?.image_url && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.photoInfoImagesScroll}
                    contentContainerStyle={styles.photoInfoImagesContent}
                  >
                    <TouchableOpacity
                      onPress={() => setImagePopup({ images: [photo.image_url], index: 0 })}
                      activeOpacity={0.9}
                    >
                      <View style={[styles.photoInfoImageBox, { width: smallImageWidth, height: smallImageHeight }]}>
                        <Image source={{ uri: photo.image_url }} style={styles.photoInfoImage} resizeMode="cover" />
                      </View>
                    </TouchableOpacity>
                  </ScrollView>
                )}

                <Text style={styles.photoInfoDesc}>{photo?.content ?? ''}</Text>

                <Divider marginTop={Spacing.v.large} />

                <Text style={styles.sectionTitle}>장소</Text>
                <TouchableOpacity
                  style={styles.placeCard}
                  activeOpacity={0.8}
                  disabled={!place}
                  onPress={() => place && router.push({ pathname: '/PlaceDetailScreen', params: { id: place.id, name: place.name } })}
                >
                  <View style={styles.placeImageWrapper}>
                    <Image source={{ uri: place?.image_url }} style={styles.placeImage} resizeMode="cover" />
                  </View>
                  <View style={styles.placeCardContent}>
                    <Text style={styles.placeCardTitle} numberOfLines={1}>{place?.name ?? '로딩 중...'}</Text>
                    <View style={styles.placeInfoRow}>
                      <Text style={styles.placeInfoText}>{place ? (CATEGORY_LABEL[place.category] ?? place.category) : ''}</Text>
                      <TextSeparator />
                      <Text style={styles.placeInfoText} numberOfLines={1}>{place ? shortAddress(place.address) : ''}</Text>
                    </View>
                    {placeTags.length > 0 && (
                      <TagRow>
                        {placeTags.map((tag) => (
                          <Text key={tag} style={styles.tagText}>#{tag}</Text>
                        ))}
                      </TagRow>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            )}

            {showDetailTab(2) && (
              <>
                {isLargeIconMode && <Divider marginTop={Spacing.v.large} />}

                <View style={styles.placePhotoSectionHeader}>
                  <Text style={styles.placePhotoSectionTitle}>장소 포토스팟</Text>
                  <Text style={styles.placePhotoSectionDesc}>이 장소의 또 다른 포토스팟이에요.</Text>
                </View>
              </>
            )}
          </View>

          {/* 장소 포토스팟 */}
          {showDetailTab(2) && (
          <View style={{ marginTop: Spacing.v.medium, marginHorizontal: Spacing.h.medium }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScrollContent}>
              {placePhotos.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={{ width: smallImageWidth }}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/PhotoSpotDetailScreen', params: { id: p.id } })}
                >
                  <View style={[styles.nearbyImageBox, { width: smallImageWidth, height: smallImageHeight }]}>
                    <Image source={{ uri: p.image_url }} style={styles.nearbyImage} resizeMode="cover" />
                    <TouchableOpacity
                      style={styles.nearbyHeart}
                      onPress={(e) => { e.stopPropagation(); setSavedPlacePhotos(prev => ({ ...prev, [p.id]: !prev[p.id] })); }}
                      activeOpacity={0.8}
                    >
                      <Heart
                        size={IconSize.large}
                        color={savedPlacePhotos[p.id] ? Colors.light.heart : Colors.light.white}
                        fill={savedPlacePhotos[p.id] ? Colors.light.heart : 'transparent'}
                        strokeWidth={IconStroke.thin}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.nearbyPlaceName} numberOfLines={1}>{p.description}</Text>
                  <TagRow>
                    {p.tags.map((tag) => (
                      <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                    ))}
                  </TagRow>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          )}

          {showDetailTab(2) && (
          <View style={styles.tagPhotoSectionWrapper}>
            <Text style={styles.placePhotoSectionTitle}>관련 태그 포토스팟</Text>
            <Text style={styles.placePhotoSectionDesc}>태그를 선택하여 자유롭게 볼 수 있어요</Text>

            <View style={styles.tagFilterRow}>
              {photoTags.map((tag) => {
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
          )}

          {/* 관련 태그 포토스팟 */}
          {showDetailTab(2) && (filteredTagPhotos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>해당 태그의 포토스팟이 없습니다.</Text>
              <Text style={styles.emptyDesc}>다른 태그를 확인해보세요.</Text>
            </View>
          ) : (
            <View style={{ marginTop: Spacing.v.medium, marginHorizontal: Spacing.h.medium }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScrollContent}>
                {filteredTagPhotos.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={{ width: smallImageWidth }}
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: '/PhotoSpotDetailScreen', params: { id: p.id } })}
                  >
                    <View style={[styles.nearbyImageBox, { width: smallImageWidth, height: smallImageHeight }]}>
                      <Image source={{ uri: p.image_url }} style={styles.nearbyImage} resizeMode="cover" />
                      <TouchableOpacity
                        style={styles.nearbyHeart}
                        onPress={(e) => { e.stopPropagation(); setSavedTagPhotos(prev => ({ ...prev, [p.id]: !prev[p.id] })); }}
                        activeOpacity={0.8}
                      >
                        <Heart
                          size={IconSize.large}
                          color={savedTagPhotos[p.id] ? Colors.light.heart : Colors.light.white}
                          fill={savedTagPhotos[p.id] ? Colors.light.heart : 'transparent'}
                          strokeWidth={IconStroke.thin}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.nearbyPlaceName} numberOfLines={1}>{p.description}</Text>
                    <TagRow>
                      {p.tags.map((tag) => (
                        <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                      ))}
                    </TagRow>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}

          <View style={styles.reviewSectionWrapper}>
            {showDetailTab(1) && (
              <>
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
                onPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: 'photospot', id } })}
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
                onImagePress={(index) => setImagePopup({ images: review.images, index })}
                onEditPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: 'photospot', id, reviewId: review.id } })}
                onDeletePress={() => setReviewDeleteTarget(review)}
                onReportPress={() => setReviewReportTarget(review)}
              />
            ))}
              </>
            )}
          </View>
        </ScrollView>

        {isDetailTabPinned && (
          <View style={[styles.detailTabPinnedOverlay, { top: headerHeight }]}>
            <View style={styles.detailTabRow}>
              {detailTabBarInner}
            </View>
          </View>
        )}

        <PhotoSpotScheduleAlert
          visible={isScheduleVisible}
          place={place}
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
                {imagePopup && (
                  <>
                    <PagerView
                      style={{ width: imageWidth, height: imageHeight }}
                      initialPage={imagePopup.index}
                      onPageSelected={(e) => {
                        const position = e.nativeEvent.position;
                        setImagePopup((prev) => (prev ? { ...prev, index: position } : prev));
                      }}
                    >
                      {imagePopup.images.map((img) => (
                        <Image key={img} source={{ uri: img }} style={styles.imagePopupImage} resizeMode="cover" />
                      ))}
                    </PagerView>
                    <Text style={styles.imagePopupIndexText}>
                      {imagePopup.index + 1}/{imagePopup.images.length}
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
                      await reviewApi.remove('photospot', target.id);
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
              await reviewApi.report('photospot', reviewReportTarget.id, reason);
            } catch {}
          }}
        />

        <ReportReviewAlert
          visible={isPhotoReportVisible}
          onClose={() => setIsPhotoReportVisible(false)}
          confirmTitle="이 포토스팟을 신고하시겠습니까?"
          onSubmit={async (reason) => {
            if (!id) return;
            try {
              await photoApi.report(Number(id), reason);
            } catch {}
          }}
        />
      </SafeAreaView>
  );
};

export default PhotoSpotDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.white },
  moreButtonWrapper: { position: 'relative' },
  menuBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  scrollContent: { paddingBottom: Spacing.v.screenBottom },
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
  photoInfoTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.large,
  },
  photoInfoDesc: {
    ...Typography.body2,
    color: Colors.light.black,
    marginTop: Spacing.v.medium,
  },
  uploaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
  },
  uploaderAvatar: {
    width: Size.circleMd,
    height: Size.circleMd,
    borderRadius: Size.circleMd / 2,
    backgroundColor: Colors.light.grayLight,
  },
  uploaderInfo: { flex: 1, marginLeft: Spacing.h.medium },
  uploaderName: { ...Typography.subtitle2, color: Colors.light.black },
  uploaderDateRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small },
  uploaderDateText: { ...Typography.body1, color: Colors.light.grayDark },
  photoInfoImagesScroll: { marginTop: Spacing.v.medium },
  photoInfoImagesContent: { gap: Spacing.h.medium },
  photoInfoImageBox: {
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  photoInfoImage: { width: '100%', height: '100%' },
  sectionTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: Spacing.v.large,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.v.large,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
    backgroundColor: Colors.light.white,
  },
  placeImageWrapper: { width: Size.circleMd, height: Size.circleMd, borderRadius: Size.circleMd / 2, overflow: 'hidden', flexShrink: 0 },
  placeImage: { width: '100%', height: '100%' },
  placeCardContent: { flex: 1, marginLeft: Spacing.h.medium },
  placeCardTitle: { ...Typography.title1, color: Colors.light.black },
  placeInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small },
  placeInfoText: { ...Typography.subtitle1, color: Colors.light.grayDark, flexShrink: 1 },
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
