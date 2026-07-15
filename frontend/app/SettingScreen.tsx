import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="마이" onBack={() => router.back()} />

      <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => router.push('/AccountScreen')}>
        <Text style={styles.menuLabel}>계정</Text>
        <ChevronRight size={IconSize.large} color={Colors.light.grayDark} />
      </TouchableOpacity>
      <Divider style={{ marginHorizontal: Spacing.h.medium }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.medium,
  },
  menuLabel: { ...Typography.title1, color: Colors.light.black },
});

export default SettingScreen;
