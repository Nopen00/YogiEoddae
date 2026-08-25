import { useLocalSearchParams, useRouter } from 'expo-router';
import { AddPlaceConfirmAlert } from '@/components/modals/AddPlaceConfirmAlert';
import { CourseSelectPopup } from '@/components/modals/CourseSelectPopup';
import { SORT_OPTIONS, SortAlert, SortOption } from '@/components/modals/SortAlert';
import { getProcessedTags } from '@/utils/getProcessedTags';
import { sortByOption } from '@/utils/sortByOption';
import { ArrowUpDown, Heart, Star } from 'lucide-react-native';
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
import PagerView, { PagerViewHandle } from '@/components/ui/PagerViewWrapper';

// 디자인 시스템 임포트
import { Divider } from '@/components/ui/Divider';
import { PlaceThumb } from '@/components/ui/PlaceThumb';
import { TextSeparator } from '@/components/ui/TextSeparator';
import SearchBar from '@/components/ui/SearchBar';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CATEGORY_LABEL, MEDIA_TYPE_LABEL, shortAddress } from '@/constants/labels';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { mediaApi, placeApi, photoApi, scheduleApi } from '../services/api';
import type { Media, Place } from '../services/types';
import { logEvent } from '@/services/logger';

const CATEGORIES = ["전체", "코스", "명소", "포토스팟"];
const PLACE_COUNT_SORT_OPTIONS: SortOption[] = ['장소 많은 순', '장소 적은 순'];

interface PhotoSpotCardData {
  id: number;
  name: string;
  image_url: string;
  rating: number;
  like_count: number;
  tags: string[];
}

const formatLikeCount = (count: number): string => {
  if (count < 100) return count.toString();
  return (Math.floor(count / 100) * 100).toLocaleString() + '+';
};

const { width } = Dimensions.get('window');
const TAB_WIDTH = width / CATEGORIES.length;

