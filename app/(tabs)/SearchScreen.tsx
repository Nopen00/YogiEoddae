import { useRouter } from 'expo-router'; // navigation 대신 router 사용 권장
import { Clock, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 컴포넌트 및 디자인 시스템 임포트
import SearchBar from '@/components/make_component/SearchBar';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INITIAL_DATA = [
  { id: '1', keyword: '최근 검색어', date: '04.03' },
  { id: '2', keyword: '최근 검색어', date: '04.03' },
  { id: '3', keyword: '최근 검색어', date: '04.03' },
];

const SearchScreen = () => {
  const router = useRouter();
  const [text, setText] = useState('');
  const [recentList, setRecentList] = useState(INITIAL_DATA);
  const [isAutoSaveOn, setIsAutoSaveOn] = useState(true);

  const toggleAnimation = useRef(new Animated.Value(isAutoSaveOn ? 1 : 0)).current;

  // 🚀 [추가] 검색 실행 시 최근 검색어에 추가하는 로직
  const handleSearch = (keyword: string) => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return;

    // 자동저장이 켜져 있을 때만 저장
    if (isAutoSaveOn) {
      const newItem = {
        id: Date.now().toString(), // 고유 ID
        keyword: trimmedKeyword,
        date: '04.29', // 실제 날짜를 사용하려면 별도 포맷팅 함수 필요
      };

      setRecentList((prev) => {
        // 중복 검색어 제거 후 맨 앞에 추가
        const filtered = prev.filter((item) => item.keyword !== trimmedKeyword);
        return [newItem, ...filtered];
      });
    }

    // 검색 결과창으로 이동
    router.push({
      pathname: '/SearchResultScreen',
      params: { keyword: trimmedKeyword }
    });
    
    setText(''); // 입력창 비우기
  };

  const handleToggle = () => {
    const nextState = !isAutoSaveOn;
    setIsAutoSaveOn(nextState);
    Animated.timing(toggleAnimation, {
      toValue: nextState ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  };

  const circleTranslateX = toggleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  const backgroundColorInterpolate = toggleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.light.grayLight, Colors.light.primary],
  });

  const renderRecentItem = ({ item }: { item: typeof INITIAL_DATA[0] }) => (
    <View style={styles.recentItemContainer}>
      {/* 🚀 검색어 클릭 시에도 해당 단어로 검색 실행 */}
      <TouchableOpacity 
        style={styles.leftGroup} 
        activeOpacity={0.6}
        onPress={() => handleSearch(item.keyword)}
      >
        <Clock size={16} color={Colors.light.grayDark} />
        <Text style={styles.keywordText}>{item.keyword}</Text>
      </TouchableOpacity>
      <View style={styles.rightGroup}>
        <Text style={styles.dateText}>{item.date}</Text>
        <TouchableOpacity onPress={() => setRecentList(recentList.filter(i => i.id !== item.id))}>
          <X size={16} color={Colors.light.grayDark} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const AutoSaveFooter = () => (
    <View style={styles.autoSaveFooterContainer}>
      <View style={styles.separator} />
      <View style={styles.autoSaveRow}>
        <Text style={styles.autoSaveLabel}>자동저장</Text>
        <TouchableOpacity activeOpacity={0.9} onPress={handleToggle}>
          <Animated.View style={[styles.toggleBody, { backgroundColor: backgroundColorInterpolate }]}>
            <Animated.View style={[styles.toggleCircle, { transform: [{ translateX: circleTranslateX }] }]} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SearchBar
        autoFocus
        placeholder="어디로 떠나볼까요?"
        value={text}
        onChangeText={setText}
        onClearPress={() => setText('')}
        onBackPress={() => router.back()}
        // 🚀 엔터(완료) 버튼 누를 때 검색 실행
        onSubmitEditing={() => handleSearch(text)}
        returnKeyType="search"
      />

      {recentList.length > 0 ? (
        <>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.recentTitle}>최근 검색어</Text>
            <TouchableOpacity onPress={() => setRecentList([])}>
              <Text style={styles.deleteAllText}>전체 삭제</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentList}
            renderItem={renderRecentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={AutoSaveFooter}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // 검색어 클릭 시 키보드 닫힘 방지
          />
        </>
      ) : (
        <View style={styles.emptyWrapper}>
          <View style={styles.emptyTextContainer}>
            <Text style={styles.emptyMainText}>최근 검색 내역이 없습니다</Text>
            <Text style={styles.emptySubText}>검색어를 입력해보세요.</Text>
          </View>
          <AutoSaveFooter />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  recentHeaderRow: { marginTop: Spacing.v.small, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.h.medium },
  recentTitle: { ...Typography.title1, color: Colors.light.black },
  deleteAllText: { ...Typography.button4, color: Colors.light.grayLight },
  listContent: { paddingHorizontal: Spacing.h.medium, paddingTop: Spacing.v.small },
  recentItemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  leftGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  keywordText: { marginLeft: Spacing.h.small, ...Typography.body2, color: Colors.light.black },
  rightGroup: { flexDirection: 'row', alignItems: 'center' },
  dateText: { marginRight: Spacing.h.small, ...Typography.body2, color: Colors.light.grayLight },
  emptyWrapper: { flex: 1 },
  emptyTextContainer: { marginTop: Spacing.v.xlarge, alignItems: 'center', marginBottom: 40 },
  emptyMainText: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  emptySubText: { marginTop: Spacing.v.small, ...Typography.body2, color: Colors.light.grayLight, textAlign: 'center' },
  autoSaveFooterContainer: { width: SCREEN_WIDTH - (Spacing.h.medium * 2), alignSelf: 'center', marginTop: Spacing.v.medium },
  separator: { height: Spacing.lw.small, backgroundColor: Colors.light.grayLight, width: '100%' },
  autoSaveRow: { marginTop: Spacing.v.medium, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  autoSaveLabel: { ...Typography.subtitle2, color: Colors.light.grayDark },
  toggleBody: { width: 48, height: 24, borderRadius: 12, position: 'relative', justifyContent: 'center' },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.light.white, position: 'absolute' },
});

export default SearchScreen;