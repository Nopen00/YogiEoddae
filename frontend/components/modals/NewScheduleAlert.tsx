// components/modals/NewScheduleAlert.tsx

// 색상, 아이콘 크기, 간격, 타이포그래피 등 디자인 시스템 상수 임포트
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

// UI 구성 요소 및 아이콘 임포트
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';

// React Native 기본 컴포넌트 및 API 임포트
import { Dimensions, Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

// 다음 단계 모달 컴포넌트 임포트
import { NewScheduleStep2Alert } from './NewScheduleStep2Alert';

// 부모 컴포넌트로부터 전달받는 props 인터페이스 정의
interface NewScheduleAlertProps {
  visible: boolean; // 모달 표시 여부
  onClose: () => void; // 모달 닫기 콜백
  onConfirm: (courseType: 'import' | 'create', name: string, range: DateRange) => void; // 최종 확인 콜백
}

// Date 객체를 'YYYY.MM' 형식의 문자열로 변환하는 유틸리티 함수
const formatYearMonth = (date: Date) => `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;

// 요일 표시를 위한 배열
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 달력의 단일 날짜 셀 정보 인터페이스
interface DayCell {
  day: number; // 날짜 (1~31)
  inCurrentMonth: boolean; // 현재 월에 속하는지 여부
}

// 특정 월의 달력 데이터를 주(week) 단위로 생성하는 함수
const getMonthWeeks = (date: Date): DayCell[][] => {
  const year = date.getFullYear(); // 연도 추출
  const month = date.getMonth(); // 월 추출 (0~11)
  
  // 현재 월의 1일이 무슨 요일인지 계산
  const firstWeekday = new Date(year, month, 1).getDay();
  // 현재 월의 마지막 날짜 계산
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // 이전 월의 마지막 날짜 계산
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];
  
  // 첫 주에서 이전 달에 해당하는 날짜 셀 채우기
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, inCurrentMonth: false });
  }
  
  // 현재 달에 해당하는 날짜 셀 채우기
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inCurrentMonth: true });
  }
  
  // 마지막 주에서 다음 달에 해당하는 날짜 셀 채우기 (7의 배수가 될 때까지)
  for (let d = 1; cells.length % 7 !== 0; d++) {
    cells.push({ day: d, inCurrentMonth: false });
  }

  // 1차원 배열을 7개씩 묶어 2차원 배열(주 단위)로 변환
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
};

// 디바이스의 화면 너비 가져오기
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 달력 박스의 전체 너비 (화면 너비 - 좌우 여백)
const CALENDAR_BOX_WIDTH = SCREEN_WIDTH - Spacing.h.medium * 4;

// 날짜 셀 하나의 가로/세로 영역 크기 (네이티브 드래그 좌표 계산용)
const COL_SLOT = IconSize.large + Spacing.h.medium;
const ROW_SLOT = IconSize.large + Spacing.v.medium;

// 월 선택 스크롤의 UI 치수 설정
const PICKER_W = SCREEN_WIDTH - Spacing.h.medium * 2; // 피커 전체 너비
const PICKER_ITEM_W = PICKER_W / 3; // 피커 내 개별 항목(월)의 너비
const PICKER_HEIGHT = Spacing.v.medium * 2 + 32; // 피커의 전체 높이
const MONTH_RANGE = 24; // 전/후로 표시할 개월 수 범위

// 일정 선택 범위 인터페이스 정의
export interface DateRange {
  year: number; // 선택된 연도
  month: number; // 선택된 월
  startDay: number; // 시작 일
  endDay: number; // 종료 일
}

// ─── 월 선택 스크롤 컴포넌트 ───────────────────────────────────────────
export const MonthPickerRow = ({ current, onSelect }: { current: Date; onSelect: (d: Date) => void }) => {
  // 기준 날짜를 중심으로 이전/이후 달의 배열을 생성 — 마운트 시 최초 1회만 고정
  // (선택 후 current가 바뀌어도 배열을 재생성하지 않아야 스크롤 위치와 months 인덱스가 어긋나지 않음)
  const months = useRef<Date[]>(
    Array.from({ length: MONTH_RANGE * 2 + 1 }, (_, i: number) =>
      new Date(current.getFullYear(), current.getMonth() - MONTH_RANGE + i, 1)
    )
  ).current;
  
  // 스크롤 상에서 중앙에 위치한 활성 항목의 인덱스 상태
  const [activeIdx, setActiveIdx] = useState(MONTH_RANGE);
  // ScrollView 제어를 위한 ref
  const scrollRef = useRef<ScrollView>(null);

  // 스크롤 진행 중 실시간으로 중앙 인덱스를 계산하여 UI에 반영 (텍스트 강조 효과)
  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / PICKER_ITEM_W);
    const clamped = Math.max(0, Math.min(months.length - 1, idx));
    if (activeIdx !== clamped) {
      setActiveIdx(clamped);
    }
  };

  // 사용자의 드래그(관성 스크롤)가 완전히 종료되었을 때, 최종 날짜를 선택 상태로 업데이트
  const handleMomentumScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / PICKER_ITEM_W);
    const clamped = Math.max(0, Math.min(months.length - 1, idx));
    onSelect(months[clamped]);
  };

  return (
    // 중앙 항목을 강조하기 위한 양 끝단 투명도 그라데이션 오버레이
    <LinearGradient
      colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,1.0)', 'rgba(255,255,255,0.6)']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{ width: PICKER_W, height: PICKER_HEIGHT, borderRadius: Spacing.r.medium, overflow: 'hidden' }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal // 가로 스크롤 활성화
        showsHorizontalScrollIndicator={false} // 스크롤바 숨김
        snapToInterval={PICKER_ITEM_W} // 개별 항목 단위로 스냅되도록 설정
        decelerationRate="fast" // 스크롤 감속 속도를 빠르게 설정하여 스냅 체감 향상
        style={{ height: PICKER_HEIGHT }}
        contentContainerStyle={{ paddingHorizontal: (PICKER_W - PICKER_ITEM_W) / 2 }} // 양 끝 항목이 중앙에 올 수 있도록 여백 추가
        contentOffset={{ x: PICKER_ITEM_W * MONTH_RANGE, y: 0 }} // 초기 렌더링 시 중앙(현재 월)으로 스크롤 위치 고정
        onScroll={handleScroll} // 스크롤 진행 이벤트 바인딩
        scrollEventThrottle={16} // 약 60fps 간격으로 스크롤 이벤트 호출
        onMomentumScrollEnd={handleMomentumScrollEnd} // 관성 스크롤 종료 시 최종 상태 반영
      >
        {months.map((month, index) => (
          <TouchableOpacity
            key={index}
            // 양옆의 월을 직접 터치했을 때 해당 항목으로 부드럽게 스크롤 및 상태 업데이트
            onPress={() => {
              scrollRef.current?.scrollTo({ x: index * PICKER_ITEM_W, animated: true });
              setActiveIdx(index);
              onSelect(month);
            }}
            style={{ width: PICKER_ITEM_W, height: PICKER_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
            activeOpacity={0.7}
          >
            {/* 활성 인덱스와 일치하면 진한 텍스트, 다르면 연한 텍스트 적용 */}
            <Text style={index === activeIdx ? pickerStyles.centerText : pickerStyles.sideText}>
              {formatYearMonth(month)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

// 메인 일정 생성 알럿 컴포넌트
export const NewScheduleAlert = ({ visible, onClose, onConfirm }: NewScheduleAlertProps) => {
  // 달력에 표시될 기준 월 상태
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  // 사용자가 드래그하여 선택한 시작~종료 날짜 범위 상태
  const [range, setRange] = useState<DateRange | null>(null);
  // 두 번째 단계(상세 설정) 모달 표시 여부
  const [isStep2Visible, setIsStep2Visible] = useState(false);
  // 월 선택 스크롤(피커) 표시 여부
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  // 현재 기준 월에 해당하는 달력 데이터 계산
  const weeks = getMonthWeeks(calendarMonth);

  // 드래그 제어를 위한 참조값 변수 (재렌더링 방지)
  const dragAnchorDayRef = useRef<number | null>(null); // 드래그가 시작된 날짜
  const dragMovedRef = useRef(false); // 터치 후 이동(드래그) 발생 여부
  const wasSoleSelectedRef = useRef(false); // 단일 선택(클릭) 여부 저장

  // 특정 날짜가 현재 선택된 범위(range) 내에 포함되는지 확인하는 함수
  const isInRange = (day: number) =>
    !!range &&
    range.year === calendarMonth.getFullYear() &&
    range.month === calendarMonth.getMonth() &&
    day >= range.startDay &&
    day <= range.endDay;

  // 터치된 좌표(x, y)를 기반으로 해당 좌표에 위치한 날짜 셀 데이터를 반환
  const getCellFromLocation = (lx: number, ly: number): DayCell | null => {
    const col = Math.min(6, Math.max(0, Math.floor(lx / COL_SLOT)));
    const row = Math.min(weeks.length - 1, Math.max(0, Math.floor(ly / ROW_SLOT)));
    const cell = weeks[row]?.[col];
    return cell?.inCurrentMonth ? cell : null; // 현재 월에 속한 셀만 반환
  };

  // 웹 환경: 마우스 클릭(드래그 시작) 핸들러
  const handleCellMouseDown = (cell: DayCell) => {
    if (!cell.inCurrentMonth) return;
    wasSoleSelectedRef.current = isInRange(cell.day) && range?.startDay === cell.day && range?.endDay === cell.day;
    dragAnchorDayRef.current = cell.day;
    dragMovedRef.current = false;
    // 클릭된 셀을 시작/종료 지점으로 초기 범위 설정
    setRange({ year: calendarMonth.getFullYear(), month: calendarMonth.getMonth(), startDay: cell.day, endDay: cell.day });
  };

  // 웹 환경: 마우스 이동(드래그 중) 핸들러
  const handleCellMouseEnter = (cell: DayCell) => {
    const anchor = dragAnchorDayRef.current;
    if (anchor === null || !cell.inCurrentMonth) return;
    if (cell.day !== anchor) dragMovedRef.current = true;
    // 드래그 시작점과 현재 위치 중 작은 값을 시작, 큰 값을 종료로 설정
    setRange({
      year: calendarMonth.getFullYear(),
      month: calendarMonth.getMonth(),
      startDay: Math.min(anchor, cell.day),
      endDay: Math.max(anchor, cell.day),
    });
  };

  // 웹 환경: 전역 마우스 드래그 종료 이벤트 리스너 등록
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleMouseUp = () => {
      if (dragAnchorDayRef.current === null) return;
      // 드래그가 발생하지 않았고 단일 선택이었던 곳을 다시 클릭한 경우, 선택 해제
      if (!dragMovedRef.current && wasSoleSelectedRef.current) {
        setRange(null);
      }
      dragAnchorDayRef.current = null;
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [visible]);

  // 네이티브(iOS/Android) 환경: 터치 드래그 이벤트 처리를 위한 PanResponder 설정
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true, // 터치 시작 시 제어권 획득
    onMoveShouldSetPanResponder: () => true, // 터치 이동 시 제어권 획득
    onPanResponderTerminationRequest: () => false, // 제어권 양보 거부
    onPanResponderGrant: evt => { // 터치(드래그) 시작 시 호출
      const cell = getCellFromLocation(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      if (!cell) return;
      wasSoleSelectedRef.current = isInRange(cell.day) && range?.startDay === cell.day && range?.endDay === cell.day;
      dragAnchorDayRef.current = cell.day;
      dragMovedRef.current = false;
      // 터치된 날짜로 초기 범위 설정
      setRange({ year: calendarMonth.getFullYear(), month: calendarMonth.getMonth(), startDay: cell.day, endDay: cell.day });
    },
    onPanResponderMove: evt => { // 터치 이동(드래그) 중 호출
      const anchor = dragAnchorDayRef.current;
      if (anchor === null) return;
      const cell = getCellFromLocation(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      if (!cell) return;
      if (cell.day !== anchor) dragMovedRef.current = true;
      // 드래그 중인 위치를 바탕으로 범위 업데이트
      setRange({
        year: calendarMonth.getFullYear(),
        month: calendarMonth.getMonth(),
        startDay: Math.min(anchor, cell.day),
        endDay: Math.max(anchor, cell.day),
      });
    },
    onPanResponderRelease: () => { // 터치 종료 시 호출
      // 드래그 없이 제자리 터치였고, 이미 선택된 단일 셀이었다면 선택 해제
      if (!dragMovedRef.current && wasSoleSelectedRef.current) {
        setRange(null);
      }
      dragAnchorDayRef.current = null;
    },
  });

  // 이전 달로 이동하는 함수
  const goToPrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // 다음 달로 이동하는 함수
  const goToNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <>
      {/* 두 번째 단계 모달 렌더링 (범위가 선택되었을 때만 접근 가능) */}
      {range && <NewScheduleStep2Alert visible={visible && isStep2Visible} onBack={() => setIsStep2Visible(false)} onClose={() => { setIsStep2Visible(false); onClose(); }} onConfirm={(courseType, name) => onConfirm(courseType, name, range)} range={range} />}
      
      {/* 메인 달력 모달 */}
      <Modal visible={visible && !isStep2Visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          {/* 외부 영역 터치 시 모달 닫기 */}
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          {/* 달력 컨테이너 — 내부 빈 공간 터치가 배경으로 전파되어 모달이 닫히지 않도록 흡수 */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.alertContainer}>
                
                {/* 상단 헤더 영역 (제목 및 닫기 버튼) */}
                <View style={styles.header}>
                  <Text style={styles.title}>일정 만들기</Text>
                  <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                  </TouchableOpacity>
                </View>
                
                {/* 달력 UI 박스 영역 */}
                <View style={styles.calendarBox}>
                  {/* 달력 상단 네비게이션 (이전달, 연월 표시, 다음달) */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={goToPrevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <ChevronLeft size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                    </TouchableOpacity>
                    {/* 연/월 텍스트 터치 시 월 선택 피커 표시/숨김 토글 */}
                    <TouchableOpacity onPress={() => setShowMonthPicker(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={styles.calendarTitle}>{formatYearMonth(calendarMonth)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goToNextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <ChevronRight size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* 요일 헤더 표시 행 (일 ~ 토) */}
                  <View style={styles.weekdayRow}>
                    {WEEKDAYS.map((day, index) => (
                      <View key={day} style={styles.weekdayCell}>
                        <Text
                          style={[
                            styles.weekdayText,
                            index === 0 && styles.sundayText, // 일요일 텍스트 색상
                            index === 6 && styles.saturdayText, // 토요일 텍스트 색상
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* 날짜 그리드 영역 (웹은 텍스트 드래그 방지, 네이티브는 PanResponder 바인딩) */}
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
                          // 앞뒤로 인접한 날짜가 선택되었는지 확인하여 배경 둥글기(Radius) 결정
                          const prevSelected = isSelected && !!prevCell?.inCurrentMonth && isInRange(prevCell.day);
                          const nextSelected = isSelected && !!nextCell?.inCurrentMonth && isInRange(nextCell.day);
                          const isLastColumn = dayIndex === 6;

                          return (
                            <View
                              key={dayIndex}
                              // 마지막 열이 아니면 간격(Spacing)을 추가하여 셀 너비 계산
                              style={{ width: isLastColumn ? IconSize.large : IconSize.large + Spacing.h.medium, height: IconSize.large }}
                              {...(Platform.OS === 'web' ? {
                                onMouseDown: () => handleCellMouseDown(cell),
                                onMouseEnter: () => handleCellMouseEnter(cell),
                              } as any : {})}
                            >
                              {/* 선택된 날짜에 렌더링되는 알약(Pill) 형태의 배경 UI */}
                              {isSelected && (
                                <View
                                  style={[
                                    styles.dayPillBackground,
                                    {
                                      // 다음 셀도 선택되어 있다면 간격까지 채우도록 너비 확장
                                      width: IconSize.large + (nextSelected ? Spacing.h.medium : 0),
                                      // 앞 셀이 선택되어 있으면 왼쪽 모서리를 직각으로, 아니면 둥글게 처리
                                      borderTopLeftRadius: prevSelected ? 0 : IconSize.large / 2,
                                      borderBottomLeftRadius: prevSelected ? 0 : IconSize.large / 2,
                                      // 다음 셀이 선택되어 있으면 오른쪽 모서리를 직각으로, 아니면 둥글게 처리
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
                                    dayIndex === 0 && styles.sundayText, // 일요일 색상
                                    dayIndex === 6 && styles.saturdayText, // 토요일 색상
                                    !cell.inCurrentMonth && styles.otherMonthText, // 이전/다음 달 날짜 색상
                                    isSelected && styles.dayTextSelected, // 선택된 날짜의 텍스트 색상
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
                
                {/* 다음 단계 버튼 (날짜 범위가 선택되어야만 활성화됨) */}
                <TouchableOpacity
                  style={[styles.nextButton, !range && styles.nextButtonDisabled]}
                  onPress={() => range && setIsStep2Visible(true)}
                >
                  <Text style={styles.nextButtonText}>다음 단계</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
            
        </View>
      </Modal>

      {/* 월 선택 피커 모달 — 달력 모달 위에 독립 렌더되어 ScrollView 드래그/관성 스크롤이 방해받지 않음 */}
      <Modal
        visible={visible && !isStep2Visible && showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          {/* 딤 영역 탭 → 피커 닫기 (absoluteFill이 먼저 렌더되므로 MonthPickerRow가 위에 쌓임) */}
          <TouchableWithoutFeedback onPress={() => setShowMonthPicker(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <MonthPickerRow
            current={calendarMonth}
            onSelect={(d) => setCalendarMonth(d)}
          />
        </View>
      </Modal>
    </>
  );
};

// 월 선택 피커 전용 스타일시트
const pickerStyles = StyleSheet.create({
  centerText: { ...Typography.HeadLine5, color: Colors.light.primary }, // 중앙 강조 텍스트
  sideText: { ...Typography.title1, color: Colors.light.grayDark }, // 양측 연한 텍스트
});

// 전체 컴포넌트 스타일시트
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // 반투명 딤 처리
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.medium,
  },
  alertContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingBottom: Spacing.v.medium,
    // 플랫폼별 그림자 효과 설정
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
  pickerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)' },
});