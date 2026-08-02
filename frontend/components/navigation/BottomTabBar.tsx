import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Home, MapPin, User, Calendar } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const TAB_ITEMS: {
  label: string;
  Icon: IconComponent;
  href: string | null;
  activePatterns: string[];
}[] = [
  {
    label: '홈',
    Icon: Home,
    href: '/(tabs)/MainScreen',
    activePatterns: ['/MainScreen'],
  },
  {
    label: '코스',
    Icon: MapPin,
    href: '/CourseScreen',
    activePatterns: ['/CourseScreen'],
  },
  {
    label: '일정',
    Icon: Calendar,
    href: '/ScheduleScreen',
    activePatterns: ['/ScheduleScreen'],
  },
  {
    label: 'MY',
    Icon: User,
    href: '/SettingScreen',
    activePatterns: ['/SettingScreen', '/AccountScreen'],
  },
];

const TIMING_CONFIG = { duration: 200, easing: Easing.out(Easing.quad) };

interface TabItemProps {
  label: string;
  Icon: IconComponent;
  isActive: boolean;
  onPress?: () => void;
}

function TabItem({ label, Icon, isActive, onPress }: TabItemProps) {
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, TIMING_CONFIG);
  }, [isActive, progress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: interpolate(progress.value, [0, 1], [0.4, 1]) }],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [Colors.light.grayDark, Colors.light.primary],
    ),
  }));

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <View style={styles.tabContent}>
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.iconOverlay, inactiveIconStyle]}>
            <Icon
              size={IconSize.large}
              color={Colors.light.grayDark}
              strokeWidth={IconStroke.regular}
            />
          </Animated.View>
          <Animated.View style={[styles.iconOverlay, activeIconStyle]}>
            <Icon
              size={IconSize.large}
              color={Colors.light.primary}
              strokeWidth={IconStroke.regular}
            />
          </Animated.View>
        </View>
        <Animated.Text style={[styles.label, textStyle]}>{label}</Animated.Text>
      </View>
    </TouchableOpacity>
  );
}

export default function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const isTabActive = (patterns: string[]) =>
    patterns.some(p => pathname === p || pathname.startsWith(p + '/'));

  const handleTabPress = (href: string) => {
    if (href === '/(tabs)/MainScreen') {
      router.navigate(href);
      return;
    }
    const routeName = href.split('/').pop()!;
    if (pathname !== `/${routeName}`) {
      router.push(href as any);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {TAB_ITEMS.map(({ label, Icon, href, activePatterns }, index) => (
        <TabItem
          key={index}
          label={label}
          Icon={Icon}
          isActive={isTabActive(activePatterns)}
          onPress={() => href && handleTabPress(href)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTopWidth: Spacing.lw.small,
    borderTopColor: Colors.light.grayLight,
  },
  tab: {
    flex: 1,
  },
  indicator: {
    height: 4,
    marginHorizontal: Spacing.h.xlarge,
    borderRadius: Spacing.r.xsmall,
    backgroundColor: Colors.light.primary,
  },
  tabContent: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: Spacing.v.small,
    gap: Spacing.v.small,
  },
  iconWrapper: {
    width: IconSize.large,
    height: IconSize.large,
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.button4,
  },
});
