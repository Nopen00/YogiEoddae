import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Home, MapPin, Map, Calendar } from 'lucide-react-native';
import { Typography } from '@/constants/Typography';

const ICON_COLOR = '#0C0C0C';
const ICON_SIZE = 24;
const ICON_STROKE = 2;

const TAB_ITEMS = [
  { label: '홈',  Icon: Home,     href: '/(tabs)/MainScreen' as const },
  { label: '코스', Icon: MapPin,   href: null },
  { label: '지도', Icon: Map,      href: null },
  { label: '일정', Icon: Calendar, href: null },
];

export default function BottomTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {TAB_ITEMS.map(({ label, Icon, href }, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tab}
          activeOpacity={0.7}
          onPress={() => href && router.push(href)}
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
    backgroundColor: '#D6D6D6',
    paddingTop: 8,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  tab: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    ...Typography.button4,
    color: '#0C0C0C',
  },
});
