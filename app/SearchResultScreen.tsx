import { useLocalSearchParams, useRouter } from 'expo-router'; // Expo Router용으로 변경
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 디자인 시스템 임포트
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

const SearchResultScreen = () => {
  const router = useRouter();
  
  //Expo Router에서 파라미터를 가져오는 가장 편한 방법!
  const { keyword } = useLocalSearchParams<{ keyword: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.black} strokeWidth={2.5} />
        </TouchableOpacity>
        
        {/* ✅ 오류 해결: 백틱을 사용하여 따옴표 처리 */}
        <Text style={styles.headerTitle}>{`'${keyword || ''}' 검색 결과`}</Text>
        
        <View style={{ width: 32 }} />
      </View>

      {/* 화면 중앙 텍스트 */}
      <View style={styles.centerContent}>
        <Text style={styles.mainText}>여기는 검색결과 창입니다</Text>
        <Text style={styles.subText}>{`입력하신 키워드: ${keyword || ''}`}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.h.medium,
    height: 56,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainText: {
    ...Typography.title1,
    color: Colors.light.black,
    marginBottom: Spacing.v.small,
  },
  subText: {
    ...Typography.body2,
    color: Colors.light.grayDark,
  },
});

export default SearchResultScreen;