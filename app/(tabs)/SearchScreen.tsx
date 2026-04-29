import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Clock, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 디자인 시스템 임포트
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
  const inputRef = useRef<TextInput>(null);
  
  const [text, setText] = useState('');
  const [recentList, setRecentList] = useState(INITIAL_DATA);
  const [isAutoSaveOn, setIsAutoSaveOn] = useState(true);

  // 애니메이션 가동을 위한 Ref (켜짐: 1, 꺼짐: 0)
  const toggleAnimation = useRef(new Animated.Value(isAutoSaveOn ? 1 : 0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // --- 핸들러 영역 ---
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

  const handleDeleteAll = () => setRecentList([]);
  const handleDeleteItem = (id: string) => {
    setRecentList(recentList.filter(item => item.id !== id));
  };

  // --- 애니메이션 보간(Interpolation) ---
  const circleTranslateX = toggleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 17], 
  });

  const backgroundColorInterpolate = toggleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.light.grayLight, Colors.light.primary],
  });

  // --- 렌더링 파트 ---
  const renderRecentItem = ({ item }: { item: typeof INITIAL_DATA[0] }) => (
    <View style={styles.recentItemContainer}>
      <TouchableOpacity style={styles.leftGroup} activeOpacity={0.6}>
        <Clock size={16} color={Colors.light.grayDark} />
        <Text style={styles.keywordText}>{item.keyword}</Text>
      </TouchableOpacity>
      <View style={styles.rightGroup}>
        <Text style={styles.dateText}>{item.date}</Text>
        <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
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
      {/* 1. 상단 검색 바 */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.black} strokeWidth={2.5} /> 
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, text.length > 0 && { marginRight: Spacing.h.small }]}
            placeholder="어디로 떠나볼까요?"
            placeholderTextColor={Colors.light.grayLight}
            value={text}
            onChangeText={setText}
          />
          {text.length > 0 && (
            <TouchableOpacity onPress={() => setText('')}>
              <X size={20} color={Colors.light.grayDark} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. 콘텐츠 영역 (최근 검색어 리스트 또는 빈 화면 가이드) */}
      {recentList.length > 0 ? (
        <>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.recentTitle}>최근 검색어</Text>
            <TouchableOpacity onPress={handleDeleteAll}>
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
  
  // 헤더 & 검색바
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.h.medium, 
    marginTop: Spacing.v.small 
  },
  backButton: { 
    width: 32, 
    height: 32, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: Spacing.h.small 
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
    paddingHorizontal: Spacing.h.medium 
  },
  searchInput: { 
    flex: 1, 
    ...Typography.body3, 
    color: Colors.light.black, 
    height: '100%', 
    paddingVertical: 0 
  },

  // 최근 검색어 섹션 헤더
  recentHeaderRow: { 
    marginTop: Spacing.v.small, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.h.medium 
  },
  recentTitle: { ...Typography.title1, color: Colors.light.black },
  deleteAllText: { ...Typography.button4, color: Colors.light.grayLight },

  // 리스트 및 아이템
  listContent: { 
    paddingHorizontal: Spacing.h.medium, 
    paddingTop: Spacing.v.small 
  },
  recentItemContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 14 
  },
  leftGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  keywordText: { 
    marginLeft: Spacing.h.small, 
    ...Typography.body2, 
    color: Colors.light.black 
  },
  rightGroup: { flexDirection: 'row', alignItems: 'center' },
  dateText: { 
    marginRight: Spacing.h.small, 
    ...Typography.body2, 
    color: Colors.light.grayLight 
  },

  // 빈 화면 안내
  emptyWrapper: { flex: 1 },
  emptyTextContainer: { 
    marginTop: Spacing.v.xlarge, 
    alignItems: 'center', 
    marginBottom: 40 
  },
  emptyMainText: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  emptySubText: { 
    marginTop: Spacing.v.small, 
    ...Typography.body2, 
    color: Colors.light.grayLight, 
    textAlign: 'center' 
  },

  // 푸터 (라인 + 자동저장 토글)
  autoSaveFooterContainer: { 
    width: SCREEN_WIDTH - (Spacing.h.medium * 2), 
    alignSelf: 'center', 
    marginTop: Spacing.v.medium 
  },
  separator: { 
    height: Spacing.lw.small, 
    backgroundColor: Colors.light.grayLight, 
    width: '100%' 
  },
  autoSaveRow: { 
    marginTop: Spacing.v.medium, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  autoSaveLabel: { ...Typography.subtitle2, color: Colors.light.grayDark },
  toggleBody: { 
    width: 32, 
    height: 16, 
    borderRadius: 8, 
    position: 'relative', 
    justifyContent: 'center' 
  },
  toggleCircle: { 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: Colors.light.white, 
    position: 'absolute' 
  },
});

export default SearchScreen;