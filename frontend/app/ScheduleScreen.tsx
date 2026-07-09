//app\(tabs)\ScheduleScreen.tsx
import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { AddPlaceConfirmAlert } from '@/components/modals/AddPlaceConfirmAlert';
import { CourseSelectPopup } from '@/components/modals/CourseSelectPopup';
import { type DateRange, NewScheduleAlert } from '@/components/modals/NewScheduleAlert';
import { NewScheduleStep3Alert } from '@/components/modals/NewScheduleStep3Alert';
import { ScheduleMoreMenuAlert } from '@/components/modals/ScheduleMoreMenuAlert';
import { SortAlert, type SortOption, SORT_OPTIONS } from '@/components/modals/SortAlert';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CATEGORY_LABEL, CITY_SHORT, MEDIA_TYPE_LABEL, shortAddress } from '@/constants/labels';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { sortByOption } from '@/utils/sortByOption';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Heart, MoreVertical, Plus, SlidersHorizontal } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PagerView from '@/components/ui/PagerViewWrapper';
import { bookmarkApi, mediaApi, placeApi, scheduleApi } from '../services/api';
import type { DailyPlace, Media, Place, Schedule } from '../services/types';

type SavedPhoto = {
  id: number;
  image_url: string;
  description: string;
  place_name: string;
  tags: { name: string; category: string }[];
  saved_at: string;
};

const TABS = ['내 일정', '과거 일정', '저장소'];
const { width } = Dimensions.get('window');
const TAB_WIDTH = width / TABS.length;

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '.');
};

