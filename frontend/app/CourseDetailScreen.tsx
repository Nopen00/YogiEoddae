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
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CourseDetailScreen = () => {
  const { id, title, locationCount, mediaType, rating, likes, tags: tagsParam } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // 이미지 박스 계산 (좌우 16pt 간격)
  const imageWidth = width - Spacing.h.medium * 2;
  const imageHeight = (imageWidth * 3) / 4;

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isScheduleVisible, setIsScheduleVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // 저장하기 상태

  const closeMenu = () => {
    if (isMenuVisible) setIsMenuVisible(false);
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
  };

  const handleSchedulePress = () => {
    setIsMenuVisible(false);
    setIsScheduleVisible(true);
  };

  // 좋아요 수 포맷 함수
  const formatLikes = (num: number) => {
    if (num >= 1000) return `${Math.floor(num / 100) * 100}+`;
    return num.toString();
  };

  // 목업 데이터
  const displayTags = Array.isArray(tagsParam) ? tagsParam : ['태그1', '태그2', '태그3', '태그4'];
  const displayLocationCount = locationCount ?? 5;
  const displayMediaType = mediaType ?? '영화';
  const displayRating = Number(rating ?? 4.5).toFixed(1);
  const displayLikes = Number(likes ?? 1298);

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 헤더 영역 */}
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.flexFill} />
          <View style={styles.moreButtonWrapper}>
            <MoreButton onPress={() => setIsMenuVisible(!isMenuVisible)} />
            {isMenuVisible && <MoreMenuAlert onSchedulePress={handleSchedulePress} />}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 이미지 박스 */}
          <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
            <Image source={{ uri: 'https://via.placeholder.com/400x300' }} style={styles.mainImage} resizeMode="cover" />
          </View>

          {/* 정보 섹션 */}
          <View style={styles.infoContainer}>
            <Text style={styles.titleText}>{title ?? '코스 제목'}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{displayLocationCount}개 장소</Text>
              <Text style={styles.separator}>|</Text>
              <Text style={styles.metaText}>{displayMediaType}</Text>
              <Text style={styles.separator}>|</Text>
              <View style={styles.iconTextRow}>
                <Star size={14} color={Colors.light.grayDark} strokeWidth={2} />
                <Text style={[styles.metaText, { marginLeft: 2 }]}>{displayRating}</Text>
              </View>
              <Text style={styles.separator}>|</Text>
              <View style={styles.iconTextRow}>
                <Heart size={14} color={Colors.light.grayDark} strokeWidth={2} />
                <Text style={[styles.metaText, { marginLeft: 2 }]}>{formatLikes(displayLikes)}</Text>
              </View>
            </View>

            <View style={styles.tagRow}>
              {displayTags.map((tag, index) => (
                <Text key={index} style={styles.tagText}>#{tag}</Text>
              ))}
            </View>

            {/* 버튼 그룹 섹션 (태그 16pt 아래, 좌우 32pt 여백) */}
            <View style={styles.actionButtonGroup}>
              {/* 1. 저장하기/저장취소 */}
              <TouchableOpacity style={styles.actionButton} onPress={handleSaveToggle} activeOpacity={0.7}>
                {isSaved ? (
                  <SaveHeart32 />
                ) : (
                  <UnSaveHeart32/>
                )}
                <Text style={styles.actionButtonText}>{isSaved ? '저장취소' : '저장하기'}</Text>
              </TouchableOpacity>

              {/* 2. 일정추가 */}
              <TouchableOpacity style={styles.actionButton} onPress={handleSchedulePress} activeOpacity={0.7}>
                <Calendar size={32} color={Colors.light.grayDark} strokeWidth={1.5} />
                <Text style={styles.actionButtonText}>일정추가</Text>
              </TouchableOpacity>

              {/* 3. 리뷰쓰기 */}
              <TouchableOpacity style={styles.actionButton} onPress={() => {}} activeOpacity={0.7}>
                <Star size={32} color={Colors.light.grayDark} strokeWidth={1.5} />
                <Text style={styles.actionButtonText}>리뷰쓰기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <ScheduleAlert
          visible={isScheduleVisible}
          onClose={() => setIsScheduleVisible(false)}
          title={String(title ?? '코스 제목')}
          period="2025.01.01 ~ 2025.03.01"
          tags={displayTags}
          inputText={displayTags[0]}
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
    ...Typography.button4, // 버튼2번폰트
    color: Colors.light.grayDark,
    marginTop: 8, // 아이콘 8pt 아래
  },
});

export default CourseDetailScreen;