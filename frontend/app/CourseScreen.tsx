import { LinearGradient } from 'expo-linear-gradient';
import { SORT_OPTIONS, SortAlert, SortOption } from '@/components/modals/SortAlert';
import SearchBar from '@/components/ui/SearchBar';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CITY_SHORT, MEDIA_TYPE_LABEL } from '@/constants/labels';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { sortByOption } from '@/utils/sortByOption';
import { useRouter } from 'expo-router';
import { ArrowUpDown, Heart, Star, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView, { PagerViewHandle } from '@/components/ui/PagerViewWrapper';
import { mediaApi, placeApi } from '../services/api';
import type { Media, Place, Tag } from '../services/types';
import { Size } from '@/constants/Size';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THEME_IMAGE_WIDTH = SCREEN_WIDTH - Spacing.h.medium * 4;
const THEME_IMAGE_HEIGHT = Math.round(THEME_IMAGE_WIDTH * 3 / 4);
const THEME_CARD_CONTENT_WIDTH = SCREEN_WIDTH - Spacing.h.medium * 4;
const THEME_CARD_IMAGE_WIDTH = Math.round(THEME_CARD_CONTENT_WIDTH * 0.42);
const THEME_CARD_IMAGE_HEIGHT = Math.round(THEME_CARD_IMAGE_WIDTH * 3 / 4);
const COURSE_ITEM_WIDTH = Math.round(SCREEN_WIDTH * 0.4);
const COURSE_ITEM_HEIGHT = Math.round(COURSE_ITEM_WIDTH * 3 / 4);
const PHOTO_SPOT_CARD_WIDTH = (SCREEN_WIDTH - Spacing.h.medium * 3) / 2;
const PHOTO_SPOT_IMAGE_HEIGHT = Math.round(PHOTO_SPOT_CARD_WIDTH * 3 / 4);
const TAB_BAR_HEIGHT = Typography.subtitle1.lineHeight + Spacing.v.small * 2;

const CATEGORIES = ['추천', '유튜브 PICK', '드라마 PICK', '영화 PICK', '포토스팟'];
const COURSE_SORT_OPTIONS = SORT_OPTIONS.filter(option => option !== '관련도 높은 순');
const PLACE_COUNT_SORT_OPTIONS: SortOption[] = ['장소 많은 순', '장소 적은 순'];
const PHOTO_TAGS = ['자연', '음식', '풍경', '야경', '감성', '카페', '도심', '계절'];

const formatLikeCount = (count: number): string => {
  if (count < 100) return count.toString();
  return (Math.floor(count / 100) * 100).toLocaleString() + '+';
};

const getProcessedTags = (tags: Tag[] = []) => {
  const names = tags.map(t => t.name);
  const visibleTags = names.slice(0, 3);
  const extraCount = names.length - 3;
  return { visibleTags, extraCount };
};

const hasHypeTag = (media: Media): boolean =>
  media.tags.some(tag => tag.name.toLowerCase() === 'hype');

const getThemeCardTitle = (media: Media, region?: string): string => {
  const label = MEDIA_TYPE_LABEL[media.media_type] ?? media.media_type;
  const lastCode = label.charCodeAt(label.length - 1);
  const hasBatchim = (lastCode - 0xAC00) % 28 !== 0;
  const particle = hasBatchim ? '으로' : '로';
  const place = region ?? media.tags.find(t => t.category === 'place_type')?.name ?? '';
  return place ? `${label}${particle} 보는 ${place}` : `${label}${particle} 보는 코스`;
};

const CourseScreen = () => {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>(COURSE_SORT_OPTIONS[0]);
  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const tabLayouts = useRef<{ x: number; width: number }[]>([]);
  const pagerRef = useRef<PagerViewHandle>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const [uniformTabWidth, setUniformTabWidth] = useState<number | null>(null);
  const rawWidths = useRef<number[]>(new Array(CATEGORIES.length).fill(0));
  const widthMeasured = useRef(false);

  const handleTabLayout = (index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };

    if (!widthMeasured.current) {
      rawWidths.current[index] = width;
      if (rawWidths.current.every(w => w > 0)) {
        widthMeasured.current = true;
        setUniformTabWidth(Math.max(...rawWidths.current));
      }
    }

    if (index === selectedIndex) {
      translateX.setValue(x);
      indicatorWidth.setValue(width);
    }
  };

  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const [youtubeMedia, setYoutubeMedia] = useState<Media[]>([]);
  const [dramaMedia, setDramaMedia] = useState<Media[]>([]);
  const [movieMedia, setMovieMedia] = useState<Media[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [themeRegions, setThemeRegions] = useState<Record<number, string>>({});
  const [pickCardImages, setPickCardImages] = useState<Record<number, string[]>>({});
  const [pickCardPlaceCounts, setPickCardPlaceCounts] = useState<Record<number, number>>({});
  const [savedPlaces, setSavedPlaces] = useState<Record<number, boolean>>({});
  const [selectedPhotoTag, setSelectedPhotoTag] = useState<string | null>(null);
  const [placePhotoId, setPlacePhotoId] = useState<Record<number, number>>({});

  useEffect(() => {
    mediaApi.getList().then(res => setAllMedia(res.data.results)).catch(() => {});
    mediaApi.getList({ type: 'youtube' }).then(res => setYoutubeMedia(res.data.results)).catch(() => {});
    mediaApi.getList({ type: 'drama' }).then(res => setDramaMedia(res.data.results)).catch(() => {});
    mediaApi.getList({ type: 'movie' }).then(res => setMovieMedia(res.data.results)).catch(() => {});
    placeApi.getList().then(res => {
      setPlaces(res.data.results);
      const map: Record<number, boolean> = {};
      res.data.results.forEach(p => { map[p.id] = p.is_bookmarked; });
      setSavedPlaces(map);

      Promise.all(res.data.results.map(p => placeApi.getPhotos(p.id).then(r => ({ placeId: p.id, photo: r.data[0] }))))
        .then(entries => {
          const photoMap: Record<number, number> = {};
          entries.forEach(({ placeId, photo }) => { if (photo) photoMap[placeId] = photo.id; });
          setPlacePhotoId(photoMap);
        })
        .catch(() => {});
    }).catch(() => {});
  }, []);

  const toggleSavedPlace = async (placeId: number) => {
    const isSavedNow = savedPlaces[placeId];
    try {
      if (isSavedNow) await placeApi.unbookmark(placeId);
      else await placeApi.bookmark(placeId);
      setSavedPlaces(prev => ({ ...prev, [placeId]: !prev[placeId] }));
      setPlaces(prev => prev.map(p => p.id === placeId
        ? { ...p, like_count: (p.like_count ?? 0) + (isSavedNow ? -1 : 1) }
        : p
      ));
    } catch {}
  };

  useEffect(() => {
    [allMedia[1], allMedia[5]].forEach(media => {
      if (!media) return;
      mediaApi.getPlaces(media.id).then(res => {
        if (res.data.length > 0) {
          const city = res.data[0].place.address.split(' ')[0];
          setThemeRegions(prev => ({ ...prev, [media.id]: CITY_SHORT[city] ?? city }));
        }
      }).catch(() => {});
    });
  }, [allMedia]);

  useEffect(() => {
    [...youtubeMedia, ...dramaMedia, ...movieMedia].forEach(media => {
      mediaApi.getPlaces(media.id).then(res => {
        const images = res.data.map(mp => mp.place.image_url).filter(Boolean);
        setPickCardImages(prev => ({ ...prev, [media.id]: images }));
        setPickCardPlaceCounts(prev => ({ ...prev, [media.id]: res.data.length }));
      }).catch(() => {});
    });
  }, [youtubeMedia, dramaMedia, movieMedia]);

  const animateIndicatorTo = (index: number) => {
    const layout = tabLayouts.current[index];
    if (!layout) return;
    Animated.spring(translateX, {
      toValue: layout.x,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
    Animated.spring(indicatorWidth, {
      toValue: layout.width,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  };

  const scrollTabIntoView = (index: number) => {
    const layout = tabLayouts.current[index];
    if (!layout) return;
    const targetX = Math.max(0, layout.x + layout.width / 2 - SCREEN_WIDTH / 2);
    tabScrollRef.current?.scrollTo({ x: targetX, animated: true });
  };

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const index = e.nativeEvent.position;
    setSelectedIndex(index);
    animateIndicatorTo(index);
    scrollTabIntoView(index);
  };

  const getPickCardPlaceCount = (m: Media) => pickCardPlaceCounts[m.id] ?? m.place_count;
  const sortedYoutubeMedia = sortByOption(youtubeMedia, sortOption, m => m.title, getPickCardPlaceCount);
  const sortedDramaMedia = sortByOption(dramaMedia, sortOption, m => m.title, getPickCardPlaceCount);
  const sortedMovieMedia = sortByOption(movieMedia, sortOption, m => m.title, getPickCardPlaceCount);
  const sortedPlaces = sortByOption(places, sortOption, p => p.name);
  const filteredPlaces = selectedPhotoTag
    ? sortedPlaces.filter(p => p.tags.some(t => t.name === selectedPhotoTag))
    : sortedPlaces;

  const renderThemeCourseCard = (item: Media) => {
    const { visibleTags, extraCount } = getProcessedTags(item.tags);
    return (
      <TouchableOpacity
        key={`theme-course-${item.id}`}
        style={styles.themeCourseBox}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: item.id, title: item.title } })}
      >
        <Text style={styles.themeCourseBoxTitle}>{getThemeCardTitle(item, themeRegions[item.id])}</Text>
        <View style={styles.themeCourseRow}>
          <View style={styles.themeCourseImageBox}>
            <Image
              source={{ uri: item.thumbnail_url ?? undefined }}
              style={styles.themeCourseImageFill}
              resizeMode="cover"
            />
          </View>
          <View style={styles.themeCourseContent}>
            <Text style={styles.themeCourseTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.themeCourseMetaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.themeCourseMetaText}>{MEDIA_TYPE_LABEL[item.media_type] ?? item.media_type}</Text>
                {(item.place_count != null || item.rating != null || item.like_count != null) && <TextSeparator />}
              </View>
              {item.place_count != null && (
                <View style={styles.metaChip}>
                  <Text style={styles.themeCourseMetaText}>{item.place_count}개 장소</Text>
                  {(item.rating != null || item.like_count != null) && <TextSeparator />}
                </View>
              )}
              {(item.rating != null || item.like_count != null) && (
                <View style={styles.metaChip}>
                  {item.rating != null && (
                    <>
                      <Star size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                      <Text style={styles.themeCourseMetaText}> {item.rating.toFixed(1)}</Text>
                    </>
                  )}
                  {item.rating != null && item.like_count != null && <TextSeparator />}
                  {item.like_count != null && (
                    <>
                      <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                      <Text style={styles.themeCourseMetaText}> {formatLikeCount(item.like_count)}</Text>
                    </>
                  )}
                </View>
              )}
            </View>
            <View style={styles.themeCourseTagRow}>
              {visibleTags.map((tag, idx) => <Text key={idx} style={styles.themeCourseTagText}>#{tag}</Text>)}
              {extraCount > 0 && <Text style={styles.themeCourseTagText}>+{extraCount}</Text>}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPickCard = (item: Media) => {
    const slideImages = pickCardImages[item.id] ?? [];
    const placeCount = pickCardPlaceCounts[item.id] ?? item.place_count;
    const isHype = hasHypeTag(item);
    return (
      <View key={`pick-card-${item.id}`} style={styles.pickCardWrapper}>
        {isHype && (
          <View style={styles.hypeBadge}>
            <Text style={styles.hypeBadgeText}>HYPE</Text>
          </View>
        )}
        <View style={[styles.pickCardBox, isHype && styles.pickCardBoxHype]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: item.id, title: item.title } })}
        >
          <Text style={styles.pickCardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.metadataRow, styles.pickCardMetaRow]}>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>{MEDIA_TYPE_LABEL[item.media_type] ?? item.media_type}</Text>
              {(placeCount != null || item.rating != null || item.like_count != null) && <TextSeparator />}
            </View>
            {placeCount != null && (
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>{placeCount}개 장소</Text>
                {(item.rating != null || item.like_count != null) && <TextSeparator />}
              </View>
            )}
            {(item.rating != null || item.like_count != null) && (
              <View style={styles.metaChip}>
                {item.rating != null && (
                  <>
                    <Star size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                    <Text style={styles.metaText}> {item.rating.toFixed(1)}</Text>
                  </>
                )}
                {item.rating != null && item.like_count != null && <TextSeparator />}
                {item.like_count != null && (
                  <>
                    <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                    <Text style={styles.metaText}> {formatLikeCount(item.like_count)}</Text>
                  </>
                )}
              </View>
            )}
          </View>
          <View style={styles.pickCardTitleImageWrapper}>
            <Image
              source={{ uri: item.thumbnail_url ?? undefined }}
              style={styles.pickCardTitleImage}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
        {slideImages.length > 0 && (
          <FlatList
            data={slideImages}
            renderItem={({ item: uri }) => (
              <View style={styles.pickCardSlideImageWrapper}>
                <Image source={{ uri }} style={styles.pickCardSlideImage} resizeMode="cover" />
              </View>
            )}
            keyExtractor={(uri, idx) => `pick-card-${item.id}-slide-${idx}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pickCardSlideContent}
            style={styles.pickCardSlideList}
          />
        )}
        </View>
      </View>
    );
  };

  const renderPhotoSpotCard = (item: Place) => {
    const { visibleTags, extraCount } = getProcessedTags(item.tags);
    return (
      <TouchableOpacity
        key={`photo-spot-card-${item.id}`}
        style={styles.photoSpotCard}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/PhotoSpotDetailScreen', params: { id: placePhotoId[item.id] ?? item.id, name: item.name } })}
      >
        <View style={styles.photoSpotImageWrapper}>
          <Image
            source={{ uri: item.image_url ?? undefined }}
            style={styles.photoSpotImage}
            resizeMode="cover"
          />
          {(item.rating != null || item.like_count != null) && (
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.photoSpotGradient}>
              <View style={styles.photoSpotInfoOverlay}>
                {item.rating != null && (
                  <>
                    <Star size={IconSize.xsmall} color={Colors.light.white} strokeWidth={IconStroke.regular} />
                    <Text style={styles.photoSpotInfoText}> {item.rating.toFixed(1)}</Text>
                  </>
                )}
                {item.rating != null && item.like_count != null && <TextSeparator color={Colors.light.white} />}
                {item.like_count != null && (
                  <>
                    <Heart size={IconSize.xsmall} color={Colors.light.white} strokeWidth={IconStroke.regular} />
                    <Text style={styles.photoSpotInfoText}> {formatLikeCount(item.like_count)}</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          )}
          <TouchableOpacity
            style={styles.photoSpotSaveButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => toggleSavedPlace(item.id)}
          >
            <Heart
              size={IconSize.large}
              color={savedPlaces[item.id] ? '#F24C54' : Colors.light.white}
              fill={savedPlaces[item.id] ? '#F24C54' : 'none'}
              strokeWidth={IconStroke.regular}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.photoSpotInfoBox}>
          <Text style={styles.photoSpotTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.photoSpotTagRow}>
            {visibleTags.map((tag, idx) => <Text key={idx} style={styles.photoSpotTagText}>#{tag}</Text>)}
            {extraCount > 0 && <Text style={styles.photoSpotTagText}>+{extraCount}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPhotoTagItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.photoTagItemContainer}
      activeOpacity={0.7}
      onPress={() => setSelectedPhotoTag(item)}
    >
      <View style={styles.photoTagCircle} />
      <Text style={styles.photoTagTitleText} numberOfLines={1}>{item}</Text>
    </TouchableOpacity>
  );

  const renderPhotoTagSection = (marginTop: number, keyPrefix: string) =>
    selectedPhotoTag ? (
      <View style={[styles.photoTagPillBox, { marginTop }]}>
        <View style={styles.photoTagPillLeftGroup}>
          <Text style={styles.photoTagPillTitle} numberOfLines={1}>{selectedPhotoTag}</Text>
          <View style={styles.photoTagPillImageBox}>
            <Image source={{ uri: undefined }} style={styles.photoTagPillImage} resizeMode="cover" />
          </View>
          <Text style={styles.photoTagPillSubtitle} numberOfLines={1}>태그 선택</Text>
        </View>
        <TouchableOpacity onPress={() => setSelectedPhotoTag(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>
      </View>
    ) : (
      <View style={[styles.photoTagBox, { marginTop }]}>
        <Text style={styles.sectionTitleText}>인기 포토 태그</Text>
        <FlatList
          data={PHOTO_TAGS}
          renderItem={renderPhotoTagItem}
          keyExtractor={(item) => `${keyPrefix}-${item}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoTagListContent}
          style={styles.courseList}
        />
      </View>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrapper}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar
              onBackPress={() => router.back()}
              onPress={() => router.push('/SearchScreen')}
              placeholder="어디로 떠나볼까요?"
            />
          </View>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setIsSortVisible(true)}
            activeOpacity={selectedIndex === 0 ? 1 : 0.7}
            disabled={selectedIndex === 0}
          >
            <ArrowUpDown
              size={IconSize.large}
              color={selectedIndex === 0 ? Colors.light.grayLight : Colors.light.black}
              strokeWidth={IconStroke.regular}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabWrapper}>
        <View style={styles.backgroundLine} />
        <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.tabContainer}>
            {CATEGORIES.map((tab, index) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, uniformTabWidth ? { width: uniformTabWidth } : null]}
                onPress={() => handleTabPress(index)}
                onLayout={(e) => handleTabLayout(index, e)}
              >
                <Text style={[styles.tabText, { color: selectedIndex === index ? Colors.light.black : Colors.light.grayLight }]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
            <Animated.View style={[styles.indicator, { width: indicatorWidth, transform: [{ translateX }] }]} />
          </View>
        </ScrollView>
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.mainContent}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {/* ── 전체 탭 ── */}
        <ScrollView key="0" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* 이 달의 테마 박스 */}
        {allMedia[0] && (
          <TouchableOpacity
            style={styles.themeBox}
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: allMedia[0].id, title: allMedia[0].title } })}
          >
            <Text style={styles.themeTitle}>이 달의 코스 : {allMedia[0].title}</Text>
            <View style={styles.themeImageWrapper}>
              <Image
                source={{ uri: allMedia[0].thumbnail_url ?? undefined }}
                style={styles.themeImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.75)']}
                style={styles.themeGradient}
              >
                <View style={styles.themeInfoOverlay}>
                  <View style={styles.themeInfoRow}>
                    <Text style={styles.themeInfoText}>
                      {MEDIA_TYPE_LABEL[allMedia[0].media_type] ?? allMedia[0].media_type}
                    </Text>
                    {allMedia[0].place_count != null && (
                      <>
                        <TextSeparator color={Colors.light.white} />
                        <Text style={styles.themeInfoText}>{allMedia[0].place_count}개 장소</Text>
                      </>
                    )}
                    {allMedia[0].rating != null && (
                      <>
                        <TextSeparator color={Colors.light.white} />
                        <Star size={IconSize.xsmall} color={Colors.light.white} strokeWidth={IconStroke.regular} />
                        <Text style={styles.themeInfoText}> {allMedia[0].rating.toFixed(1)}</Text>
                      </>
                    )}
                    {allMedia[0].like_count != null && (
                      <>
                        <TextSeparator color={Colors.light.white} />
                        <Heart size={IconSize.xsmall} color={Colors.light.white} strokeWidth={IconStroke.regular} />
                        <Text style={styles.themeInfoText}> {formatLikeCount(allMedia[0].like_count)}</Text>
                      </>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        )}

        {/* 테마 코스 카드 2개 */}
        {allMedia[1] && renderThemeCourseCard(allMedia[1])}
        {allMedia[5] && renderThemeCourseCard(allMedia[5])}

        {/* 포토태그 */}
        {renderPhotoTagSection(Spacing.v.large, 'photo')}

        {/* 실시간 인기 코스 */}
        <View style={[styles.sectionTitleContainer, { marginTop: Spacing.v.large }]}>
          <Text style={styles.sectionTitleText}>실시간 인기 코스</Text>
        </View>
        <FlatList
          data={allMedia.slice(0, 4)}
          renderItem={renderCourseItem}
          keyExtractor={(item) => `popular-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseListContent}
          style={styles.courseList}
        />

        {/* 맞춤형 여행 코스 */}
        <View style={[styles.sectionTitleContainer, { marginTop: Spacing.v.large }]}>
          <Text style={styles.sectionTitleText}>맞춤형 여행 코스</Text>
        </View>
        <FlatList
          data={allMedia.slice(4, 8)}
          renderItem={renderCourseItem}
          keyExtractor={(item) => `recommended-${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courseListContent}
          style={styles.courseList}
        />
        </ScrollView>

        {/* ── 유튜브 PICK 탭 ── */}
        <ScrollView key="1" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {youtubeMedia.length > 0 ? (
            <View>
              {sortedYoutubeMedia.map(item => renderPickCard(item))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>유튜브 코스가 존재하지 않습니다.</Text>
              <Text style={styles.emptyDesc}>다른 탭을 확인해주세요.</Text>
            </View>
          )}
        </ScrollView>

        {/* ── 드라마 PICK 탭 ── */}
        <ScrollView key="2" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {dramaMedia.length > 0 ? (
            <View>
              {sortedDramaMedia.map(item => renderPickCard(item))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>드라마 코스가 존재하지 않습니다.</Text>
              <Text style={styles.emptyDesc}>다른 탭을 확인해주세요.</Text>
            </View>
          )}
        </ScrollView>

        {/* ── 영화 PICK 탭 ── */}
        <ScrollView key="3" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {movieMedia.length > 0 ? (
            <View>
              {sortedMovieMedia.map(item => renderPickCard(item))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>영화 코스가 존재하지 않습니다.</Text>
              <Text style={styles.emptyDesc}>다른 탭을 확인해주세요.</Text>
            </View>
          )}
        </ScrollView>

        {/* ── 포토스팟 탭 ── */}
        <ScrollView key="4" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {renderPhotoTagSection(Spacing.v.medium, 'photo-spot-theme')}
          {filteredPlaces.length > 0 ? (
            <View style={styles.photoSpotGrid}>
              {filteredPlaces.map(item => renderPhotoSpotCard(item))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              {selectedPhotoTag ? (
                <>
                  <Text style={styles.emptyTitle}>해당 태그의 포토스팟이 없습니다.</Text>
                  <Text style={styles.emptyDesc}>다른 태그를 확인해보세요.</Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>포토스팟이 존재하지 않습니다.</Text>
                  <Text style={styles.emptyDesc}>다른 탭를 확인해보세요.</Text>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </PagerView>
      <SortAlert
        visible={isSortVisible}
        options={COURSE_SORT_OPTIONS}
        disabledOptions={selectedIndex === 4 ? PLACE_COUNT_SORT_OPTIONS : undefined}
        selected={sortOption}
        onClose={() => setIsSortVisible(false)}
        onSelect={setSortOption}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerWrapper: { paddingBottom: Spacing.v.small },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  sortButton: { marginRight: Spacing.h.medium },
  tabWrapper: { position: 'relative' },
  backgroundLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Spacing.lw.small, backgroundColor: Colors.light.grayLight },
  tabScroll: { height: TAB_BAR_HEIGHT },
  tabContainer: { flexDirection: 'row', position: 'relative' },
  tabItem: { justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.v.small, paddingHorizontal: Spacing.h.medium },
  tabText: { ...Typography.subtitle1 },
  indicator: { position: 'absolute', bottom: 0, left: 0, height: Spacing.lw.small, backgroundColor: Colors.light.black, zIndex: 1 },
  mainContent: { flex: 1 },
  scrollContainer: { paddingBottom: Spacing.v.screenBottom },
  themeBox: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    paddingTop: Spacing.v.medium,
    paddingBottom: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
  },
  themeTitle: {
    paddingLeft: Spacing.h.medium,
    ...Typography.title1,
    color: Colors.light.black,
  },
  themeImageWrapper: {
    marginTop: Spacing.h.small,
    marginHorizontal: Spacing.h.medium,
    height: THEME_IMAGE_HEIGHT,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  themeImage: {
    width: '100%',
    height: '100%',
  },
  themeGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },
  themeInfoOverlay: {
    padding: Spacing.h.small,
  },
  themeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeInfoText: {
    ...Typography.body2,
    color: Colors.light.white,
  },
  card: {
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
  cardTitle: { ...Typography.title1, color: Colors.light.black, marginBottom: Spacing.h.xsmall },
  metadataRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: Spacing.h.xsmall, marginBottom: Spacing.h.xsmall },
  metaText: { ...Typography.subtitle1, color: Colors.light.grayDark },
  metaChip: { flexDirection: 'row', alignItems: 'center' },
  tagRow: { flexDirection: 'row', alignItems: 'center' },
  tagText: { ...Typography.body2, color: Colors.light.primary, marginRight: Spacing.h.xsmall },
  emptyState: { paddingTop: Spacing.v.medium, alignItems: 'center' },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  emptyDesc: { ...Typography.body2, color: Colors.light.grayLight, marginTop: Spacing.v.medium },
  themeCourseBox: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.v.medium,
  },
  themeCourseBoxTitle: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  themeCourseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.v.small,
  },
  themeCourseImageBox: {
    width: THEME_CARD_IMAGE_WIDTH,
    height: THEME_CARD_IMAGE_HEIGHT,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  themeCourseImageFill: {
    width: '100%',
    height: '100%',
  },
  themeCourseContent: {
    flex: 1,
    marginLeft: Spacing.h.small,
  },
  themeCourseTitle: {
    ...Typography.title2,
    color: Colors.light.black,
  },
  themeCourseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: Spacing.h.xsmall,
    marginTop: Spacing.v.small,
  },
  themeCourseMetaText: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
  },
  themeCourseTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.v.small,
  },
  themeCourseTagText: {
    ...Typography.body2,
    color: Colors.light.primary,
    marginRight: Spacing.h.xsmall,
  },
  pickCardWrapper: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  pickCardBox: {
    padding: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
  },
  pickCardBoxHype: {
    borderWidth: 4,
    borderColor: Colors.light.primary,
    borderTopLeftRadius: 0,
  },
  hypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.h.small,
    paddingVertical: Spacing.h.xsmall,
    backgroundColor: Colors.light.primary,
    borderTopLeftRadius: Spacing.r.small,
    borderTopRightRadius: Spacing.r.small,
  },
  hypeBadgeText: {
    ...Typography.subtitle2,
    color: Colors.light.white,
  },
  pickCardTitle: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  pickCardTitleImageWrapper: {
    marginTop: Spacing.v.medium,
    width: '100%',
    height: THEME_IMAGE_HEIGHT,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  pickCardTitleImage: {
    width: '100%',
    height: '100%',
  },
  pickCardSlideList: {
    marginTop: Spacing.v.medium,
  },
  pickCardSlideContent: {
    gap: Spacing.h.small,
  },
  pickCardSlideImageWrapper: {
    width: THEME_CARD_IMAGE_WIDTH,
    height: THEME_CARD_IMAGE_HEIGHT,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  pickCardSlideImage: {
    width: '100%',
    height: '100%',
  },
  pickCardMetaRow: {
    marginTop: Spacing.v.small,
  },
  sectionTitleContainer: {
    marginTop: Spacing.v.large,
    paddingLeft: Spacing.h.medium,
  },
  sectionTitleText: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  courseList: {
    marginTop: Spacing.v.medium,
  },
  courseListContent: {
    paddingHorizontal: Spacing.h.medium,
    gap: Spacing.h.medium,
  },
  courseItemContainer: {
    width: COURSE_ITEM_WIDTH,
  },
  courseImageWrapper: {
    width: COURSE_ITEM_WIDTH,
    height: COURSE_ITEM_HEIGHT,
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
  photoTagBox: {
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
    padding: Spacing.v.medium,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
  },
  photoTagListContent: {
    gap: Spacing.h.medium,
  },
  photoTagPillBox: {
    marginHorizontal: Spacing.h.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.v.medium,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: 999,
  },
  photoTagPillLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  photoTagPillTitle: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  photoTagPillImageBox: {
    marginLeft: Spacing.h.small,
    width: IconSize.large,
    height: IconSize.large,
    borderRadius: IconSize.large / 2,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  photoTagPillImage: {
    width: '100%',
    height: '100%',
  },
  photoTagPillSubtitle: {
    marginLeft: Spacing.h.small,
    ...Typography.subtitle2,
    color: Colors.light.grayDark,
  },
  photoTagItemContainer: {
    alignItems: 'center',
    width: Size.circleMd,
  },
  photoTagCircle: {
    width: Size.circleMd,
    height: Size.circleMd,
    borderRadius: Size.circleMd / 2,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  photoTagTitleText: {
    marginTop: Spacing.v.small,
    ...Typography.button4,
    color: Colors.light.grayDark,
    textAlign: 'center',
  },
  photoSpotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.h.medium,
    paddingTop: Spacing.v.medium,
    columnGap: Spacing.h.medium,
    rowGap: Spacing.v.medium,
  },
  photoSpotCard: {
    width: PHOTO_SPOT_CARD_WIDTH,
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  photoSpotImageWrapper: {
    width: '100%',
    height: PHOTO_SPOT_IMAGE_HEIGHT,
    borderTopLeftRadius: Spacing.r.small,
    borderTopRightRadius: Spacing.r.small,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  photoSpotImage: {
    width: '100%',
    height: '100%',
  },
  photoSpotSaveButton: {
    position: 'absolute',
    top: Spacing.h.small,
    right: Spacing.h.small,
  },
  photoSpotGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },
  photoSpotInfoOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.h.small,
    paddingBottom: Spacing.h.small,
  },
  photoSpotInfoText: {
    ...Typography.subtitle1,
    color: Colors.light.white,
  },
  photoSpotInfoBox: {
    padding: Spacing.h.small,
  },
  photoSpotTitle: {
    ...Typography.title2,
    color: Colors.light.black,
  },
  photoSpotTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.h.small,
  },
  photoSpotTagText: {
    ...Typography.body2,
    color: Colors.light.primary,
    marginRight: Spacing.h.xsmall,
  },
});

export default CourseScreen;
