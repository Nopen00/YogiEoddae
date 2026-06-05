import { BackButton } from '@/components/make_component/BackButton';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Plus } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleApi } from '../../services/api';
import type { Schedule } from '../../services/types';

const TABS = ['내 일정', '과거 일정', '저장소'];
const { width } = Dimensions.get('window');
const TAB_WIDTH = width / TABS.length;

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '.');
};

const isExpired = (endDate: string | null) => {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
};

export default function ScheduleScreen() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [savedSchedules, setSavedSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    scheduleApi.getList().then(res => setMySchedules(res.data)).catch(() => {});
    scheduleApi.getBookmarked().then(res => setSavedSchedules(res.data)).catch(() => {});
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

  const activeSchedules = mySchedules.filter(s => !isExpired(s.end_date));
  const pastSchedules = mySchedules.filter(s => isExpired(s.end_date));

  const currentList =
    selectedIndex === 0 ? activeSchedules :
    selectedIndex === 1 ? pastSchedules :
    savedSchedules;

  const isEmpty = currentList.length === 0;
  const showAddButton = selectedIndex !== 2 && isEmpty;

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

      {/* 일정 추가 버튼 — 탭 16pt 아래, 내 일정/과거 일정 비어있을 때만 */}
      {showAddButton && (
        <TouchableOpacity style={styles.addScheduleButton} activeOpacity={0.8}>
          <View style={styles.addCircle}>
            <Plus size={20} color={Colors.light.black} strokeWidth={2} />
          </View>
        </TouchableOpacity>
      )}

      {/* 콘텐츠 영역 */}
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Calendar size={48} color={Colors.light.grayLight} strokeWidth={2} />
          <Text style={styles.emptyTitle}>일정이 없습니다.</Text>
          <Text style={styles.emptySubtitle}>일정을 추가해보세요.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentList.map((schedule) => {
            const dayCount = new Set(schedule.daily_places.map(dp => dp.day_number)).size;
            const placeCount = schedule.daily_places.length;
            return (
              <TouchableOpacity key={schedule.id} style={styles.card} activeOpacity={0.85}>
                <View style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{schedule.title}</Text>
                    <ChevronRight size={16} color={Colors.light.grayDark} />
                  </View>
                  <Text style={styles.cardDate}>
                    {schedule.start_date && schedule.end_date
                      ? `${formatDate(schedule.start_date)} ~ ${formatDate(schedule.end_date)}`
                      : '날짜 미정'}
                  </Text>
                  <View style={styles.cardInfoRow}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{dayCount}일</Text>
                    </View>
                    <Text style={styles.cardPlaces}>장소 {placeCount}곳</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    paddingHorizontal: Spacing.h.medium,
    height: 56,
    zIndex: 10,
  },
  headerTitle: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    height: 32,
    position: 'relative',
  },
  backgroundLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.light.grayLight,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    ...Typography.subtitle1,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 1,
    backgroundColor: Colors.light.black,
    zIndex: 1,
  },
  addScheduleButton: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    height: 48,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.v.medium,
  },
  emptyTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
  },
  emptySubtitle: {
    ...Typography.body2,
    color: Colors.light.grayLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.h.medium,
    paddingTop: Spacing.v.medium,
    paddingBottom: Spacing.v.large,
    gap: Spacing.v.medium,
  },
  card: {
    flexDirection: 'row',
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.v.medium,
    backgroundColor: Colors.light.white,
    gap: Spacing.h.medium,
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...Typography.title2,
    color: Colors.light.black,
    flex: 1,
  },
  cardDate: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.h.small,
  },
  badge: {
    paddingHorizontal: Spacing.h.small,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.light.secondary,
  },
  badgeText: {
    ...Typography.body1,
    color: Colors.light.dark,
  },
  cardPlaces: {
    ...Typography.body2,
    color: Colors.light.grayDark,
  },
});
