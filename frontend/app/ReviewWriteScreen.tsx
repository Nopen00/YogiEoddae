import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { VisitDate, VisitDateAlert } from '@/components/modals/VisitDateAlert';
import { reviewApi } from '../services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, ChevronRight, Plus, Star, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';

// TODO: 목데이터. 실제 데이터 연동 시 리뷰 작성 대상(명소/코스/포토스팟) 정보로 교체
const MOCK_REVIEW_TARGET = {
  title: '광화문 광장',
  detail: '관광지 | 서울 종로구',
  tags: ['로맨스', '드라마', '야경'],
};

const REVIEW_TEXT_PLACEHOLDER =
  '- 솔직한 소감을 남겨주세요.\n- 여러 팁들을 적을 수 있어요.\n- 사진을 최대 10장 첨부할 수 있어요. (선택)';

const formatVisitDateValue = (date: VisitDate) =>
  `${date.year}.${String(date.month + 1).padStart(2, '0')}.${String(date.day).padStart(2, '0')}`;

const formatVisitDate = (date: VisitDate) => `${formatVisitDateValue(date)} 방문`;

const visitDateKey = (date: VisitDate | null) => (date ? formatVisitDateValue(date) : '');

const parseVisitDate = (value: string): VisitDate | null => {
  const [year, month, day] = value.split('.').map(Number);
  if (!year || !month || !day) return null;
  return { year, month: month - 1, day };
};

const MAX_REVIEW_IMAGES = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STAR_COUNT = 5;
const STAR_SIZE = IconSize.xlarge;
const STAR_GAP = Spacing.v.small;
const STAR_ROW_WIDTH = STAR_SIZE * STAR_COUNT + STAR_GAP * (STAR_COUNT - 1);

