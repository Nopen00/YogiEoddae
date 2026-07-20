//app\(tabs)\ScheduleScreen.tsx
import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { NewScheduleAlert } from '@/components/modals/NewScheduleAlert';
import { ScheduleMoreMenuAlert } from '@/components/modals/ScheduleMoreMenuAlert';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CITY_SHORT, MEDIA_TYPE_LABEL } from '@/constants/labels';
import { Size } from '@/constants/Size';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, MoreVertical, Plus } from 'lucide-react-native';
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
import PagerView, { PagerViewHandle } from '@/components/ui/PagerViewWrapper';
import { scheduleApi } from '../services/api';
import type { DailyPlace, Schedule } from '../services/types';

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

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function ScheduleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; scheduleId?: string; dayNumber?: string; tab?: string }>();
  const initialTabIndex = params.tab ? Number(params.tab) : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialTabIndex);
  const translateX = useRef(new Animated.Value(initialTabIndex * TAB_WIDTH)).current;
  const pagerRef = useRef<PagerViewHandle>(null);

  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [pastSchedules, setPastSchedules] = useState<Schedule[]>([]);
  const [isNewScheduleVisible, setIsNewScheduleVisible] = useState(false);
  const [newScheduleKey, setNewScheduleKey] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

  const openNewScheduleFresh = () => {
    setNewScheduleKey(k => k + 1);
    setIsNewScheduleVisible(true);
  };

  useEffect(() => {
    if (params.mode === 'addPlace') {
      router.replace({ pathname: '/SavedListScreen', params: { type: 'place', mode: 'addPlace', scheduleId: params.scheduleId, dayNumber: params.dayNumber } });
    }
    // 진입 시점의 초기 파라미터만 확인하는 마운트 1회성 효과 — params.mode를 deps에 넣으면 재실행됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      scheduleApi.getList().then(res => {
        const all = [...new Map(res.data.map((s: Schedule) => [s.id, s])).values()];
        setMySchedules(all.filter((s: Schedule) => !isExpired(s.end_date)));
        setPastSchedules(all.filter((s: Schedule) => isExpired(s.end_date)));
      }).catch(() => {});
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

  const currentSchedules = mySchedules.filter(isCurrent);
  const plannedSchedules = mySchedules.filter(isPlanned);
  const mySchedulesEmpty = currentSchedules.length === 0 && plannedSchedules.length === 0;
  const pastEmpty = pastSchedules.length === 0;

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

      <PagerView ref={pagerRef} style={{ flex: 1 }} initialPage={initialTabIndex} onPageSelected={handlePageSelected}>
      {/* 내 일정 탭 */}
      <View key="0" style={{ flex: 1 }}>
        {mySchedulesEmpty ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>일정이 없습니다.</Text>
            <Text style={styles.emptySubtitle}>일정을 추가해보세요.</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
        <TouchableOpacity style={styles.savedMenuItem} activeOpacity={0.7} onPress={() => router.push({ pathname: '/SavedListScreen', params: { type: 'course' } })}>
          <Text style={styles.savedMenuLabel}>코스</Text>
          <ChevronRight size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.savedMenuItem, styles.savedMenuItemSpaced]} activeOpacity={0.7} onPress={() => router.push({ pathname: '/SavedListScreen', params: { type: 'place' } })}>
          <Text style={styles.savedMenuLabel}>명소</Text>
          <ChevronRight size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.savedMenuItem, styles.savedMenuItemSpaced]} activeOpacity={0.7} onPress={() => router.push({ pathname: '/SavedListScreen', params: { type: 'photo' } })}>
          <Text style={styles.savedMenuLabel}>포토스팟</Text>
          <ChevronRight size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>
      </View>
      </PagerView>

      <Modal visible={deleteTarget !== null} transparent animationType="fade">
        <View style={styles.deleteOverlay}>
          <View style={styles.deletePopup}>
            <Text style={styles.deleteTitle}>일정을 삭제하시겠습니까?</Text>
            <Text style={styles.deleteDesc}>삭제된 일정은 되돌릴 수 없습니다.</Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={styles.btnCancel}
                activeOpacity={0.8}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={styles.btnCancelText}>취소</Text>
              </TouchableOpacity>
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
            setIsNewScheduleVisible(false);
            router.push({ pathname: '/SavedListScreen', params: { type: 'course', mode: 'import', scheduleName: name, startDate, endDate } });
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
    ...Shadows.card,
  },
  deleteTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  deleteDesc: { ...Typography.body2, color: Colors.light.primary, marginTop: Spacing.v.medium, textAlign: 'center' },
  deleteButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnConfirmText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },
  extraBadgeContainer: { width: SMALL, height: SMALL, borderRadius: SMALL / 2, overflow: 'hidden' },
  extraBadgeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  extraBadgeText: { ...Typography.button3, color: Colors.light.white },
  sectionEmpty: { alignItems: 'center', marginTop: Spacing.v.medium, paddingVertical: Spacing.v.medium },
  sectionEmptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  sectionEmptySubtitle: { ...Typography.body2, color: Colors.light.grayLight, marginTop: Spacing.v.small },
  savedMenuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.h.medium, marginTop: Spacing.v.medium },
  savedMenuItemSpaced: { marginTop: Spacing.v.large },
  savedMenuLabel: { ...Typography.title1, color: Colors.light.black },
});
