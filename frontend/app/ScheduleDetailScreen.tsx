// app/ScheduleDetailScreen.tsx
import { KakaoMap } from '@/components/ui/KakaoMap';
import { AddPlaceAlert } from '@/components/modals/AddPlaceAlert';
import { ScheduleEditNameAlert } from '@/components/modals/ScheduleEditNameAlert';
import { Divider } from '@/components/ui/Divider';
import { MediaMetaText } from '@/components/ui/MediaMetaText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { CATEGORY_LABEL, shortAddress } from '@/constants/labels';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Equal, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleApi } from '../services/api';
import type { DailyPlace, Schedule } from '../services/types';

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

const formatDayDate = (startDate: string, dayIndex: number): string => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayIndex);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = WEEKDAY_KO[date.getDay()];
  return `${month}/${day} ${weekday}`;
};

const MARQUEE_GAP = 48;
const MARQUEE_SPEED = 40;
// 핸들 영역 높이 = marginTop(8) + 화살표(24) + 하단 여백(8)
const HANDLE_HEIGHT = Spacing.v.small + 24 + Spacing.v.small; // 40px
// 헤더(56) + marginTop(8) 를 제외한 초기 콘텐츠 높이 추정값
const INITIAL_CONTENT_HEIGHT = Dimensions.get('window').height - 64;

const SPRING = { useNativeDriver: false, tension: 60, friction: 12 } as const;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── 마키 텍스트 ──────────────────────────────────────────────────────────────
const MarqueeText = ({ text, style }: { text: string; style?: object }) => {
  const [containerW, setContainerW] = useState(0);
  const [textW, setTextW] = useState(0);
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const animRef = useRef<RNAnimated.CompositeAnimation | null>(null);
  const shouldScroll = containerW > 0 && textW > containerW;

  useEffect(() => {
    animRef.current?.stop();
    translateX.setValue(0);
    if (!shouldScroll) return;
    const totalDist = textW + MARQUEE_GAP;
    animRef.current = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(1500),
        RNAnimated.timing(translateX, {
          toValue: -totalDist,
          duration: (totalDist / MARQUEE_SPEED) * 1000,
          useNativeDriver: true,
        }),
        RNAnimated.delay(500),
      ])
    );
    animRef.current.start();
    return () => animRef.current?.stop();
  }, [shouldScroll, textW, containerW, translateX]);

  return (
    <View style={{ flex: 1 }} onLayout={e => setContainerW(e.nativeEvent.layout.width)}>
      <View style={{ position: 'absolute', opacity: 0 }} pointerEvents="none">
        <Text style={style} onLayout={e => setTextW(e.nativeEvent.layout.width)}>{text}</Text>
      </View>
      <View style={{ flex: 1, overflow: 'hidden', justifyContent: 'center' }}>
        {shouldScroll ? (
          <RNAnimated.View style={{ flexDirection: 'row', transform: [{ translateX }] }}>
            <Text style={[style, { flexShrink: 0 }]}>{text}</Text>
            <Text style={[style, { flexShrink: 0, marginLeft: MARQUEE_GAP }]}>{text}</Text>
          </RNAnimated.View>
        ) : (
          <Text style={[style, { textAlign: 'center' }]} numberOfLines={1}>{text}</Text>
        )}
      </View>
    </View>
  );
};

// ─── 드래그 핸들 아이콘 (시각 표시 전용) ──────────────────────────────────────
const GripIcon = () => (
  <View style={gripIconStyle.col}>
    <Equal size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
  </View>
);
const gripIconStyle = StyleSheet.create({
  col: { width: 32, alignItems: 'flex-start', justifyContent: 'center' },
});

// 드래그 가능한 카드 행 — 전체 행에 pan 제스처 부착
const DRAG_ROW_BASE: object = {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: Spacing.v.small,
  paddingHorizontal: Spacing.h.medium,
};
const DRAG_ROW_ACTIVE: object = { opacity: 0.5, transform: [{ scale: 0.8 }] };

