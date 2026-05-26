import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
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

  const showTabBar = !HIDDEN_TAB_ROUTES.some((route) => pathname.startsWith(route));

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
          </Stack>
        </View>
        {showTabBar && <BottomTabBar />}
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
