import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams } from 'expo-router'; // 🚀 파라미터 수신을 위한 훅
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const CourseDetailScreen = () => {
  // 🚀 이전 화면에서 보낸 데이터를 가져옵니다.
  const { id, title } = useLocalSearchParams(); 

  return (
    <View style={styles.container}>
      {/* 🚀 이제 클릭한 카드에 따라 텍스트가 달라집니다. */}
      <Text style={styles.idText}>코스 ID: {id}</Text>
      <Text style={styles.titleText}>{title} 상세 화면</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  idText: { ...Typography.body2, color: Colors.light.grayDark },
  titleText: { ...Typography.HeadLine7, color: Colors.light.black, marginTop: 10 },
});

export default CourseDetailScreen;