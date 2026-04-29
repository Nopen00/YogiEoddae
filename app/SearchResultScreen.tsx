import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 디자인 시스템 및 컴포넌트 임포트
import SearchBar from '@/components/make_component/SearchBar';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

// 탭 항목 정의
const CATEGORIES = ["전체", "코스", "명소", "포토스팟"];
const { width } = Dimensions.get('window');
const TAB_WIDTH = width / CATEGORIES.length; // 4등분 너비 계산

const DUMMY_RESULTS = [
  { id: '1', title: '강원도 양양 서핑 투어', category: '액티비티' },
  { id: '2', title: '양양 낙산사 일출 감상', category: '관광명소' },
  { id: '3', title: '속초/양양 1박 2일 코스', category: '여행코스' },
];

const SearchResultScreen = () => {
  const router = useRouter();
  
  // 1. 초기 검색어 가져오기 및 입력 상태 관리
  const { keyword: initialKeyword } = useLocalSearchParams<{ keyword: string }>();
  const [inputText, setInputText] = useState(initialKeyword || '');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 2. 애니메이션 값 (하단 바 X축 이동)
  const translateX = useRef(new Animated.Value(0)).current;

  // 탭 클릭 핸들러 (애니메이션 적용)
  const handleTabPress = (index: number) => {
    setSelectedIndex(index);
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const renderItem = ({ item }: { item: typeof DUMMY_RESULTS[0] }) => (
    <TouchableOpacity style={styles.resultItem} activeOpacity={0.7}>
      <View>
        <Text style={styles.resultCategory}>{item.category}</Text>
        <Text style={styles.resultTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* --- 상단 검색바 영역 --- */}
      <View style={styles.headerWrapper}>
        <SearchBar
          value={inputText}
          onChangeText={setInputText}
          placeholder="검색어를 입력해 주세요"
          onBackPress={() => router.back()}
          onClearPress={() => setInputText('')}
          onSubmitEditing={() => console.log('검색 실행:', inputText)}
          returnKeyType="search"
        />
      </View>

      {/* --- 카테고리 탭 영역 (4등분 & 애니메이션) --- */}
      <View style={styles.tabContainer}>
        {/* 비활성화 상태의 기본 가로선 (라이트그레이) */}
        <View style={styles.backgroundLine} />

        {CATEGORIES.map((tab, index) => {
          const isSelected = selectedIndex === index;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => handleTabPress(index)}
              activeOpacity={1} // 탭 클릭 시 깜빡임 방지
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isSelected ? Colors.light.black : Colors.light.grayLight }
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* 활성화 상태의 움직이는 바 (블랙) */}
        <Animated.View 
          style={[
            styles.indicator, 
            { 
              width: TAB_WIDTH, 
              transform: [{ translateX }] 
            }
          ]} 
        />
      </View>

      {/* --- 검색 결과 리스트 영역 --- */}
      <View style={styles.content}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            총 <Text style={styles.highlightText}>{DUMMY_RESULTS.length}</Text>건의 결과가 있습니다
          </Text>
        </View>

        <FlatList
          data={DUMMY_RESULTS}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.light.background 
  },
  headerWrapper: {
    paddingBottom: Spacing.v.small,
  },
  // 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    height: 32,
    position: 'relative',
    backgroundColor: Colors.light.background,
  },
  backgroundLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.light.grayLight,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    ...Typography.subtitle1,
    textAlign: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 1,
    backgroundColor: Colors.light.black,
    zIndex: 1,
  },
  // 콘텐츠 및 리스트 스타일
  content: {
    flex: 1,
  },
  summaryContainer: {
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
  },
  summaryText: {
    ...Typography.body2,
    color: Colors.light.grayDark,
  },
  highlightText: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.h.medium,
  },
  resultItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.grayLight,
  },
  resultCategory: {
    ...Typography.body1, // 데이터 성격에 따라 body로 조정
    color: Colors.light.primary,
    marginBottom: 4,
  },
  resultTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body2,
    color: Colors.light.grayLight,
  },
});

export default SearchResultScreen;