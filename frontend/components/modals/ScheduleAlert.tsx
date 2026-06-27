//components\modals\ScheduleAlert.tsx
import { TagRow } from '@/components/ui/TagRow';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CITY_SHORT, MEDIA_TYPE_LABEL } from '@/constants/labels';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import type { DailyPlace, Schedule } from '@/services/types';
import { Calendar, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

// ─── PlaceImageCluster ────────────────────────────────────────
const CLUSTER = Size.circleMd;
const SMALL = 22;
const GAP = Spacing.r.xsmall;

const SmallCircle = ({ uri, size, style }: { uri: string | null; size: number; style?: object }) => {
  const base = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[base, style]} />;
  return <View style={[base, { backgroundColor: Colors.light.grayLight }, style]} />;
};

const PlaceImageCluster = ({ dailyPlaces }: { dailyPlaces: DailyPlace[] }) => {
  const count = dailyPlaces.length;
  const abs = (left: number, top: number) => ({ position: 'absolute' as const, left, top });

  if (count === 0)
    return <View style={{ width: CLUSTER, height: CLUSTER, borderRadius: CLUSTER / 2, backgroundColor: Colors.light.grayLight }} />;
  if (count === 1)
    return <SmallCircle uri={dailyPlaces[0].place.image_url} size={CLUSTER} />;

  const midY = (CLUSTER - SMALL) / 2;

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

  const extra = count - 4;
  return (
    <View style={{ width: CLUSTER, height: CLUSTER }}>
      <SmallCircle uri={dailyPlaces[0].place.image_url} size={SMALL} style={abs(0, 0)} />
      <SmallCircle uri={dailyPlaces[1].place.image_url} size={SMALL} style={abs(SMALL + GAP, 0)} />
      <SmallCircle uri={dailyPlaces[2].place.image_url} size={SMALL} style={abs(0, SMALL + GAP)} />
      {count >= 5 ? (
        <View style={[{ width: SMALL, height: SMALL, borderRadius: SMALL / 2, overflow: 'hidden' }, abs(SMALL + GAP, SMALL + GAP)]}>
          <SmallCircle uri={dailyPlaces[3].place.image_url} size={SMALL} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ ...Typography.button3, color: Colors.light.white }}>+{extra}</Text>
          </View>
        </View>
      ) : (
        <SmallCircle uri={dailyPlaces[3].place.image_url} size={SMALL} style={abs(SMALL + GAP, SMALL + GAP)} />
      )}
    </View>
  );
};

// ─── Helpers ──────────────────────────────────────────────────
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

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '';
  return dateStr.replace(/-/g, '.');
};

const getDays = (schedule: Schedule) => {
  if (!schedule.start_date || !schedule.end_date) return [{ dayLabel: 'Day 1', date: '' }];
  const start = new Date(schedule.start_date);
  const end = new Date(schedule.end_date);
  const days: { dayLabel: string; date: string }[] = [];
  const cur = new Date(start);
  let i = 1;
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    days.push({ dayLabel: `Day ${i}`, date: `${y}.${m}.${d}` });
    cur.setDate(cur.getDate() + 1);
    i++;
  }
  return days;
};

// ─── Props ────────────────────────────────────────────────────
interface ScheduleAlertProps {
  visible: boolean;
  onClose: () => void;
  schedules: Schedule[];
  onConfirm?: (scheduleId: number, dayNumber: number) => void;
  checkMedia?: boolean;
}

