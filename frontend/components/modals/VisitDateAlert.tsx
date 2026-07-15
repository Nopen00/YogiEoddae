// components/modals/VisitDateAlert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Modal, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { MonthPickerRow } from './NewScheduleAlert';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const formatYearMonth = (date: Date) => `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;

interface DayCell {
  day: number;
  inCurrentMonth: boolean;
}

const getMonthWeeks = (date: Date): DayCell[][] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, inCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inCurrentMonth: true });
  }
  for (let d = 1; cells.length % 7 !== 0; d++) {
    cells.push({ day: d, inCurrentMonth: false });
  }

  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CALENDAR_BOX_WIDTH = SCREEN_WIDTH - Spacing.h.medium * 4;

export interface VisitDate {
  year: number;
  month: number; // 0~11
  day: number;
}

interface VisitDateAlertProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: VisitDate) => void;
  initialDate?: VisitDate | null;
}

export const VisitDateAlert = ({ visible, onClose, onConfirm, initialDate }: VisitDateAlertProps) => {
  const [calendarMonth, setCalendarMonth] = useState(
    initialDate ? new Date(initialDate.year, initialDate.month, 1) : new Date()
  );
  const [selectedDate, setSelectedDate] = useState<VisitDate | null>(initialDate ?? null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const weeks = getMonthWeeks(calendarMonth);

  const isSelectedCell = (cell: DayCell) =>
    cell.inCurrentMonth &&
    !!selectedDate &&
    selectedDate.year === calendarMonth.getFullYear() &&
    selectedDate.month === calendarMonth.getMonth() &&
    selectedDate.day === cell.day;

  const handleCellPress = (cell: DayCell) => {
    if (!cell.inCurrentMonth) return;
    setSelectedDate({ year: calendarMonth.getFullYear(), month: calendarMonth.getMonth(), day: cell.day });
  };

  const goToPrevMonth = () => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const handleConfirm = () => {
    if (!selectedDate) return;
    onConfirm(selectedDate);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.alertContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>방문 날짜</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                </TouchableOpacity>
              </View>

              <View style={styles.calendarBox}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={goToPrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <ChevronLeft size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowMonthPicker(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.calendarTitle}>{formatYearMonth(calendarMonth)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={goToNextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <ChevronRight size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekdayRow}>
                  {WEEKDAYS.map((day, index) => (
                    <View key={day} style={styles.weekdayCell}>
                      <Text
                        style={[
                          styles.weekdayText,
                          index === 0 && styles.sundayText,
                          index === 6 && styles.saturdayText,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.daysGrid}>
                  {weeks.map((week, weekIndex) => (
                    <View key={weekIndex} style={styles.dayRow}>
                      {week.map((cell, dayIndex) => {
                        const selected = isSelectedCell(cell);
                        const isLastColumn = dayIndex === 6;
                        return (
                          <TouchableOpacity
                            key={dayIndex}
                            style={{ width: isLastColumn ? IconSize.large : IconSize.large + Spacing.h.medium, height: IconSize.large }}
                            onPress={() => handleCellPress(cell)}
                            activeOpacity={0.7}
                          >
                            {selected && <View style={styles.dayPillBackground} />}
                            <View style={styles.dayTouchable}>
                              <Text
                                style={[
                                  styles.dayText,
                                  dayIndex === 0 && styles.sundayText,
                                  dayIndex === 6 && styles.saturdayText,
                                  !cell.inCurrentMonth && styles.otherMonthText,
                                  selected && styles.dayTextSelected,
                                ]}
                              >
                                {cell.day}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.confirmButton, !selectedDate && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      <Modal
        visible={visible && showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowMonthPicker(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <MonthPickerRow current={calendarMonth} onSelect={(d) => setCalendarMonth(d)} />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.medium,
  },
  alertContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingBottom: Spacing.v.medium,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  title: { ...Typography.title1, color: Colors.light.black },
  calendarBox: {
    width: CALENDAR_BOX_WIDTH,
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarTitle: { ...Typography.title1, color: Colors.light.black },
  weekdayRow: {
    flexDirection: 'row',
    marginTop: Spacing.v.medium,
    gap: Spacing.h.medium,
  },
  weekdayCell: {
    width: IconSize.large,
    height: IconSize.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: { ...Typography.subtitle1, color: Colors.light.black },
  sundayText: { color: Colors.light.heart },
  saturdayText: { color: Colors.light.skyBlue },
  daysGrid: {
    marginTop: Spacing.v.medium,
    gap: Spacing.v.medium,
  },
  dayRow: { flexDirection: 'row' },
  dayPillBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: IconSize.large,
    height: IconSize.large,
    borderRadius: IconSize.large / 2,
    backgroundColor: Colors.light.dark,
  },
  dayTouchable: {
    width: IconSize.large,
    height: IconSize.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { ...Typography.body2, color: Colors.light.black },
  otherMonthText: { color: Colors.light.grayLight },
  dayTextSelected: { color: Colors.light.white },
  confirmButton: {
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
    height: 48,
    backgroundColor: Colors.light.dark,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: { backgroundColor: Colors.light.grayLight },
  confirmButtonText: { ...Typography.button2, color: Colors.light.white },
  pickerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)' },
});
