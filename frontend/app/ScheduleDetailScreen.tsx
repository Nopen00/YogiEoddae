// app/ScheduleDetailScreen.tsx
import { BackButton } from '@/components/make_component/BackButton';
import { Divider } from '@/components/make_component/Divider';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleApi } from '../services/api';
import type { Schedule } from '../services/types';

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

// ─── 메인 화면 ────────────────────────────────────────────────────────────────
type PanelState = -1 | 0 | 1;

export default function ScheduleDetailScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { id, title: paramTitle } = useLocalSearchParams<{ id: string; title: string }>();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [contentHeight, setContentHeight] = useState(INITIAL_CONTENT_HEIGHT);
  const [panelState, setPanelState] = useState<PanelState>(0);
  const panelStateRef = useRef<PanelState>(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);

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

  useEffect(() => {
    if (!id) return;
    scheduleApi.getDetail(Number(id)).then(res => setSchedule(res.data)).catch(() => {});
  }, [id]);

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

  const displayTitle = schedule?.title ?? paramTitle ?? '';

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
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <MarqueeText text={displayTitle} style={styles.headerTitle} />
        <View style={styles.headerSpacer} />
      </View>

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
        />

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

          <ScrollView
            ref={scrollRef}
            style={styles.panelScroll}
            showsVerticalScrollIndicator={false}
            scrollEnabled={panelState === 1}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.panelContent}>
              <View style={styles.panelContentHeader}>
                <Text style={styles.panelContentTitle}>일정</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.panelContentAction}>편집</Text>
                </TouchableOpacity>
              </View>
              <Divider style={{ marginHorizontal: Spacing.h.medium }} />
              {dayEntries.map(({ dayNum, dateStr }) => (
                <View key={dayNum} style={styles.dayRow}>
                  <Text style={styles.dayLabel}>Day {dayNum}</Text>
                  <Text style={styles.dayDate}>{dateStr}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </RNAnimated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    paddingHorizontal: Spacing.h.medium,
    height: 56,
  },
  headerTitle: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
  },
  headerSpacer: { width: 48 },
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
    paddingTop: 24,
  },
  panelContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: Spacing.h.medium,
    paddingRight: 32,
  },
  panelContentTitle: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
  },
  panelContentAction: {
    ...Typography.button4,
    color: Colors.light.primary,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: Spacing.h.medium,
  },
  dayLabel: {
    ...Typography.title2,
    color: Colors.light.black,
  },
  dayDate: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    marginLeft: 8,
  },
});