const DraggableRow = React.memo(({ id, dragging, onBegin, onChange, onEnd, children }: {
  id: number;
  dragging: boolean;
  onBegin: (id: number) => void;
  onChange: (id: number, dy: number) => void;
  onEnd: () => void;
  children: React.ReactNode;
}) => {
  const gesture = useMemo(() => Gesture.Pan()
    .activateAfterLongPress(400)
    .onStart(() => { runOnJS(onBegin)(id); })
    .onChange(e => { runOnJS(onChange)(id, e.translationY); })
    .onFinalize(() => { runOnJS(onEnd)(); })
  , [id, onBegin, onChange, onEnd]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={[DRAG_ROW_BASE, dragging && DRAG_ROW_ACTIVE]}>
        {children}
      </View>
    </GestureDetector>
  );
});

DraggableRow.displayName = 'DraggableRow';

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
type PanelState = -1 | 0 | 1;

export default function ScheduleDetailScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { id, title: paramTitle, autoEdit } = useLocalSearchParams<{ id: string; title: string; autoEdit?: string }>();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingRemovals, setPendingRemovals] = useState<Set<number>>(new Set());
  const [localPlaces, setLocalPlaces] = useState<DailyPlace[]>([]);
  const [isUnsavedWarningVisible, setIsUnsavedWarningVisible] = useState(false);
  const [placeDeleteTarget, setPlaceDeleteTarget] = useState<number | null>(null);
  const [isAddPlaceVisible, setIsAddPlaceVisible] = useState(false);
  const [isEditNameVisible, setIsEditNameVisible] = useState(false);
  const [activeDayNum, setActiveDayNum] = useState(1);
  const originalPlacesRef = useRef<DailyPlace[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const localPlacesRef = useRef<DailyPlace[]>([]);
  localPlacesRef.current = localPlaces;
  const isEditingRef = useRef(isEditing);
  isEditingRef.current = isEditing;
  const pendingRemovalsRef = useRef(pendingRemovals);
  pendingRemovalsRef.current = pendingRemovals;
  // 드래그용 레이아웃 상수 (대략적인 섹션 높이)
  const DAY_HEADER_H = 52;
  const ADD_BTN_H = 80;
  const CARD_H = 110;
  const dragStartIndexRef = useRef(0);
  const lastTargetIndexRef = useRef(-1);
  const lastTargetDayNumRef = useRef(-1);
  // 드래그 시작 시점의 섹션 경계 및 카드 절대 Y 위치
  const sectionBoundsRef = useRef<{ dayNum: number; top: number }[]>([]);
  const draggingStartAbsoluteY = useRef(0);
  // editableGroups / dayEntries 의 최신값을 드래그 핸들러(useCallback)에서 쓰기 위한 ref
  const editableGroupsRef = useRef<Record<number, DailyPlace[]>>({});
  const dayEntriesRef = useRef<{ dayNum: number; dateStr: string }[]>([]);
  const [contentHeight, setContentHeight] = useState(INITIAL_CONTENT_HEIGHT);
  const [panelState, setPanelState] = useState<PanelState>(0);
  const panelStateRef = useRef<PanelState>(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const autoEditProcessedRef = useRef(false);

  // 지도 카드 크기: CourseDetailScreen 이미지와 동일 규격 (좌우 16pt 여백, 3:4 비율)
  const mapCardWidth = screenWidth - Spacing.h.medium * 2;
  const mapCardHeight = (mapCardWidth * 3) / 4;

  // PanResponder 클로저 스테일 방지용 ref (렌더마다 갱신)
  const contentHeightRef = useRef(INITIAL_CONTENT_HEIGHT);
  const mapCardHeightRef = useRef(mapCardHeight);
  mapCardHeightRef.current = mapCardHeight;

  // 패널 높이 & 지도 애니메이션 값
  const panelHeight = useRef(new RNAnimated.Value(INITIAL_CONTENT_HEIGHT / 2)).current;
  const mapHeightAnim = useRef(new RNAnimated.Value(mapCardHeight)).current;
  const mapTopAnim = useRef(new RNAnimated.Value(Spacing.v.small)).current;
  const panelRadiusAnim = useRef(new RNAnimated.Value(Spacing.r.medium)).current;

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      scheduleApi.getDetail(Number(id)).then(res => {
        const fresh = res.data;
        setSchedule(fresh);
        if (isEditingRef.current) {
          const localIds = new Set(localPlacesRef.current.map(p => p.id));
          const newPlaces = fresh.daily_places.filter(
            dp => !localIds.has(dp.id) && !pendingRemovalsRef.current.has(dp.id)
          );
          if (newPlaces.length > 0) {
            setLocalPlaces(prev => [...prev, ...newPlaces]);
            originalPlacesRef.current = [...originalPlacesRef.current, ...newPlaces];
          }
        }
      }).catch(() => {});
    }, [id])
  );

  // autoEdit 파라미터가 있으면 일정 최초 로드 후 즉시 편집 모드 진입
  // ref로 처리 여부를 추적해 저장 후 schedule 갱신 시 재진입 방지
  useEffect(() => {
    if (autoEdit !== 'true' || !schedule || isEditing || autoEditProcessedRef.current) return;
    autoEditProcessedRef.current = true;
    const sorted = [...(schedule.daily_places ?? [])]
      .sort((a, b) => a.day_number !== b.day_number ? a.day_number - b.day_number : a.order - b.order);
    setLocalPlaces(sorted);
    originalPlacesRef.current = sorted;
    setIsEditing(true);
  }, [schedule, autoEdit, isEditing]);

  // 실제 콘텐츠 높이가 측정되면 현재 패널 상태에 맞게 즉시 재조정
  useEffect(() => {
    const state = panelStateRef.current;
    if (state === 1) panelHeight.setValue(contentHeight);
    else if (state === 0) panelHeight.setValue(Math.max(contentHeight - mapCardHeight - Spacing.v.small - Spacing.h.medium, HANDLE_HEIGHT));
    else {
      panelHeight.setValue(HANDLE_HEIGHT);
      mapHeightAnim.setValue(contentHeight - HANDLE_HEIGHT - Spacing.v.medium * 2);
    }
  }, [contentHeight, mapCardHeight, panelHeight, mapHeightAnim]);

  const hasUnsavedChanges =
    isEditing &&
    (pendingRemovals.size > 0 ||
      localPlaces.map(p => p.id).join() !== originalPlacesRef.current.map(p => p.id).join());

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setIsUnsavedWarningVisible(true);
    } else {
      router.dismiss();
    }
  };

  const handleEditSave = async () => {
    if (!isEditing) {
      const sorted = [...(schedule?.daily_places ?? [])]
        .sort((a, b) => a.day_number !== b.day_number ? a.day_number - b.day_number : a.order - b.order);
      setLocalPlaces(sorted);
      originalPlacesRef.current = sorted;
      setIsEditing(true);
      return;
    }
    try {
      for (const dpId of pendingRemovals) {
        await scheduleApi.removePlace(Number(id), dpId);
      }
      const reordered = localPlaces
        .map((dp, idx) => ({ id: dp.id, day_number: dp.day_number, order: idx + 1 }));
      if (reordered.length > 0) {
        await scheduleApi.reorderPlaces(Number(id), reordered);
      }
      const res = await scheduleApi.getDetail(Number(id));
      setSchedule(res.data);
    } catch {}
    setPendingRemovals(new Set());
    setLocalPlaces([]);
    setIsEditing(false);
  };

  const handleRenameConfirm = async (newTitle: string) => {
    try {
      const res = await scheduleApi.update(Number(id), { title: newTitle });
      setSchedule(res.data);
    } catch {}
    setIsEditNameVisible(false);
  };

  const handleRemovePlace = (dpId: number) => {
    setPendingRemovals(prev => new Set([...prev, dpId]));
    setLocalPlaces(prev => prev.filter(p => p.id !== dpId));
  };

  const onDragBegin = useCallback((dpId: number) => {
    // 섹션 경계 계산 (드래그 시작 시 스냅샷)
    let y = 0;
    const bounds = dayEntriesRef.current.map(({ dayNum }) => {
      const top = y;
      y += DAY_HEADER_H;
      y += (editableGroupsRef.current[dayNum]?.length ?? 0) * CARD_H;
      y += ADD_BTN_H;
      return { dayNum, top };
    });
    sectionBoundsRef.current = bounds;

    // 드래그 카드의 절대 Y 계산
    const places = localPlacesRef.current;
    let itemAbsY = 0;
    outer: for (const { dayNum, top } of bounds) {
      let cardY = top + DAY_HEADER_H;
      for (const dp of editableGroupsRef.current[dayNum] ?? []) {
        if (dp.id === dpId) { itemAbsY = cardY; break outer; }
        cardY += CARD_H;
      }
    }
    draggingStartAbsoluteY.current = itemAbsY;

    const idx = places.findIndex(p => p.id === dpId);
    dragStartIndexRef.current = idx;
    lastTargetIndexRef.current = idx;
    lastTargetDayNumRef.current = places[idx]?.day_number ?? -1;
    setDraggingId(dpId);
  }, []);

  const onDragChange = useCallback((dpId: number, dy: number) => {
    const places = localPlacesRef.current;
    const fromIndex = places.findIndex(p => p.id === dpId);
    if (fromIndex === -1) return;

    // 절대 Y 기준으로 대상 Day 결정 (빈 Day 포함)
    const currentAbsY = draggingStartAbsoluteY.current + dy;
    const bounds = sectionBoundsRef.current;
    let targetDayNum = bounds[0]?.dayNum ?? 1;
    for (const b of bounds) {
      if (currentAbsY >= b.top) targetDayNum = b.dayNum;
    }

    // 대상 Day 내 아이템 인덱스 목록 (드래그 중인 카드 제외)
    const dayIndices = places.reduce<number[]>((acc, p, i) => {
      if (p.day_number === targetDayNum && i !== fromIndex) acc.push(i);
      return acc;
    }, []);

    let targetIndex: number;
    if (dayIndices.length === 0) {
      // 빈 Day: 다음 Day의 첫 아이템 앞에 삽입
      const firstAfter = places.findIndex((p, i) => i !== fromIndex && p.day_number > targetDayNum);
      if (firstAfter !== -1) {
        targetIndex = fromIndex < firstAfter ? firstAfter - 1 : firstAfter;
      } else {
        targetIndex = places.length - 1;
      }
    } else {
      // Day 내 Y 위치로 정밀 위치 계산
      const dayBound = bounds.find(b => b.dayNum === targetDayNum);
      const withinDayY = currentAbsY - (dayBound?.top ?? 0) - DAY_HEADER_H;
      const slot = Math.max(0, Math.min(dayIndices.length, Math.round(withinDayY / CARD_H)));
      const rawTarget = slot < dayIndices.length
        ? dayIndices[slot]
        : dayIndices[dayIndices.length - 1] + 1;
      targetIndex = Math.max(0, Math.min(places.length - 1,
        fromIndex < rawTarget ? rawTarget - 1 : rawTarget));
    }

    // 위치도 Day도 동일하면 스킵
    if (targetIndex === lastTargetIndexRef.current && targetDayNum === lastTargetDayNumRef.current) return;
    lastTargetIndexRef.current = targetIndex;
    lastTargetDayNumRef.current = targetDayNum;

    setLocalPlaces(prev => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(Math.min(targetIndex, next.length), 0, { ...item, day_number: targetDayNum });
      return next;
    });
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggingId(null);
    lastTargetIndexRef.current = -1;
    lastTargetDayNumRef.current = -1;
  }, []);

  const displayTitle = schedule?.title ?? paramTitle ?? '';

  const mapPlaces = useMemo(() => {
    const places = isEditing ? localPlaces : (schedule?.daily_places ?? []);
    return places.map(dp => dp.place);
  }, [isEditing, localPlaces, schedule]);

  const dayGroups = useMemo(() => {
    const places = schedule?.daily_places ?? [];
    return places.reduce<Record<number, DailyPlace[]>>((acc, dp) => {
      const key = dp.day_number;
      if (!acc[key]) acc[key] = [];
      acc[key].push(dp);
      return acc;
    }, {});
  }, [schedule]);

  const editableGroups = useMemo(() =>
    localPlaces.reduce<Record<number, DailyPlace[]>>((acc, dp) => {
      if (!acc[dp.day_number]) acc[dp.day_number] = [];
      acc[dp.day_number].push(dp);
      return acc;
    }, {})
  , [localPlaces]);
  editableGroupsRef.current = editableGroups;

  const dayEntries = useMemo(() => {
    if (!schedule?.start_date || !schedule?.end_date) return [];
    const start = new Date(schedule.start_date);
    const end = new Date(schedule.end_date);
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: totalDays }, (_, i) => ({
      dayNum: i + 1,
      dateStr: formatDayDate(schedule.start_date!, i),
    }));
  }, [schedule]);
  dayEntriesRef.current = dayEntries;

  const snapTo = (state: PanelState) => {
    const isMapMain = state === -1;
    const h = contentHeightRef.current;
    const cardH = mapCardHeightRef.current;
    // 패널 높이: state 0은 지도 카드 바로 아래부터 시작 (갭 없음)
    const targetPanel =
      state === -1 ? HANDLE_HEIGHT :
      state === 0  ? Math.max(h - cardH - Spacing.v.small - Spacing.h.medium, HANDLE_HEIGHT) :
                     h;
    // 지도 높이: -1이면 16pt 사방 여백으로 확장, 그 외는 3:4 카드
    const targetMapH = isMapMain
      ? h - HANDLE_HEIGHT - Spacing.v.medium * 2
      : cardH;
    // 지도 상단 여백: -1이면 16pt, 그 외는 8pt
    const targetMapTop = isMapMain ? Spacing.v.medium : Spacing.v.small;
    // 패널 상단 radius: state 1(최대)이면 0, 그 외는 16
    const targetRadius = state === 1 ? 0 : Spacing.r.medium;

    RNAnimated.spring(panelHeight,    { toValue: targetPanel,   ...SPRING }).start();
    RNAnimated.spring(mapHeightAnim,  { toValue: targetMapH,    ...SPRING }).start();
    RNAnimated.spring(mapTopAnim,     { toValue: targetMapTop,  ...SPRING }).start();
    RNAnimated.spring(panelRadiusAnim,{ toValue: targetRadius,  ...SPRING }).start();

    setPanelState(state);
    panelStateRef.current = state;
    if (state !== 1) scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // PanResponder 클로저가 snapTo를 항상 최신 버전으로 호출하도록 ref 사용
  const snapToRef = useRef<(state: PanelState) => void>(null!);
  snapToRef.current = snapTo;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => {
        if (gs.dy < -10) return true;
        if (gs.dy > 10 && (panelStateRef.current !== 1 || scrollYRef.current <= 0)) return true;
        return false;
      },
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        panelStateRef.current === 1 && scrollYRef.current <= 0 && gs.dy > 10,
      onPanResponderRelease: (_, gs) => {
        const { dy, vy } = gs;
        const cur = panelStateRef.current;
        if (dy < -30 || vy < -0.3) {
          if (cur === -1) snapToRef.current(0);
          else if (cur === 0) snapToRef.current(1);
        } else if (dy > 30 || vy > 0.3) {
          if (cur === 1 && scrollYRef.current <= 0) snapToRef.current(0);
          else if (cur === 0) snapToRef.current(-1);
        }
      },
    })
  ).current;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  };

  // 화살표 버튼 탭: -1→0→1, 1→0
  const handleArrowPress = () => {
    const cur = panelStateRef.current;
    if (cur === 1) snapTo(0);
    else if (cur === 0) snapTo(1);
    else snapTo(0);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack={handleBack}>
        {isEditing ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsEditNameVisible(true)}
            style={{ flex: 1 }}
          >
            <MarqueeText text={displayTitle} style={styles.headerTitle} />
          </TouchableOpacity>
        ) : (
          <MarqueeText text={displayTitle} style={styles.headerTitle} />
        )}
      </ScreenHeader>

      <View
        style={styles.content}
        onLayout={e => {
          contentHeightRef.current = e.nativeEvent.layout.height;
          setContentHeight(e.nativeEvent.layout.height);
        }}
      >
        {/* 지도: 3:4 비율 카드 (state에 따라 크기 애니메이션) */}
        <RNAnimated.View
          style={[
            styles.mapContainer,
            {
              width: mapCardWidth,
              height: mapHeightAnim,
              top: mapTopAnim,
            },
          ]}
        >
          <KakaoMap places={mapPlaces} style={styles.mapPlaceholder} />
        </RNAnimated.View>

        {/* 슬라이딩 패널 */}
        <RNAnimated.View
          style={[
            styles.panel,
            {
              height: panelHeight,
              borderTopLeftRadius: panelRadiusAnim,
              borderTopRightRadius: panelRadiusAnim,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={handleArrowPress}
            activeOpacity={0.7}
          >
            {panelState === 1
              ? <ChevronDown size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
              : <ChevronUp   size={IconSize.large} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
            }
          </TouchableOpacity>

          <View style={styles.panelContentHeader}>
            <Text style={styles.panelContentTitle}>일정</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={handleEditSave}>
              <Text style={styles.panelContentAction}>{isEditing ? '저장' : '편집'}</Text>
            </TouchableOpacity>
          </View>
          <Divider style={{ marginHorizontal: Spacing.h.medium }} />

          <ScrollView
            ref={scrollRef}
            style={styles.panelScroll}
            showsVerticalScrollIndicator={false}
            scrollEnabled={panelState === 1}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.panelContent}>
              {dayEntries.map(({ dayNum, dateStr }) => {
                const places = isEditing
                  ? (editableGroups[dayNum] ?? [])
                  : (dayGroups[dayNum] ?? []).filter(dp => !pendingRemovals.has(dp.id));
                return (
                  <View key={dayNum}>
                    <View style={styles.dayRow}>
                      <Text style={styles.dayLabel}>Day {dayNum}</Text>
                      <Text style={styles.dayDate}>{dateStr}</Text>
                    </View>
                    {places.length === 0 && !isEditing && (
                      <View style={styles.emptyDayContainer}>
                        <Text style={styles.emptyDayTitle}>장소가 존재하지 않습니다.</Text>
                        <Text style={styles.emptyDayDesc}>편집을 통해 장소를 추가하여 주세요.</Text>
                      </View>
                    )}
                    {places.map((dp, idx) => {
                      const card = (
                        <TouchableOpacity
                          style={styles.placeCard}
                          activeOpacity={isEditing ? 1 : 0.8}
                          onPress={isEditing ? undefined : () => router.push({ pathname: '/PlaceDetailScreen', params: { id: dp.place.id, name: dp.place.name } })}
                        >
                          <Image
                            source={{ uri: dp.place.image_url ?? undefined }}
                            style={styles.placeCardImage}
                            resizeMode="cover"
                          />
                          <View style={styles.placeCardContent}>
                            <Text style={styles.placeNameText}>{dp.place.name}</Text>
                            <View style={styles.placeSubRow}>
                              <Text style={styles.placeSubText}>{CATEGORY_LABEL[dp.place.category] ?? dp.place.category}</Text>
                              <TextSeparator />
                              <Text style={styles.placeSubText} numberOfLines={1}>{shortAddress(dp.place.address)}</Text>
                            </View>
                            {!isEditing && (
                              <TouchableOpacity style={styles.routeButton} activeOpacity={0.7}>
                                <Text style={styles.routeButtonText}>경로 확인</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          {isEditing && (
                            <TouchableOpacity
                              style={styles.trashButton}
                              activeOpacity={0.7}
                              onPress={() => setPlaceDeleteTarget(dp.id)}
                            >
                              <Trash2 size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                            </TouchableOpacity>
                          )}
                        </TouchableOpacity>
                      );

                      if (isEditing) {
                        return (
                          <DraggableRow
                            key={dp.id}
                            id={dp.id}
                            dragging={draggingId === dp.id}
                            onBegin={onDragBegin}
                            onChange={onDragChange}
                            onEnd={onDragEnd}
                          >
                            <GripIcon />
                            {card}
                          </DraggableRow>
                        );
                      }
                      return (
                        <View key={dp.id} style={styles.placeRow}>
                          <View style={styles.placeNumberCol}>
                            <View style={styles.placeCircle}>
                              <Text style={styles.placeCircleText}>{idx + 1}</Text>
                            </View>
                          </View>
                          {card}
                        </View>
                      );
                    })}
                    {isEditing && (
                      <TouchableOpacity style={styles.addPlaceButton} activeOpacity={0.8} onPress={() => { setActiveDayNum(dayNum); setIsAddPlaceVisible(true); }}>
                        <View style={styles.addPlaceCircle}>
                          <Plus size={IconSize.medium} color={Colors.light.black} strokeWidth={IconStroke.regular} />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              {schedule?.media && (
                <>
                  <Divider style={styles.importedCourseDivider} />
                  <View style={styles.importedCourseSection}>
                    <Text style={styles.importedCourseLabel}>가져온 코스</Text>
                    <TouchableOpacity
                      style={styles.importedCourseCard}
                      activeOpacity={0.85}
                      onPress={() => router.push({ pathname: '/CourseDetailScreen', params: { id: schedule.media!.id } })}
                    >
                      <View style={styles.importedCourseImageWrapper}>
                        <Image
                          source={{ uri: schedule.media.thumbnail_url ?? undefined }}
                          style={styles.importedCourseImage}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.importedCourseContent}>
                        <Text style={styles.importedCourseTitle} numberOfLines={1}>{schedule.media.title}</Text>
                        <View style={styles.importedCourseInfoRow}>
                          <MediaMetaText media={schedule.media} />
                        </View>
                        {schedule.media.tags.length > 0 && (
                          <TagRow>
                            {schedule.media.tags.map(tag => (
                              <Text key={tag.id} style={styles.importedCourseTagText}>#{tag.name}</Text>
                            ))}
                          </TagRow>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </RNAnimated.View>
      </View>
      <ScheduleEditNameAlert
        visible={isEditNameVisible}
        currentTitle={displayTitle}
        onConfirm={handleRenameConfirm}
        onClose={() => setIsEditNameVisible(false)}
      />
      <AddPlaceAlert
        visible={isAddPlaceVisible}
        onClose={() => setIsAddPlaceVisible(false)}
        onConfirm={(type) => {
          setIsAddPlaceVisible(false);
          if (type === 'import') {
            router.push({ pathname: '/ScheduleScreen', params: { mode: 'addPlace', scheduleId: id, dayNumber: String(activeDayNum) } });
          } else {
            router.push({ pathname: '/SearchScreen', params: { mode: 'addPlace', scheduleId: id, dayNumber: String(activeDayNum) } });
          }
        }}
      />
      <Modal visible={isUnsavedWarningVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.unsavedPopup}>
            <Text style={styles.unsavedTitle}>일정이 아직 저장되지 않았습니다.</Text>
            <Text style={styles.unsavedDesc}>저장되지 않은 변동사항은 반영되지 않습니다.</Text>
            <View style={styles.unsavedButtons}>
              <TouchableOpacity
                style={styles.btnStay}
                activeOpacity={0.8}
                onPress={() => setIsUnsavedWarningVisible(false)}
              >
                <Text style={styles.btnStayText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDiscard}
                activeOpacity={0.8}
                onPress={() => {
                  setIsUnsavedWarningVisible(false);
                  setPendingRemovals(new Set());
                  setLocalPlaces([]);
                  setIsEditing(false);
                  router.dismiss();
                }}
              >
                <Text style={styles.btnDiscardText}>무시</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={placeDeleteTarget !== null} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.unsavedPopup}>
            <Text style={styles.unsavedTitle}>장소을 삭제하시겠습니까?</Text>
            <Text style={styles.unsavedDesc}>삭제된 장소는 되돌릴 수 없습니다.</Text>
            <View style={styles.unsavedButtons}>
              <TouchableOpacity
                style={styles.btnStay}
                activeOpacity={0.8}
                onPress={() => setPlaceDeleteTarget(null)}
              >
                <Text style={styles.btnStayText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDiscard}
                activeOpacity={0.8}
                onPress={() => {
                  if (placeDeleteTarget !== null) handleRemovePlace(placeDeleteTarget);
                  setPlaceDeleteTarget(null);
                }}
              >
                <Text style={styles.btnDiscardText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerTitle: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  mapContainer: {
    position: 'absolute',
    left: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  mapPlaceholder: {
    flex: 1,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0px -8px 12px rgba(0,0,0,0.1)' } as object,
    }),
  },
  arrowButton: {
    width: 48,
    height: 24,
    alignSelf: 'center',
    marginTop: Spacing.v.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelScroll: {
    flex: 1,
  },
  panelContent: {
    paddingBottom: Spacing.v.screenBottom,
  },
  panelContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.v.large24,
    paddingBottom: Spacing.v.small,
    paddingLeft: Spacing.h.medium,
    paddingRight: Spacing.h.xlarge,
  },
  panelContentTitle: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
  },
  panelContentAction: {
    ...Typography.button4,
    color: Colors.light.primary,
  },
  importedCourseDivider: {
    marginHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.large,
  },
  importedCourseSection: {
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
  },
  importedCourseLabel: {
    ...Typography.title2,
    color: Colors.light.black,
  },
  importedCourseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
    backgroundColor: Colors.light.white,
  },
  importedCourseImageWrapper: {
    width: Size.circleMd,
    height: Size.circleMd,
    borderRadius: Size.circleMd / 2,
    overflow: 'hidden',
    flexShrink: 0,
  },
  importedCourseImage: {
    width: '100%',
    height: '100%',
  },
  importedCourseContent: {
    flex: 1,
    marginLeft: Spacing.h.medium,
  },
  importedCourseTitle: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  importedCourseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    gap: Spacing.h.xsmall,
  },
  importedCourseTagText: {
    ...Typography.body2,
    color: Colors.light.primary,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.large,
    paddingHorizontal: Spacing.h.medium,
  },
  dayLabel: {
    ...Typography.title2,
    color: Colors.light.black,
  },
  dayDate: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    marginLeft: Spacing.h.small,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    paddingHorizontal: Spacing.h.medium,
  },
  placeNumberCol: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  placeCircle: {
    width: Spacing.h.medium,
    height: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeCircleText: {
    ...Typography.body1,
    color: Colors.light.black,
  },
  placeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingVertical: Spacing.v.small,
    paddingLeft: Spacing.h.small,
  },
  placeCardImage: {
    width: Size.thumbSquare,
    height: Size.thumbSquare,
    borderRadius: Spacing.r.xsmall,
    backgroundColor: Colors.light.grayLight,
  },
  placeCardContent: {
    flex: 1,
    marginLeft: Spacing.h.small,
    alignSelf: 'stretch',
  },
  placeNameText: {
    ...Typography.subtitle2,
    color: Colors.light.black,
  },
  placeSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
  },
  placeSubText: {
    ...Typography.body2,
    color: Colors.light.grayDark,
  },
  trashButton: {
    marginLeft: Spacing.h.medium,
    marginRight: Spacing.h.medium,
    alignSelf: 'center',
  },
  emptyDayContainer: {
    marginTop: Spacing.v.small,
    paddingHorizontal: Spacing.h.medium,
    alignItems: 'center',
  },
  emptyDayTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    textAlign: 'center',
  },
  emptyDayDesc: {
    ...Typography.body2,
    color: Colors.light.grayLight,
    marginTop: Spacing.v.medium,
    textAlign: 'center',
  },
  addPlaceButton: {
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
    height: Size.buttonMd,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPlaceCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeButton: {
    position: 'absolute',
    bottom: 0,
    right: Spacing.h.small,
    height: 24,
    paddingHorizontal: Spacing.h.medium,
    backgroundColor: Colors.light.white,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeButtonText: {
    ...Typography.button4,
    color: Colors.light.grayDark,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unsavedPopup: {
    width: SCREEN_WIDTH - 64,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingBottom: Spacing.v.medium,
    ...Shadows.card,
  },
  unsavedTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    textAlign: 'center',
  },
  unsavedDesc: {
    ...Typography.body2,
    color: Colors.light.primary,
    marginTop: Spacing.v.medium,
    textAlign: 'center',
  },
  unsavedButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.h.medium,
    marginTop: Spacing.v.medium,
  },
  btnDiscard: {
    width: 80,
    height: Size.buttonSm,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDiscardText: { ...Typography.button2, color: Colors.light.white },
  btnStay: {
    width: 80,
    height: Size.buttonSm,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnStayText: { ...Typography.button2, color: Colors.light.grayDark },
});
