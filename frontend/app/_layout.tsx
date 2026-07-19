import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import BottomTabBar from '@/components/navigation/BottomTabBar';

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
            <Stack.Screen name="SearchScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SearchResultScreen" options={{ headerShown: false }} />
            <Stack.Screen name="CourseDetailScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PlaceDetailScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PhotoSpotDetailScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ReviewWriteScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ScheduleScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SavedListScreen" options={{ headerShown: false }} />
            <Stack.Screen name="QuizListScreen" options={{ headerShown: false }} />
            <Stack.Screen name="QuizDetailScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SettingScreen" options={{ headerShown: false }} />
            <Stack.Screen name="MailboxScreen" options={{ headerShown: false }} />
            <Stack.Screen name="TokenChargeScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ReviewManageScreen" options={{ headerShown: false }} />
            <Stack.Screen name="AccountScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PasswordConfirmScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PasswordChangeScreen" options={{ headerShown: false }} />
            <Stack.Screen name="IdChangeScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PasswordEditScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PasswordResetScreen" options={{ headerShown: false }} />
            <Stack.Screen name="EmailChangeScreen" options={{ headerShown: false }} />
            <Stack.Screen name="EmailVerifyScreen" options={{ headerShown: false }} />
            <Stack.Screen name="WithdrawalScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ScheduleDetailScreen" options={{ headerShown: false }} />
            <Stack.Screen name="CourseScreen" options={{ headerShown: false }} />
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
