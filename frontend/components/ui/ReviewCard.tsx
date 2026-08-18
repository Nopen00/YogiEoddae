import { TextSeparator } from '@/components/ui/TextSeparator';
import { Colors } from '@/constants/Colors';
import { IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Star, ThumbsUp } from 'lucide-react-native';
import React, { ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 카드 너비 기준 대략 4줄을 넘는 글자 수 (플랫폼 간 onTextLayout 신뢰도 문제로 근사치 사용)
const REVIEW_TRUNCATE_LENGTH = 80;

export interface ReviewCardData {
  id: number;
  author: string;
  authorAvatar?: string | null;
  travelDate: string;
  writtenDate: string;
  rating: number;
  content: string;
  images: string[];
  likeCount: number;
  isMine?: boolean;
}

// 좋아요 여부가 서버에 저장되기 전에는 review.likeCount가 내 좋아요를 반영하지 못해서
// 로컬에서 +1을 더해 보여주는 임시방편이었지만, 이제 likeCount 자체가 서버 값이라 그대로 씀
export const getReviewLikeCount = (review: ReviewCardData) => review.likeCount;

interface ReviewCardProps {
  review: ReviewCardData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
  onImagePress: (index: number) => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  onReportPress?: () => void;
  likeDisabled?: boolean;
  hideAuthor?: boolean;
  sectionCard?: ReactNode;
}

export const ReviewCard = ({
  review,
  isExpanded,
  onToggleExpand,
  isLiked,
  onToggleLike,
  onImagePress,
  onEditPress,
  onDeletePress,
  onReportPress,
  likeDisabled,
  hideAuthor,
  sectionCard,
}: ReviewCardProps) => {
  const isTruncated = review.content.length > REVIEW_TRUNCATE_LENGTH;
  const likeCount = getReviewLikeCount(review);

  return (
    <View style={styles.card}>
      {hideAuthor ? (
        sectionCard
      ) : (
        <View style={styles.header}>
          {review.authorAvatar ? (
            <Image source={{ uri: review.authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{review.author}</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{review.travelDate} 여행</Text>
              <TextSeparator color={Colors.light.grayDark} />
              <Text style={styles.dateText}>{review.writtenDate} 작성</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => {
          const isFull = n <= review.rating;
          const isHalf = !isFull && n - 0.5 <= review.rating;
          return (
            <View key={n} style={{ width: 20, height: 20 }}>
              <Star size={20} color={Colors.light.grayDark} fill="none" strokeWidth={IconStroke.regular} style={{ position: 'absolute' }} />
              {(isFull || isHalf) && (
                <View style={{ position: 'absolute', width: isFull ? 20 : 10, height: 20, overflow: 'hidden' }}>
                  <Star size={20} color={Colors.light.star} fill={Colors.light.star} strokeWidth={IconStroke.regular} />
                </View>
              )}
            </View>
          );
        })}
      </View>

      <Text style={styles.contentText} numberOfLines={isExpanded ? undefined : 4}>
        {review.content}
      </Text>

      {isTruncated && (
        <TouchableOpacity onPress={onToggleExpand} activeOpacity={0.7}>
          <Text style={styles.moreText}>{isExpanded ? '간략히' : '더보기'}</Text>
        </TouchableOpacity>
      )}

      {review.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imagesScroll}
          contentContainerStyle={styles.imagesContent}
        >
          {review.images.map((img, idx) => (
            <TouchableOpacity key={img} onPress={() => onImagePress(idx)} activeOpacity={0.9}>
              <Image source={{ uri: img }} style={styles.imageThumb} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.bottomRow}>
        <View style={styles.likeRow}>
          {likeDisabled ? (
            <ThumbsUp
              size={16}
              color={isLiked ? Colors.light.dark : Colors.light.grayDark}
              fill={isLiked ? Colors.light.primary : 'none'}
              strokeWidth={IconStroke.regular}
            />
          ) : (
            <TouchableOpacity onPress={onToggleLike} activeOpacity={0.7}>
              <ThumbsUp
                size={16}
                color={isLiked ? Colors.light.dark : Colors.light.grayDark}
                fill={isLiked ? Colors.light.primary : 'none'}
                strokeWidth={IconStroke.regular}
              />
            </TouchableOpacity>
          )}
          <Text style={styles.likeCount}>{likeCount}</Text>
        </View>

        {review.isMine ? (
          <View style={styles.myActionsRow}>
            <TouchableOpacity onPress={onEditPress} activeOpacity={0.7}>
              <Text style={styles.myActionText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDeletePress} activeOpacity={0.7}>
              <Text style={styles.myActionText}>삭제</Text>
            </TouchableOpacity>
          </View>
        ) : (
          onReportPress && (
            <View style={styles.myActionsRow}>
              <TouchableOpacity onPress={onReportPress} activeOpacity={0.7}>
                <Text style={styles.myActionText}>신고</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.white,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.grayLight,
  },
  authorInfo: { flex: 1, marginLeft: Spacing.h.medium },
  authorName: { ...Typography.subtitle2, color: Colors.light.black },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small },
  dateText: { ...Typography.body1, color: Colors.light.grayDark },
  ratingRow: { flexDirection: 'row', gap: 4, marginTop: Spacing.v.small },
  contentText: { ...Typography.body2, color: Colors.light.black, marginTop: Spacing.v.small },
  moreText: { ...Typography.button4, color: Colors.light.dark, marginTop: Spacing.v.small },
  imagesScroll: { marginTop: Spacing.v.small },
  imagesContent: { gap: Spacing.h.medium },
  imageThumb: {
    width: Size.reviewThumbW,
    height: Size.reviewThumbH,
    borderRadius: Spacing.r.small,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.h.xsmall,
  },
  likeCount: { ...Typography.body2, color: Colors.light.grayDark },
  myActionsRow: {
    flexDirection: 'row',
    gap: Spacing.h.medium,
  },
  myActionText: { ...Typography.button4, color: Colors.light.grayLight },
});