// ─── Component ────────────────────────────────────────────────
export const ScheduleAlert = ({ visible, onClose, schedules, onConfirm, checkMedia }: ScheduleAlertProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ scheduleId: number; dayIndex: number } | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [failVisible, setFailVisible] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const uniqueSchedules = [...new Map(schedules.map(s => [s.id, s])).values()];

  const currentSchedules = uniqueSchedules.filter(s => {
    if (!s.start_date || !s.end_date) return false;
    return new Date(s.start_date) <= today && new Date(s.end_date) >= today;
  });

  const plannedSchedules = uniqueSchedules.filter(s => {
    if (!s.start_date) return false;
    return new Date(s.start_date) > today;
  });

  const isButtonEnabled = selectedDay !== null;

  const handleConfirm = async () => {
    if (!selectedDay) return;
    if (checkMedia) {
      const target = uniqueSchedules.find(s => s.id === selectedDay.scheduleId);
      if (target?.media) {
        setFailVisible(true);
        return;
      }
    }
    try {
      await onConfirm?.(selectedDay.scheduleId, selectedDay.dayIndex + 1);
      onClose();
      setResultVisible(true);
    } catch {
      setFailVisible(true);
    }
  };

  const renderCard = (schedule: Schedule) => {
    const isExpanded = expandedId === schedule.id;
    const days = getDays(schedule);
    const tags = getScheduleTags(schedule);

    return (
      <TouchableOpacity
        key={schedule.id}
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => setExpandedId(isExpanded ? null : schedule.id)}
      >
        <View style={styles.cardRow}>
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
        </View>

        {isExpanded && (
          <View style={styles.dayListSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScrollContent}>
              {days.map((item, index) => {
                const isSelected = selectedDay?.scheduleId === schedule.id && selectedDay?.dayIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedDay(isSelected ? null : { scheduleId: schedule.id, dayIndex: index });
                    }}
                    style={[styles.dayButton, isSelected ? styles.dayButtonSelected : styles.dayButtonUnselected]}
                  >
                    <Text style={[styles.dayLabel, isSelected ? styles.textWhite : styles.textBlack]}>{item.dayLabel}</Text>
                    <Text style={[styles.dateText, isSelected ? styles.textLightGray : styles.textDarkGray]}>{item.date}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const hasSchedules = currentSchedules.length > 0 || plannedSchedules.length > 0;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.alertContainer}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>일정 추가하기</Text>
                  <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                  </TouchableOpacity>
                </View>

                {!hasSchedules ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>일정이 없습니다.</Text>
                    <Text style={styles.emptySubtitle}>일정을 추가해주세요.</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {currentSchedules.length > 0 && (
                      <View>
                        <Text style={styles.sectionTitle}>현재 진행중인 일정</Text>
                        {currentSchedules.map(renderCard)}
                      </View>
                    )}
                    {plannedSchedules.length > 0 && (
                      <View style={currentSchedules.length > 0 ? styles.sectionGap : undefined}>
                        <Text style={styles.sectionTitle}>예정된 일정</Text>
                        {plannedSchedules.map(renderCard)}
                      </View>
                    )}
                    <View style={{ height: Spacing.v.medium }} />
                  </ScrollView>
                )}

                <TouchableOpacity
                  style={[styles.addButton, isButtonEnabled ? styles.addButtonActive : styles.addButtonInactive]}
                  activeOpacity={isButtonEnabled ? 0.7 : 1}
                  onPress={handleConfirm}
                >
                  <Text style={styles.addButtonText}>추가하기</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={resultVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.resultOverlay}
          activeOpacity={1}
          onPress={() => setResultVisible(false)}
        >
          <View style={styles.resultPopupBox}>
            <Calendar size={IconSize.xxlarge} color={Colors.light.primary} strokeWidth={IconStroke.thin} style={styles.resultIcon} />
            <Text style={styles.resultText}>일정에 성공적으로 추가했습니다!</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={failVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.resultOverlay}
          activeOpacity={1}
          onPress={() => { setFailVisible(false); onClose(); }}
        >
          <View style={styles.failPopupBox}>
            <Text style={styles.failTitle}>일정 추가에 실패했습니다.</Text>
            <Text style={styles.failDesc}>한 일정당 하나의 미디어 코스만 가능합니다.</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.medium,
  },
  alertContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingBottom: Spacing.v.medium,
    maxHeight: '82%',
    ...Platform.select({
      ios: { shadowColor: Colors.light.black, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    marginBottom: Spacing.v.small,
  },
  headerTitle: { ...Typography.title1, color: Colors.light.black },
  scrollView: { flexGrow: 0 },
  sectionTitle: {
    ...Typography.title2,
    color: Colors.light.grayDark,
    marginHorizontal: Spacing.h.medium,
    marginTop: 16,
  },
  sectionGap: { marginTop: Spacing.v.medium },
  card: {
    marginHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.small,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
    backgroundColor: Colors.light.white,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardContent: { flex: 1, marginLeft: Spacing.h.medium },
  cardTitle: { ...Typography.title1, color: Colors.light.black },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small, gap: Spacing.h.xsmall },
  infoText: { ...Typography.subtitle1, color: Colors.light.grayDark },
  infoSep: { ...Typography.subtitle1, color: Colors.light.grayDark },
  tagText: { ...Typography.body2, color: Colors.light.primary },
  dayListSection: { marginTop: Spacing.v.medium },
  dayScrollContent: { gap: Spacing.v.small },
  dayButton: {
    width: 139,
    height: 78,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    alignItems: 'center',
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.xlarge,
  },
  dayButtonUnselected: { backgroundColor: Colors.light.white, borderColor: Colors.light.grayLight },
  dayButtonSelected: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  dayLabel: { ...Typography.title2, marginBottom: Spacing.v.small },
  dateText: { ...Typography.body2 },
  textWhite: { color: Colors.light.white },
  textBlack: { color: Colors.light.black },
  textLightGray: { color: Colors.light.grayLight },
  textDarkGray: { color: Colors.light.grayDark },
  addButton: {
    height: Size.buttonMd,
    marginHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonInactive: { backgroundColor: Colors.light.grayLight },
  addButtonActive: { backgroundColor: Colors.light.primary },
  addButtonText: { ...Typography.button2, color: Colors.light.white },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.v.large },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black, marginBottom: Spacing.v.small },
  emptySubtitle: { ...Typography.body2, color: Colors.light.grayLight },
  resultOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.xlarge,
  },
  resultPopupBox: {
    height: 116,
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    alignItems: 'center',
  },
  resultIcon: { marginTop: Spacing.v.medium, width: 48, height: 48 },
  resultText: { marginTop: Spacing.v.medium, ...Typography.subtitle2, color: Colors.light.black },
  failPopupBox: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    alignItems: 'center',
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  failTitle: { ...Typography.subtitle2, color: Colors.light.black },
  failDesc: { ...Typography.body2, color: Colors.light.primary, marginTop: 16 },
});
