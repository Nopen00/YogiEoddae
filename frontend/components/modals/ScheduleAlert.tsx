//components\make_component\ScheduleAlert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Typography } from '@/constants/Typography';
import type { Schedule } from '@/services/types';
import { Calendar, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface DayItem {
  dayLabel: string;
  date: string;
}

interface ScheduleAlertProps {
  visible: boolean;
  onClose: () => void;
  schedules: Schedule[];
}

const getDays = (schedule: Schedule): DayItem[] => {
  if (!schedule.start_date || !schedule.end_date) return [{ dayLabel: 'Day 1', date: '' }];
  const start = new Date(schedule.start_date);
  const end = new Date(schedule.end_date);
  const days: DayItem[] = [];
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

const formatPeriod = (s: Schedule) => {
  if (!s.start_date || !s.end_date) return '';
  return `${s.start_date.replace(/-/g, '.')} ~ ${s.end_date.replace(/-/g, '.')}`;
};

export const ScheduleAlert = ({ visible, onClose, schedules }: ScheduleAlertProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ scheduleId: number; dayIndex: number } | null>(null);
  const [resultPopup, setResultPopup] = useState<{ visible: boolean; isSuccess: boolean }>({
    visible: false,
    isSuccess: true,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentSchedules = schedules.filter(s => {
    if (!s.start_date || !s.end_date) return false;
    const start = new Date(s.start_date);
    const end = new Date(s.end_date);
    return start <= today && end >= today;
  });

  const plannedSchedules = schedules.filter(s => {
    if (!s.start_date) return false;
    return new Date(s.start_date) > today;
  });

  const isButtonEnabled = selectedDay !== null;

  const handleAddAction = () => {
    if (isButtonEnabled) {
      onClose();
      setResultPopup({ visible: true, isSuccess: true });
    }
  };

  const renderScheduleList = (list: Schedule[]) => {
    if (list.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>일정이 없습니다.</Text>
          <Text style={styles.emptySubtitle}>일정을 추가해주세요</Text>
        </View>
      );
    }
    return list.map(schedule => {
      const isExpanded = expandedId === schedule.id;
      const days = getDays(schedule);
      return (
        <TouchableOpacity
          key={schedule.id}
          style={[styles.accordionButton, isExpanded && styles.expandedButton]}
          activeOpacity={0.9}
          onPress={() => setExpandedId(isExpanded ? null : schedule.id)}
        >
          <View style={styles.infoRow}>
            <View style={styles.imageWrapper}>
              {schedule.media?.thumbnail_url ? (
                <Image source={{ uri: schedule.media.thumbnail_url }} style={styles.image} />
              ) : (
                <View style={[styles.image, { backgroundColor: Colors.light.grayLight }]} />
              )}
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.scheduleName} numberOfLines={1}>{schedule.title}</Text>
              <Text style={styles.periodText}>{formatPeriod(schedule)}</Text>
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
    });
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.alertContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>예정된 일정</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={IconSize.large} color={Colors.light.grayLight} />
              </TouchableOpacity>
            </View>
            {renderScheduleList(plannedSchedules)}

            <View style={styles.currentSectionWrapper}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>현재 진행중인 일정</Text>
              </View>
              {renderScheduleList(currentSchedules)}
            </View>

            <TouchableOpacity
              style={[styles.addButton, isButtonEnabled ? styles.addButtonActive : styles.addButtonInactive]}
              activeOpacity={isButtonEnabled ? 0.7 : 1}
              onPress={handleAddAction}
            >
              <Text style={styles.addButtonText}>추가하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={resultPopup.visible} transparent animationType="none">
        <TouchableOpacity
          style={styles.resultOverlay}
          activeOpacity={1}
          onPress={() => setResultPopup({ ...resultPopup, visible: false })}
        >
          <View style={styles.resultPopupBox}>
            <Calendar size={IconSize.xxlarge} color={Colors.light.primary} strokeWidth={IconStroke.thin} style={styles.resultIcon} />
            <Text style={styles.resultText}>
              {resultPopup.isSuccess ? '일정에 성공적으로 추가했습니다!' : '일정에 추가를 실패했습니다.'}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center', paddingHorizontal: 16 },
  alertContainer: { backgroundColor: Colors.light.white, borderRadius: 8, borderWidth: 1, borderColor: Colors.light.grayLight, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { ...Typography.title1, color: Colors.light.black },
  currentSectionWrapper: { marginTop: 16 },
  emptyContainer: { alignItems: 'center', paddingVertical: 16 },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black, marginBottom: 16 },
  emptySubtitle: { ...Typography.body2, color: Colors.light.grayLight },
  accordionButton: { marginHorizontal: 16, marginTop: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.light.grayLight, padding: 16, backgroundColor: Colors.light.white },
  expandedButton: {},
  infoRow: { flexDirection: 'row' },
  imageWrapper: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  infoTextWrapper: { marginLeft: 16, flex: 1, justifyContent: 'center' },
  scheduleName: { ...Typography.title1, color: Colors.light.black },
  periodText: { marginTop: 4, ...Typography.body2, color: Colors.light.grayDark },
  dayListSection: { marginTop: 16 },
  dayScrollContent: { gap: 8 },
  dayButton: { width: 139, height: 78, borderRadius: 8, borderWidth: 1, alignItems: 'center', paddingTop: 16, paddingHorizontal: 32 },
  dayButtonUnselected: { backgroundColor: Colors.light.white, borderColor: Colors.light.grayLight },
  dayButtonSelected: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  dayLabel: { ...Typography.title2, marginBottom: 8 },
  dateText: { ...Typography.body2 },
  addButton: { height: 48, marginHorizontal: 16, marginTop: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addButtonInactive: { backgroundColor: Colors.light.grayLight },
  addButtonActive: { backgroundColor: Colors.light.primary },
  addButtonText: { ...Typography.button2, color: Colors.light.white },
  resultOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center', paddingHorizontal: 32 },
  resultPopupBox: { height: 116, backgroundColor: Colors.light.white, borderRadius: 8, borderWidth: 1, borderColor: Colors.light.grayLight, alignItems: 'center' },
  resultIcon: { marginTop: 16, width: 48, height: 48 },
  resultText: { marginTop: 16, ...Typography.subtitle2, color: Colors.light.black },
  textWhite: { color: Colors.light.white },
  textBlack: { color: Colors.light.black },
  textLightGray: { color: Colors.light.grayLight },
  textDarkGray: { color: Colors.light.grayDark },
});
