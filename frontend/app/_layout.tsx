import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import BottomTabBar from '@/components/navigation/BottomTabBar';

export const unstable_settings = {
  anchor: '(tabs)',
};

const HIDDEN_TAB_ROUTES = ['/SearchScreen', '/tutorial', '/LoginScreen', '/SignInScreen', '/SignUpScreen', '/SignUpStep2Screen', '/EmailSetupScreen', '/FindIdScreen', '/FindIdResultScreen', '/FindPasswordScreen'];

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { fromPublic } = useGlobalSearchParams<{ fromPublic?: string }>();
  // PasswordChangeScreen/PasswordResetScreen은 MY페이지(로그인 상태)와 비밀번호 찾기(비로그인)
  // 양쪽에서 재사용되는데, 비로그인 진입(fromPublic) 시에는 다른 인증 화면들처럼 탭바를 숨겨야 함
  const isSharedPasswordScreenFromPublic =
    (pathname.startsWith('/PasswordChangeScreen') || pathname.startsWith('/PasswordResetScreen')) &&
    fromPublic === '1';

  const showTabBar =
    pathname !== '/' &&
    !isSharedPasswordScreenFromPublic &&
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
            <Stack.Screen name="PhotoSpotWriteScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ScheduleScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SavedListScreen" options={{ headerShown: false }} />
            <Stack.Screen name="QuizListScreen" options={{ headerShown: false }} />
            <Stack.Screen name="QuizDetailScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SettingScreen" options={{ headerShown: false }} />
            <Stack.Screen name="MailboxScreen" options={{ headerShown: false }} />
            <Stack.Screen name="TokenChargeScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ReviewManageScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PhotoSpotManageScreen" options={{ headerShown: false }} />
            <Stack.Screen name="UserPhotoSpotsScreen" options={{ headerShown: false }} />
            <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SignInScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SignUpScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SignUpStep2Screen" options={{ headerShown: false }} />
            <Stack.Screen name="EmailSetupScreen" options={{ headerShown: false }} />
            <Stack.Screen name="FindIdScreen" options={{ headerShown: false }} />
            <Stack.Screen name="FindIdResultScreen" options={{ headerShown: false }} />
            <Stack.Screen name="FindPasswordScreen" options={{ headerShown: false }} />
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
