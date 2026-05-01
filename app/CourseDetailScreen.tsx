import BackButton from '@/components/make_component/BackButton';
import { MoreButton } from '@/components/make_component/MoreButton';
import { MoreMenuAlert } from '@/components/make_component/MoreMenuAlert';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react'; // 🚀 상태 관리를 위해 useState 추가
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CourseDetailScreen = () => {
  const { id, title } = useLocalSearchParams(); 
  const router = useRouter();

  // 🚀 알럿 메뉴의 표시 여부를 관리하는 상태
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // 메뉴 외부 클릭 시 닫기 위한 핸들러
  const closeMenu = () => {
    if (isMenuVisible) setIsMenuVisible(false);
  };

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <SafeAreaView style={styles.container} edges={['top']}>
        
        {/* 🚀 헤더 영역: 양 끝에 버튼 배치 */}
        <View style={styles.header}>
          {/* 좌측 뒤로가기 버튼 */}
          <BackButton onPress={() => router.back()} />
          
          {/* 중앙 공간 확보 (flex: 1을 주어 좌우로 밀어냄) */}
          <View style={styles.flexFill} />

          {/* 우측 MoreButton 영역 */}
          <View style={styles.moreButtonWrapper}>
            <MoreButton onPress={() => setIsMenuVisible(!isMenuVisible)} />
            
            {/* 🚀 알럿 메뉴: 상태가 true일 때만 표시 */}
            {isMenuVisible && <MoreMenuAlert />}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.idText}>코스 ID: {id}</Text>
          <Text style={styles.titleText}>{title} 상세 화면</Text>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    marginTop: Spacing.v.small, 
    // 🚀 양쪽 끝에 16pt 여백을 주어 SearchBar와 동일한 정렬 유지
    paddingHorizontal: Spacing.h.medium,
    height: 56, 
    zIndex: 10, // 알럿이 다른 요소 위로 올라오도록 설정
  },
  flexFill: {
    flex: 1,
  },
  moreButtonWrapper: {
    // 🚀 알럿이 버튼을 기준으로 위치하도록 설정
    position: 'relative',
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 64, 
  },
  idText: { 
    ...Typography.body2, 
    color: Colors.light.grayDark 
  },
  titleText: { 
    ...Typography.HeadLine7, 
    color: Colors.light.black, 
    marginTop: 10 
  },
});

export default CourseDetailScreen;