import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 디자인 시스템 임포트
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

const SearchScreen = () => {
  const navigation = useNavigation();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState('');

  // 화면 진입 시 자동 포커스
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        {/* 1. 왼쪽 화살표 (32x32) */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.light.black} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* 2. 검색창 (화살표에서 8pt 간격) */}
        <View style={styles.searchBarContainer}>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="어디로 떠나볼까요?"
            placeholderTextColor={Colors.light.grayLight}
            value={text}
            onChangeText={setText}
            returnKeyType="search"
          />
          
          {/* 3. 텍스트 입력 시 나타나는 X 표시 (우측 16pt 간격) */}
          {text.length > 0 && (
            <TouchableOpacity 
              onPress={() => setText('')}
              style={styles.clearButton}
            >
              <X size={20} color={Colors.light.black} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 키보드 닫기용 빈 영역 */}
      <TouchableOpacity 
        style={{ flex: 1 }} 
        activeOpacity={1} 
        onPress={Keyboard.dismiss} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.h.medium, // 화면 왼쪽/오른쪽 전체 16pt 간격
    marginTop: Spacing.v.small,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8, // 화살표와 검색창 사이 8pt
  },
  searchBarContainer: {
    flex: 1,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: 56,
    // 내부 요소(텍스트박스, X버튼)들의 외각 간격을 16pt로 유지하기 위한 패딩
    paddingHorizontal: 16, 
  },
  searchInput: {
    flex: 1,
    ...Typography.body3,
    color: Colors.light.black,
    height: '100%',
    paddingVertical: 0, // 중앙 정렬을 방해하는 기본 패딩 제거
  },
  clearButton: {
    marginLeft: 8, // 텍스트와 X 사이의 최소 간격
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchScreen;