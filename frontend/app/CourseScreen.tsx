import { LinearGradient } from 'expo-linear-gradient';
import { SORT_OPTIONS, SortAlert, SortOption } from '@/components/modals/SortAlert';
import { PlaceThumb } from '@/components/ui/PlaceThumb';
import SearchBar from '@/components/ui/SearchBar';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CITY_SHORT, MEDIA_TYPE_LABEL } from '@/constants/labels';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { getProcessedTags } from '@/utils/getProcessedTags';
import { sortByOption } from '@/utils/sortByOption';
import { useRouter } from 'expo-router';
import { ArrowUpDown, Edit2, Heart, Star, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  LayoutChangeEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView, { PagerViewHandle } from '@/components/ui/PagerViewWrapper';
import { BASE_URL, mediaApi, photoApi, placeApi } from '../services/api';
import type { Media, Photo } from '../services/types';
import { Size } from '@/constants/Size';

type PhotoSpotItem = Photo & { rating: number; like_count: number };

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
// 태그별 대표 이미지 무작위 선택 결과 캐시 — 앱 프로세스가 살아있는 동안(=이 모듈이
// 다시 로드되기 전까지) 유지된다. 앱을 완전히 종료했다 다시 켜면 초기화됨.
let photoTagThumbnailsCache: Record<string, string | undefined> | null = null;

const formatLikeCount = (count: number): string => {
  if (count < 100) return count.toString();
  return (Math.floor(count / 100) * 100).toLocaleString() + '+';
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
  const [popularMedia, setPopularMedia] = useState<Media[]>([]);
  const [youtubeMedia, setYoutubeMedia] = useState<Media[]>([]);
  const [dramaMedia, setDramaMedia] = useState<Media[]>([]);
  const [movieMedia, setMovieMedia] = useState<Media[]>([]);
  const [themeRegions, setThemeRegions] = useState<Record<number, string>>({});
  const [pickCardImages, setPickCardImages] = useState<Record<number, string[]>>({});
  const [pickCardPlaceCounts, setPickCardPlaceCounts] = useState<Record<number, number>>({});
  const [photoSpots, setPhotoSpots] = useState<PhotoSpotItem[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<Record<number, boolean>>({});
  const [selectedPhotoTag, setSelectedPhotoTag] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // TODO: 임시 디버그용 — 포토스팟이 안 불러와지는 원인 확인되면 제거
  const [photoLoadError, setPhotoLoadError] = useState<string | null>(null);

  const loadCourseData = async () => {
    const photoSpotsPromise = photoApi.getList().then(res => {
      setPhotoLoadError(null);
      const allPhotos: PhotoSpotItem[] = res.data.map(p => ({ ...p, rating: p.rating ?? 0, like_count: p.likes }));
      setPhotoSpots(allPhotos);
      const map: Record<number, boolean> = {};
      allPhotos.forEach(p => { map[p.id] = p.is_bookmarked ?? false; });
      setSavedPhotos(map);
    }).catch(err => {
      const detail = err?.response
        ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data).slice(0, 300)}`
        : (err?.message || String(err));
      setPhotoLoadError(`[${BASE_URL}/api/photos/] ${detail}`);
    });

    await Promise.all([
      mediaApi.getList().then(res => setAllMedia(res.data.results)).catch(() => {}),
      mediaApi.getList({ ordering: 'popular' }).then(res => setPopularMedia(res.data.results)).catch(() => {}),
      mediaApi.getList({ type: 'youtube' }).then(res => setYoutubeMedia(res.data.results)).catch(() => {}),
      mediaApi.getList({ type: 'drama' }).then(res => setDramaMedia(res.data.results)).catch(() => {}),
      mediaApi.getList({ type: 'movie' }).then(res => setMovieMedia(res.data.results)).catch(() => {}),
      photoSpotsPromise,
    ]);
  };

  useEffect(() => {
    loadCourseData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCourseData();
    setIsRefreshing(false);
  };

  const toggleSavedPhoto = async (photoId: number) => {
    const isSavedNow = savedPhotos[photoId];
    try {
      if (isSavedNow) await photoApi.unbookmark(photoId);
      else await photoApi.bookmark(photoId);
      setSavedPhotos(prev => ({ ...prev, [photoId]: !prev[photoId] }));
      setPhotoSpots(prev => prev.map(p => p.id === photoId
        ? { ...p, likes: p.likes + (isSavedNow ? -1 : 1), like_count: p.likes + (isSavedNow ? -1 : 1) }
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
  const sortedPhotoSpots = sortByOption(photoSpots, sortOption, p => p.description);
  const filteredPhotoSpots = selectedPhotoTag
    ? sortedPhotoSpots.filter(p => p.tags.some(t => t.name === selectedPhotoTag))
    : sortedPhotoSpots;

  // 태그별 대표 이미지 — 그 태그가 달린 포토스팟들 중 하나를 무작위로 골라서 보여준다.
  // photoTagThumbnailsCache(모듈 스코프)에 한 번 뽑히면 고정돼서, 새로고침/북마크
  // 토글/탭 전환으로는 안 바뀌고 앱을 완전히 껐다 켜야(=JS가 새로 로드돼야) 다시 뽑힌다.
  const [photoTagThumbnails, setPhotoTagThumbnails] = useState(photoTagThumbnailsCache ?? {});
  useEffect(() => {
    if (photoTagThumbnailsCache || photoSpots.length === 0) return;
    const map: Record<string, string | undefined> = {};
    PHOTO_TAGS.forEach(tag => {
      const matches = photoSpots.filter(p => p.image_url && p.tags.some(t => t.name === tag));
      if (matches.length > 0) {
        map[tag] = matches[Math.floor(Math.random() * matches.length)].image_url;
      }
    });
    photoTagThumbnailsCache = map;
    setPhotoTagThumbnails(map);
  }, [photoSpots]);

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
            <PlaceThumb uri={item.thumbnail_url} style={styles.themeCourseImageFill} />
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
            <PlaceThumb uri={item.thumbnail_url} style={styles.pickCardTitleImage} />
          </View>
        </TouchableOpacity>
        {slideImages.length > 0 && (
          <FlatList
            data={slideImages}
            renderItem={({ item: uri }) => (
              <View style={styles.pickCardSlideImageWrapper}>
                <PlaceThumb uri={uri} style={styles.pickCardSlideImage} />
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

  const renderPhotoSpotCard = (item: PhotoSpotItem) => {
    const { visibleTags, extraCount } = getProcessedTags(item.tags);
    return (
      <TouchableOpacity
        key={`photo-spot-card-${item.id}`}
        style={styles.photoSpotCard}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/PhotoSpotDetailScreen', params: { id: item.id, name: item.description } })}
      >
        <View style={styles.photoSpotImageWrapper}>
          <PlaceThumb uri={item.image_url} style={styles.photoSpotImage} />
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
            onPress={() => toggleSavedPhoto(item.id)}
          >
            <Heart
              size={IconSize.large}
              color={savedPhotos[item.id] ? Colors.light.heart : Colors.light.white}
              fill={savedPhotos[item.id] ? Colors.light.heart : 'none'}
              strokeWidth={IconStroke.regular}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.photoSpotInfoBox}>
          <Text style={styles.photoSpotTitle} numberOfLines={1}>{item.description}</Text>
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
      onPress={() => {
        setSelectedPhotoTag(item);
        handleTabPress(4);
      }}
    >
      <PlaceThumb uri={photoTagThumbnails[item]} style={styles.photoTagCircle} shape="circle" />
      <Text style={styles.photoTagTitleText} numberOfLines={1}>{item}</Text>
    </TouchableOpacity>
  );

  const renderPhotoTagSection = (marginTop: number, keyPrefix: string) =>
    selectedPhotoTag && keyPrefix === 'photo-spot-theme' ? (
      <View style={[styles.photoTagPillBox, { marginTop }]}>
        <View style={styles.photoTagPillLeftGroup}>
          <Text style={styles.photoTagPillTitle} numberOfLines={1}>{selectedPhotoTag}</Text>
          <View style={styles.photoTagPillImageBox}>
            <PlaceThumb uri={photoTagThumbnails[selectedPhotoTag]} style={styles.photoTagPillImage} shape="circle" />
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
        <PlaceThumb uri={item.thumbnail_url} style={styles.courseImage} />
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
        <ScrollView key="0" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[Colors.light.primary]} tintColor={Colors.light.primary} />}>
        {/* 이 달의 테마 박스 */}
        {allMedia[0] && (
          <TouchableOpacity
            style={styles.themeBox}
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: allMedia[0].id, title: allMedia[0].title } })}
          >
            <Text style={styles.themeTitle}>이 달의 코스 : {allMedia[0].title}</Text>
            <View style={styles.themeImageWrapper}>
              <PlaceThumb uri={allMedia[0].thumbnail_url} style={styles.themeImage} />
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
          data={popularMedia.slice(0, 4)}
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

        {/* 코스 건의 유도 */}
        <View style={styles.suggestSection}>
          <Text style={styles.suggestTitle}>원하시는 코스가 없으신가요?</Text>
          <Text style={styles.suggestSubtitle}>100 토큰으로 코스를 건의해요!</Text>
          <TouchableOpacity
            style={styles.suggestButton}
            activeOpacity={0.8}
            onPress={() => router.push('/CourseSuggestionWriteScreen')}
          >
            <Text style={styles.suggestButtonText}>건의하러 가기</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>

        {/* ── 유튜브 PICK 탭 ── */}
        <ScrollView key="1" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[Colors.light.primary]} tintColor={Colors.light.primary} />}>
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
        <ScrollView key="2" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[Colors.light.primary]} tintColor={Colors.light.primary} />}>
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
        <ScrollView key="3" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[Colors.light.primary]} tintColor={Colors.light.primary} />}>
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
        <ScrollView key="4" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[Colors.light.primary]} tintColor={Colors.light.primary} />}>
          {renderPhotoTagSection(Spacing.v.medium, 'photo-spot-theme')}
          {filteredPhotoSpots.length > 0 ? (
            <View style={styles.photoSpotGrid}>
              {filteredPhotoSpots.map(item => renderPhotoSpotCard(item))}
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
                  {photoLoadError && (
                    <Text style={{ marginTop: 12, fontSize: 11, color: '#dc2626', textAlign: 'center' }} selectable>
                      DEBUG: {photoLoadError}
                    </Text>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </PagerView>

      {selectedIndex === 4 && (
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.8}
          onPress={() => router.push('/PhotoSpotWriteScreen')}
        >
          <Edit2 size={IconSize.xlarge} color={Colors.light.white} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>
      )}

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
  fabButton: {
    position: 'absolute',
    right: Spacing.h.medium,
    bottom: Spacing.v.medium,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
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
  tagText: { ...Typography.body2, color: Colors.light.dark, marginRight: Spacing.h.xsmall },
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
    color: Colors.light.dark,
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
  suggestSection: {
    marginTop: Spacing.v.large,
    paddingHorizontal: Spacing.h.medium,
  },
  suggestTitle: { ...Typography.title1, color: Colors.light.black },
  suggestSubtitle: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  suggestButton: {
    marginTop: Spacing.v.medium,
    minHeight: Size.buttonMd,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestButtonText: { ...Typography.button2, color: Colors.light.white },
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
    ...Shadows.card,
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
    color: Colors.light.dark,
    marginRight: Spacing.h.xsmall,
  },
});

export default CourseScreen;
