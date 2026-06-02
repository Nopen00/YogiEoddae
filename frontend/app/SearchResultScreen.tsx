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

  const handleTabPress = (index: number) => {
    setSelectedIndex(index);
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const formatLikes = (count: number) => {
    if (count >= 100) {
      const rounded = Math.floor(count / 100) * 100;
      return `${rounded.toLocaleString()}+`;
    }
    return count.toString();
  };

  // 태그 처리 로직
  const getProcessedTags = (tags: string[] = []) => {
    const safeTags = tags || [];
    const sorted = [...safeTags].sort((a, b) => 
      a === inputText ? -1 : b === inputText ? 1 : 0
    );
    const visibleTags = sorted.slice(0, 3);
    const extraCount = safeTags.length - 3;
    return { visibleTags, extraCount };
  };

  // 데이터셋
  const dummyCourses = [
    { id: 1, title: "내가 왕이 될 상인가....", placeCount: 7, media: "드라마", rating: 4.3, likes: 1250, tags: ["역사", "서울", "관광명소", "가족여행"] },
    { id: 2, title: "해안도로 드라이브", placeCount: 5, media: "유튜브", rating: 4.8, likes: 85, tags: ["강원", "드라이브"] },
    { id: 3, title: "서울 야경 투어", placeCount: 4, media: "영화", rating: 4.5, likes: 320, tags: ["야경"] },
    { id: 4, title: "제주 맛집", placeCount: 8, media: "SNS", rating: 4.9, likes: 2100, tags: ["제주"] },
  ];

  const dummyAttractions = [
    { id: 1, title: "경복궁", feature: "관광", address: "서울 종로구", rating: 4.7, likes: 3500, tags: ["역사", "고궁"] },
    { id: 2, title: "양양 서피비치", feature: "체험", address: "강원 양양군", rating: 4.5, likes: 820, tags: ["서핑", "바다"] },
    { id: 3, title: "남산타워", feature: "관광", address: "서울 용산구", rating: 4.6, likes: 1500, tags: ["야경"] },
    { id: 4, title: "불국사", feature: "역사", address: "경북 경주시", rating: 4.8, likes: 2200, tags: ["유적지"] },
  ];

  const dummyPhotoSpots = [
    { id: 1, title: "속초 아이 대관람차", address: "강원 속초시", likes: 5200, tags: ["포토존"] },
    { id: 2, title: "별마당 도서관", address: "서울 강남구", likes: 8900, tags: ["실내"] },
    { id: 3, title: "강릉 안목해변", address: "강원 강릉시", likes: 3100, tags: ["바다"] },
    { id: 4, title: "감천문화마을", address: "부산 사하구", likes: 4500, tags: ["마을"] },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrapper}>
        <SearchBar value={inputText} onChangeText={setInputText} onBackPress={() => router.back()} onClearPress={() => setInputText('')} />
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.backgroundLine} />
        {CATEGORIES.map((tab, index) => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => handleTabPress(index)}>
            <Text style={[styles.tabText, { color: selectedIndex === index ? Colors.light.black : Colors.light.grayLight }]}>{tab}</Text>
          </TouchableOpacity>
        ))}
        <Animated.View style={[styles.indicator, { width: TAB_WIDTH, transform: [{ translateX }] }]} />
      </View>

      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* --- 1. 코스 섹션 --- */}
        {(selectedIndex === 0 || selectedIndex === 1) && (
          <View>
            {selectedIndex === 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>코스</Text>
                <View style={styles.titleBottomLine} />
              </View>
            )}
            {(selectedIndex === 0 ? dummyCourses.slice(0, 3) : dummyCourses).map((course) => {
              const { visibleTags, extraCount } = getProcessedTags(course.tags);
              return (
                <TouchableOpacity 
                key={`course-${course.id}`} 
                style={styles.cardButton} 
                activeOpacity={0.9} 
                onPress={() => router.push({
                  pathname:'/CourseDetailScreen',
                  params: { id: course.id, title: course.title}
                  })}>
                  <View style={styles.cardInner}>
                    <View style={styles.imageCircle} />
                    <View style={styles.infoContent}>
                      <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataText}>{course.placeCount}개 장소</Text>
                        <Text style={styles.divider}>|</Text>
                        <Text style={styles.metadataText}>{course.media}</Text>
                        <Text style={styles.divider}>|</Text>
                        <View style={styles.iconGroup}><Star size={14} color={Colors.light.grayDark} /><Text style={styles.iconValue}>{course.rating.toFixed(1)}</Text></View>
                        <Text style={styles.divider}>|</Text>
                        <View style={styles.iconGroup}><Heart size={14} color={Colors.light.grayDark} /><Text style={styles.iconValue}>{formatLikes(course.likes)}</Text></View>
                      </View>
                      <View style={styles.tagRow}>
                        {visibleTags.map((tag, idx) => <Text key={idx} style={styles.tagText}>#{tag}</Text>)}
                        {extraCount > 0 && <Text style={styles.tagText}>+{extraCount}</Text>}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
            {selectedIndex === 0 && dummyCourses.length > 3 && (
              <TouchableOpacity style={styles.moreButton} onPress={() => handleTabPress(1)}>
                <Text style={styles.moreButtonText}>더보기</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* --- 2. 명소 섹션 --- */}
        {(selectedIndex === 0 || selectedIndex === 2) && (
          <View style={selectedIndex === 0 ? styles.nextSectionWrapper : null}>
            {selectedIndex === 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>명소</Text>
                <View style={styles.titleBottomLine} />
              </View>
            )}
            {(selectedIndex === 0 ? dummyAttractions.slice(0, 3) : dummyAttractions).map((attr) => {
              const { visibleTags, extraCount } = getProcessedTags(attr.tags);
              return (
                <TouchableOpacity
                  key={`attr-${attr.id}`}
                  style={styles.cardButton}
                  activeOpacity={0.9}
                  onPress={() => router.push({
                    pathname: '/PlaceDetailScreen',
                    params: {
                      name: attr.title,
                      rating: attr.rating,
                      category: attr.feature,
                      address: attr.address,
                      tags: attr.tags,
                    },
                  })}
                >
                  <View style={styles.cardInner}>
                    <View style={styles.imageCircle} />
                    <View style={styles.infoContent}>
                      <Text style={styles.courseTitle} numberOfLines={1}>{attr.title}</Text>
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataText}>{attr.feature}</Text>
                        <Text style={styles.divider}>|</Text>
                        <Text style={styles.metadataText}>{attr.address}</Text>
                        <Text style={styles.divider}>|</Text>
                        <View style={styles.iconGroup}><Star size={14} color={Colors.light.grayDark} /><Text style={styles.iconValue}>{attr.rating.toFixed(1)}</Text></View>
                        <Text style={styles.divider}>|</Text>
                        <View style={styles.iconGroup}><Heart size={14} color={Colors.light.grayDark} /><Text style={styles.iconValue}>{formatLikes(attr.likes)}</Text></View>
                      </View>
                      <View style={styles.tagRow}>
                        {visibleTags.map((tag, idx) => <Text key={idx} style={styles.tagText}>#{tag}</Text>)}
                        {extraCount > 0 && <Text style={styles.tagText}>+{extraCount}</Text>}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
            {selectedIndex === 0 && dummyAttractions.length > 3 && (
              <TouchableOpacity style={styles.moreButton} onPress={() => handleTabPress(2)}>
                <Text style={styles.moreButtonText}>더보기</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* --- 3. 포토스팟 섹션 --- */}
        {(selectedIndex === 0 || selectedIndex === 3) && (
          <View style={selectedIndex === 0 ? styles.nextSectionWrapper : null}>
            {selectedIndex === 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>포토스팟</Text>
                <View style={styles.titleBottomLine} />
              </View>
            )}
            {(selectedIndex === 0 ? dummyPhotoSpots.slice(0, 3) : dummyPhotoSpots).map((spot) => {
              const { visibleTags, extraCount } = getProcessedTags(spot.tags);
              return (
                <TouchableOpacity key={`spot-${spot.id}`} style={styles.cardButton} activeOpacity={0.9}>
                  <View style={styles.cardInner}>
                    <View style={styles.imageCircle} />
                    <View style={styles.infoContent}>
                      <Text style={styles.courseTitle} numberOfLines={1}>{spot.title}</Text>
                      <View style={styles.metadataRow}>
                        <Text style={styles.metadataText}>{spot.address}</Text>
                        <Text style={styles.divider}>|</Text>
                        <View style={styles.iconGroup}>
                          <Heart size={14} color={Colors.light.grayDark} />
                          <Text style={styles.iconValue}>{formatLikes(spot.likes)}</Text>
                        </View>
                      </View>
                      <View style={styles.tagRow}>
                        {visibleTags.map((tag, idx) => <Text key={idx} style={styles.tagText}>#{tag}</Text>)}
                        {extraCount > 0 && <Text style={styles.tagText}>+{extraCount}</Text>}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
            {selectedIndex === 0 && dummyPhotoSpots.length > 3 && (
              <TouchableOpacity style={styles.moreButton} onPress={() => handleTabPress(3)}>
                <Text style={styles.moreButtonText}>더보기</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  
  // 🚀 최하단 여백 64pt 설정
  scrollContainer: { paddingBottom: 64 },

  // 🚀 타이틀(하단 항목)의 32pt 위에 위치하도록 설정
  nextSectionWrapper: { marginTop: 32 },

  sectionHeader: { paddingHorizontal: Spacing.h.medium, marginBottom: Spacing.v.medium },
  sectionTitle: { ...Typography.HeadLine7, color: Colors.light.black, marginBottom: Spacing.v.small },
  titleBottomLine: { height: 1, backgroundColor: Colors.light.grayLight },
  cardButton: {
    height: 106,
    marginHorizontal: Spacing.h.medium,
    marginBottom: 16, // 카드 하단 16pt 여백
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
  tagText: { ...Typography.body2, color: Colors.light.primary, marginRight: 4 },
  
  // 🚀 상단 항목(카드)에서 16pt 떨어지도록 설정
  // 카드의 marginBottom(16)과 moreButton의 marginTop(0)이 합쳐져 16pt 유지
  moreButton: { marginTop: 0, alignSelf: 'flex-end', marginRight: 16, paddingVertical: 8 },
  moreButtonText: { ...Typography.button4, color: Colors.light.primary }
});

export default SearchResultScreen;