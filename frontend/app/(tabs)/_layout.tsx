import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { display: 'none' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null, // 하단 탭 바 아이콘을 생성하지 않음
        }}
      />
      <Tabs.Screen
        name="MainScreen"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="ScheduleScreen"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="SettingScreen"
        options={{
          href: null,
        }}
      />

    </Tabs>
  );
}
