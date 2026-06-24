import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import BottomTabBar from '@/components/make_component/BottomTabBar';

export const unstable_settings = {
  anchor: '(tabs)',
};

const HIDDEN_TAB_ROUTES = ['/SearchScreen', '/tutorial'];

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  const showTabBar =
    pathname !== '/' &&
    !HIDDEN_TAB_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="SearchScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SearchResultScreen" options={{ headerShown: false }} />
            <Stack.Screen name="CourseDetailScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PlaceDetailScreen" options={{ headerShown: false }} />
            <Stack.Screen name="AccountScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ScheduleDetailScreen" options={{ headerShown: false }} />
          </Stack>
        </View>
        {showTabBar && <BottomTabBar />}
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}
