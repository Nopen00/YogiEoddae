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
import { Shadow } from 'react-native-shadow-2';

const CourseDetailScreen = () => {
  const { title, locationCount, mediaType, mediaTitle, rating, likes, tags: tagsParam } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();

  // 이미지 박스 계산 (좌우 16pt 간격)
  const imageWidth = width - Spacing.h.medium * 2;
  const imageHeight = (imageWidth * 3) / 4;
  const smallImageWidth = imageWidth / 2;
  const smallImageHeight = (smallImageWidth * 3) / 4;

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
    if (num < 1000) return num.toString();
    const rounded = Math.floor(num / 100) * 100;
    return `${(rounded).toLocaleString('en-US')}+`;
  };

  // 목업 데이터
  const displayTags = Array.isArray(tagsParam) ? tagsParam : ['태그1', '태그2', '태그3', '태그4'];
  const displayMediaTitle = String(mediaTitle ?? '미디어 제목');
  const mockDays: { n: number; date: string; places: { name: string; rating: number; category: string; address: string }[] }[] = [
    { n: 1, date: '01/01 수', places: [
      { name: '장소 명칭 1', rating: 4.5, category: '관광명소', address: '서울시 도봉구' },
    ]},
    { n: 2, date: '01/02 목', places: [
      { name: '장소 명칭 2', rating: 4.2, category: '음식점', address: '서울시 마포구' },
      { name: '장소 명칭 2-2', rating: 3.8, category: '카페', address: '서울시 마포구' },
    ]},
    { n: 3, date: '01/03 금', places: [
      { name: '장소 명칭 3', rating: 4.8, category: '숙박', address: '서울시 강남구' },
    ]},
  ];
  const mockPhotoSpots: { id: string; imageUrl: string; title: string; address: string; likes: number; tags: string[] }[] = [
    { id: '1', imageUrl: 'https://via.placeholder.com/48x48', title: '포토스팟 제목 1', address: '서울시 도봉구', likes: 89, tags: ['태그1', '태그2'] },
    { id: '2', imageUrl: 'https://via.placeholder.com/48x48', title: '포토스팟 제목 2', address: '서울시 마포구', likes: 1290, tags: ['태그3'] },
  ];
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
            {isMenuVisible && <MoreMenuAlert isSaved={isSaved} onSavePress={handleSaveToggle} onSchedulePress={handleSchedulePress} />}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
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
                <Star size={16} color={Colors.light.grayDark} strokeWidth={2} />
                <Text style={[styles.metaText, { marginLeft: 2 }]}>{displayRating}</Text>
              </View>
              <Text style={styles.separator}>|</Text>
              <View style={styles.iconTextRow}>
                <Heart size={16} color={Colors.light.grayDark} strokeWidth={2} />
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

            {/* 구분선 */}
            <View style={styles.divider} />

            {/* 미디어 타이틀 */}
            <Text style={styles.mediaTitleText}>{displayMediaTitle}</Text>

            {/* 미디어 이미지 박스 */}
            <View style={[styles.mediaImageContainer, { height: imageHeight }]}>
              <Image source={{ uri: 'https://via.placeholder.com/400x300' }} style={styles.mediaImage} resizeMode="cover" />
            </View>

            {/* 미디어 설명 */}
            <Text style={styles.mediaDescText}>미디어 설명이 여기에 들어갑니다.</Text>

            {/* 구분선 */}
            <View style={styles.dividerBottom} />

            {/* 촬영지 섹션 */}
            <Text style={styles.locationSectionTitle}>{displayMediaTitle} 속 촬영지</Text>
          </View>

          {/* 촬영지 이미지 슬라이드 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.locationScrollContent, { paddingHorizontal: Spacing.h.medium }]}
            style={{ marginTop: 16 }}
          >
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={[styles.locationImageBox, { width: smallImageWidth, height: smallImageHeight }]}>
                <Image source={{ uri: 'https://via.placeholder.com/200x150' }} style={styles.locationImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>

          <View style={styles.infoContainer}>
            {/* 장소 설명 */}
            <Text style={styles.locationDescText}>장소에 대한 설명이 여기에 들어갑니다.</Text>

            {/* 구분선 */}
            <View style={styles.dividerBottom} />

            {/* 코스 섹션 */}
            <Text style={styles.courseSectionTitle}>코스</Text>

            {mockDays.map((day, dayIndex) => (
              <View key={dayIndex} style={dayIndex > 0 ? { marginTop: 32 } : undefined}>
                <View style={styles.dayRow}>
                  <Text style={styles.dayText}>Day {day.n}</Text>
                  <Text style={styles.dayDateText}>{day.date}</Text>
                </View>

                {day.places.map((place, placeIndex) => (
                  <View key={placeIndex} style={styles.placeRow}>
                    {/* 넘버링 원 */}
                    <View style={styles.placeNumberColumn}>
                      <View style={styles.placeCircle}>
                        <Text style={styles.placeCircleText}>{placeIndex + 1}</Text>
                      </View>
                    </View>

                    <View style={{ width: 16 }} />

                    {/* 코스 카드 */}
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      activeOpacity={0.8}
                      onPress={() => router.push({
                        pathname: '/PlaceDetailScreen',
                        params: {
                          name: place.name,
                          rating: place.rating,
                          category: place.category,
                          address: place.address,
                        },
                      })}
                    >
                      <Shadow distance={4} startColor="rgba(0, 0, 0, 0.15)" offset={[0, 0]} stretch>
                        <View style={styles.courseCard}>
                          <Image
                            source={{ uri: 'https://via.placeholder.com/86x86' }}
                            style={styles.courseCardImage}
                            resizeMode="cover"
                          />
                          <View style={styles.cardContent}>
                            <View style={styles.cardNameRow}>
                              <Text style={styles.placeNameText}>{place.name}</Text>
                              <Star size={16} color={Colors.light.grayDark} strokeWidth={1} />
                              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
                            </View>
                            <View style={styles.cardSubRow}>
                              <Text style={styles.cardSubText}>{place.category}</Text>
                              <Text style={styles.cardSeparator}>|</Text>
                              <Text style={styles.cardSubText}>{place.address}</Text>
                            </View>
                            <TouchableOpacity style={styles.routeButton} activeOpacity={0.7}>
                              <Text style={styles.routeButtonText}>경로 확인</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Shadow>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}

            {/* 구분선 */}
            <View style={styles.dividerBottom} />

            {/* 포토스팟 섹션 */}
            <Text style={styles.photoSpotTitle}>포토스팟</Text>
            {mockPhotoSpots.map((spot, index) => (
              <View key={spot.id} style={[styles.photoSpotBox, index > 0 && { marginTop: 8 }]}>
                <View style={styles.photoSpotItem}>
                  {/* 이미지 */}
                  <Image
                    source={{ uri: spot.imageUrl }}
                    style={styles.photoSpotImage}
                  />
                  <View style={{ width: 16 }} />

                  {/* 정보 */}
                  <View style={styles.photoSpotContent}>
                    {/* 제목 */}
                    <Text style={styles.photoSpotItemTitle}>{spot.title}</Text>

                    {/* 주소 + 하트 + 좋아요 */}
                    <View style={styles.photoSpotMetaRow}>
                      <Text style={styles.photoSpotAddress}>{spot.address}</Text>
                      <Text style={styles.photoSpotSeparator}>|</Text>
                      <Heart size={16} color={Colors.light.grayDark} strokeWidth={1} />
                      <Text style={styles.photoSpotLikes}>{formatLikes(spot.likes)}</Text>
                    </View>

                    {/* 태그 */}
                    <View style={styles.photoSpotTags}>
                      {spot.tags.map((tag, tagIndex) => (
                        <Text key={tagIndex} style={styles.photoSpotTag}>#{tag}</Text>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            ))}
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
    ...Typography.button4,
    color: Colors.light.grayDark,
    marginTop: 8,
  },
  divider: {
    marginTop: 16,
    height: 1,
    backgroundColor: Colors.light.grayLight,
  },
  mediaTitleText: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 16,
  },
  mediaImageContainer: {
    marginTop: 16,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  mediaImage: { width: '100%', height: '100%' },
  mediaDescText: {
    ...Typography.body2,
    color: Colors.light.black,
    marginTop: 16,
  },
  dividerBottom: {
    marginTop: 32,
    height: 1,
    backgroundColor: Colors.light.grayLight,
  },
  locationSectionTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 32,
  },
  locationScrollContent: {
    gap: 8,
  },
  locationImageBox: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  locationImage: { width: '100%', height: '100%' },
  locationDescText: {
    ...Typography.body2,
    color: Colors.light.black,
  },
  courseSectionTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 32,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dayText: {
    ...Typography.title2,
    color: Colors.light.black,
  },
  dayDateText: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    marginLeft: 8,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  placeNumberColumn: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  placeCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
    width: 1,
    backgroundColor: Colors.light.grayLight,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 102,
    backgroundColor: Colors.light.white,
    borderRadius: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
  },
  courseCardImage: {
    width: 86,
    height: 86,
    borderRadius: 4,
    backgroundColor: Colors.light.grayLight,
  },
  cardContent: {
    flex: 1,
    marginLeft: 8,
    alignSelf: 'stretch',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardSubText: {
    ...Typography.body2,
    color: Colors.light.grayDark,
  },
  cardSeparator: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    marginHorizontal: 8,
  },
  placeNameText: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    marginRight: 8,
  },
  routeButton: {
    position: 'absolute',
    bottom: 0,
    right: 8,
    height: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.white,
    borderWidth: 1,
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
    marginLeft: 2,
  },
  photoSpotTitle: {
    ...Typography.title1,
    color: Colors.light.black,
    marginTop: 32,
  },
  photoSpotBox: {
    marginTop: 16,
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  photoSpotItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  photoSpotImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.grayLight,
  },
  photoSpotContent: {
    flex: 1,
  },
  photoSpotItemTitle: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  photoSpotMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  photoSpotAddress: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
  },
  photoSpotSeparator: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    marginHorizontal: 4,
  },
  photoSpotLikes: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    marginLeft: 2,
  },
  photoSpotTags: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  photoSpotTag: {
    ...Typography.body2,
    color: '#41737c',
  },
});

export default CourseDetailScreen;