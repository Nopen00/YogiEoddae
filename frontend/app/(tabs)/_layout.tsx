import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
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
    </Tabs>
  );
}
