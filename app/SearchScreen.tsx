import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 디자인 시스템 임포트
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

const SearchScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* 뒤로가기 버튼 (테스트 편의를 위해 추가) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={28} color={Colors.light.black} />
        </TouchableOpacity>
      </View>

      {/* 중앙 텍스트 */}
      <View style={styles.content}>
        <Text style={styles.searchText}>검색!</Text>
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
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.medium,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    justifyContent: 'center', // 세로 중앙 정렬
    alignItems: 'center',     // 가로 중앙 정렬
  },
  searchText: {
    ...Typography.HeadLine3, // 크고 명확한 헤드라인 적용
    color: Colors.light.primary,
  },
});

export default SearchScreen;