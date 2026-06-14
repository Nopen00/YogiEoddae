import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, Star } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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
import { mediaApi, placeApi } from '../services/api';
import type { Media, Place, Tag } from '../services/types';

const CATEGORIES = ["전체", "코스", "명소", "포토스팟"];

const formatLikeCount = (count: number): string => {
  if (count < 100) return count.toString();
  return (Math.floor(count / 100) * 100).toLocaleString() + '+';
};

const CITY_SHORT: Record<string, string> = {
  '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구',
  '인천광역시': '인천', '광주광역시': '광주', '대전광역시': '대전',
  '울산광역시': '울산', '세종특별자치시': '세종', '경기도': '경기',
  '강원특별자치도': '강원', '강원도': '강원', '충청북도': '충북',
  '충청남도': '충남', '전라북도': '전북', '전북특별자치도': '전북',
  '전라남도': '전남', '경상북도': '경북', '경상남도': '경남',
  '제주특별자치도': '제주',
};
const { width } = Dimensions.get('window');
const TAB_WIDTH = width / CATEGORIES.length;

const SearchResultScreen = () => {
  const router = useRouter();
  const { keyword: initialKeyword } = useLocalSearchParams<{ keyword: string }>();
  
  const [inputText, setInputText] = useState(initialKeyword || '');
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword || '');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const [courses, setCourses] = useState<Media[]>([]);
  const [attractions, setAttractions] = useState<Place[]>([]);

  useEffect(() => {
    if (!searchKeyword) return;
    mediaApi.getList({ keyword: searchKeyword }).then(res => setCourses(res.data.results)).catch((e) => console.error('media error:', e));
    placeApi.getList({ keyword: searchKeyword }).then(res => setAttractions(res.data.results)).catch((e) => console.error('place error:', e));
  }, [searchKeyword]);

  const handleSearch = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setSearchKeyword(trimmed);
  };

  const handleTabPress = (index: number) => {
    setSelectedIndex(index);
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const MEDIA_TYPE_LABEL: Record<string, string> = {
    drama: '드라마', movie: '영화', youtube: '유튜브', etc: '기타',
  };

  const CATEGORY_LABEL: Record<string, string> = {
    '12': '관광지', '14': '문화시설', '15': '축제/행사',
    '25': '여행코스', '28': '레포츠', '32': '숙박', '38': '쇼핑', '39': '음식점',
  };

  const getProcessedTags = (tags: Tag[] = []) => {
    const names = tags.map(t => t.name);
    const visibleTags = names.slice(0, 3);
    const extraCount = names.length - 3;
    return { visibleTags, extraCount };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrapper}>
        <SearchBar value={inputText} onChangeText={setInputText} onBackPress={() => router.back()} onClearPress={() => setInputText('')} onSubmitEditing={handleSearch} returnKeyType="search" />
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
            {(selectedIndex === 0 ? courses.slice(0, 3) : courses).map((course) => {
              const { visibleTags: courseTags, extraCount: courseExtra } = getProcessedTags(course.tags);
              return (
                <TouchableOpacity
                  key={`course-${course.id}`}
                  style={styles.cardButton}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: course.id, title: course.title } })}
                >
                  <View style={styles.cardInner}>
                    <View style={styles.imageCircle} />
                    <View style={styles.infoContent}>
                      <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
                      <View style={styles.metadataRow}>
                        <View style={styles.metaChip}>
                          <Text style={styles.metadataText}>{MEDIA_TYPE_LABEL[course.media_type] ?? course.media_type}</Text>
                          {(course.place_count != null || course.rating != null || course.like_count != null) && (
                            <Text style={styles.divider}>|</Text>
                          )}
                        </View>
                        {course.place_count != null && (
                          <View style={styles.metaChip}>
                            <Text style={styles.metadataText}>{course.place_count}개 장소</Text>
                            {(course.rating != null || course.like_count != null) && (
                              <Text style={styles.divider}>|</Text>
                            )}
                          </View>
                        )}
                        {(course.rating != null || course.like_count != null) && (
                          <View style={styles.metaChip}>
                            {course.rating != null && (
                              <>
                                <Star size={16} color={Colors.light.grayDark} strokeWidth={2} />
                                <Text style={styles.metadataText}> {course.rating.toFixed(1)}</Text>
                              </>
                            )}
                            {course.rating != null && course.like_count != null && (
                              <Text style={styles.divider}>|</Text>
                            )}
                            {course.like_count != null && (
                              <>
                                <Heart size={16} color={Colors.light.grayDark} strokeWidth={2} />
                                <Text style={styles.metadataText}> {formatLikeCount(course.like_count)}</Text>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                      <View style={styles.tagRow}>
                        {courseTags.map((tag, idx) => <Text key={idx} style={styles.tagText}>#{tag}</Text>)}
                        {courseExtra > 0 && <Text style={styles.tagText}>+{courseExtra}</Text>}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            {selectedIndex === 0 && courses.length > 3 && (
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
            {(selectedIndex === 0 ? attractions.slice(0, 3) : attractions).map((attr) => {
              const { visibleTags: attrTags, extraCount: attrExtra } = getProcessedTags(attr.tags);
              const addrParts = attr.address.split(' ');
              if (addrParts[0] && CITY_SHORT[addrParts[0]]) addrParts[0] = CITY_SHORT[addrParts[0]];
              const shortAddr = addrParts.slice(0, 2).join(' ');
              return (
                <TouchableOpacity
                  key={`attr-${attr.id}`}
                  style={styles.cardButton}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/PlaceDetailScreen', params: { id: attr.id, name: attr.name } })}
                >
                  <View style={styles.cardInner}>
                    <View style={styles.imageCircle} />
                    <View style={styles.infoContent}>
                      <Text style={styles.courseTitle} numberOfLines={1}>{attr.name}</Text>
                      <View style={styles.metadataRow}>
                        <View style={styles.metaChip}>
                          <Text style={styles.metadataText}>{CATEGORY_LABEL[attr.category] ?? attr.category}</Text>
                          <Text style={styles.divider}>|</Text>
                        </View>
                        <View style={styles.metaChip}>
                          <Text style={styles.metadataText}>{shortAddr}</Text>
                          {(attr.rating != null || attr.like_count != null) && (
                            <Text style={styles.divider}>|</Text>
                          )}
                        </View>
                        {(attr.rating != null || attr.like_count != null) && (
                          <View style={styles.metaChip}>
                            {attr.rating != null && (
                              <>
                                <Star size={16} color={Colors.light.grayDark} strokeWidth={2} />
                                <Text style={styles.metadataText}> {attr.rating.toFixed(1)}</Text>
                              </>
                            )}
                            {attr.rating != null && attr.like_count != null && (
                              <Text style={styles.divider}>|</Text>
                            )}
                            {attr.like_count != null && (
                              <>
                                <Heart size={16} color={Colors.light.grayDark} strokeWidth={2} />
                                <Text style={styles.metadataText}> {formatLikeCount(attr.like_count)}</Text>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                      <View style={styles.tagRow}>
                        {attrTags.map((tag, idx) => <Text key={idx} style={styles.tagText}>#{tag}</Text>)}
                        {attrExtra > 0 && <Text style={styles.tagText}>+{attrExtra}</Text>}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            {selectedIndex === 0 && attractions.length > 3 && (
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
            {(selectedIndex === 0 ? attractions.slice(0, 3) : attractions).map((spot) => {
              const { visibleTags: spotTags, extraCount: spotExtra } = getProcessedTags(spot.tags);
              const spotAddrParts = spot.address.split(' ');
              if (spotAddrParts[0] && CITY_SHORT[spotAddrParts[0]]) spotAddrParts[0] = CITY_SHORT[spotAddrParts[0]];
              const spotShortAddr = spotAddrParts.slice(0, 2).join(' ');
              return (
                <TouchableOpacity
                  key={`spot-${spot.id}`}
                  style={styles.cardButton}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/PlaceDetailScreen', params: { id: spot.id, name: spot.name } })}
                >
                  <View style={styles.cardInner}>
                    <View style={styles.imageCircle} />
                    <View style={styles.infoContent}>
                      <Text style={styles.courseTitle} numberOfLines={1}>{spot.name}</Text>
                      <View style={styles.metadataRow}>
                        <View style={styles.metaChip}>
                          <Text style={styles.metadataText}>{spotShortAddr}</Text>
                          {spot.like_count != null && <Text style={styles.divider}>|</Text>}
                        </View>
                        {spot.like_count != null && (
                          <View style={styles.metaChip}>
                            <Heart size={16} color={Colors.light.grayDark} strokeWidth={2} />
                            <Text style={styles.metadataText}> {formatLikeCount(spot.like_count)}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.tagRow}>
                        {spotTags.map((tag, idx) => <Text key={idx} style={styles.tagText}>#{tag}</Text>)}
                        {spotExtra > 0 && <Text style={styles.tagText}>+{spotExtra}</Text>}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            {selectedIndex === 0 && attractions.length > 3 && (
              <TouchableOpacity style={styles.moreButton} onPress={() => handleTabPress(3)}>
                <Text style={styles.moreButtonText}>더보기</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {searchKeyword.length > 0 && (
          (selectedIndex === 0 && courses.length === 0 && attractions.length === 0) ||
          (selectedIndex === 1 && courses.length === 0) ||
          (selectedIndex === 2 && attractions.length === 0) ||
          (selectedIndex === 3 && attractions.length === 0)
        ) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>검색 결과가 없습니다.</Text>
            <Text style={styles.emptyDesc}>검색어가 정확한지 확인해주세요.</Text>
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
    minHeight: 106,
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
  metadataRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: 4, marginBottom: 4 },
  metadataText: { ...Typography.subtitle1, color: Colors.light.grayDark },
  divider: { marginHorizontal: 4, color: Colors.light.grayLight },
  iconGroup: { flexDirection: 'row', alignItems: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center' },
  iconValue: { ...Typography.subtitle1, color: Colors.light.grayDark, marginLeft: 2 },
  tagRow: { flexDirection: 'row', alignItems: 'center' },
  tagText: { ...Typography.body2, color: Colors.light.primary, marginRight: 4 },
  
  // 🚀 상단 항목(카드)에서 16pt 떨어지도록 설정
  // 카드의 marginBottom(16)과 moreButton의 marginTop(0)이 합쳐져 16pt 유지
  emptyState: {
    paddingTop: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
  },
  emptyDesc: {
    ...Typography.body2,
    color: Colors.light.grayLight,
    marginTop: 16,
  },
  moreButton: { marginTop: 0, alignSelf: 'flex-end', marginRight: 16, paddingVertical: 8 },
  moreButtonText: { ...Typography.button4, color: Colors.light.primary }
});

export default SearchResultScreen;