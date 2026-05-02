import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 디데이 아이템 인터페이스
interface DayItem {
  dayLabel: string; // "Day 1" 등
  date: string;     // "2026.04.03" 등
}

interface ScheduleAlertProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  period: string;
  tags: string[];
  inputText: string;
  imageUrl?: string;
}

export const ScheduleAlert = ({
  visible,
  onClose,
  title,
  period,
  tags = [],
  inputText,
  imageUrl,
}: ScheduleAlertProps) => {
  // 🚀 상태 관리
  // isExpanded: 일정 버튼 클릭 시 세로로 확장되어 디데이 버튼들을 보여줌
  const [isExpanded, setIsExpanded] = useState(false);
  // selectedDayIndex: 선택된 디데이의 인덱스 (null이면 아무것도 선택되지 않은 상태)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // 임시 데이터 (실제 데이터로 교체 가능)
  const dayList: DayItem[] = [
    { dayLabel: "Day 1", date: "2026.04.03" },
    { dayLabel: "Day 2", date: "2026.04.04" },
    { dayLabel: "Day 3", date: "2026.04.05" },
    { dayLabel: "Day 4", date: "2026.04.06" },
  ];

  // 디데이 버튼 클릭 핸들러 (토글 로직)
  const handleDayPress = (index: number) => {
    if (selectedDayIndex === index) {
      // 🚀 이미 선택된 버튼을 다시 누르면 선택 취소
      setSelectedDayIndex(null);
    } else {
      // 새로운 버튼 선택
      setSelectedDayIndex(index);
    }
  };

  // 태그 처리 로직
  const getProcessedTags = (safeTags: string[] = []) => {
    const sorted = [...safeTags].sort((a, b) => (a === inputText ? -1 : b === inputText ? 1 : 0));
    const visibleTags = sorted.slice(0, 3);
    const extraCount = Math.max(0, safeTags.length - 3);
    return { visibleTags, extraCount };
  };

  const { visibleTags, extraCount } = getProcessedTags(tags);

  return (
    <Modal
      key={visible ? 'active-modal' : 'inactive-modal'}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          
          {/* 1. 헤더 영역 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>예정된 일정</Text>
            <TouchableOpacity 
              onPress={onClose} 
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color={Colors.light.grayLight} />
            </TouchableOpacity>
          </View>

          {/* 2. 일정 버튼 (클릭 시 확장되는 아코디언 구조) */}
          <TouchableOpacity 
            style={[styles.accordionButton, isExpanded && styles.expandedButton]} 
            activeOpacity={0.9}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            {/* 상단 정보 (이미지, 타이틀, 태그 등) */}
            <View style={styles.infoRow}>
              <View style={styles.imageWrapper}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                  <View style={[styles.image, { backgroundColor: Colors.light.grayLight }]} />
                )}
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.scheduleName} numberOfLines={1}>{title}</Text>
                <Text style={styles.periodText}>{period}</Text>
                <View style={styles.tagContainer}>
                  {visibleTags.map((tag, index) => (
                    <Text key={`${tag}-${index}`} style={styles.tagItem}>#{tag}</Text>
                  ))}
                  {extraCount > 0 && <Text style={styles.tagItem}>+{extraCount}</Text>}
                </View>
              </View>
            </View>

            {/* 3. 확장 시 나타나는 디데이 버튼 리스트 (태그 16pt 하단) */}
            {isExpanded && (
              <View style={styles.dayListSection}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dayScrollContent}
                >
                  {dayList.map((item, index) => {
                    const isSelected = selectedDayIndex === index;
                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.8}
                        onPress={() => handleDayPress(index)}
                        style={[
                          styles.dayButton,
                          isSelected ? styles.dayButtonSelected : styles.dayButtonUnselected
                        ]}
                      >
                        {/* Day 텍스트 (버튼 상단 16pt 하단 배치) */}
                        <Text style={[
                          styles.dayLabel, 
                          isSelected ? styles.textWhite : styles.textBlack
                        ]}>
                          {item.dayLabel}
                        </Text>
                        {/* 날짜 텍스트 (Day 8pt 하단 배치) */}
                        <Text style={[
                          styles.dateText, 
                          isSelected ? styles.textLightGray : styles.textDarkGray
                        ]}>
                          {item.date}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  alertContainer: {
    width: '100%',
    backgroundColor: Colors.light.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    ...Typography.HeadLine7,
    color: Colors.light.black,
  },
  accordionButton: {
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    padding: 16,
    backgroundColor: Colors.light.white,
  },
  expandedButton: {
    // 확장 시 추가적인 스타일이 필요하다면 여기에 정의
  },
  infoRow: {
    flexDirection: 'row',
  },
  imageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoTextWrapper: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  scheduleName: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  periodText: {
    marginTop: 8,
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
  },
  tagContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tagItem: {
    ...Typography.body2,
    color: Colors.light.primary,
    marginRight: 4,
  },
  // 디데이 리스트 섹션
  dayListSection: {
    marginTop: 16, // 태그에서 16pt 아래 정보 추가
  },
  dayScrollContent: {
    paddingRight: 0,
    gap: 8, // 버튼 간 8pt 간격
  },
  dayButton: {
    width: 139,
    height: 78,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    paddingTop: 16, // 버튼 상단에서 16pt 아래 텍스트 시작
    paddingHorizontal: 32, // 좌우 32pt 간격 형성 유도
  },
  dayButtonUnselected: {
    backgroundColor: Colors.light.white,
    borderColor: Colors.light.grayLight,
  },
  dayButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayLabel: {
    ...Typography.title2,
    marginBottom: 8, // Day 8pt 아래 날짜
  },
  dateText: {
    ...Typography.body2,
  },
  // 텍스트 컬러 유틸리티
  textWhite: { color: Colors.light.white },
  textBlack: { color: Colors.light.black },
  textLightGray: { color: Colors.light.grayLight },
  textDarkGray: { color: Colors.light.grayDark },
});