///app\CourseDetailScreen.tsx
import { BackButton } from '@/components/make_component/BackButton';
import { MoreButton } from '@/components/make_component/MoreButton';
import { MoreMenuAlert } from '@/components/make_component/MoreMenuAlert';
import { ScheduleAlert } from '@/components/make_component/ScheduleAlert'; // ✅ 추가
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

console.log('ScheduleAlert:', ScheduleAlert);
console.log('BackButton:', BackButton);

const CourseDetailScreen = () => {
  const { id, title } = useLocalSearchParams(); 
  const router = useRouter();


  
  // 드롭다운 메뉴 표시 여부
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // ✅ 일정추가 팝업 표시 여부
  const [isScheduleVisible, setIsScheduleVisible] = useState(false);

  // 메뉴 외부 클릭 시 닫기
  const closeMenu = () => {
    if (isMenuVisible) setIsMenuVisible(false);
  };

  // ✅ 일정추가 버튼 눌렸을 때: 메뉴 닫고 팝업 열기
  const handleSchedulePress = () => {
    setIsMenuVisible(false);
    setIsScheduleVisible(true);
  };

  return (
    <TouchableWithoutFeedback onPress={closeMenu}>
      <SafeAreaView style={styles.container} edges={['top']}>
        
        {/* 헤더 영역 */}
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.flexFill} />

          <View style={styles.moreButtonWrapper}>
            <MoreButton onPress={() => setIsMenuVisible(!isMenuVisible)} />
            
            {/* ✅ onSchedulePress props 전달 */}
            {isMenuVisible && (
              <MoreMenuAlert onSchedulePress={handleSchedulePress} />
            )}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.idText}>코스 ID: {id}</Text>
          <Text style={styles.titleText}>{title} 상세 화면</Text>
        </View>

        {/* ✅ ScheduleAlert 렌더링 */}
        <ScheduleAlert
          visible={isScheduleVisible}
          onClose={() => setIsScheduleVisible(false)}
          title={String(title ?? '코스 제목')}
          period="2025.01.01 ~ 2025.03.01"
          tags={['태그1', '태그2', '태그3', '태그4']}
          inputText="태그1"
        />
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
    paddingHorizontal: Spacing.h.medium,
    height: 56, 
    zIndex: 10,
  },
  flexFill: {
    flex: 1,
  },
  moreButtonWrapper: {
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