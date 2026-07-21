import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader />

      <View style={styles.body}>
        <Text style={styles.logo}>요기어때?</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  body: {
    marginTop: Spacing.v.medium,
    alignItems: 'center',
  },
  logo: { ...Typography.HeadLine5, color: Colors.light.black },
});

export default LoginScreen;
