//app\(tabs)\ScheduleScreen.tsx
import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { AddPlaceConfirmAlert } from '@/components/modals/AddPlaceConfirmAlert';
import { CourseSelectPopup } from '@/components/modals/CourseSelectPopup';
import { type DateRange, NewScheduleAlert } from '@/components/modals/NewScheduleAlert';
import { NewScheduleStep3Alert } from '@/components/modals/NewScheduleStep3Alert';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CATEGORY_LABEL, CITY_SHORT, MEDIA_TYPE_LABEL, shortAddress } from '@/constants/labels';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Heart, MoreVertical, Plus } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mediaApi, placeApi, scheduleApi } from '../services/api';
import type { DailyPlace, Media, MediaPlace, Place, Schedule } from '../services/types';

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
const ScheduleCard = ({ schedule, onPress }: { schedule: Schedule; onPress?: () => void }) => {
  const tags = getScheduleTags(schedule);
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
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
        <MoreVertical size={IconSize.large} color={Colors.light.black} />
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

  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [pastSchedules, setPastSchedules] = useState<Schedule[]>([]);
  const [savedCourses, setSavedCourses] = useState<Media[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [savedSpots] = useState<MediaPlace[]>([]);
  const [isNewScheduleVisible, setIsNewScheduleVisible] = useState(false);
  const [newScheduleKey, setNewScheduleKey] = useState(0);
  const [isCourseSelectVisible, setIsCourseSelectVisible] = useState(false);
  const [isPlaceSelectVisible, setIsPlaceSelectVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isPlaceConfirmVisible, setIsPlaceConfirmVisible] = useState(false);
  const [isStep3Visible, setIsStep3Visible] = useState(false);
  const [selectedCourseMedia, setSelectedCourseMedia] = useState<Media | null>(null);
  const [scheduleData, setScheduleData] = useState<{ name: string; range: DateRange } | null>(null);

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
      mediaApi.getBookmarked().then(res => setSavedCourses(res.data)).catch(() => {});
      placeApi.getBookmarked().then(res => setSavedPlaces(res.data)).catch(() => {});
    }, [])
  );

  const handleTabPress = (index: number) => {
    setSelectedIndex(index);
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const currentSchedules = mySchedules.filter(isCurrent);
  const plannedSchedules = mySchedules.filter(isPlanned);

  const mySchedulesEmpty = currentSchedules.length === 0 && plannedSchedules.length === 0;
  const pastEmpty = pastSchedules.length === 0;
  const savedEmpty = savedCourses.length === 0 && savedPlaces.length === 0 && savedSpots.length === 0;

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

      {/* 내 일정 탭 */}
      {selectedIndex === 0 && (
        mySchedulesEmpty ? (
          <View style={styles.emptyContainer}>
            <Calendar size={IconSize.xxlarge} color={Colors.light.grayLight} strokeWidth={IconStroke.thin} />
            <Text style={styles.emptyTitle}>일정이 없습니다.</Text>
            <Text style={styles.emptySubtitle}>일정을 추가해보세요.</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <SectionWrapper title="현재 진행 중인 일정" isEmpty={currentSchedules.length === 0} emptyTitle="현재 진행 중인 일정이 비어있습니다." emptySubtitle="일정을 추가해보세요." onAddPress={openNewScheduleFresh}>
              {currentSchedules.map(s => <ScheduleCard key={s.id} schedule={s} onPress={() => router.push({ pathname: '/ScheduleDetailScreen', params: { id: s.id, title: s.title } })} />)}
            </SectionWrapper>
            <SectionWrapper title="예정된 일정" style={styles.secondSection} isEmpty={plannedSchedules.length === 0} emptyTitle="예정된 일정이 비어있습니다." emptySubtitle="일정을 추가해보세요." onAddPress={openNewScheduleFresh}>
              {plannedSchedules.map(s => <ScheduleCard key={s.id} schedule={s} onPress={() => router.push({ pathname: '/ScheduleDetailScreen', params: { id: s.id, title: s.title } })} />)}
            </SectionWrapper>
          </ScrollView>
        )
      )}

      {/* 과거 일정 탭 */}
      {selectedIndex === 1 && (
        pastEmpty ? (
          <View style={styles.emptyContainer}>
            <Calendar size={IconSize.xxlarge} color={Colors.light.grayLight} strokeWidth={IconStroke.thin} />
            <Text style={styles.emptyTitle}>일정이 없습니다.</Text>
            <Text style={styles.emptySubtitle}>일정을 추가해보세요.</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentOther} showsVerticalScrollIndicator={false}>
            {pastSchedules.map(s => <ScheduleCard key={s.id} schedule={s} onPress={() => router.push({ pathname: '/ScheduleDetailScreen', params: { id: s.id, title: s.title } })} />)}
          </ScrollView>
        )
      )}

      {/* 저장소 탭 */}
      {selectedIndex === 2 && (
        savedEmpty ? (
          <View style={styles.emptyContainer}>
            <Heart size={IconSize.xxlarge} color={Colors.light.grayLight} strokeWidth={IconStroke.thin} />
            <Text style={styles.emptyTitle}>저장소가 비어있습니다.</Text>
            <Text style={styles.emptySubtitle}>마음에 드는 걸 추가해보세요.</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <SectionWrapper title="저장한 코스" showAdd={false} isEmpty={savedCourses.length === 0} emptyTitle="저장한 코스가 비어있습니다.">
              {savedCourses.map(m => (
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
              ))}
            </SectionWrapper>
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
            <SectionWrapper title="저장한 포토스팟" style={styles.secondSection} showAdd={false} isEmpty={savedSpots.length === 0} emptyTitle="저장한 포토스팟이 비어있습니다.">
              {savedSpots.map(sp => (
                <TouchableOpacity key={sp.id} style={styles.card} activeOpacity={0.85}>
                  <View style={styles.imageWrapper}>
                    {sp.place.image_url ? (
                      <Image source={{ uri: sp.place.image_url }} style={styles.cardImage} />
                    ) : (
                      <View style={[styles.cardImage, { backgroundColor: Colors.light.grayLight }]} />
                    )}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{sp.place.name}</Text>
                    {sp.place.tags.length > 0 && (
                      <TagRow>
                        {sp.place.tags.map(tag => (
                          <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                        ))}
                      </TagRow>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </SectionWrapper>
          </ScrollView>
        )
      )}

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
          onClose={() => setIsPlaceConfirmVisible(false)}
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
      {selectedCourseMedia && (
        <NewScheduleStep3Alert
          visible={isStep3Visible}
          onClose={() => setIsStep3Visible(false)}
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
  moreIconWrapper: { alignSelf: 'center', marginLeft: Spacing.h.medium },
  extraBadgeContainer: { width: SMALL, height: SMALL, borderRadius: SMALL / 2, overflow: 'hidden' },
  extraBadgeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  extraBadgeText: { ...Typography.button3, color: Colors.light.white },
  sectionEmpty: { alignItems: 'center', marginTop: Spacing.v.medium, paddingVertical: Spacing.v.medium },
  sectionEmptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  sectionEmptySubtitle: { ...Typography.body2, color: Colors.light.grayLight, marginTop: Spacing.v.small },
});
