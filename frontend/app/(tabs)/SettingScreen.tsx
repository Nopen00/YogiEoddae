import { BackButton } from '@/components/make_component/BackButton';
import { Divider } from '@/components/make_component/Divider';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => router.push('/AccountScreen')}>
        <Text style={styles.menuLabel}>계정</Text>
        <ChevronRight size={IconSize.large} color={Colors.light.grayDark} />
      </TouchableOpacity>
      <Divider style={{ marginHorizontal: 16 }} />
    </SafeAreaView>
  );
};

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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  menuLabel: { ...Typography.title1, color: Colors.light.black },
});

export default SettingScreen;
