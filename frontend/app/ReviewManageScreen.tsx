import { getReviewLikeCount, ReviewCard } from '@/components/ui/ReviewCard';
import { MediaMetaText } from '@/components/ui/MediaMetaText';
import PagerView, { PagerViewHandle } from '@/components/ui/PagerViewWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { Colors } from '@/constants/Colors';
import { CATEGORY_LABEL, shortAddress } from '@/constants/labels';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { reviewApi } from '@/services/api';
import type { Review, ReviewTargetType } from '@/services/types';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TABS = ['코스', '명소', '포토스팟'];
const { width } = Dimensions.get('window');
const TAB_WIDTH = width / TABS.length;
const REVIEW_TARGET_TYPES = ['course', 'place', 'photospot'] as const;

const ReviewManageScreen = () => {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef<PagerViewHandle>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [imagePopup, setImagePopup] = useState<{ reviewId: number; index: number } | null>(null);
  const [reviewDeleteTarget, setReviewDeleteTarget] = useState<Review | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all(REVIEW_TARGET_TYPES.map(type => reviewApi.getMine(type)))
        .then(results => setReviews(results.flatMap(res => res.data)))
        .catch(() => {});
    }, [])
  );

  const popupReview = imagePopup ? reviews.find((r) => r.id === imagePopup.reviewId) : null;

  const animateIndicatorTo = (index: number) => {
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const index = e.nativeEvent.position;
    setSelectedIndex(index);
    animateIndicatorTo(index);
  };

  const TARGET_SCREEN: Record<ReviewTargetType, string> = {
    course: '/CourseDetailScreen',
    place: '/PlaceDetailScreen',
    photospot: '/PhotoSpotDetailScreen',
  };

  const renderTargetCard = (review: Review) => {
    const target = review.target;
    if (!target) return null;
    return (
      <TouchableOpacity
        style={styles.sectionCard}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: TARGET_SCREEN[target.type] as any, params: { id: target.id } })}
      >
        <View style={styles.sectionImageWrapper}>
          <Image source={{ uri: target.imageUrl }} style={styles.sectionImage} />
        </View>
        <View style={styles.sectionContent}>
          <Text style={styles.sectionTitle} numberOfLines={1}>{target.title}</Text>
          {target.type === 'place' ? (
            <View style={styles.sectionInfoRow}>
              <Text style={styles.sectionInfoText}>{CATEGORY_LABEL[target.category ?? ''] ?? target.category}</Text>
              <TextSeparator />
              <Text style={styles.sectionInfoText}>{shortAddress(target.subtitle ?? '')}</Text>
            </View>
          ) : target.subtitle ? (
            <View style={styles.sectionInfoRow}>
              <Text style={styles.sectionInfoText}>{target.subtitle}</Text>
            </View>
          ) : null}
          {target.tags.length > 0 && (
            <TagRow>
              {target.tags.map(tag => (
                <Text key={tag.id} style={styles.sectionTag}>#{tag.name}</Text>
              ))}
            </TagRow>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderReviewList = (tabIndex: number) => {
    const tabReviews = reviews.filter((r) => r.target?.type === REVIEW_TARGET_TYPES[tabIndex]);
    return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {tabReviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>작성한 리뷰가 없습니다.</Text>
          <Text style={styles.emptySubtitle}>리뷰를 작성해보세요.</Text>
        </View>
      ) : (
        tabReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isExpanded={expandedReviews[review.id] ?? false}
            onToggleExpand={() => setExpandedReviews((prev) => ({ ...prev, [review.id]: !prev[review.id] }))}
            isLiked={false}
            onToggleLike={() => {}}
            likeDisabled
            hideAuthor
            sectionCard={renderTargetCard(review)}
            onImagePress={(index) => setImagePopup({ reviewId: review.id, index })}
            onEditPress={() => router.push({ pathname: '/ReviewWriteScreen', params: { type: REVIEW_TARGET_TYPES[tabIndex], reviewId: review.id } })}
            onDeletePress={() => setReviewDeleteTarget(review)}
          />
        ))
      )}
    </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack={() => router.back()} title="리뷰 관리" />

      <View style={styles.tabContainer}>
        <View style={styles.backgroundLine} />
        {TABS.map((tab, index) => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => handleTabPress(index)} activeOpacity={0.7}>
            <Text style={[styles.tabText, { color: selectedIndex === index ? Colors.light.black : Colors.light.grayLight }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
        <Animated.View style={[styles.indicator, { width: TAB_WIDTH, transform: [{ translateX }] }]} />
      </View>

      <PagerView ref={pagerRef} style={styles.mainContent} initialPage={0} onPageSelected={handlePageSelected}>
        <View key="0" style={{ flex: 1 }}>{renderReviewList(0)}</View>
        <View key="1" style={{ flex: 1 }}>{renderReviewList(1)}</View>
        <View key="2" style={{ flex: 1 }}>{renderReviewList(2)}</View>
      </PagerView>

      <Modal visible={!!imagePopup} transparent animationType="fade" onRequestClose={() => setImagePopup(null)}>
        <TouchableOpacity style={styles.imagePopupOverlay} activeOpacity={1} onPress={() => setImagePopup(null)}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.imagePopupContainer}>
              {popupReview && imagePopup && (
                <>
                  <PagerView
                    style={{ width: width - Spacing.h.xlarge * 2, height: width - Spacing.h.xlarge * 2 }}
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
                  if (!target.target) return;
                  try {
                    await reviewApi.remove(target.target.type, target.id);
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
  tabContainer: { flexDirection: 'row', position: 'relative' },
  backgroundLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Spacing.lw.small, backgroundColor: Colors.light.grayLight },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.v.small },
  tabText: { ...Typography.subtitle1 },
  indicator: { position: 'absolute', bottom: 0, left: 0, height: Spacing.lw.small, backgroundColor: Colors.light.black, zIndex: 1 },
  mainContent: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.h.medium, paddingBottom: Spacing.v.screenBottom },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
  },
  sectionImageWrapper: { width: Size.circleMd, height: Size.circleMd, borderRadius: Size.circleMd / 2, overflow: 'hidden', flexShrink: 0 },
  sectionImage: { width: '100%', height: '100%' },
  sectionContent: { flex: 1, marginLeft: Spacing.h.medium },
  sectionTitle: { ...Typography.title1, color: Colors.light.black },
  sectionInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small },
  sectionInfoText: { ...Typography.subtitle1, color: Colors.light.grayDark },
  sectionTag: { ...Typography.body2, color: Colors.light.primary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.v.medium, marginTop: Spacing.v.xlarge },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  emptySubtitle: { ...Typography.body2, color: Colors.light.grayLight },
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

export default ReviewManageScreen;
