// app\QuizListScreen.tsx
import { SortAlert } from '@/components/modals/SortAlert';
import { Divider } from '@/components/ui/Divider';
import { FilterButton } from '@/components/ui/FilterButton';
import { MediaMetaText } from '@/components/ui/MediaMetaText';
import PagerView, { PagerViewHandle } from '@/components/ui/PagerViewWrapper';
import { PlaceThumb } from '@/components/ui/PlaceThumb';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { mediaApi } from '@/services/api';
import type { Media } from '@/services/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['전체', '영화', '드라마', '유튜브'];
const { width } = Dimensions.get('window');
const TAB_WIDTH = width / CATEGORIES.length;

const FILTER_OPTIONS = ['기본', '미완료된 퀴즈만', '완료된 퀴즈만'] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

const QuizCard = ({ media, onPress }: { media: Media; onPress: () => void }) => {
  const isSubmitted = !!media.is_submitted;
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={isSubmitted ? 1 : 0.85}
      onPress={isSubmitted ? undefined : onPress}
      disabled={isSubmitted}
    >
      <View style={styles.imageWrapper}>
        <PlaceThumb uri={media.thumbnail_url} style={styles.cardImage} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{media.title}</Text>
        <View style={styles.infoRow}>
          <MediaMetaText media={media} />
        </View>
        {media.tags.length > 0 && (
          <TagRow style={styles.tagRow}>
            {media.tags.map(tag => (
              <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
            ))}
          </TagRow>
        )}
      </View>
      {isSubmitted && (
        <View style={styles.checkIconWrapper}>
          <CheckCircle size={IconSize.xxlarge} color={Colors.light.primary} strokeWidth={IconStroke.thin} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function QuizListScreen() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef<PagerViewHandle>(null);

  const [movieMedia, setMovieMedia] = useState<Media[]>([]);
  const [dramaMedia, setDramaMedia] = useState<Media[]>([]);
  const [youtubeMedia, setYoutubeMedia] = useState<Media[]>([]);
  const [filterOption, setFilterOption] = useState<FilterOption>('기본');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const applyFilter = (list: Media[]) => {
    if (filterOption === '미완료된 퀴즈만') return list.filter(m => !m.is_submitted);
    if (filterOption === '완료된 퀴즈만') return list.filter(m => !!m.is_submitted);
    return list;
  };

  useFocusEffect(
    useCallback(() => {
      mediaApi.getList({ type: 'movie' }).then(res => setMovieMedia(res.data.results)).catch(() => {});
      mediaApi.getList({ type: 'drama' }).then(res => setDramaMedia(res.data.results)).catch(() => {});
      mediaApi.getList({ type: 'youtube' }).then(res => setYoutubeMedia(res.data.results)).catch(() => {});
    }, [])
  );

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

  const goToQuiz = (media: Media) => {
    router.push({ pathname: '/QuizDetailScreen', params: { id: media.id } });
  };

  const renderSection = (title: string, mediaList: Media[], tabIndex: number, isFirst = false) => (
    <View style={isFirst ? undefined : styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Divider marginTop={0} />
      </View>
      {mediaList.slice(0, 3).map(m => (
        <QuizCard key={m.id} media={m} onPress={() => goToQuiz(m)} />
      ))}
      {mediaList.length > 3 && (
        <TouchableOpacity style={styles.moreButton} onPress={() => handleTabPress(tabIndex)}>
          <Text style={styles.moreButtonText}>더보기</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader
        onBack={() => router.back()}
        title="QUIZ"
        right={<FilterButton onPress={() => setIsFilterVisible(true)} />}
      />

      <View style={styles.tabContainer}>
        <View style={styles.backgroundLine} />
        {CATEGORIES.map((tab, index) => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => handleTabPress(index)} activeOpacity={0.7}>
            <Text style={[styles.tabText, { color: selectedIndex === index ? Colors.light.black : Colors.light.grayLight }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
        <Animated.View style={[styles.indicator, { width: TAB_WIDTH, transform: [{ translateX }] }]} />
      </View>

      <PagerView ref={pagerRef} style={styles.mainContent} initialPage={0} onPageSelected={handlePageSelected}>
        <ScrollView key="0" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {renderSection('영화', applyFilter(movieMedia), 1, true)}
          {renderSection('드라마', applyFilter(dramaMedia), 2)}
          {renderSection('유튜브', applyFilter(youtubeMedia), 3)}
        </ScrollView>

        <ScrollView key="1" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {applyFilter(movieMedia).map(m => (
            <QuizCard key={m.id} media={m} onPress={() => goToQuiz(m)} />
          ))}
        </ScrollView>

        <ScrollView key="2" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {applyFilter(dramaMedia).map(m => (
            <QuizCard key={m.id} media={m} onPress={() => goToQuiz(m)} />
          ))}
        </ScrollView>

        <ScrollView key="3" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
          {applyFilter(youtubeMedia).map(m => (
            <QuizCard key={m.id} media={m} onPress={() => goToQuiz(m)} />
          ))}
        </ScrollView>
      </PagerView>

      <SortAlert
        visible={isFilterVisible}
        title="필터"
        options={FILTER_OPTIONS}
        selected={filterOption}
        onClose={() => setIsFilterVisible(false)}
        onSelect={setFilterOption}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  tabContainer: { flexDirection: 'row', position: 'relative' },
  backgroundLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Spacing.lw.small, backgroundColor: Colors.light.grayLight },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.v.small },
  tabText: { ...Typography.subtitle1 },
  indicator: { position: 'absolute', bottom: 0, left: 0, height: Spacing.lw.small, backgroundColor: Colors.light.black, zIndex: 1 },
  mainContent: { flex: 1 },
  scrollContainer: { paddingTop: Spacing.v.medium, paddingBottom: Spacing.v.screenBottom },
  section: { marginTop: Spacing.v.large },
  sectionHeader: { paddingHorizontal: Spacing.h.medium, marginBottom: Spacing.v.medium },
  sectionTitle: { ...Typography.title1, color: Colors.light.black, marginBottom: Spacing.v.small },
  moreButton: { marginTop: 0, alignSelf: 'flex-end', marginRight: Spacing.h.medium, paddingVertical: Spacing.v.small },
  moreButtonText: { ...Typography.button4, color: Colors.light.dark },
  card: {
    minHeight: 106,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: Spacing.h.medium,
    marginBottom: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
    backgroundColor: Colors.light.white,
    justifyContent: 'center',
    position: 'relative',
  },
  imageWrapper: { width: Size.circleMd, height: Size.circleMd, borderRadius: Size.circleMd / 2, overflow: 'hidden', flexShrink: 0 },
  cardImage: { width: '100%', height: '100%' },
  cardContent: { flex: 1, marginLeft: Spacing.h.medium },
  cardTitle: { ...Typography.title1, color: Colors.light.black, marginBottom: Spacing.h.xsmall },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.h.xsmall },
  tagRow: { marginTop: 0, gap: 0 },
  tagText: { ...Typography.body2, color: Colors.light.dark, marginRight: Spacing.h.xsmall },
  checkIconWrapper: {
    position: 'absolute',
    right: Spacing.h.medium,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
