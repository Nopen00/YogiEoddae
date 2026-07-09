import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApi } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PAGES = [
  { id: '1', title: '미디어 속 관광지를 찾아봐요', body: "드라마, 영화부터 유튜브까지\n다양한 미디어의 배경을 볼 수 있어요" },
  { id: '2', title: '두 번째 페이지', body: "설명 문구가 여기에 들어갑니다." },
  { id: '3', title: '세 번째 페이지', body: "설명 문구가 여기에 들어갑니다." },
  { id: '4', title: '마지막 페이지', body: "이제 서비스를 시작해 볼까요?" },
];

const IntroScreen = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastPage = activeIndex === PAGES.length - 1;
  const insets = useSafeAreaInsets();

  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    AsyncStorage.getItem('device_id').then((id) => {
      if (id) router.replace('/MainScreen');
    });
  }, []);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(scrollOffset / SCREEN_WIDTH);
    setActiveIndex(currentIndex);
  };

  const handlePress = async () => {
    if (isLastPage) {
      try {
        const res = await userApi.createUser();
        await AsyncStorage.setItem('device_id', res.data.device_id);
      } catch (e) {
        // 유저 생성 실패해도 앱 진입은 허용
      }
      router.replace('/MainScreen');
    } else {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  const renderItem = ({ item }: { item: typeof PAGES[0] }) => (
    <View style={styles.pageWrapper}>
      <View style={styles.topContent}>
        <Text style={styles.headline}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <View style={[styles.bottomContent, { bottom: insets.bottom + 16 }]}>
        <View style={styles.indicatorContainer}>
          {PAGES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[
            styles.button,
            isLastPage && styles.lastPageButton
          ]} 
          activeOpacity={0.7}
          onPress={handlePress}
        >
          <Text style={[
            styles.buttonText,
            isLastPage && styles.lastPageButtonText
          ]}>
            {isLastPage ? "시작하기" : "다음으로"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // 1. 전체 레이아웃
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  pageWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
  },

  // 2. 상단 콘텐츠
  topContent: {
    alignItems: 'center',
    paddingTop: Spacing.v.xxlarge,
  },

  headline: {
    ...Typography.HeadLine4,
    color: Colors.light.black,
    textAlign: 'center',
    marginBottom: Spacing.v.medium,
  },

  body: {
    ...Typography.body3,
    color: Colors.light.grayDark,
    textAlign: 'center',
  },

  // 3. 하단 고정 영역
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 56,
  },

  // 4. 페이지 인디케이터
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.grayLight,
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: Colors.light.primary,
  },

  // 5. 버튼 영역
  button: {
    height: 40,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
  },

  lastPageButton: {
    backgroundColor: Colors.light.dark,
    borderWidth: 0,
  },

  buttonText: {
    ...Typography.button2,
    color: Colors.light.black,
  },

  lastPageButtonText: {
    color: Colors.light.white,
  },
});

export default IntroScreen;