import { LinearGradient } from 'expo-linear-gradient';
import { Search } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { MEDIA_TYPE_LABEL } from '@/constants/labels';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { mediaApi } from '../../services/api';
import type { Media } from '../../services/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - (Spacing.h.medium * 2);

const MainScreen = () => {
  const router = useRouter();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [carouselData, setCarouselData] = useState<Media[]>([]);
  const [popularCourses, setPopularCourses] = useState<Media[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Media[]>([]);

  // 루프 캐러셀용: [마지막, ...원본, 첫번째]
  const extendedCarouselData = useMemo(() =>
    carouselData.length > 0
      ? [carouselData[carouselData.length - 1], ...carouselData, carouselData[0]]
      : [],
    [carouselData]
  );
  const currentExtendedIndexRef = useRef(1);

  useEffect(() => {
    mediaApi.getList({ type: 'drama' }).then(res => setCarouselData(res.data.results)).catch((e) => console.error('carousel error:', e));
    mediaApi.getList().then(res => {
      const all = res.data.results;
      setPopularCourses(all.slice(0, 4));
      setRecommendedCourses(all.slice(4, 8));
    }).catch((e) => console.error('courses error:', e));
  }, []);

  // 데이터 로드 후 실제 첫 번째 아이템(index 1)으로 순간이동
  useEffect(() => {
    if (extendedCarouselData.length < 3) return;
    const t = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: 1, animated: false });
      currentExtendedIndexRef.current = 1;
    }, 0);
    return () => clearTimeout(t);
  }, [extendedCarouselData.length]);

  // 자동 슬라이드 — 클론 끝에 닿으면 실제 위치로 순간이동
  useEffect(() => {
    if (carouselData.length < 2) return;
    const total = extendedCarouselData.length;
    const timer = setInterval(() => {
      const next = currentExtendedIndexRef.current + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      currentExtendedIndexRef.current = next;
      setActiveIndex(next === total - 1 ? 0 : next - 1);
      if (next === total - 1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: 1, animated: false });
          currentExtendedIndexRef.current = 1;
        }, 350);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [carouselData.length, extendedCarouselData.length]);

  // 사용자가 직접 스와이프했을 때 클론 위치 → 실제 위치로 순간이동
  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / CAROUSEL_WIDTH);
    const total = extendedCarouselData.length;
    if (index === 0) {
      const realLast = total - 2;
      flatListRef.current?.scrollToIndex({ index: realLast, animated: false });
      currentExtendedIndexRef.current = realLast;
      setActiveIndex(carouselData.length - 1);
    } else if (index === total - 1) {
      flatListRef.current?.scrollToIndex({ index: 1, animated: false });
      currentExtendedIndexRef.current = 1;
      setActiveIndex(0);
    } else {
      currentExtendedIndexRef.current = index;
      setActiveIndex(index - 1);
    }
  };

  const renderCarouselItem = ({ item }: { item: Media }) => (
    <TouchableOpacity
      style={styles.carouselWrapper}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: item.id, title: item.title } })}
    >
      <View style={styles.carouselInner}>
        <Image source={{ uri: item.thumbnail_url ?? undefined }} style={styles.fullImage} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradientOverlay}>
          <View style={styles.textOverlay}>
            <Text style={styles.carouselSubtitleText}>{MEDIA_TYPE_LABEL[item.media_type] ?? item.media_type}</Text>
            <Text style={styles.carouselTitleText}>{item.title}</Text>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  const renderCourseItem = ({ item }: { item: Media }) => (
    <TouchableOpacity
      style={styles.courseItemContainer}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: item.id, title: item.title } })}
    >
      <View style={styles.courseImageWrapper}>
        <Image source={{ uri: item.thumbnail_url ?? undefined }} style={styles.courseImage} />
      </View>
      <Text style={styles.courseTitleText} numberOfLines={1}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* 1. 상단 고정 검색바 */}
      <View style={styles.searchBarFixed}>
        <TouchableOpacity 
          style={styles.searchBarContainer}
          activeOpacity={0.9}
          // 🚀 여기가 핵심입니다! 
          // SearchScreen으로 가면서 "나 MainScreen에서 왔어" 라고 알려줍니다.
          onPress={() => router.push({
            pathname: '/SearchScreen',
            params: { from: '/MainScreen' }
          })}
        >
          <Search size={IconSize.large} color={Colors.light.primary} />
          <View style={styles.searchPlaceholderWrapper}>
            <Text style={styles.searchPlaceholderText}>어디로 떠나볼까요?</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}
      >
        {/* 2. 메인 캐러셀 */}
        <View style={styles.imageBox}>
          <FlatList
            ref={flatListRef}
            data={extendedCarouselData}
            renderItem={renderCarouselItem}
            keyExtractor={(_, index) => String(index)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: CAROUSEL_WIDTH,
              offset: CAROUSEL_WIDTH * index,
              index,
            })}
          />
          <View style={styles.indicatorContainer}>
            {carouselData.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, { backgroundColor: activeIndex === index ? Colors.light.primary : Colors.light.white }]}
              />
            ))}
          </View>
        </View>

        {/* 3. 국내 여행 버튼 */}
        <TouchableOpacity style={styles.domesticButton} activeOpacity={0.8}>
          <Text style={styles.domesticButtonText}>여행하러 가기</Text>
        </TouchableOpacity>

        {/* 4. 실시간 인기 코스 섹션 */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitleText}>실시간 인기 코스</Text>
        </View>
        <FlatList
          data={popularCourses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseListContent}
          style={styles.courseList}
        />

        {/* 5. 맞춤형 여행 코스 섹션 */}
        <View style={[styles.sectionTitleContainer, { marginTop: Spacing.v.large }]}>
          <Text style={styles.sectionTitleText}>맞춤형 여행 코스</Text>
        </View>
        <FlatList
          data={recommendedCourses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseListContent}
          style={styles.courseList}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 1. 레이아웃 메인 컨테이너
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  searchBarFixed: {
    backgroundColor: Colors.light.background,
    paddingBottom: Spacing.v.small,
  },

  // 2. 상단 검색바
  searchBarContainer: {
    marginTop: Spacing.v.small,
    marginHorizontal: Spacing.h.medium,
    height: Size.header,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: Colors.light.white,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Size.header,

    paddingHorizontal: Spacing.h.medium,
  },

  searchPlaceholderWrapper: {
    flex: 1,
    marginLeft: Spacing.h.small,
  },

  searchPlaceholderText: {
    ...Typography.body3,
    color: Colors.light.grayLight,
  },

  // 3. 메인 캐러셀 영역
  imageBox: {
    marginTop: Spacing.v.small,
    marginHorizontal: Spacing.h.medium,
    height: 240,
    position: 'relative',
  },

  carouselWrapper: {
    width: CAROUSEL_WIDTH,
    height: 240,
    paddingHorizontal: Spacing.h.xsmall,
  },

  carouselInner: {
    flex: 1,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },

  fullImage: {
    width: '100%',
    height: '100%',
  },

  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },

  textOverlay: {
    paddingLeft: Spacing.h.medium,
    paddingBottom: Spacing.v.large,
  },

  carouselTitleText: {
    ...Typography.HeadLine5,
    color: Colors.light.white,
  },

  carouselSubtitleText: {
    ...Typography.subtitle2,
    color: Colors.light.white,
    marginBottom: Spacing.v.small,
  },

  indicatorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.v.small,

    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: Spacing.r.xsmall,
    marginHorizontal: Spacing.h.xsmall,
  },

  // 4. 국내 여행 버튼
  domesticButton: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    height: 122,

    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,

    paddingTop: Spacing.v.medium,
    paddingLeft: Spacing.h.medium,
  },

  domesticButtonText: {
    ...Typography.title1,
    color: Colors.light.black,
  },

  // 5. 섹션 타이틀
  sectionTitleContainer: {
    marginTop: Spacing.v.large,
    paddingLeft: Spacing.h.medium,
  },

  sectionTitleText: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
  },

  // 6. 코스 리스트
  courseList: {
    marginTop: Spacing.v.medium,
  },

  courseListContent: {
    paddingHorizontal: Spacing.h.medium,
    gap: Spacing.h.small,
  },

  courseItemContainer: {
    width: 160,
  },

  courseImageWrapper: {
    width: 160,
    height: 120,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },

  courseImage: {
    width: '100%',
    height: '100%',
  },

  courseTitleText: {
    marginTop: Spacing.v.small,
    ...Typography.body3,
    color: Colors.light.grayDark,
    textAlign: 'left',
  },
});

export default MainScreen;