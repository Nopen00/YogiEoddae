//app\(tabs)\ScheduleScreen.tsx
import { BackButton } from '@/components/make_component/BackButton';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useRouter } from 'expo-router';
import { Calendar, Heart, MoreVertical, Plus } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
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
import { mediaApi, placeApi, scheduleApi } from '../../services/api';
import type { Media, MediaPlace, Place, Schedule } from '../../services/types';

const TABS = ['내 일정', '과거 일정', '저장소'];
const { width } = Dimensions.get('window');
const TAB_WIDTH = width / TABS.length;

const MEDIA_TYPE_LABEL: Record<string, string> = {
  drama: '드라마', movie: '영화', youtube: '유튜브', etc: '기타',
};

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
  children,
}: {
  title: string;
  style?: object;
  showAdd?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  children: React.ReactNode;
}) => (
  <View style={style}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.divider} />
    {!isEmpty && children}
    {showAdd && (
      <TouchableOpacity style={styles.addScheduleButton} activeOpacity={0.8}>
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

// ─── 일정 카드 ────────────────────────────────────────────────
const ScheduleCard = ({ schedule }: { schedule: Schedule }) => {
  const tags = schedule.media?.tags ?? [];
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        {schedule.media?.thumbnail_url ? (
          <Image source={{ uri: schedule.media.thumbnail_url }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: Colors.light.grayLight }]} />
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{schedule.title}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>{formatDate(schedule.start_date)}</Text>
          <Text style={styles.infoSep}>-</Text>
          <Text style={styles.infoText}>{formatDate(schedule.end_date)}</Text>
        </View>
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map(tag => (
              <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
            ))}
          </View>
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
          <Text style={styles.infoSep}>|</Text>
          <Text style={styles.infoText}>{typeLabel}</Text>
        </View>
        {media.tags.length > 0 && (
          <View style={styles.tagRow}>
            {media.tags.map(tag => (
              <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [pastSchedules, setPastSchedules] = useState<Schedule[]>([]);
  const [savedCourses, setSavedCourses] = useState<Media[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [savedSpots] = useState<MediaPlace[]>([]);

  useEffect(() => {
    scheduleApi.getList().then(res => {
      const all = res.data;
      setMySchedules(all.filter(s => !isExpired(s.end_date)));
      setPastSchedules(all.filter(s => isExpired(s.end_date)));
    }).catch(() => {});
    mediaApi.getBookmarked().then(res => setSavedCourses(res.data)).catch(() => {});
    placeApi.getBookmarked().then(res => setSavedPlaces(res.data)).catch(() => {});
  }, []);

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
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>일정</Text>
      </View>

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
        <TouchableOpacity style={styles.addScheduleButton} activeOpacity={0.8}>
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
            <SectionWrapper title="현재 진행 중인 일정" isEmpty={currentSchedules.length === 0} emptyTitle="현재 진행 중인 일정이 비어있습니다." emptySubtitle="일정을 추가해보세요.">
              {currentSchedules.map(s => <ScheduleCard key={s.id} schedule={s} />)}
            </SectionWrapper>
            <SectionWrapper title="예정된 일정" style={styles.secondSection} isEmpty={plannedSchedules.length === 0} emptyTitle="예정된 일정이 비어있습니다." emptySubtitle="일정을 추가해보세요.">
              {plannedSchedules.map(s => <ScheduleCard key={s.id} schedule={s} />)}
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
            {pastSchedules.map(s => <ScheduleCard key={s.id} schedule={s} />)}
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
                  onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: m.id } })}
                />
              ))}
            </SectionWrapper>
            <SectionWrapper title="저장한 명소" style={styles.secondSection} showAdd={false} isEmpty={savedPlaces.length === 0} emptyTitle="저장한 명소가 비어있습니다.">
              {savedPlaces.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/PlaceDetailScreen', params: { id: p.id } })}
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
                    {p.tags.length > 0 && (
                      <View style={styles.tagRow}>
                        {p.tags.map(tag => (
                          <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                        ))}
                      </View>
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
                      <View style={styles.tagRow}>
                        {sp.place.tags.map(tag => (
                          <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </SectionWrapper>
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small, paddingHorizontal: Spacing.h.medium, height: 56, zIndex: 10 },
  headerTitle: { ...Typography.HeadLine5, color: Colors.light.black, position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', height: 32, position: 'relative' },
  backgroundLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: Colors.light.grayLight },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { ...Typography.subtitle1 },
  indicator: { position: 'absolute', bottom: 0, left: 0, height: 1, backgroundColor: Colors.light.black, zIndex: 1 },
  addScheduleButton: { marginTop: Spacing.v.medium, marginHorizontal: Spacing.h.medium, height: 48, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  addCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.light.white, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.v.medium },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  emptySubtitle: { ...Typography.body2, color: Colors.light.grayLight },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: Spacing.v.large },
  scrollContentOther: { paddingTop: 0, paddingBottom: Spacing.v.large },
  sectionTitle: { ...Typography.title1, color: Colors.light.black, paddingLeft: 16 },
  divider: { height: 1, backgroundColor: Colors.light.grayLight, marginTop: 8, marginHorizontal: 16 },
  secondSection: { marginTop: 32 },
  card: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 16, marginTop: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.light.grayLight, padding: 16, backgroundColor: Colors.light.white },
  imageWrapper: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', flexShrink: 0 },
  cardImage: { width: '100%', height: '100%' },
  cardContent: { flex: 1, marginLeft: 16 },
  cardTitle: { ...Typography.title1, color: Colors.light.black },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  infoText: { ...Typography.subtitle1, color: Colors.light.grayDark },
  infoSep: { ...Typography.subtitle1, color: Colors.light.grayDark },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  tagText: { ...Typography.body2, color: Colors.light.dark },
  moreIconWrapper: { alignSelf: 'center', marginLeft: 16 },
  sectionEmpty: { alignItems: 'center', marginTop: 16, paddingVertical: 16 },
  sectionEmptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  sectionEmptySubtitle: { ...Typography.body2, color: Colors.light.grayLight, marginTop: 8 },
});
