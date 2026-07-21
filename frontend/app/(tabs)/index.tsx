import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';

const AuthGateScreen = () => {
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('access_token').then((token) => {
      router.replace(token ? '/MainScreen' : '/LoginScreen');
    });
  }, [router]);

  return null;
};

export default AuthGateScreen;
