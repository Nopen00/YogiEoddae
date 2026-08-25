// app\SavedListScreen.tsx
import { AddPlaceConfirmAlert } from '@/components/modals/AddPlaceConfirmAlert';
import { CourseSelectPopup } from '@/components/modals/CourseSelectPopup';
import { NewScheduleStep3Alert } from '@/components/modals/NewScheduleStep3Alert';
import { Divider } from '@/components/ui/Divider';
import { PlaceThumb } from '@/components/ui/PlaceThumb';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CATEGORY_LABEL, getMediaMetaParts, shortAddress } from '@/constants/labels';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { bookmarkApi, mediaApi, placeApi, scheduleApi } from '@/services/api';
import type { Media, Place, Tag } from '@/services/types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logEvent } from '@/services/logger';

const TABS = ['내 일정', '과거 일정', '저장소'];
const { width } = Dimensions.get('window');
const TAB_WIDTH = width / TABS.length;
const SAVED_TAB_INDEX = 2;

type SavedListType = 'course' | 'place' | 'photo';

type SavedPhoto = {
  id: number;
  image_url: string;
  description: string;
  place_name: string;
  tags: Tag[];
  saved_at: string;
};

interface SavedItem {
  id: number;
  title: string;
  imageUrl: string;
  infoParts?: string[];
  tags: Tag[];
}

const LIST_TITLE: Record<SavedListType, string> = {
  course: '저장한 코스',
  place: '저장한 명소',
  photo: '저장한 포토스팟',
};

