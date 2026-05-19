import { LinearGradient } from 'expo-linear-gradient';
import { Search } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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

// 🚀 구형 useNavigation을 지우고 Expo Router의 useRouter를 가져옵니다!
import { useRouter } from 'expo-router';

// 디자인 시스템 임포트
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - (Spacing.h.medium * 2);

// --- 데이터 영역 (생략 없이 그대로) ---
const CAROUSEL_IMAGES = [
  { id: '1', uri: 'https://picsum.photos/id/10/400/240', title: '푸른 바다의 전설', subtitle: '드라마 촬영지' },
  { id: '2', uri: 'https://picsum.photos/id/11/400/240', title: '겨울 왕국 여행', subtitle: '영화 속 그곳' },
  { id: '3', uri: 'https://picsum.photos/id/12/400/240', title: '유튜버의 숨은 맛집', subtitle: '먹방 성지순례' },
  { id: '4', uri: 'https://picsum.photos/id/13/400/240', title: '한옥의 미를 찾아서', subtitle: '전통 문화 체험' },
  { id: '5', uri: 'https://picsum.photos/id/14/400/240', title: '도심 속 휴식', subtitle: '서울 야경 명소' },
];

const POPULAR_COURSES = [
  { id: '1', uri: 'https://picsum.photos/id/20/320/240', title: '담양 소쇄원 산책' },
  { id: '2', uri: 'https://picsum.photos/id/21/320/240', title: '여수 밤바다 투어' },
  { id: '3', uri: 'https://picsum.photos/id/22/320/240', title: '경주 황리단길' },
  { id: '4', uri: 'https://picsum.photos/id/23/320/240', title: '제주 애월 카페거리' },
];

const RECOMMENDED_COURSES = [
  { id: '1', uri: 'https://picsum.photos/id/30/320/240', title: '나만 알고 싶은 숲길' },
  { id: '2', uri: 'https://picsum.photos/id/31/320/240', title: '강릉 수제버거 맛집' },
  { id: '3', uri: 'https://picsum.photos/id/32/320/240', title: '부산 흰여울 문화마을' },
  { id: '4', uri: 'https://picsum.photos/id/33/320/240', title: '가평 쁘띠프랑스' },
];

const MainScreen = () => {
  // 🚀 navigation 대신 router를 선언합니다!
  const router = useRouter(); 
  
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // 캐러셀 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % CAROUSEL_IMAGES.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, 3000);
    return () => clearInterval(timer);
  }, [activeIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / CAROUSEL_WIDTH);
    if (currentIndex >= 0 && currentIndex < CAROUSEL_IMAGES.length) {
      if (currentIndex !== activeIndex) setActiveIndex(currentIndex);
    }
  };

  const renderCarouselItem = ({ item }: { item: typeof CAROUSEL_IMAGES[0] }) => (
    <View style={styles.carouselWrapper}>
      <View style={styles.carouselInner}>
        <Image source={{ uri: item.uri }} style={styles.fullImage} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradientOverlay}>
          <View style={styles.textOverlay}>
            <Text style={styles.carouselSubtitleText}>{item.subtitle}</Text>
            <Text style={styles.carouselTitleText}>{item.title}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  const renderCourseItem = ({ item }: { item: typeof POPULAR_COURSES[0] }) => (
    <TouchableOpacity style={styles.courseItemContainer} activeOpacity={0.8}>
      <View style={styles.courseImageWrapper}>
        <Image source={{ uri: item.uri }} style={styles.courseImage} />
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
          <Search size={24} color={Colors.light.primary} />
          <View style={styles.searchPlaceholderWrapper}>
            <Text style={styles.searchPlaceholderText}>어디로 떠나볼까요?</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* 2. 메인 캐러셀 */}
        <View style={styles.imageBox}>
          <FlatList
            ref={flatListRef}
            data={CAROUSEL_IMAGES}
            renderItem={renderCarouselItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          <View style={styles.indicatorContainer}>
            {CAROUSEL_IMAGES.map((_, index) => (
              <View 
                key={index} 
                style={[styles.dot, { backgroundColor: activeIndex === index ? Colors.light.primary : Colors.light.white }]} 
              />
            ))}
          </View>
        </View>

        {/* 3. 국내 여행 버튼 */}
        <TouchableOpacity style={styles.domesticButton} activeOpacity={0.8}>
          <Text style={styles.domesticButtonText}>국내 여행</Text>
        </TouchableOpacity>

        {/* 4. 실시간 인기 코스 섹션 */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitleText}>실시간 인기 코스</Text>
        </View>
        <FlatList
          data={POPULAR_COURSES}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
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
          data={RECOMMENDED_COURSES}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
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
    height: 56,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: Colors.light.white,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: 56,

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
    borderRadius: 4,
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
    marginTop: 8,
    ...Typography.body3,
    color: Colors.light.grayDark,
    textAlign: 'left',
  },
});

export default MainScreen;