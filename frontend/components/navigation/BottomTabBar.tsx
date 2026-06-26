import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Home, MapPin, Settings, Calendar } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

const ICON_COLOR = Colors.light.black;
const ICON_SIZE = IconSize.large;
const ICON_STROKE = IconStroke.regular;

const TAB_ITEMS = [
  { label: '홈',  Icon: Home,     href: '/(tabs)/MainScreen' as const },
  { label: '코스', Icon: MapPin,   href: null },
  { label: '일정', Icon: Calendar, href: '/ScheduleScreen' as const },
  { label: '설정', Icon: Settings,  href: '/SettingScreen' as const },
];

export default function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

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
      {TAB_ITEMS.map(({ label, Icon, href }, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tab}
          activeOpacity={0.7}
          onPress={() => href && handleTabPress(href)}
        >
          <Icon size={ICON_SIZE} color={ICON_COLOR} strokeWidth={ICON_STROKE} />
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.light.grayLight,
    paddingTop: Spacing.v.small,
    paddingHorizontal: Spacing.h.xlarge,
    justifyContent: 'space-between',
  },
  tab: {
    alignItems: 'center',
    gap: Spacing.v.small,
  },
  label: {
    ...Typography.button4,
    color: Colors.light.black,
  },
});