export default function SavedListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type: SavedListType;
    mode?: string;
    scheduleId?: string;
    dayNumber?: string;
    scheduleName?: string;
    startDate?: string;
    endDate?: string;
  }>();
  const listType: SavedListType = params.type === 'place' || params.type === 'photo' ? params.type : 'course';

  const [courses, setCourses] = useState<Media[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);

  const isAddPlaceMode = listType === 'place' && params.mode === 'addPlace' && !!params.scheduleId;
  const isImportMode = listType === 'course' && params.mode === 'import' && !!params.scheduleName && !!params.startDate && !!params.endDate;
  const isSelectMode = isAddPlaceMode || isImportMode;

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isPlaceConfirmVisible, setIsPlaceConfirmVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [isStep3Visible, setIsStep3Visible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (listType === 'course') {
        mediaApi.getBookmarked().then(res => setCourses(res.data)).catch(err => logEvent('error', 'SavedListScreen.tsx:83', err?.message || String(err)));
      } else if (listType === 'place') {
        placeApi.getBookmarked().then(res => setPlaces(res.data)).catch(err => logEvent('error', 'SavedListScreen.tsx:85', err?.message || String(err)));
      } else {
        bookmarkApi.getAll().then((res: any) => setPhotos(res.data?.saved_photos ?? [])).catch(err => logEvent('error', 'SavedListScreen.tsx:87', err?.message || String(err)));
      }
    }, [listType])
  );

  const items: SavedItem[] =
    listType === 'course'
      ? courses.map(m => ({
          id: m.id,
          title: m.title,
          imageUrl: m.thumbnail_url,
          infoParts: getMediaMetaParts(m),
          tags: m.tags,
        }))
      : listType === 'place'
      ? places.map(p => ({
          id: p.id,
          title: p.name,
          imageUrl: p.image_url,
          infoParts: [CATEGORY_LABEL[p.category] ?? p.category, shortAddress(p.address)],
          tags: p.tags,
        }))
      : photos.map(sp => ({
          id: sp.id,
          title: sp.description,
          imageUrl: sp.image_url,
          tags: sp.tags,
        }));

  const goToDetail = (id: number) => {
    if (listType === 'course') router.push({ pathname: '/CourseDetailScreen', params: { id } });
    else if (listType === 'place') router.push({ pathname: '/PlaceDetailScreen', params: { id } });
    else router.push({ pathname: '/PhotoSpotDetailScreen', params: { id } });
  };

  const handleCardPress = (id: number) => {
    if (isAddPlaceMode) {
      const place = places.find(p => p.id === id);
      if (place) {
        setSelectedPlace(place);
        setIsPlaceConfirmVisible(true);
      }
      return;
    }
    if (isImportMode) {
      const media = courses.find(m => m.id === id);
      if (media) {
        setSelectedMedia(media);
        setIsStep3Visible(true);
      }
      return;
    }
    goToDetail(id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack={() => router.back()} title="일정" />

      <View style={styles.tabContainer}>
        <View style={styles.backgroundLine} />
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => router.replace({ pathname: '/ScheduleScreen', params: { tab: String(index) } })}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: index === SAVED_TAB_INDEX ? Colors.light.black : Colors.light.grayLight }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={[styles.indicator, { width: TAB_WIDTH, left: SAVED_TAB_INDEX * TAB_WIDTH }]} />
      </View>

      <TouchableOpacity
        style={styles.titleRow}
        activeOpacity={0.7}
        onPress={() => router.back()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ChevronLeft size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        <Text style={styles.titleText}>{LIST_TITLE[listType]}</Text>
      </TouchableOpacity>
      <Divider marginTop={Spacing.v.medium} style={{ marginHorizontal: Spacing.h.medium }} />

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>저장소가 비어있습니다.</Text>
          <Text style={styles.emptySubtitle}>마음에 드는 걸 추가해보세요.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => handleCardPress(item.id)}
            >
              <View style={styles.imageWrapper}>
                <PlaceThumb uri={item.imageUrl} style={styles.cardImage} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                {item.infoParts && item.infoParts.length > 0 && (
                  <View style={styles.infoRow}>
                    {item.infoParts.map((part, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <TextSeparator />}
                        <Text style={styles.infoText} numberOfLines={1}>{part}</Text>
                      </React.Fragment>
                    ))}
                  </View>
                )}
                {item.tags.length > 0 && (
                  <TagRow>
                    {item.tags.map(tag => (
                      <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                    ))}
                  </TagRow>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <CourseSelectPopup
        visible={isSelectMode}
        label={isAddPlaceMode ? '일정으로 가져올 장소를 선택하세요.' : undefined}
        onClose={() => router.back()}
        onBack={() => router.back()}
      />

      {selectedPlace && (
        <AddPlaceConfirmAlert
          visible={isPlaceConfirmVisible}
          place={selectedPlace}
          onClose={() => setIsPlaceConfirmVisible(false)}
          onBack={() => setIsPlaceConfirmVisible(false)}
          onConfirm={async () => {
            if (!params.scheduleId) return;
            const scheduleId = Number(params.scheduleId);
            const dayNum = Number(params.dayNumber ?? 1);
            try {
              const detail = await scheduleApi.getDetail(scheduleId);
              const existingCount = detail.data.daily_places.filter(dp => dp.day_number === dayNum).length;
              await scheduleApi.addPlace(scheduleId, {
                place_id: selectedPlace.id,
                day_number: dayNum,
                order: existingCount + 1,
              });
            } catch {}
            setIsPlaceConfirmVisible(false);
            router.back();
          }}
        />
      )}

      {selectedMedia && (
        <NewScheduleStep3Alert
          visible={isStep3Visible}
          media={selectedMedia}
          onClose={() => setIsStep3Visible(false)}
          onBack={() => setIsStep3Visible(false)}
          onConfirm={async () => {
            if (!params.scheduleName || !params.startDate || !params.endDate) return;
            try {
              const res = await mediaApi.importToSchedule(selectedMedia.id, {
                title: params.scheduleName,
                start_date: params.startDate,
                end_date: params.endDate,
              });
              setIsStep3Visible(false);
              router.push({ pathname: '/ScheduleDetailScreen', params: { id: res.data.id, title: params.scheduleName } });
            } catch {}
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  tabContainer: { flexDirection: 'row', height: 32, position: 'relative' },
  backgroundLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Spacing.lw.small, backgroundColor: Colors.light.grayLight },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { ...Typography.subtitle1 },
  indicator: { position: 'absolute', bottom: 0, height: Spacing.lw.small, backgroundColor: Colors.light.black, zIndex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.h.small, marginTop: Spacing.v.medium, paddingHorizontal: Spacing.h.medium },
  titleText: { ...Typography.title1, color: Colors.light.black },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.v.medium },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  emptySubtitle: { ...Typography.body2, color: Colors.light.grayLight },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.v.screenBottom },
  card: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: Spacing.h.medium, marginTop: Spacing.v.medium, borderRadius: Spacing.r.small, borderWidth: Spacing.lw.small, borderColor: Colors.light.grayLight, padding: Spacing.h.medium, backgroundColor: Colors.light.white },
  imageWrapper: { width: Size.circleMd, height: Size.circleMd, borderRadius: Size.circleMd / 2, overflow: 'hidden', flexShrink: 0 },
  cardImage: { width: '100%', height: '100%' },
  cardContent: { flex: 1, marginLeft: Spacing.h.medium },
  cardTitle: { ...Typography.title1, color: Colors.light.black },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small, gap: Spacing.h.xsmall },
  infoText: { ...Typography.subtitle1, color: Colors.light.grayDark },
  tagText: { ...Typography.body2, color: Colors.light.dark },
});