const isExpired = (endDate: string | null) => {
  if (!endDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(endDate) < today;
};

const isCurrent = (s: Schedule) => {
  if (!s.start_date || !s.end_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(s.start_date) <= today && new Date(s.end_date) >= today;
};

const isPlanned = (s: Schedule) => {
  if (!s.start_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(s.start_date) > today;
};

// ─── 공통 섹션 래퍼 ───────────────────────────────────────────
const SectionWrapper = ({
  title,
  style,
  showAdd = true,
  isEmpty = false,
  emptyTitle,
  emptySubtitle,
  onAddPress,
  children,
}: {
  title: string;
  style?: object;
  showAdd?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  onAddPress?: () => void;
  children: React.ReactNode;
}) => (
  <View style={style}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Divider marginTop={Spacing.v.small} style={{ marginHorizontal: Spacing.h.medium }} />
    {!isEmpty && children}
    {showAdd && (
      <TouchableOpacity style={styles.addScheduleButton} activeOpacity={0.8} onPress={onAddPress}>
        <View style={styles.addCircle}>
          <Plus size={IconSize.medium} color={Colors.light.black} strokeWidth={IconStroke.regular} />
        </View>
      </TouchableOpacity>
    )}
    {isEmpty && (
      <View style={styles.sectionEmpty}>
        <Text style={styles.sectionEmptyTitle}>{emptyTitle}</Text>
        <Text style={styles.sectionEmptySubtitle}>{emptySubtitle ?? '마음에 드는걸 추가해보세요.'}</Text>
      </View>
    )}
  </View>
);

// ─── 장소 이미지 클러스터 ─────────────────────────────────────
const CLUSTER = Size.circleMd;  // 48
const SMALL   = 22;
const GAP     = Spacing.r.xsmall; // 4

const SmallCircle = ({ uri, size, style }: { uri: string | null; size: number; style?: object }) => {
  const base = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[base, style]} />;
  return <View style={[base, { backgroundColor: Colors.light.grayLight }, style]} />;
};

const PlaceImageCluster = ({ dailyPlaces }: { dailyPlaces: DailyPlace[] }) => {
  const count = dailyPlaces.length;
  const abs = (left: number, top: number) => ({ position: 'absolute' as const, left, top });

  if (count === 0) {
    return <View style={{ width: CLUSTER, height: CLUSTER, borderRadius: CLUSTER / 2, backgroundColor: Colors.light.grayLight }} />;
  }
  if (count === 1) {
    return <SmallCircle uri={dailyPlaces[0].place.image_url} size={CLUSTER} />;
  }

  const midY = (CLUSTER - SMALL) / 2; // 13 — 2개일 때 수직 중앙

  if (count === 2) {
    return (
      <View style={{ width: CLUSTER, height: CLUSTER }}>
        <SmallCircle uri={dailyPlaces[0].place.image_url} size={SMALL} style={abs(0, midY)} />
        <SmallCircle uri={dailyPlaces[1].place.image_url} size={SMALL} style={abs(SMALL + GAP, midY)} />
      </View>
    );
  }
  if (count === 3) {
    return (
      <View style={{ width: CLUSTER, height: CLUSTER }}>
        <SmallCircle uri={dailyPlaces[0].place.image_url} size={SMALL} style={abs((CLUSTER - SMALL) / 2, 0)} />
        <SmallCircle uri={dailyPlaces[1].place.image_url} size={SMALL} style={abs(0, SMALL + GAP)} />
        <SmallCircle uri={dailyPlaces[2].place.image_url} size={SMALL} style={abs(SMALL + GAP, SMALL + GAP)} />
      </View>
    );
  }

  // 4개 이상: 2×2 그리드, 5개 이상이면 우측 하단에 +n 뱃지
  const extra = count - 4;
  return (
    <View style={{ width: CLUSTER, height: CLUSTER }}>
      <SmallCircle uri={dailyPlaces[0].place.image_url} size={SMALL} style={abs(0, 0)} />
      <SmallCircle uri={dailyPlaces[1].place.image_url} size={SMALL} style={abs(SMALL + GAP, 0)} />
      <SmallCircle uri={dailyPlaces[2].place.image_url} size={SMALL} style={abs(0, SMALL + GAP)} />
      {count >= 5 ? (
        <View style={[styles.extraBadgeContainer, abs(SMALL + GAP, SMALL + GAP)]}>
          <SmallCircle uri={dailyPlaces[3].place.image_url} size={SMALL} />
          <View style={styles.extraBadgeOverlay}>
            <Text style={styles.extraBadgeText}>+{extra}</Text>
          </View>
        </View>
      ) : (
        <SmallCircle uri={dailyPlaces[3].place.image_url} size={SMALL} style={abs(SMALL + GAP, SMALL + GAP)} />
      )}
    </View>
  );
};

// ─── 일정 태그 생성 ───────────────────────────────────────────
const getScheduleTags = (schedule: Schedule): string[] => {
  const tags: string[] = [];
  if (schedule.media) {
    const typeLabel = MEDIA_TYPE_LABEL[schedule.media.media_type];
    if (typeLabel) tags.push(typeLabel);
  }
  const cities = new Set<string>();
  for (const dp of schedule.daily_places) {
    const city = CITY_SHORT[dp.place.address.split(' ')[0]];
    if (city) cities.add(city);
  }
  cities.forEach(c => tags.push(c));
  return tags;
};

// ─── 일정 카드 ────────────────────────────────────────────────
const ScheduleCard = ({
  schedule,
  onPress,
  isMenuOpen,
  onMorePress,
  onEditPress,
  onDeletePress,
  style,
}: {
  schedule: Schedule;
  onPress?: () => void;
  isMenuOpen?: boolean;
  onMorePress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
  style?: StyleProp<ViewStyle>;
}) => {
  const tags = getScheduleTags(schedule);
  return (
    <TouchableOpacity style={[styles.card, style]} activeOpacity={0.85} onPress={onPress}>
      <PlaceImageCluster dailyPlaces={schedule.daily_places} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{schedule.title}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>{formatDate(schedule.start_date)}</Text>
          <Text style={styles.infoSep}>-</Text>
          <Text style={styles.infoText}>{formatDate(schedule.end_date)}</Text>
        </View>
        {tags.length > 0 && (
          <TagRow>
            {tags.map((tag, i) => (
              <Text key={i} style={styles.tagText}>#{tag}</Text>
            ))}
          </TagRow>
        )}
      </View>
      <View style={styles.moreIconWrapper}>
        <TouchableOpacity onPress={onMorePress} activeOpacity={0.7} hitSlop={8}>
          <MoreVertical size={IconSize.large} color={Colors.light.black} />
        </TouchableOpacity>
        {isMenuOpen && (
          <ScheduleMoreMenuAlert
            onEditPress={onEditPress ?? (() => {})}
            onDeletePress={onDeletePress ?? (() => {})}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── 코스 카드 ────────────────────────────────────────────────
const CourseCard = ({ media, onPress }: { media: Media; onPress: () => void }) => {
  const typeLabel = MEDIA_TYPE_LABEL[media.media_type] ?? media.media_type;
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.imageWrapper}>
        {media.thumbnail_url ? (
          <Image source={{ uri: media.thumbnail_url }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: Colors.light.grayLight }]} />
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{media.title}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>{media.place_count ?? 0}개 장소</Text>
          <TextSeparator />
          <Text style={styles.infoText}>{typeLabel}</Text>
        </View>
        {media.tags.length > 0 && (
          <TagRow>
            {media.tags.map(tag => (
              <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
            ))}
          </TagRow>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function ScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; scheduleId?: string; dayNumber?: string }>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef<PagerView>(null);

  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [pastSchedules, setPastSchedules] = useState<Schedule[]>([]);
  const [savedSchedules, setSavedSchedules] = useState<Schedule[]>([]);
  const [savedCourses, setSavedCourses] = useState<Media[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<SavedPhoto[]>([]);
  const [myScheduleSort, setMyScheduleSort] = useState<SortOption>('관련도 높은 순');
  const [isMySortVisible, setIsMySortVisible] = useState(false);
  const [courseSort, setCourseSort] = useState<SortOption>('관련도 높은 순');
  const [isCourseSortVisible, setIsCourseSortVisible] = useState(false);
  const [isNewScheduleVisible, setIsNewScheduleVisible] = useState(false);
  const [newScheduleKey, setNewScheduleKey] = useState(0);
  const [isCourseSelectVisible, setIsCourseSelectVisible] = useState(false);
  const [isPlaceSelectVisible, setIsPlaceSelectVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isPlaceConfirmVisible, setIsPlaceConfirmVisible] = useState(false);
  const [isStep3Visible, setIsStep3Visible] = useState(false);
  const [selectedCourseMedia, setSelectedCourseMedia] = useState<Media | null>(null);
  const [scheduleData, setScheduleData] = useState<{ name: string; range: DateRange } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  const openNewScheduleFresh = () => {
    setNewScheduleKey(k => k + 1);
    setIsNewScheduleVisible(true);
  };

  useEffect(() => {
    if (params.mode === 'addPlace') {
      handleTabPress(2);
      setIsPlaceSelectVisible(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      scheduleApi.getList().then(res => {
        const all = [...new Map(res.data.map((s: Schedule) => [s.id, s])).values()];
        setMySchedules(all.filter((s: Schedule) => !isExpired(s.end_date)));
        setPastSchedules(all.filter((s: Schedule) => isExpired(s.end_date)));
      }).catch(() => {});
      scheduleApi.getBookmarked().then(res => setSavedSchedules(res.data)).catch(() => {});
      mediaApi.getBookmarked().then(res => setSavedCourses(res.data)).catch(() => {});
      placeApi.getBookmarked().then(res => setSavedPlaces(res.data)).catch(() => {});
      bookmarkApi.getAll().then((res: any) => setSavedPhotos(res.data?.saved_photos ?? [])).catch(() => {});
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

  const sortedByName = (list: Schedule[]) =>
    myScheduleSort === '이름순' ? [...list].sort((a, b) => a.title.localeCompare(b.title, 'ko')) : list;

  const currentSchedules = sortedByName(mySchedules.filter(isCurrent));
  const plannedSchedules = sortedByName(mySchedules.filter(isPlanned));
  const sortedSavedCourses = sortByOption(savedCourses, courseSort, m => m.title, m => m.place_count);

  const mySchedulesEmpty = currentSchedules.length === 0 && plannedSchedules.length === 0;
  const pastEmpty = pastSchedules.length === 0;
  const savedEmpty = savedSchedules.length === 0 && savedCourses.length === 0 && savedPlaces.length === 0 && savedPhotos.length === 0;

  const showAddButton =
    (selectedIndex === 0 && mySchedulesEmpty) ||
    (selectedIndex === 1 && pastEmpty);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 상단 바 */}
      <ScreenHeader onBack={() => router.back()} title="일정" />

      {/* 탭 분류 */}
      <View style={styles.tabContainer}>
        <View style={styles.backgroundLine} />
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => handleTabPress(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: selectedIndex === index ? Colors.light.black : Colors.light.grayLight }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
        <Animated.View style={[styles.indicator, { width: TAB_WIDTH, transform: [{ translateX }] }]} />
      </View>

      {showAddButton && (
        <TouchableOpacity style={styles.addScheduleButton} activeOpacity={0.8} onPress={openNewScheduleFresh}>
          <View style={styles.addCircle}>
            <Plus size={IconSize.medium} color={Colors.light.black} strokeWidth={IconStroke.regular} />
          </View>
        </TouchableOpacity>
      )}

      <PagerView ref={pagerRef} style={{ flex: 1 }} initialPage={0} onPageSelected={handlePageSelected}>
      {/* 내 일정 탭 */}
      <View key="0" style={{ flex: 1 }}>
        {mySchedulesEmpty ? (
          <View style={styles.emptyContainer}>
            <Calendar size={IconSize.xxlarge} color={Colors.light.grayLight} strokeWidth={IconStroke.thin} />
            <Text style={styles.emptyTitle}>일정이 없습니다.</Text>
            <Text style={styles.emptySubtitle}>일정을 추가해보세요.</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.sortButton} onPress={() => setIsMySortVisible(true)} activeOpacity={0.7}>
              <SlidersHorizontal size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
              <Text style={styles.sortButtonText}>{myScheduleSort}</Text>
            </TouchableOpacity>
            <SectionWrapper title="현재 진행 중인 일정" isEmpty={currentSchedules.length === 0} emptyTitle="현재 진행 중인 일정이 비어있습니다." emptySubtitle="일정을 추가해보세요." onAddPress={openNewScheduleFresh}>
              {currentSchedules.map(s => (
                <ScheduleCard
                  key={s.id}
                  schedule={s}
                  onPress={() => { if (openMenuId !== null) { setOpenMenuId(null); return; } router.push({ pathname: '/ScheduleDetailScreen', params: { id: s.id, title: s.title } }); }}
                  isMenuOpen={openMenuId === s.id}
                  onMorePress={() => setOpenMenuId(prev => prev === s.id ? null : s.id)}
                  onEditPress={() => { setOpenMenuId(null); router.push({ pathname: '/ScheduleDetailScreen', params: { id: s.id, title: s.title, autoEdit: 'true' } }); }}
                  onDeletePress={() => { setOpenMenuId(null); setDeleteTarget(s); }}
                  style={openMenuId === s.id ? { zIndex: 100 } : undefined}
                />
              ))}
            </SectionWrapper>
            <SectionWrapper title="예정된 일정" style={styles.secondSection} isEmpty={plannedSchedules.length === 0} emptyTitle="예정된 일정이 비어있습니다." emptySubtitle="일정을 추가해보세요." onAddPress={openNewScheduleFresh}>
              {plannedSchedules.map(s => (
                <ScheduleCard
                  key={s.id}
                  schedule={s}
                  onPress={() => { if (openMenuId !== null) { setOpenMenuId(null); return; } router.push({ pathname: '/ScheduleDetailScreen', params: { id: s.id, title: s.title } }); }}
                  isMenuOpen={openMenuId === s.id}
                  onMorePress={() => setOpenMenuId(prev => prev === s.id ? null : s.id)}
                  onEditPress={() => { setOpenMenuId(null); router.push({ pathname: '/ScheduleDetailScreen', params: { id: s.id, title: s.title, autoEdit: 'true' } }); }}
                  onDeletePress={() => { setOpenMenuId(null); setDeleteTarget(s); }}
                  style={openMenuId === s.id ? { zIndex: 100 } : undefined}
                />
              ))}
            </SectionWrapper>
          </ScrollView>
        )}
      </View>

      {/* 과거 일정 탭 */}
      <View key="1" style={{ flex: 1 }}>
        {pastEmpty ? (
          <View style={styles.emptyContainer}>
            <Calendar size={IconSize.xxlarge} color={Colors.light.grayLight} strokeWidth={IconStroke.thin} />
            <Text style={styles.emptyTitle}>일정이 없습니다.</Text>
            <Text style={styles.emptySubtitle}>일정을 추가해보세요.</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentOther} showsVerticalScrollIndicator={false}>
            {pastSchedules.map(s => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                onPress={() => { if (openMenuId !== null) { setOpenMenuId(null); return; } router.push({ pathname: '/ScheduleDetailScreen', params: { id: s.id, title: s.title } }); }}
                isMenuOpen={openMenuId === s.id}
                onMorePress={() => setOpenMenuId(prev => prev === s.id ? null : s.id)}
                onEditPress={() => { setOpenMenuId(null); router.push({ pathname: '/ScheduleDetailScreen', params: { id: s.id, title: s.title, autoEdit: 'true' } }); }}
                onDeletePress={() => { setOpenMenuId(null); setDeleteTarget(s); }}
                style={openMenuId === s.id ? { zIndex: 100 } : undefined}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* 저장소 탭 */}
      <View key="2" style={{ flex: 1 }}>
        {savedEmpty ? (
          <View style={styles.emptyContainer}>
            <Heart size={IconSize.xxlarge} color={Colors.light.grayLight} strokeWidth={IconStroke.thin} />
            <Text style={styles.emptyTitle}>저장소가 비어있습니다.</Text>
            <Text style={styles.emptySubtitle}>마음에 드는 걸 추가해보세요.</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 저장한 일정 */}
            <SectionWrapper title="저장한 일정" showAdd={false} isEmpty={savedSchedules.length === 0} emptyTitle="저장한 일정이 비어있습니다.">
              {savedSchedules.map(s => (
                <ScheduleCard
                  key={s.id}
                  schedule={s}
                  onPress={() => router.push({ pathname: '/ScheduleDetailScreen', params: { id: s.id, title: s.title } })}
                />
              ))}
            </SectionWrapper>
            {/* 저장한 코스 */}
            <View style={styles.secondSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>저장한 코스</Text>
                <TouchableOpacity onPress={() => setIsCourseSortVisible(true)} activeOpacity={0.7} style={styles.sectionSortBtn}>
                  <SlidersHorizontal size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  <Text style={styles.sortButtonText}>{courseSort}</Text>
                </TouchableOpacity>
              </View>
              <Divider marginTop={Spacing.v.small} style={{ marginHorizontal: Spacing.h.medium }} />
              {savedCourses.length === 0 ? (
                <View style={styles.sectionEmpty}>
                  <Text style={styles.sectionEmptyTitle}>저장한 코스가 비어있습니다.</Text>
                </View>
              ) : (
                sortedSavedCourses.map(m => (
                  <CourseCard
                    key={m.id}
                    media={m}
                    onPress={() => {
                      if (isCourseSelectVisible) {
                        setSelectedCourseMedia(m);
                        setIsCourseSelectVisible(false);
                        setIsStep3Visible(true);
                      } else {
                        router.push({ pathname: '/CourseDetailScreen', params: { id: m.id } });
                      }
                    }}
                  />
                ))
              )}
            </View>
            {/* 저장한 명소 */}
            <SectionWrapper title="저장한 명소" style={styles.secondSection} showAdd={false} isEmpty={savedPlaces.length === 0} emptyTitle="저장한 명소가 비어있습니다.">
              {savedPlaces.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (isPlaceSelectVisible) {
                      setSelectedPlace(p);
                      setIsPlaceSelectVisible(false);
                      setIsPlaceConfirmVisible(true);
                    } else {
                      router.push({ pathname: '/PlaceDetailScreen', params: { id: p.id } });
                    }
                  }}
                >
                  <View style={styles.imageWrapper}>
                    {p.image_url ? (
                      <Image source={{ uri: p.image_url }} style={styles.cardImage} />
                    ) : (
                      <View style={[styles.cardImage, { backgroundColor: Colors.light.grayLight }]} />
                    )}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{p.name}</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoText}>{CATEGORY_LABEL[p.category] ?? p.category}</Text>
                      <TextSeparator />
                      <Text style={styles.infoText} numberOfLines={1}>{shortAddress(p.address)}</Text>
                    </View>
                    {p.tags.length > 0 && (
                      <TagRow>
                        {p.tags.map(tag => (
                          <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                        ))}
                      </TagRow>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </SectionWrapper>
            {/* 저장한 포토스팟 */}
            <SectionWrapper title="저장한 포토스팟" style={styles.secondSection} showAdd={false} isEmpty={savedPhotos.length === 0} emptyTitle="저장한 포토스팟이 비어있습니다.">
              {savedPhotos.map(sp => (
                <TouchableOpacity key={sp.id} style={styles.card} activeOpacity={0.85}>
                  <View style={styles.imageWrapper}>
                    {sp.image_url ? (
                      <Image source={{ uri: sp.image_url }} style={styles.cardImage} />
                    ) : (
                      <View style={[styles.cardImage, { backgroundColor: Colors.light.grayLight }]} />
                    )}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{sp.place_name}</Text>
                    {sp.description ? (
                      <Text style={styles.infoText} numberOfLines={1}>{sp.description}</Text>
                    ) : null}
                    {sp.tags.length > 0 && (
                      <TagRow>
                        {sp.tags.map((tag, i) => (
                          <Text key={i} style={styles.tagText}>#{tag.name}</Text>
                        ))}
                      </TagRow>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </SectionWrapper>
          </ScrollView>
        )}
      </View>
      </PagerView>

      <Modal visible={deleteTarget !== null} transparent animationType="fade">
        <View style={styles.deleteOverlay}>
          <View style={styles.deletePopup}>
            <Text style={styles.deleteTitle}>일정을 삭제하시겠습니까?</Text>
            <Text style={styles.deleteDesc}>삭제된 일정은 되돌릴 수 없습니다.</Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={styles.btnConfirm}
                activeOpacity={0.8}
                onPress={async () => {
                  if (!deleteTarget) return;
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  try {
                    await scheduleApi.remove(target.id);
                    setMySchedules(prev => prev.filter(s => s.id !== target.id));
                    setPastSchedules(prev => prev.filter(s => s.id !== target.id));
                  } catch {}
                }}
              >
                <Text style={styles.btnConfirmText}>확인</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnCancel}
                activeOpacity={0.8}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={styles.btnCancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NewScheduleAlert
        key={newScheduleKey}
        visible={isNewScheduleVisible}
        onClose={() => setIsNewScheduleVisible(false)}
        onConfirm={async (courseType, name, range) => {
          const fmt = (n: number) => String(n).padStart(2, '0');
          const startDate = `${range.year}-${fmt(range.month + 1)}-${fmt(range.startDay)}`;
          const endDate = `${range.year}-${fmt(range.month + 1)}-${fmt(range.endDay)}`;
          if (courseType === 'import') {
            setScheduleData({ name, range });
            setIsNewScheduleVisible(false);
            handleTabPress(2);
            setIsCourseSelectVisible(true);
          } else {
            try {
              const res = await scheduleApi.create({ title: name, start_date: startDate, end_date: endDate });
              const created = res.data;
              if (isExpired(created.end_date)) {
                setPastSchedules(prev => [...prev, created]);
              } else {
                setMySchedules(prev => [...prev, created]);
              }
              setIsNewScheduleVisible(false);
              router.push({ pathname: '/ScheduleDetailScreen', params: { id: created.id, title: name } });
            } catch {}
          }
        }}
      />
      <CourseSelectPopup
        visible={isCourseSelectVisible}
        onClose={() => setIsCourseSelectVisible(false)}
        onBack={() => {
          setIsCourseSelectVisible(false);
          setIsNewScheduleVisible(true);
        }}
      />
      <CourseSelectPopup
        visible={isPlaceSelectVisible}
        label="일정으로 가져올 장소를 선택하세요."
        onClose={() => { setIsPlaceSelectVisible(false); router.back(); }}
        onBack={() => { setIsPlaceSelectVisible(false); router.back(); }}
      />
      {selectedPlace && (
        <AddPlaceConfirmAlert
          visible={isPlaceConfirmVisible}
          place={selectedPlace}
          onClose={() => {
            setIsPlaceConfirmVisible(false);
            setIsPlaceSelectVisible(true);
          }}
          onBack={() => {
            setIsPlaceConfirmVisible(false);
            setIsPlaceSelectVisible(true);
          }}
          onConfirm={async () => {
            if (!params.scheduleId) return;
            const scheduleId = Number(params.scheduleId);
            const dayNum = Number(params.dayNumber ?? 1);
            const allSchedules = [...mySchedules, ...pastSchedules];
            const schedule = allSchedules.find(s => s.id === scheduleId);
            const existingCount = schedule?.daily_places.filter(dp => dp.day_number === dayNum).length ?? 0;
            try {
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
      <SortAlert
        visible={isMySortVisible}
        options={['관련도 높은 순', '이름순']}
        disabledOptions={['별점순', '하트 순', '장소 많은 순', '장소 적은 순']}
        selected={myScheduleSort}
        onClose={() => setIsMySortVisible(false)}
        onSelect={setMyScheduleSort}
      />
      <SortAlert
        visible={isCourseSortVisible}
        options={SORT_OPTIONS}
        disabledOptions={['별점순', '하트 순']}
        selected={courseSort}
        onClose={() => setIsCourseSortVisible(false)}
        onSelect={setCourseSort}
      />
      {selectedCourseMedia && (
        <NewScheduleStep3Alert
          visible={isStep3Visible}
          onClose={() => {
            setIsStep3Visible(false);
            setIsCourseSelectVisible(true);
          }}
          onBack={() => {
            setIsStep3Visible(false);
            setIsCourseSelectVisible(true);
          }}
          onConfirm={async () => {
            if (!scheduleData || !selectedCourseMedia) return;
            const { name, range } = scheduleData;
            const fmt = (n: number) => String(n).padStart(2, '0');
            const startDate = `${range.year}-${fmt(range.month + 1)}-${fmt(range.startDay)}`;
            const endDate = `${range.year}-${fmt(range.month + 1)}-${fmt(range.endDay)}`;
            try {
              const res = await mediaApi.importToSchedule(selectedCourseMedia.id, { title: name, start_date: startDate, end_date: endDate });
              const created = res.data;
              if (isExpired(created.end_date)) {
                setPastSchedules(prev => [...prev, created]);
              } else {
                setMySchedules(prev => [...prev, created]);
              }
              setIsStep3Visible(false);
              router.push({ pathname: '/ScheduleDetailScreen', params: { id: created.id, title: name } });
            } catch {}
          }}
          media={selectedCourseMedia}
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
  indicator: { position: 'absolute', bottom: 0, left: 0, height: Spacing.lw.small, backgroundColor: Colors.light.black, zIndex: 1 },
  addScheduleButton: { marginTop: Spacing.v.medium, marginHorizontal: Spacing.h.medium, height: Size.buttonMd, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  addCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.light.white, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.v.medium },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  emptySubtitle: { ...Typography.body2, color: Colors.light.grayLight },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: Spacing.v.medium, paddingBottom: Spacing.v.screenBottom },
  scrollContentOther: { paddingTop: 0, paddingBottom: Spacing.v.screenBottom },
  sectionTitle: { ...Typography.title1, color: Colors.light.black, paddingLeft: Spacing.h.medium },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: Spacing.h.medium },
  sectionSortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.h.medium, paddingBottom: Spacing.v.small },
  sortButtonText: { ...Typography.body2, color: Colors.light.grayDark },
  secondSection: { marginTop: Spacing.v.large },
  card: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: Spacing.h.medium, marginTop: Spacing.v.medium, borderRadius: Spacing.r.small, borderWidth: Spacing.lw.small, borderColor: Colors.light.grayLight, padding: Spacing.h.medium, backgroundColor: Colors.light.white },
  imageWrapper: { width: Size.circleMd, height: Size.circleMd, borderRadius: Size.circleMd / 2, overflow: 'hidden', flexShrink: 0 },
  cardImage: { width: '100%', height: '100%' },
  cardContent: { flex: 1, marginLeft: Spacing.h.medium },
  cardTitle: { ...Typography.title1, color: Colors.light.black },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small, gap: Spacing.h.xsmall },
  infoText: { ...Typography.subtitle1, color: Colors.light.grayDark },
  infoSep: { ...Typography.subtitle1, color: Colors.light.grayDark },
  tagText: { ...Typography.body2, color: Colors.light.primary },
  moreIconWrapper: { alignSelf: 'center', marginLeft: Spacing.h.medium, zIndex: 1 },
  deleteOverlay: { flex: 1, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  deletePopup: {
    width: width - 64,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingBottom: Spacing.v.medium,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  deleteDesc: { ...Typography.body2, color: Colors.light.primary, marginTop: Spacing.v.medium, textAlign: 'center' },
  deleteButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnConfirmText: { ...Typography.button2, color: Colors.light.grayDark },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.white },
  extraBadgeContainer: { width: SMALL, height: SMALL, borderRadius: SMALL / 2, overflow: 'hidden' },
  extraBadgeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  extraBadgeText: { ...Typography.button3, color: Colors.light.white },
  sectionEmpty: { alignItems: 'center', marginTop: Spacing.v.medium, paddingVertical: Spacing.v.medium },
  sectionEmptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  sectionEmptySubtitle: { ...Typography.body2, color: Colors.light.grayLight, marginTop: Spacing.v.small },
});
