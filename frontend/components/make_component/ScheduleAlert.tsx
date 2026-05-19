//components\make_component\ScheduleAlert.tsx
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Calendar, X } from 'lucide-react-native'; // 🚀 달력 아이콘 추가
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

interface DayItem {
  dayLabel: string;
  date: string;
}

interface ScheduleAlertProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  period: string;
  tags: string[];
  inputText: string;
  imageUrl?: string;
  hasPlannedSchedule?: boolean;
  hasCurrentSchedule?: boolean;
}

export const ScheduleAlert = ({
  visible,
  onClose,
  title,
  period,
  tags = [],
  inputText,
  imageUrl,
  hasPlannedSchedule = true,
  hasCurrentSchedule = false,
}: ScheduleAlertProps) => {
  // 상태 관리
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [isCurrentExpanded, setIsCurrentExpanded] = useState(false);
  const [selectedCurrentDayIndex, setSelectedCurrentDayIndex] = useState<number | null>(null);
  
  // 🚀 결과 팝업 상태 (성공/실패 통합 관리)
  const [resultPopup, setResultPopup] = useState<{visible: boolean; isSuccess: boolean}>({
    visible: false,
    isSuccess: true,
  });

  const isButtonEnabled = selectedDayIndex !== null || selectedCurrentDayIndex !== null;

  const dayList: DayItem[] = [
    { dayLabel: "Day 1", date: "2026.04.03" },
    { dayLabel: "Day 2", date: "2026.04.04" },
    { dayLabel: "Day 3", date: "2026.04.05" },
  ];

  const handleDayPress = (index: number, isCurrent: boolean) => {
    if (isCurrent) {
      setSelectedCurrentDayIndex(selectedCurrentDayIndex === index ? null : index);
    } else {
      setSelectedDayIndex(selectedDayIndex === index ? null : index);
    }
  };

  // 🚀 추가하기 동작 (성공 시나리오)
  const handleAddAction = () => {
    if (isButtonEnabled) {
      onClose(); // 기존 알럿 닫기
      setResultPopup({ visible: true, isSuccess: true }); // 성공 팝업 표시
    }
  };

  const getProcessedTags = (safeTags: string[] = []) => {
    const sorted = [...safeTags].sort((a, b) => (a === inputText ? -1 : b === inputText ? 1 : 0));
    const visibleTags = sorted.slice(0, 3);
    const extraCount = Math.max(0, safeTags.length - 3);
    return { visibleTags, extraCount };
  };

  const { visibleTags, extraCount } = getProcessedTags(tags);

  const renderScheduleContent = (expanded: boolean, selectedIndex: number | null, isCurrent: boolean) => (
    <TouchableOpacity 
      style={[styles.accordionButton, expanded && styles.expandedButton]} 
      activeOpacity={0.9}
      onPress={() => isCurrent ? setIsCurrentExpanded(!expanded) : setIsExpanded(!expanded)}
    >
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
              <Text key={index} style={styles.tagItem}>#{tag}</Text>
            ))}
            {extraCount > 0 && <Text style={styles.tagItem}>+{extraCount}</Text>}
          </View>
        </View>
      </View>

      {expanded && (
        <View style={styles.dayListSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScrollContent}>
            {dayList.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  onPress={() => handleDayPress(index, isCurrent)}
                  style={[styles.dayButton, isSelected ? styles.dayButtonSelected : styles.dayButtonUnselected]}
                >
                  <Text style={[styles.dayLabel, isSelected ? styles.textWhite : styles.textBlack]}>{item.dayLabel}</Text>
                  <Text style={[styles.dateText, isSelected ? styles.textLightGray : styles.textDarkGray]}>{item.date}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      {/* 메인 일정 알럿 */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.alertContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>예정된 일정</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={24} color={Colors.light.grayLight} />
              </TouchableOpacity>
            </View>
            {hasPlannedSchedule ? renderScheduleContent(isExpanded, selectedDayIndex, false) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>예정된 일정이 없습니다.</Text>
                <Text style={styles.emptySubtitle}>일정을 추가해주세요</Text>
              </View>
            )}

            <View style={styles.currentSectionWrapper}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>현재 진행중인 일정</Text>
              </View>
              {hasCurrentSchedule ? renderScheduleContent(isCurrentExpanded, selectedCurrentDayIndex, true) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>현재 진행중인 일정이 없습니다.</Text>
                  <Text style={styles.emptySubtitle}>일정을 추가해주세요</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.addButton, isButtonEnabled ? styles.addButtonActive : styles.addButtonInactive]}
              activeOpacity={isButtonEnabled ? 0.7 : 1}
              onPress={handleAddAction}
            >
              <Text style={styles.addButtonText}>추가하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🚀 결과 팝업 (성공/실패) */}
      <Modal visible={resultPopup.visible} transparent animationType="none">
        <TouchableOpacity 
          style={styles.resultOverlay} 
          activeOpacity={1} 
          onPress={() => setResultPopup({ ...resultPopup, visible: false })}
        >
          <View style={styles.resultPopupBox}>
            {/* 상단 16pt 간격, 중앙 달력 아이콘 */}
            <Calendar size={48} color={Colors.light.primary} style={styles.resultIcon} />
            
            {/* 아이콘 아래 16pt 간격 안내 문구 */}
            <Text style={styles.resultText}>
              {resultPopup.isSuccess ? "일정에 성공적으로 추가했습니다!" : "일정에 추가를 실패했습니다."}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.25)', justifyContent: 'center', paddingHorizontal: 16 },
  alertContainer: { backgroundColor: Colors.light.white, borderRadius: 8, borderWidth: 1, borderColor: Colors.light.grayLight, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { ...Typography.HeadLine7, color: Colors.light.black },
  currentSectionWrapper: { marginTop: 16 },
  emptyContainer: { alignItems: 'center', paddingVertical: 16 },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black, marginBottom: 16 },
  emptySubtitle: { ...Typography.body2, color: Colors.light.grayLight },
  accordionButton: { marginHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: Colors.light.grayLight, padding: 16, backgroundColor: Colors.light.white },
  expandedButton: {},
  infoRow: { flexDirection: 'row' },
  imageWrapper: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  infoTextWrapper: { marginLeft: 16, flex: 1, justifyContent: 'center' },
  scheduleName: { ...Typography.title1, color: Colors.light.black },
  periodText: { marginTop: 8, ...Typography.subtitle1, color: Colors.light.grayDark },
  tagContainer: { flexDirection: 'row', marginTop: 8 },
  tagItem: { ...Typography.body2, color: Colors.light.primary, marginRight: 4 },
  dayListSection: { marginTop: 16 },
  dayScrollContent: { paddingRight: 0, gap: 8 },
  dayButton: { width: 139, height: 78, borderRadius: 8, borderWidth: 1, alignItems: 'center', paddingTop: 16, paddingHorizontal: 32 },
  dayButtonUnselected: { backgroundColor: Colors.light.white, borderColor: Colors.light.grayLight },
  dayButtonSelected: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  dayLabel: { ...Typography.title2, marginBottom: 8 },
  dateText: { ...Typography.body2 },
  addButton: { height: 48, marginHorizontal: 16, marginTop: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addButtonInactive: { backgroundColor: Colors.light.grayLight },
  addButtonActive: { backgroundColor: Colors.light.primary },
  addButtonText: { ...Typography.button2, color: Colors.light.white },

  // 🚀 결과 팝업 스타일 가이드 준수
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // 불투명도 25의 블랙 뒷배경
    justifyContent: 'center',
    paddingHorizontal: 32, // 좌우 32 여백 반응형 가로
  },
  resultPopupBox: {
    height: 116, // 세로 116 사각형
    backgroundColor: Colors.light.white, // 화이트 배경
    borderRadius: 8, // 8 radius
    borderWidth: 1, // 굵기 1
    borderColor: Colors.light.grayLight, // 그레이라이트 외각선
    alignItems: 'center',
  },
  resultIcon: {
    marginTop: 16, // 상단 16pt 간격
    width: 48,
    height: 48,
  },
  resultText: {
    marginTop: 16, // 아이콘 아래 16pt 간격
    ...Typography.subtitle2, // 부제목2 폰트
    color: Colors.light.black, // 블랙 색상
  },

  textWhite: { color: Colors.light.white },
  textBlack: { color: Colors.light.black },
  textLightGray: { color: Colors.light.grayLight },
  textDarkGray: { color: Colors.light.grayDark },
});