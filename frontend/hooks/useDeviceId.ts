import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('device_id').then((id) => {
      setDeviceId(id);
      setIsReady(true);
    });
  }, []);

  return { deviceId, isReady };
}
