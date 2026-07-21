import AsyncStorage from '@react-native-async-storage/async-storage';
import { USE_MOCK } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

const AuthGateScreen = () => {
  const router = useRouter();

  useEffect(() => {
    // AsyncStorage 조회를 항상 거쳐 다음 tick으로 미룸 — 루트 레이아웃(네비게이터)이
    // 마운트되기 전에 동기적으로 router.replace를 호출하면 네비게이션 에러가 난다.
    AsyncStorage.getItem('access_token').then((token) => {
      // mock 테스트 중에는 이전 세션의 저장된 토큰과 무관하게 항상 로그인 화면부터 확인
      router.replace(USE_MOCK || !token ? '/LoginScreen' : '/MainScreen');
    });
  }, [router]);

  return null;
};

export default AuthGateScreen;
