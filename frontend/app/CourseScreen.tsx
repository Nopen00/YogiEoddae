import { LinearGradient } from 'expo-linear-gradient';
import SearchBar from '@/components/ui/SearchBar';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CATEGORY_LABEL, MEDIA_TYPE_LABEL, shortAddress } from '@/constants/labels';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useRouter } from 'expo-router';
import { Heart, Star } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mediaApi, placeApi } from '../services/api';
import type { Media, Place, Tag } from '../services/types';
import { Size } from '@/constants/Size';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THEME_IMAGE_WIDTH = SCREEN_WIDTH - Spacing.h.medium * 4;
const THEME_IMAGE_HEIGHT = Math.round(THEME_IMAGE_WIDTH * 3 / 4);

const CATEGORIES = ['전체', '유튜브 PICK', '드라마 PICK', '영화 PICK', '포토스팟'];

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

const CourseScreen = () => {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const tabLayouts = useRef<{ x: number; width: number }[]>([]);
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

  useEffect(() => {
    mediaApi.getList().then(res => setAllMedia(res.data.results)).catch(() => {});
    mediaApi.getList({ type: 'youtube' }).then(res => setYoutubeMedia(res.data.results)).catch(() => {});
    mediaApi.getList({ type: 'drama' }).then(res => setDramaMedia(res.data.results)).catch(() => {});
    mediaApi.getList({ type: 'movie' }).then(res => setMovieMedia(res.data.results)).catch(() => {});
    placeApi.getList().then(res => setPlaces(res.data.results)).catch(() => {});
  }, []);

  const handleTabPress = (index: number) => {
    setSelectedIndex(index);
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

  const handleSearch = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    router.push({ pathname: '/SearchResultScreen', params: { keyword: trimmed } });
  };

  const currentMedia = [allMedia, youtubeMedia, dramaMedia, movieMedia][selectedIndex] ?? [];

  const renderMediaCard = (item: Media) => {
    const { visibleTags, extraCount } = getProcessedTags(item.tags);
    return (
      <TouchableOpacity
        key={`media-${item.id}`}
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: item.id, title: item.title } })}
      >
        <View style={styles.cardInner}>
          <View style={styles.imageCircle} />
          <View style={styles.infoContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.metadataRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>{MEDIA_TYPE_LABEL[item.media_type] ?? item.media_type}</Text>
                {(item.place_count != null || item.rating != null || item.like_count != null) && <TextSeparator />}
              </View>
              {item.place_count != null && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaText}>{item.place_count}개 장소</Text>
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
            <View style={styles.tagRow}>
              {visibleTags.map((tag, idx) => <Text key={idx} style={styles.tagText}>#{tag}</Text>)}
              {extraCount > 0 && <Text style={styles.tagText}>+{extraCount}</Text>}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPlaceCard = (item: Place) => {
    const { visibleTags, extraCount } = getProcessedTags(item.tags);
    const shortAddr = shortAddress(item.address);
    return (
      <TouchableOpacity
        key={`place-${item.id}`}
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push({ pathname: '/PlaceDetailScreen', params: { id: item.id, name: item.name } })}
      >
        <View style={styles.cardInner}>
          <View style={styles.imageCircle} />
          <View style={styles.infoContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <View style={styles.metadataRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>{CATEGORY_LABEL[item.category] ?? item.category}</Text>
                <TextSeparator />
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>{shortAddr}</Text>
                {(item.rating != null || item.like_count != null) && <TextSeparator />}
              </View>
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
            <View style={styles.tagRow}>
              {visibleTags.map((tag, idx) => <Text key={idx} style={styles.tagText}>#{tag}</Text>)}
              {extraCount > 0 && <Text style={styles.tagText}>+{extraCount}</Text>}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrapper}>
        <SearchBar
          value={inputText}
          onChangeText={setInputText}
          onBackPress={() => router.back()}
          onClearPress={() => setInputText('')}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          placeholder="어디로 떠나볼까요?"
        />
      </View>

      <View style={styles.tabWrapper}>
        <View style={styles.backgroundLine} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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

      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerWrapper: { paddingBottom: Spacing.v.small },
  tabWrapper: { position: 'relative' },
  backgroundLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Spacing.lw.small, backgroundColor: Colors.light.grayLight },
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
    ...Typography.body3,
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
});

export default CourseScreen;
