import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { LargeIconModeProvider } from '@/hooks/useLargeIconMode';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { logEvent } from '@/services/logger';

SplashScreen.preventAutoHideAsync();

// 처리되지 않은 JS 예외(진짜 크래시)를 숨겨진 디버그 로그 화면(MY 타이틀 5연타)에서
// 볼 수 있게 기록해둔다. 기본 핸들러도 그대로 호출해서 기존 크래시 동작은 유지한다.
const globalErrorUtils = (global as any).ErrorUtils;
if (globalErrorUtils && !(globalErrorUtils as any)._loggerPatched) {
  const defaultHandler = globalErrorUtils.getGlobalHandler?.();
  globalErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    logEvent('error', isFatal ? 'FATAL' : 'JS 예외', error?.message || String(error));
    defaultHandler?.(error, isFatal);
  });
  (globalErrorUtils as any)._loggerPatched = true;
}

export const unstable_settings = {
  anchor: '(tabs)',
};

const HIDDEN_TAB_ROUTES = ['/SearchScreen', '/LoginScreen', '/SignInScreen', '/SignUpAgreementScreen', '/SignUpScreen', '/SignUpStep2Screen', '/EmailSetupScreen', '/FindIdScreen', '/FindIdResultScreen', '/FindPasswordScreen'];

// 아래 Stack.Screen에 등록된 실제 라우트 이름 목록. 여기 없는 경로(오타 URL, 삭제된 딥링크 등)는
// +not-found 화면으로 떨어지는데, 그런 미확정 경로에서까지 탭바가 화면 위에 겹쳐 뜨는 것을 막기 위해
// "알려진 경로일 때만" 탭바를 보여주는 화이트리스트 방식으로 판단한다.
const KNOWN_ROUTES = [
  'MainScreen', 'SearchScreen', 'SearchResultScreen', 'CourseDetailScreen', 'PlaceDetailScreen', 'PhotoSpotDetailScreen',
  'ReviewWriteScreen', 'PhotoSpotWriteScreen', 'ScheduleScreen', 'SavedListScreen', 'QuizListScreen', 'QuizDetailScreen',
  'SettingScreen', 'MailboxScreen', 'TokenChargeScreen', 'ReviewManageScreen', 'PhotoSpotManageScreen',
  'CourseSuggestionWriteScreen', 'UserPhotoSpotsScreen', 'LoginScreen', 'SignInScreen', 'SignUpAgreementScreen',
  'SignUpScreen', 'SignUpStep2Screen', 'EmailSetupScreen', 'FindIdScreen', 'FindIdResultScreen', 'FindPasswordScreen',
  'AccountScreen', 'PasswordConfirmScreen', 'PasswordChangeScreen', 'PasswordEditScreen',
  'PasswordResetScreen', 'EmailChangeScreen', 'EmailVerifyScreen', 'WithdrawalScreen', 'ScheduleDetailScreen', 'CourseScreen',
];

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { fromPublic, fromSignup } = useGlobalSearchParams<{ fromPublic?: string; fromSignup?: string }>();
  const isKnownRoute = pathname === '/' || KNOWN_ROUTES.some((name) => pathname.startsWith(`/${name}`));
  // PasswordChangeScreen/PasswordResetScreen은 MY페이지(로그인 상태)와 비밀번호 찾기(비로그인)
  // 양쪽에서 재사용되는데, 비로그인 진입(fromPublic) 시에는 다른 인증 화면들처럼 탭바를 숨겨야 함
  const isSharedPasswordScreenFromPublic =
    (pathname.startsWith('/PasswordChangeScreen') || pathname.startsWith('/PasswordResetScreen')) &&
    fromPublic === '1';
  // EmailVerifyScreen도 마찬가지로 MY페이지(이메일 변경)와 회원가입(fromSignup, 계정/토큰이 아직 없는 상태)
  // 양쪽에서 재사용되는데, 회원가입 흐름 중에는 탭 이동으로 가입을 이탈할 수 없도록 탭바를 숨겨야 함
  const isSignupEmailVerify = pathname.startsWith('/EmailVerifyScreen') && fromSignup === '1';
  const showTabBar =
    pathname !== '/' &&
    isKnownRoute &&
    !isSharedPasswordScreenFromPublic &&
    !isSignupEmailVerify &&
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
            <Stack.Screen name="CourseSuggestionWriteScreen" options={{ headerShown: false }} />
            <Stack.Screen name="UserPhotoSpotsScreen" options={{ headerShown: false }} />
            <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SignInScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SignUpAgreementScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SignUpScreen" options={{ headerShown: false }} />
            <Stack.Screen name="SignUpStep2Screen" options={{ headerShown: false }} />
            <Stack.Screen name="EmailSetupScreen" options={{ headerShown: false }} />
            <Stack.Screen name="FindIdScreen" options={{ headerShown: false }} />
            <Stack.Screen name="FindIdResultScreen" options={{ headerShown: false }} />
            <Stack.Screen name="FindPasswordScreen" options={{ headerShown: false }} />
            <Stack.Screen name="AccountScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PasswordConfirmScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PasswordChangeScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PasswordEditScreen" options={{ headerShown: false }} />
            <Stack.Screen name="PasswordResetScreen" options={{ headerShown: false }} />
            <Stack.Screen name="EmailChangeScreen" options={{ headerShown: false }} />
            <Stack.Screen name="EmailVerifyScreen" options={{ headerShown: false }} />
            <Stack.Screen name="WithdrawalScreen" options={{ headerShown: false }} />
            <Stack.Screen name="ScheduleDetailScreen" options={{ headerShown: false }} />
            <Stack.Screen name="CourseScreen" options={{ headerShown: false }} />
            <Stack.Screen name="DebugLogScreen" options={{ headerShown: false }} />
          </Stack>
        </View>
        {showTabBar && <BottomTabBar />}
      </View>
      {/* 앱 화면이 항상 흰 배경(라이트 UI)이라, OS가 다크모드일 때 style="auto"가
          상태바 아이콘을 흰색으로 바꾸면 흰 배경에 묻혀 안 보이는 문제가 있었음.
          앱 자체는 다크모드를 지원하지 않으므로 상태바도 항상 어두운 색으로 고정. */}
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    LoadingFont: require('@/assets/fonts/ongeulip_demong_gothic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LargeIconModeProvider>
        <RootLayoutNav />
      </LargeIconModeProvider>
    </GestureHandlerRootView>
  );
}
