// app/ScheduleDetailScreen.tsx
import { BackButton } from '@/components/make_component/BackButton';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleApi } from '../services/api';
import type { Schedule } from '../services/types';

export default function ScheduleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    if (!id) return;
    scheduleApi.getDetail(Number(id)).then(res => setSchedule(res.data)).catch(() => {});
  }, [id]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>{schedule?.title ?? ''}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    paddingHorizontal: Spacing.h.medium,
    height: 56,
  },
  headerTitle: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
});