const ReviewWriteScreen = () => {
  const router = useRouter();
  const { reviewId } = useLocalSearchParams<{ type?: string; id?: string; reviewId?: string }>();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [visitDate, setVisitDate] = useState<VisitDate | null>(null);
  const [isDateVisible, setIsDateVisible] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isUnsavedWarningVisible, setIsUnsavedWarningVisible] = useState(false);
  const initialSnapshotRef = useRef({ rating: 0, reviewText: '', visitDate: null as VisitDate | null, reviewImages: [] as string[] });

  useEffect(() => {
    if (!reviewId) return;
    reviewApi.getDetail(Number(reviewId)).then((res) => {
      const review = res.data;
      if (!review) return;
      setRating(review.rating);
      setReviewText(review.content);
      setReviewImages(review.images);
      let parsedDate: VisitDate | null = null;
      if (review.travelDate) {
        parsedDate = parseVisitDate(review.travelDate);
        if (parsedDate) setVisitDate(parsedDate);
      }
      initialSnapshotRef.current = { rating: review.rating, reviewText: review.content, visitDate: parsedDate, reviewImages: review.images };
    }).catch(() => {});
  }, [reviewId]);

  const hasUnsavedChanges = () => {
    const snap = initialSnapshotRef.current;
    if (rating !== snap.rating) return true;
    if (reviewText !== snap.reviewText) return true;
    if (visitDateKey(visitDate) !== visitDateKey(snap.visitDate)) return true;
    if (reviewImages.length !== snap.reviewImages.length) return true;
    if (reviewImages.some((uri, i) => uri !== snap.reviewImages[i])) return true;
    return false;
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) setIsUnsavedWarningVisible(true);
    else router.back();
  };

  const handlePickImage = async () => {
    const remaining = MAX_REVIEW_IMAGES - reviewImages.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled) {
      setReviewImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_REVIEW_IMAGES));
    }
  };

  const removeReviewImage = (uri: string) => {
    setReviewImages((prev) => prev.filter((u) => u !== uri));
  };

  const updateRatingFromX = (x: number) => {
    const cell = STAR_SIZE + STAR_GAP;
    const index = Math.floor(x / cell);
    setRating(Math.min(STAR_COUNT, Math.max(1, index + 1)));
  };

  const ratingGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onStart((e) => { runOnJS(updateRatingFromX)(e.x); })
        .onUpdate((e) => { runOnJS(updateRatingFromX)(e.x); }),
    []
  );

  const isSubmitEnabled = rating > 0 && visitDate !== null;

  const handleSubmit = async () => {
    if (!isSubmitEnabled) return;
    try {
      const payload = {
        rating,
        content: reviewText,
        images: reviewImages,
        visitDate: visitDate ? formatVisitDateValue(visitDate) : undefined,
      };
      if (reviewId) await reviewApi.update(Number(reviewId), payload);
      else await reviewApi.create(payload);
      router.back();
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={handleBack} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.titleText}>{MOCK_REVIEW_TARGET.title}</Text>
        <Text style={styles.detailText}>{MOCK_REVIEW_TARGET.detail}</Text>
        <TagRow>
          {MOCK_REVIEW_TARGET.tags.map((tag) => (
            <Text key={tag} style={styles.tagText}>#{tag}</Text>
          ))}
        </TagRow>

        <Divider />

        <Text style={styles.ratingTitle}>별점</Text>
        <GestureDetector gesture={ratingGesture}>
          <View style={styles.starRow}>
            {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((n) => (
              <Star
                key={n}
                size={STAR_SIZE}
                color={n <= rating ? Colors.light.star : Colors.light.grayDark}
                fill={n <= rating ? Colors.light.star : 'none'}
                strokeWidth={IconStroke.regular}
              />
            ))}
          </View>
        </GestureDetector>

        <View style={styles.reviewBoxWrapper}>
          <Shadow distance={4} startColor="rgba(0, 0, 0, 0.15)" offset={[0, 0]} stretch>
            <View style={styles.reviewBox}>
              <TouchableOpacity style={styles.dateRow} onPress={() => setIsDateVisible(true)} activeOpacity={0.7}>
                <Calendar size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                <Text style={styles.dateText}>
                  {visitDate ? formatVisitDate(visitDate) : '방문한 날짜를 선택해주세요.'}
                </Text>
                <ChevronRight size={16} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
              </TouchableOpacity>

              <TextInput
                style={styles.reviewInput}
                value={reviewText}
                onChangeText={setReviewText}
                placeholder={REVIEW_TEXT_PLACEHOLDER}
                placeholderTextColor={Colors.light.grayDark}
                multiline
                textAlignVertical="top"
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                {reviewImages.length < MAX_REVIEW_IMAGES && (
                  <TouchableOpacity style={styles.imageAddButton} onPress={handlePickImage} activeOpacity={0.7}>
                    <Plus size={32} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  </TouchableOpacity>
                )}
                {reviewImages.map((uri, index) => (
                  <View
                    key={uri}
                    style={[styles.imageThumbWrapper, index === 0 && { marginLeft: Spacing.h.small }]}
                  >
                    <Image source={{ uri }} style={styles.imageThumb} />
                    <TouchableOpacity
                      style={styles.imageRemoveButton}
                      onPress={() => removeReviewImage(uri)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={24} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Shadow>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !isSubmitEnabled && styles.submitButtonDisabled]}
          activeOpacity={isSubmitEnabled ? 0.8 : 1}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>작성 완료</Text>
        </TouchableOpacity>
      </ScrollView>

      <VisitDateAlert
        visible={isDateVisible}
        onClose={() => setIsDateVisible(false)}
        onConfirm={(date) => { setVisitDate(date); setIsDateVisible(false); }}
        initialDate={visitDate}
      />

      <Modal visible={isUnsavedWarningVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.unsavedPopup}>
            <Text style={styles.unsavedTitle}>리뷰가 아직 저장되지 않았습니다.</Text>
            <Text style={styles.unsavedDesc}>저장되지 않은 변동사항은 반영되지 않습니다.</Text>
            <View style={styles.unsavedButtons}>
              <TouchableOpacity
                style={styles.btnDiscard}
                activeOpacity={0.8}
                onPress={() => {
                  setIsUnsavedWarningVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.btnDiscardText}>무시</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnStay}
                activeOpacity={0.8}
                onPress={() => setIsUnsavedWarningVisible(false)}
              >
                <Text style={styles.btnStayText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ReviewWriteScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.white },
  content: { paddingHorizontal: Spacing.h.medium, marginTop: Spacing.v.medium, paddingBottom: Spacing.v.screenBottom },
  titleText: { ...Typography.title1, color: Colors.light.black },
  detailText: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  tagText: { ...Typography.body2, color: Colors.light.primary },
  ratingTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    textAlign: 'center',
    marginTop: Spacing.v.medium,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: STAR_GAP,
    marginTop: Spacing.v.medium,
    width: STAR_ROW_WIDTH,
    alignSelf: 'center',
  },
  reviewBoxWrapper: { marginTop: Spacing.v.large },
  reviewBox: {
    borderRadius: Spacing.r.small,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
    backgroundColor: Colors.light.white,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.h.small,
  },
  dateText: { ...Typography.subtitle2, color: Colors.light.grayDark },
  reviewInput: {
    marginTop: Spacing.v.medium,
    ...Typography.body2,
    color: Colors.light.black,
  },
  imageRow: { marginTop: Spacing.v.medium, gap: Spacing.h.small },
  imageAddButton: {
    width: Size.reviewUpload,
    height: Size.reviewUpload,
    backgroundColor: Colors.light.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageThumbWrapper: { width: Size.reviewUpload, height: Size.reviewUpload },
  imageThumb: { width: Size.reviewUpload, height: Size.reviewUpload },
  imageRemoveButton: { position: 'absolute', top: 0, right: 0 },
  submitButton: {
    marginTop: Spacing.v.large,
    borderRadius: Spacing.r.small,
    paddingVertical: Spacing.v.medium,
    backgroundColor: Colors.light.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { backgroundColor: Colors.light.grayLight },
  submitButtonText: { ...Typography.button2, color: Colors.light.white },
  overlay: { flex: 1, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  unsavedPopup: {
    width: SCREEN_WIDTH - 64,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingBottom: Spacing.v.medium,
    ...Shadows.card,
  },
  unsavedTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  unsavedDesc: { ...Typography.body2, color: Colors.light.primary, marginTop: Spacing.v.medium, textAlign: 'center' },
  unsavedButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnDiscard: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnDiscardText: { ...Typography.button2, color: Colors.light.grayDark },
  btnStay: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnStayText: { ...Typography.button2, color: Colors.light.white },
});
