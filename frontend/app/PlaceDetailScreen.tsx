import { BackButton } from '@/components/make_component/BackButton';
import { MoreButton } from '@/components/make_component/MoreButton';
import { MoreMenuAlert } from '@/components/make_component/MoreMenuAlert';
import { ScheduleAlert } from '@/components/make_component/ScheduleAlert';
import { SaveHeart32 } from '@/components/make_component/icons/SaveHeart';
import { UnSaveHeart32 } from '@/components/make_component/icons/UnSaveHeart';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Heart, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';

const PlaceDetailScreen = () => {
  const { name, rating, category, address, tags: tagsParam } = useLocalSearchParams();
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
  const [isToggled, setIsToggled] = useState(false);

  const toggleNearby = (index: number) => {
    setSavedNearby(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const closeMenu = () => {
    if (isMenuVisible) setIsMenuVisible(false);
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
  };

  const formatLikes = (num: number) => {
    if (num < 1000) return num.toString();
    const rounded = Math.floor(num / 100) * 100;
    return `${rounded.toLocaleString('en-US')}+`;
  };

  const displayName = String(name ?? '장소 이름');
  const displayRating = Number(rating ?? 4.5).toFixed(1);
  const displayCategory = String(category ?? '관광명소');
  const displayAddress = String(address ?? '서울시 도봉구');
  const displayTags = Array.isArray(tagsParam) ? tagsParam : ['태그1', '태그2', '태그3'];
  const mockLikes = 324;
  const mockReviews = [
    { nickname: '여행러닉네임', date: '2025.03.15', rating: 4.3, content: '정말 아름다운 곳이에요. 봄철 벚꽃이 피는 시기에 방문하면 더욱 좋습니다.' },
    { nickname: '서울탐험가', date: '2025.01.08', rating: 4.7, content: '역사적인 느낌이 물씬 나는 공간입니다. 가이드 투어를 신청하면 더 재밌게 관람할 수 있어요!' },
    { nickname: '주말여행러', date: '2024.11.22', rating: 3.9, content: '사람이 많아서 조금 복잡했지만 그래도 볼거리가 많아서 좋았습니다.' },
    { nickname: '힐링여행자', date: '2024.09.10', rating: 4.5, content: '조용하고 아름다운 곳입니다. 이른 아침에 방문하면 한적하게 즐길 수 있어요.' },
  ];
  const mockNearbyPlaces = [
    { name: '경복궁', category: '관광명소', address: '서울시 종로구' },
    { name: '북촌 한옥마을', category: '관광명소', address: '서울시 종로구' },
    { name: '광장시장', category: '시장/쇼핑', address: '서울시 종로구' },
    { name: '인사동', category: '문화거리', address: '서울시 종로구' },
  ];

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 헤더 */}
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.flexFill} />
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
          <View style={[styles.moreButtonWrapper, { marginLeft: 16 }]}>
            <MoreButton onPress={() => setIsMenuVisible(!isMenuVisible)} />
            {isMenuVisible && (
              <MoreMenuAlert
                isSaved={isSaved}
                onSavePress={handleSaveToggle}
                onSchedulePress={() => {
                  setIsMenuVisible(false);
                  setIsScheduleVisible(true);
                }}
              />
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* 대표 이미지 */}
          <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
            <Image
              source={{ uri: 'https://via.placeholder.com/400x300' }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          </View>

          {/* 정보 섹션 */}
          <View style={styles.infoContainer}>
            {/* 장소명 */}
            <Text style={styles.titleText}>{displayName}</Text>

            {/* 카테고리 | 평점 | 좋아요 */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{displayCategory}</Text>
              <Text style={styles.separator}>|</Text>
              <View style={styles.iconTextRow}>
                <Star size={16} color={Colors.light.grayDark} strokeWidth={2} />
                <Text style={[styles.metaText, { marginLeft: 2 }]}>{displayRating}</Text>
              </View>
              <Text style={styles.separator}>|</Text>
              <View style={styles.iconTextRow}>
                <Heart size={16} color={Colors.light.grayDark} strokeWidth={2} />
                <Text style={[styles.metaText, { marginLeft: 2 }]}>{formatLikes(mockLikes)}</Text>
              </View>
            </View>

            {/* 태그 */}
            <View style={styles.tagRow}>
              {displayTags.map((tag, index) => (
                <Text key={index} style={styles.tagText}>#{tag}</Text>
              ))}
            </View>

            {/* 액션 버튼 그룹 */}
            <View style={styles.actionButtonGroup}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSaveToggle} activeOpacity={0.7}>
                {isSaved ? <SaveHeart32 /> : <UnSaveHeart32 />}
                <Text style={styles.actionButtonText}>{isSaved ? '저장취소' : '저장하기'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={() => setIsScheduleVisible(true)} activeOpacity={0.7}>
                <Calendar size={32} color={Colors.light.grayDark} strokeWidth={1.5} />
                <Text style={styles.actionButtonText}>일정추가</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={() => {}} activeOpacity={0.7}>
                <Star size={32} color={Colors.light.grayDark} strokeWidth={1.5} />
                <Text style={styles.actionButtonText}>리뷰쓰기</Text>
              </TouchableOpacity>
            </View>

            {/* 구분선 */}
            <View style={styles.divider} />

            {/* 기본 정보 */}
            <Text style={styles.basicInfoTitle}>기본 정보</Text>

            {/* 지도 */}
            <View style={[styles.mapContainer, { height: imageHeight }]} />

            {/* 정보 그룹 */}
            <View style={{ marginTop: 16 }}>
            <Shadow distance={4} startColor="rgba(0, 0, 0, 0.15)" offset={[0, 0]} stretch>
            <View style={styles.infoGroup}>
              <View style={styles.infoGroupRow}>
                <Text style={styles.infoLabel}>주소</Text>
                <Text style={styles.infoValue}>{displayAddress}</Text>
              </View>
              <View style={[styles.infoGroupRow, { marginTop: 16 }]}>
                <Text style={styles.infoLabel}>영업시간</Text>
                <Text style={styles.infoValue}>-</Text>
              </View>
              <View style={[styles.infoGroupRow, { marginTop: 16 }]}>
                <Text style={styles.infoLabel}>전화</Text>
                <Text style={styles.infoValue}>-</Text>
              </View>
              <View style={[styles.infoGroupRow, { marginTop: 16 }]}>
                <Text style={styles.infoLabel}>홈페이지</Text>
                <Text style={styles.infoValue}>-</Text>
              </View>
            </View>
            </Shadow>
            </View>

            {/* 구분선 */}
            <View style={styles.dividerBottom} />

            {/* 장소 소개 / 이용자 리뷰 */}
            <Text style={styles.placeTitle}>{isToggled ? '이용자 리뷰' : displayName}</Text>
            {isToggled ? (
              <View style={{ marginTop: 16, gap: 16 }}>
                {mockReviews.slice(0, 3).map((review, i) => (
                  <Shadow key={i} distance={4} startColor="rgba(0, 0, 0, 0.15)" offset={[0, 0]} stretch>
                    <View style={styles.reviewCard}>
                      <View style={styles.reviewImageBox} />
                      <View style={styles.reviewContent}>
                        <Text style={styles.reviewNickname}>{review.nickname}</Text>
                        <View style={[styles.reviewMetaRow, { marginTop: 4 }]}>
                          <Text style={styles.reviewSep}>|</Text>
                          <Text style={[styles.reviewMetaText, { marginLeft: 4 }]}>{review.date}</Text>
                          <Text style={[styles.reviewSep, { marginLeft: 4 }]}>|</Text>
                          <Star size={14} strokeWidth={1} color={Colors.light.grayDark} style={{ marginLeft: 4 }} />
                          <Text style={[styles.reviewMetaText, { marginLeft: 2 }]}>{review.rating.toFixed(1)}</Text>
                        </View>
                        <Text style={[styles.reviewText, { marginTop: 8 }]} numberOfLines={2} ellipsizeMode="tail">{review.content}</Text>
                      </View>
                    </View>
                  </Shadow>
                ))}
                {mockReviews.length > 3 && (
                  <TouchableOpacity style={styles.reviewMoreButton} onPress={() => {}}>
                    <Text style={styles.reviewMoreText}>더보기</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.placeDesc}>이 장소에 대한 상세 설명이 여기에 들어갑니다.</Text>
            )}

            {/* 구분선 */}
            <View style={styles.dividerBottom} />

            {/* 근처 추천 장소 타이틀 */}
            <Text style={styles.nearbyTitle}>근처 추천 장소</Text>
          </View>

          {/* 근처 추천 장소 가로 스크롤 */}
          <View style={{ marginTop: 16, marginHorizontal: Spacing.h.medium }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearbyScrollContent}
          >
            {mockNearbyPlaces.map((place, i) => (
              <TouchableOpacity
                key={i}
                style={{ width: smallImageWidth }}
                activeOpacity={0.9}
                onPress={() => router.push({
                  pathname: '/PlaceDetailScreen',
                  params: { name: place.name, category: place.category, address: place.address },
                })}
              >
                <View style={[styles.nearbyImageBox, { height: smallImageHeight }]}>
                  <Image source={{ uri: 'https://via.placeholder.com/200x150' }} style={styles.nearbyImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.nearbyHeart} onPress={(e) => { e.stopPropagation(); toggleNearby(i); }} activeOpacity={0.8}>
                    <Heart
                      size={24}
                      color={savedNearby[i] ? Colors.light.heart : Colors.light.white}
                      fill={savedNearby[i] ? Colors.light.heart : 'transparent'}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.nearbyPlaceName} numberOfLines={1}>{place.name}</Text>
                <Text style={styles.nearbyCategory}>{place.category}</Text>
                <Text style={styles.nearbyAddress}>{place.address}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          </View>
        </ScrollView>

        <ScheduleAlert
          visible={isScheduleVisible}
          onClose={() => setIsScheduleVisible(false)}
          title="서울 봄 여행"
          period="2026.04.03 ~ 2026.04.05"
          tags={['서울', '봄여행', '나들이']}
          inputText=""
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
    marginLeft: 8,
  },
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
  actionButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  actionButton: { alignItems: 'center', width: 64 },
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
  dividerBottom: {
    marginTop: 32,
    height: 1,
    backgroundColor: Colors.light.grayLight,
  },
  basicInfoTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 16,
  },
  mapContainer: {
    marginTop: 16,
    width: '100%',
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
  },
  infoGroup: {
    borderRadius: Spacing.r.small,
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    marginLeft: 16,
    flex: 1,
  },
  placeTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 32,
  },
  placeDesc: {
    ...Typography.body2,
    color: Colors.light.black,
    marginTop: 16,
  },
  nearbyTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 32,
  },
  reviewCard: {
    flexDirection: 'row',
    height: 102,
    borderRadius: 8,
    backgroundColor: Colors.light.white,
    padding: 8,
  },
  reviewImageBox: {
    width: 86,
    height: 86,
    borderRadius: 8,
    backgroundColor: Colors.light.grayLight,
  },
  reviewContent: {
    flex: 1,
    marginLeft: 8,
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
  reviewMoreButton: { alignSelf: 'flex-end', paddingVertical: 8 },
  reviewMoreText: { ...Typography.button4, color: Colors.light.primary },
  nearbyScrollContent: {
    gap: 8,
  },
  nearbyImageBox: {
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  nearbyImage: { width: '100%', height: '100%' },
  nearbyHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  nearbyPlaceName: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    marginTop: 8,
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
});

export default PlaceDetailScreen;
