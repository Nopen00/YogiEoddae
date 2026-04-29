import { useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation();
  const [text, setText] = useState('');
  const [recentList, setRecentList] = useState(INITIAL_DATA);
  const [isAutoSaveOn, setIsAutoSaveOn] = useState(true);

  const toggleAnimation = useRef(new Animated.Value(isAutoSaveOn ? 1 : 0)).current;

  // 토글 애니메이션 로직
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
      <TouchableOpacity style={styles.leftGroup} activeOpacity={0.6}>
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
      {/* 🚀 분리한 SearchBar 컴포넌트 적용 */}
      <SearchBar
        autoFocus
        placeholder="어디로 떠나볼까요?"
        value={text}
        onChangeText={setText}
        onClearPress={() => setText('')}
        onBackPress={() => navigation.goBack()}
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
  // headerRow, backButton, searchBarContainer, searchInput 스타일은 SearchBar.tsx로 이동했으므로 삭제 가능
  
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