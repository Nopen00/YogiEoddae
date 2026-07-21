import AsyncStorage from '@react-native-async-storage/async-storage';
import { USE_MOCK } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

const AuthGateScreen = () => {
  const router = useRouter();

  useEffect(() => {
    // mock 테스트 중에는 이전 세션의 저장된 토큰과 무관하게 항상 로그인 화면부터 확인
    if (USE_MOCK) {
      router.replace('/LoginScreen');
      return;
    }
    AsyncStorage.getItem('access_token').then((token) => {
      router.replace(token ? '/MainScreen' : '/LoginScreen');
    });
  }, [router]);

  return null;
};

export default AuthGateScreen;