const SearchResultScreen = () => {
  const router = useRouter();
  const { keyword: initialKeyword, mode, scheduleId, dayNumber } = useLocalSearchParams<{ keyword: string; mode?: string; scheduleId?: string; dayNumber?: string }>();
  const isAddPlaceMode = mode === 'addPlace';
  const [placePopupVisible, setPlacePopupVisible] = useState(isAddPlaceMode);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isPlaceConfirmVisible, setIsPlaceConfirmVisible] = useState(false);
  
  const [inputText, setInputText] = useState(initialKeyword || '');
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword || '');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef<PagerViewHandle>(null);
  const [courses, setCourses] = useState<Media[]>([]);
  const [attractions, setAttractions] = useState<Place[]>([]);
  const [photoSpots, setPhotoSpots] = useState<PhotoSpotCardData[]>([]);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('관련도 높은 순');

  useEffect(() => {
    if (!searchKeyword) return;
    // "#국밥"처럼 #으로 시작하면 이름/설명이 아니라 태그로 검색한다.
    const isTagSearch = searchKeyword.startsWith('#');
    const trimmedTag = searchKeyword.slice(1).trim();
    if (isTagSearch && !trimmedTag) return;
    const query: { keyword?: string; tag?: string } = isTagSearch ? { tag: trimmedTag } : { keyword: searchKeyword };

    mediaApi.getList(query).then(res => setCourses(res.data.results)).catch((e) => console.error('media error:', e));
    placeApi.getList(query).then(res => setAttractions(res.data.results)).catch((e) => console.error('place error:', e));
    photoApi.getList(query).then(res => {
      setPhotoSpots(res.data.results.map(photo => ({
        id: photo.id,
        name: photo.description,
        image_url: photo.image_url,
        rating: photo.rating ?? 0,
        like_count: photo.likes,
        tags: photo.tags.map(t => t.name),
      })));
    }).catch(err => logEvent('error', 'SearchResultScreen.tsx:84', err?.message || String(err)));
  }, [searchKeyword]);

  const handleSearch = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setSearchKeyword(trimmed);
  };

  const sortedCourses = sortByOption(courses, sortOption, c => c.title, c => c.place_count);
  const sortedAttractions = sortByOption(attractions, sortOption, a => a.name);
  const sortedPhotoSpots = sortByOption(photoSpots, sortOption, s => s.name);

  const animateIndicatorTo = (index: number) => {
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const index = e.nativeEvent.position;
    setSelectedIndex(index);
    animateIndicatorTo(index);
  };

  const renderCourseCard = (course: Media) => {
    const { visibleTags: courseTags, extraCount: courseExtra } = getProcessedTags(course.tags);
    return (
      <TouchableOpacity
        key={`course-${course.id}`}
        style={styles.cardButton}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: course.id, title: course.title } })}
      >
        <View style={styles.cardInner}>
          <PlaceThumb uri={course.thumbnail_url} style={styles.imageCircle} shape="circle" />
          <View style={styles.infoContent}>
            <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
            <View style={styles.metadataRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metadataText}>{MEDIA_TYPE_LABEL[course.media_type] ?? course.media_type}</Text>
                {(course.place_count != null || course.rating != null || course.like_count != null) && (
                  <TextSeparator />
                )}
              </View>
              {course.place_count != null && (
                <View style={styles.metaChip}>
                  <Text style={styles.metadataText}>{course.place_count}개 장소</Text>
                  {(course.rating != null || course.like_count != null) && (
                    <TextSeparator />
                  )}
                </View>
              )}
              {(course.rating != null || course.like_count != null) && (
                <View style={styles.metaChip}>
                  {course.rating != null && (
                    <>
                      <Star size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                      <Text style={styles.metadataText}> {course.rating.toFixed(1)}</Text>
                    </>
                  )}
                  {course.rating != null && course.like_count != null && (
                    <TextSeparator />
                  )}
                  {course.like_count != null && (
                    <>
                      <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
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
  };

  const renderAttractionCard = (attr: Place) => {
    const { visibleTags: attrTags, extraCount: attrExtra } = getProcessedTags(attr.tags);
    const shortAddr = shortAddress(attr.address);
    return (
      <TouchableOpacity
        key={`attr-${attr.id}`}
        style={styles.cardButton}
        activeOpacity={0.9}
        onPress={() => {
          if (isAddPlaceMode) {
            setSelectedPlace(attr);
            setPlacePopupVisible(false);
            setIsPlaceConfirmVisible(true);
          } else {
            router.push({ pathname: '/PlaceDetailScreen', params: { id: attr.id, name: attr.name } });
          }
        }}
      >
        <View style={styles.cardInner}>
          <PlaceThumb uri={attr.image_url} style={styles.imageCircle} shape="circle" />
          <View style={styles.infoContent}>
            <Text style={styles.courseTitle} numberOfLines={1}>{attr.name}</Text>
            <View style={styles.metadataRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metadataText}>{CATEGORY_LABEL[attr.category] ?? attr.category}</Text>
                <TextSeparator />
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metadataText}>{shortAddr}</Text>
                {(attr.rating != null || attr.like_count != null) && (
                  <TextSeparator />
                )}
              </View>
              {(attr.rating != null || attr.like_count != null) && (
                <View style={styles.metaChip}>
                  {attr.rating != null && (
                    <>
                      <Star size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                      <Text style={styles.metadataText}> {attr.rating.toFixed(1)}</Text>
                    </>
                  )}
                  {attr.rating != null && attr.like_count != null && (
                    <TextSeparator />
                  )}
                  {attr.like_count != null && (
                    <>
                      <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
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
  };

  const renderSpotCard = (spot: PhotoSpotCardData) => (
    <TouchableOpacity
      key={`spot-${spot.id}`}
      style={styles.cardButton}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/PhotoSpotDetailScreen', params: { id: spot.id, name: spot.name } })}
    >
      <View style={styles.cardInner}>
        <PlaceThumb uri={spot.image_url} style={styles.imageCircle} shape="circle" />
        <View style={styles.infoContent}>
          <Text style={styles.courseTitle} numberOfLines={1}>{spot.name}</Text>
          <View style={styles.metadataRow}>
            <View style={styles.metaChip}>
              <Star size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
              <Text style={styles.metadataText}> {spot.rating.toFixed(1)}</Text>
              <TextSeparator />
              <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
              <Text style={styles.metadataText}> {formatLikeCount(spot.like_count)}</Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            {spot.tags.map((tag, idx) => <Text key={idx} style={styles.tagText}>#{tag}</Text>)}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrapper}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar value={inputText} onChangeText={setInputText} onBackPress={() => router.back()} onClearPress={() => router.back()} onSubmitEditing={handleSearch} returnKeyType="search" />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setIsSortVisible(true)} activeOpacity={0.7}>
            <ArrowUpDown size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
          </TouchableOpacity>
        </View>
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

      <PagerView ref={pagerRef} style={styles.mainContent} initialPage={0} onPageSelected={handlePageSelected}>
        {/* --- 0. 전체 --- */}
        <ScrollView key="0" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>코스</Text>
              <Divider marginTop={0} />
            </View>
            {sortedCourses.slice(0, 3).map(renderCourseCard)}
            {courses.length > 3 && (
              <TouchableOpacity style={styles.moreButton} onPress={() => handleTabPress(1)}>
                <Text style={styles.moreButtonText}>더보기</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.nextSectionWrapper}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>명소</Text>
              <Divider marginTop={0} />
            </View>
            {sortedAttractions.slice(0, 3).map(renderAttractionCard)}
            {attractions.length > 3 && (
              <TouchableOpacity style={styles.moreButton} onPress={() => handleTabPress(2)}>
                <Text style={styles.moreButtonText}>더보기</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.nextSectionWrapper}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>포토스팟</Text>
              <Divider marginTop={0} />
            </View>
            {sortedPhotoSpots.slice(0, 3).map(renderSpotCard)}
            {photoSpots.length > 3 && (
              <TouchableOpacity style={styles.moreButton} onPress={() => handleTabPress(3)}>
                <Text style={styles.moreButtonText}>더보기</Text>
              </TouchableOpacity>
            )}
          </View>

          {searchKeyword.length > 0 && courses.length === 0 && attractions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>검색 결과가 없습니다.</Text>
              <Text style={styles.emptyDesc}>검색어가 정확한지 확인해주세요.</Text>
            </View>
          )}
        </ScrollView>

        {/* --- 1. 코스 --- */}
        <ScrollView key="1" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          <View>
            {sortedCourses.map(renderCourseCard)}
          </View>
          {searchKeyword.length > 0 && courses.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>검색 결과가 없습니다.</Text>
              <Text style={styles.emptyDesc}>검색어가 정확한지 확인해주세요.</Text>
            </View>
          )}
        </ScrollView>

        {/* --- 2. 명소 --- */}
        <ScrollView key="2" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          <View>
            {sortedAttractions.map(renderAttractionCard)}
          </View>
          {searchKeyword.length > 0 && attractions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>검색 결과가 없습니다.</Text>
              <Text style={styles.emptyDesc}>검색어가 정확한지 확인해주세요.</Text>
            </View>
          )}
        </ScrollView>

        {/* --- 3. 포토스팟 --- */}
        <ScrollView key="3" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          <View>
            {sortedPhotoSpots.map(renderSpotCard)}
          </View>
        </ScrollView>
      </PagerView>
      <SortAlert
        visible={isSortVisible}
        options={SORT_OPTIONS}
        disabledOptions={selectedIndex === 3 ? PLACE_COUNT_SORT_OPTIONS : undefined}
        selected={sortOption}
        onClose={() => setIsSortVisible(false)}
        onSelect={setSortOption}
      />
      <CourseSelectPopup
        visible={placePopupVisible}
        label="일정으로 가져올 장소를 선택하세요."
        onClose={() => setPlacePopupVisible(false)}
        onBack={() => router.back()}
      />
      {selectedPlace && (
        <AddPlaceConfirmAlert
          visible={isPlaceConfirmVisible}
          place={selectedPlace}
          onClose={() => setIsPlaceConfirmVisible(false)}
          onBack={() => {
            setIsPlaceConfirmVisible(false);
            setPlacePopupVisible(true);
          }}
          onConfirm={async () => {
            if (!scheduleId) return;
            const dayNum = Number(dayNumber ?? 1);
            try {
              await scheduleApi.addPlace(Number(scheduleId), {
                place_id: selectedPlace.id,
                day_number: dayNum,
                order: 999,
              });
            } catch {}
            setIsPlaceConfirmVisible(false);
            router.back();
            router.back();
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerWrapper: { paddingBottom: Spacing.v.small },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  filterButton: { marginRight: Spacing.h.medium },
  tabContainer: { flexDirection: 'row', position: 'relative' },
  backgroundLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Spacing.lw.small, backgroundColor: Colors.light.grayLight },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.v.small },
  tabText: { ...Typography.subtitle1 },
  indicator: { position: 'absolute', bottom: 0, left: 0, height: Spacing.lw.small, backgroundColor: Colors.light.black, zIndex: 1 },
  mainContent: { flex: 1 },
  scrollContainer: { paddingTop: Spacing.v.medium, paddingBottom: Spacing.v.screenBottom },
  nextSectionWrapper: { marginTop: Spacing.v.large },
  sectionHeader: { paddingHorizontal: Spacing.h.medium, marginBottom: Spacing.v.medium },
  sectionTitle: { ...Typography.title1, color: Colors.light.black, marginBottom: Spacing.v.small },
  cardButton: {
    minHeight: 106,
    marginHorizontal: Spacing.h.medium,
    marginBottom: Spacing.v.medium,
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
    justifyContent: 'center',
  },
  cardInner: { flexDirection: 'row', alignItems: 'flex-start' },
  imageCircle: { width: Size.circleMd, height: Size.circleMd, borderRadius: Size.circleMd / 2, backgroundColor: Colors.light.grayLight },
  infoContent: { flex: 1, marginLeft: Spacing.h.medium },
  courseTitle: { ...Typography.title1, color: Colors.light.black, marginBottom: Spacing.h.xsmall },
  metadataRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: Spacing.h.xsmall, marginBottom: Spacing.h.xsmall },
  metadataText: { ...Typography.subtitle1, color: Colors.light.grayDark },
  iconGroup: { flexDirection: 'row', alignItems: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center' },
  iconValue: { ...Typography.subtitle1, color: Colors.light.grayDark, marginLeft: Spacing.h.xsmall },
  tagRow: { flexDirection: 'row', alignItems: 'center' },
  tagText: { ...Typography.body2, color: Colors.light.dark, marginRight: Spacing.h.xsmall },
  emptyState: {
    paddingTop: Spacing.v.medium,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
  },
  emptyDesc: {
    ...Typography.body2,
    color: Colors.light.grayLight,
    marginTop: Spacing.v.medium,
  },
  moreButton: { marginTop: 0, alignSelf: 'flex-end', marginRight: Spacing.h.medium, paddingVertical: Spacing.v.small },
  moreButtonText: { ...Typography.button4, color: Colors.light.dark }
});

export default SearchResultScreen;