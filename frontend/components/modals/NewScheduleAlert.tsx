// components/modals/NewScheduleAlert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, PanResponder, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { NewScheduleStep2Alert } from './NewScheduleStep2Alert';

interface NewScheduleAlertProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (courseType: 'import' | 'create', name: string, range: DateRange) => void;
}

const formatYearMonth = (date: Date) => `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

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

// 팝업 좌우 16pt(overlay) + 박스 좌우 16pt(margin) = 64pt를 화면 너비에서 제외한 박스 너비
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CALENDAR_BOX_WIDTH = SCREEN_WIDTH - Spacing.h.medium * 4;

// 날짜 셀 한 칸이 차지하는 가로/세로 칸 크기(셀 24pt + 간격 16pt) — 네이티브 드래그 좌표를 셀로 환산할 때 사용
const COL_SLOT = IconSize.large + Spacing.h.medium;
const ROW_SLOT = IconSize.large + Spacing.v.medium;

// 하나의 일정에는 같은 달 안에서 연속된 하루~여러 날만 선택 가능
export interface DateRange {
  year: number;
  month: number;
  startDay: number;
  endDay: number;
}

export const NewScheduleAlert = ({ visible, onClose, onConfirm }: NewScheduleAlertProps) => {
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [range, setRange] = useState<DateRange | null>(null);
  const [isStep2Visible, setIsStep2Visible] = useState(false);
  const weeks = getMonthWeeks(calendarMonth);

  const dragAnchorDayRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const wasSoleSelectedRef = useRef(false);

  const isInRange = (day: number) =>
    !!range &&
    range.year === calendarMonth.getFullYear() &&
    range.month === calendarMonth.getMonth() &&
    day >= range.startDay &&
    day <= range.endDay;

  // dayRow에 pointerEvents="none"을 줘서 grid가 유일한 터치 타깃이 되면, locationX/Y가 정확히 grid 기준 좌표
  const getCellFromLocation = (lx: number, ly: number): DayCell | null => {
    const col = Math.min(6, Math.max(0, Math.floor(lx / COL_SLOT)));
    const row = Math.min(weeks.length - 1, Math.max(0, Math.floor(ly / ROW_SLOT)));
    const cell = weeks[row]?.[col];
    return cell?.inCurrentMonth ? cell : null;
  };

  // 웹: 셀에 직접 붙이는 핸들러 — measureInWindow/좌표계 불일치 문제 없음
  const handleCellMouseDown = (cell: DayCell) => {
    if (!cell.inCurrentMonth) return;
    wasSoleSelectedRef.current = isInRange(cell.day) && range?.startDay === cell.day && range?.endDay === cell.day;
    dragAnchorDayRef.current = cell.day;
    dragMovedRef.current = false;
    setRange({ year: calendarMonth.getFullYear(), month: calendarMonth.getMonth(), startDay: cell.day, endDay: cell.day });
  };

  const handleCellMouseEnter = (cell: DayCell) => {
    const anchor = dragAnchorDayRef.current;
    if (anchor === null || !cell.inCurrentMonth) return;
    if (cell.day !== anchor) dragMovedRef.current = true;
    setRange({
      year: calendarMonth.getFullYear(),
      month: calendarMonth.getMonth(),
      startDay: Math.min(anchor, cell.day),
      endDay: Math.max(anchor, cell.day),
    });
  };

  // 웹: document mouseup에서 드래그 종료 및 단일 선택 해제 처리
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleMouseUp = () => {
      if (dragAnchorDayRef.current === null) return;
      if (!dragMovedRef.current && wasSoleSelectedRef.current) {
        setRange(null);
      }
      dragAnchorDayRef.current = null;
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [visible]);

  // 네이티브 전용 PanResponder (웹에서는 셀 레벨 이벤트를 사용)
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: evt => {
      const cell = getCellFromLocation(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      if (!cell) return;
      wasSoleSelectedRef.current = isInRange(cell.day) && range?.startDay === cell.day && range?.endDay === cell.day;
      dragAnchorDayRef.current = cell.day;
      dragMovedRef.current = false;
      setRange({ year: calendarMonth.getFullYear(), month: calendarMonth.getMonth(), startDay: cell.day, endDay: cell.day });
    },
    onPanResponderMove: evt => {
      const anchor = dragAnchorDayRef.current;
      if (anchor === null) return;
      const cell = getCellFromLocation(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      if (!cell) return;
      if (cell.day !== anchor) dragMovedRef.current = true;
      setRange({
        year: calendarMonth.getFullYear(),
        month: calendarMonth.getMonth(),
        startDay: Math.min(anchor, cell.day),
        endDay: Math.max(anchor, cell.day),
      });
    },
    onPanResponderRelease: () => {
      if (!dragMovedRef.current && wasSoleSelectedRef.current) {
        setRange(null);
      }
      dragAnchorDayRef.current = null;
    },
  });

  const goToPrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <>
      {range && <NewScheduleStep2Alert visible={visible && isStep2Visible} onBack={() => setIsStep2Visible(false)} onClose={() => { setIsStep2Visible(false); onClose(); }} onConfirm={(courseType, name) => onConfirm(courseType, name, range)} range={range} />}
      <Modal visible={visible && !isStep2Visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.alertContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>일정 만들기</Text>
                  <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
                  </TouchableOpacity>
                </View>
                <View style={styles.calendarBox}>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={goToPrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <ChevronLeft size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                    </TouchableOpacity>
                    <Text style={styles.calendarTitle}>{formatYearMonth(calendarMonth)}</Text>
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
                  <View
                    style={[styles.daysGrid, Platform.OS === 'web' && { userSelect: 'none' } as object]}
                    {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
                  >
                    {weeks.map((week, weekIndex) => (
                      <View key={weekIndex} style={styles.dayRow} pointerEvents={Platform.OS !== 'web' ? 'none' : 'auto'}>
                        {week.map((cell, dayIndex) => {
                          const isSelected = cell.inCurrentMonth && isInRange(cell.day);
                          const prevCell = week[dayIndex - 1];
                          const nextCell = week[dayIndex + 1];
                          const prevSelected = isSelected && !!prevCell?.inCurrentMonth && isInRange(prevCell.day);
                          const nextSelected = isSelected && !!nextCell?.inCurrentMonth && isInRange(nextCell.day);
                          const isLastColumn = dayIndex === 6;

                          return (
                            <View
                              key={dayIndex}
                              style={{ width: isLastColumn ? IconSize.large : IconSize.large + Spacing.h.medium, height: IconSize.large }}
                              {...(Platform.OS === 'web' ? {
                                onMouseDown: () => handleCellMouseDown(cell),
                                onMouseEnter: () => handleCellMouseEnter(cell),
                              } as any : {})}
                            >
                              {isSelected && (
                                <View
                                  style={[
                                    styles.dayPillBackground,
                                    {
                                      width: IconSize.large + (nextSelected ? Spacing.h.medium : 0),
                                      borderTopLeftRadius: prevSelected ? 0 : IconSize.large / 2,
                                      borderBottomLeftRadius: prevSelected ? 0 : IconSize.large / 2,
                                      borderTopRightRadius: nextSelected ? 0 : IconSize.large / 2,
                                      borderBottomRightRadius: nextSelected ? 0 : IconSize.large / 2,
                                    },
                                  ]}
                                />
                              )}
                              <View style={styles.dayTouchable}>
                                <Text
                                  style={[
                                    styles.dayText,
                                    dayIndex === 0 && styles.sundayText,
                                    dayIndex === 6 && styles.saturdayText,
                                    !cell.inCurrentMonth && styles.otherMonthText,
                                    isSelected && styles.dayTextSelected,
                                  ]}
                                >
                                  {cell.day}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.nextButton, !range && styles.nextButtonDisabled]}
                  onPress={() => range && setIsStep2Visible(true)}
                >
                  <Text style={styles.nextButtonText}>다음 단계</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  title: {
    ...Typography.title1,
    color: Colors.light.black,
  },
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
  calendarTitle: {
    ...Typography.title1,
    color: Colors.light.black,
  },
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
  weekdayText: {
    ...Typography.subtitle1,
    color: Colors.light.black,
  },
  sundayText: {
    color: Colors.light.heart,
  },
  saturdayText: {
    color: Colors.light.skyBlue,
  },
  daysGrid: {
    marginTop: Spacing.v.medium,
    gap: Spacing.v.medium,
  },
  dayRow: {
    flexDirection: 'row',
  },
  dayPillBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: IconSize.large,
    backgroundColor: Colors.light.dark,
  },
  dayTouchable: {
    width: IconSize.large,
    height: IconSize.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...Typography.body2,
    color: Colors.light.black,
  },
  otherMonthText: {
    color: Colors.light.grayLight,
  },
  dayTextSelected: {
    color: Colors.light.white,
  },
  nextButton: {
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
    height: 48,
    backgroundColor: Colors.light.dark,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Colors.light.grayLight,
  },
  nextButtonText: {
    ...Typography.button2,
    color: Colors.light.white,
  },
});
