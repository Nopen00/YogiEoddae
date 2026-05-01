import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, Star } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 디자인 시스템 임포트
import SearchBar from '@/components/make_component/SearchBar';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

const CATEGORIES = ["전체", "코스", "명소", "포토스팟"];
const { width } = Dimensions.get('window');
const TAB_WIDTH = width / CATEGORIES.length;

const SearchResultScreen = () => {
  const router = useRouter();
  const { keyword: initialKeyword } = useLocalSearchParams<{ keyword: string }>();
  
  const [inputText, setInputText] = useState(initialKeyword || '');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  // 탭 이동 핸들러
  const handleTabPress = (index: number) => {
    setSelectedIndex(index);
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  // 좋아요 포맷 함수
  const formatLikes = (count: number) => {
    if (count >= 100) {
      const rounded = Math.floor(count / 100) * 100;
      return `${rounded.toLocaleString()}+`;
    }
    return count.toString();
  };

  // 샘플 데이터
  const dummyCourses = [
    { id: 1, title: "내가 왕이 될 상인가....", placeCount: 7, media: "드라마", rating: 4.3, likes: 1250, tags: ["역사", "서울", "관광명소", "가족여행"] },
    { id: 2, title: "해안도로 드라이브 코스", placeCount: 5, media: "유튜브", rating: 4.8, likes: 85, tags: ["강원", "드라이브"] },
    { id: 3, title: "서울 야경 명소 투어", placeCount: 4, media: "영화", rating: 4.5, likes: 320, tags: ["야경", "데이트", "산책", "감성"] },
    { id: 4, title: "제주 맛집 탐방 코스", placeCount: 8, media: "인스타그램", rating: 4.9, likes: 2100, tags: ["제주", "맛집", "카페"] },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrapper}>
        <SearchBar
          value={inputText}
          onChangeText={setInputText}
          onBackPress={() => router.back()}
          onClearPress={() => setInputText('')}
        />
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.backgroundLine} />
        {CATEGORIES.map((tab, index) => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => handleTabPress(index)}>
            <Text style={[styles.tabText, { color: selectedIndex === index ? Colors.light.black : Colors.light.grayLight }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
        <Animated.View style={[styles.indicator, { width: TAB_WIDTH, transform: [{ translateX }] }]} />
      </View>

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* 전체 탭에서만 타이틀 표시 */}
        {selectedIndex === 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>코스</Text>
            <View style={styles.titleBottomLine} />
          </View>
        )}

        {/* 리스트 출력 (전체 탭은 3개, 그 외는 전체) */}
        {(selectedIndex === 0 ? dummyCourses.slice(0, 3) : dummyCourses).map((course) => {
          // 🚀 태그 노출 로직 구현
          const visibleTags = course.tags.slice(0, 3);
          const extraTagCount = course.tags.length - 3;

          return (
            <TouchableOpacity key={course.id} style={styles.cardButton} activeOpacity={0.9}>
              <View style={styles.cardInner}>
                <View style={styles.imageCircle} />
                <View style={styles.infoContent}>
                  <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataText}>{course.placeCount}개 장소</Text>
                    <Text style={styles.divider}>|</Text>
                    <Text style={styles.metadataText}>{course.media}</Text>
                    <Text style={styles.divider}>|</Text>
                    <View style={styles.iconGroup}>
                      <Star size={14} color={Colors.light.grayDark} />
                      <Text style={styles.iconValue}>{course.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.divider}>|</Text>
                    <View style={styles.iconGroup}>
                      <Heart size={14} color={Colors.light.grayDark} />
                      <Text style={styles.iconValue}>{formatLikes(course.likes)}</Text>
                    </View>
                  </View>
                  
                  {/* 🚀 태그 영역: 최대 3개 + 초과분 표시 */}
                  <View style={styles.tagRow}>
                    {visibleTags.map((tag, idx) => (
                      <Text key={idx} style={styles.tagText}>#{tag}</Text>
                    ))}
                    {extraTagCount > 0 && (
                      <Text style={styles.tagText}>+{extraTagCount}</Text>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* 전체 탭에서만 더보기 버튼 표시 */}
        {selectedIndex === 0 && dummyCourses.length > 3 && (
          <TouchableOpacity 
            style={styles.moreButton} 
            onPress={() => handleTabPress(1)} 
          >
            <Text style={styles.moreButtonText}>더보기</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerWrapper: { paddingBottom: Spacing.v.small },
  tabContainer: { flexDirection: 'row', height: 32, position: 'relative' },
  backgroundLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: Colors.light.grayLight },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { ...Typography.subtitle1 },
  indicator: { position: 'absolute', bottom: 0, left: 0, height: 1, backgroundColor: Colors.light.black, zIndex: 1 },
  mainContent: { flex: 1, paddingTop: Spacing.v.medium },
  sectionHeader: { paddingHorizontal: Spacing.h.medium, marginBottom: Spacing.v.medium },
  sectionTitle: { ...Typography.title1, color: Colors.light.black, marginBottom: Spacing.v.small },
  titleBottomLine: { height: 1, backgroundColor: Colors.light.grayLight },
  
  cardButton: {
    height: 106,
    marginHorizontal: Spacing.h.medium,
    marginBottom: 16,
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: 16,
    justifyContent: 'center',
  },
  cardInner: { flexDirection: 'row', alignItems: 'flex-start' },
  imageCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D9D9D9' },
  infoContent: { flex: 1, marginLeft: 16 },
  courseTitle: { ...Typography.title1, color: Colors.light.black, marginBottom: 4 },
  metadataRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metadataText: { ...Typography.subtitle1, color: Colors.light.grayDark },
  divider: { marginHorizontal: 4, color: Colors.light.grayLight },
  iconGroup: { flexDirection: 'row', alignItems: 'center' },
  iconValue: { ...Typography.subtitle1, color: Colors.light.grayDark, marginLeft: 2 },
  tagRow: { flexDirection: 'row', alignItems: 'center' },
  tagText: { 
    ...Typography.body2, 
    color: Colors.light.primary, 
    marginRight: 4 
  },
  moreButton: {
    marginTop: 32,
    alignSelf: 'flex-end',
    marginRight: 16,
  },
  moreButtonText: {
    ...Typography.button4,
    color: Colors.light.primary,
  }
});

export default SearchResultScreen;