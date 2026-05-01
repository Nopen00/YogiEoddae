///components\make_component\ScheduleAlert.tsx
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { X } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
  
  // 태그 처리 로직 (제공해주신 로직 적용)
  const getProcessedTags = (safeTags: string[] = []) => {
    const sorted = [...safeTags].sort((a, b) =>
      a === inputText ? -1 : b === inputText ? 1 : 0
    );
    const visibleTags = sorted.slice(0, 3);
    const extraCount = safeTags.length - 3;
    return { visibleTags, extraCount };
  };

  const { visibleTags, extraCount } = getProcessedTags(tags);

  return (
    <Modal
      // 🚀 key를 주어 visible이 바뀔 때 모달 인스턴스를 확실히 초기화합니다.
      key={visible ? 'active-modal' : 'inactive-modal'}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 🚀 전체 화면을 덮는 오버레이 영역 */}
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          
          {/* 헤더 영역 */}
          <View style={styles.header}>
            <Text style={styles.titleText}>예정된 일정</Text>
            <TouchableOpacity 
              onPress={onClose} 
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // 터치 영역 확장
            >
              <X size={24} color={Colors.light.grayLight} />
            </TouchableOpacity>
          </View>

          {/* 아코디언 박스 (높이 106) */}
          <View style={styles.accordionBox}>
            {/* 이미지 원형 영역 */}
            <View style={styles.imageWrapper}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, { backgroundColor: Colors.light.grayLight }]} />
              )}
            </View>

            {/* 정보 영역 */}
            <View style={styles.infoWrapper}>
              <Text style={styles.scheduleName} numberOfLines={1}>
                {title}
              </Text>
              
              {/* 🚀 subtitle1 적용 및 텍스트 렌더링 보장 */}
              <Text style={styles.periodText}>
                {period}
              </Text>
              
              {/* 태그 영역 */}
              <View style={styles.tagContainer}>
                {visibleTags.map((tag, index) => (
                  <Text key={`${tag}-${index}`} style={styles.tagItem}>
                    #{tag}
                  </Text>
                ))}
                {extraCount > 0 && (
                  <Text style={styles.tagItem}>+{extraCount}</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // 뒷배경 불투명도 25%
    justifyContent: 'center',
    alignItems: 'center', // 🚀 알럿을 정확히 화면 정중앙에 배치
    paddingHorizontal: 16,
  },
  alertContainer: {
    width: '100%', // 가로 반응형 (부모의 padding 16 적용됨)
    backgroundColor: Colors.light.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    paddingBottom: 16, // 마지막 요소에서 16pt 여백
    // 그림자 제거 (요청 사항 반영)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16, // 상단/좌측 16pt 간격 확보
  },
  titleText: {
    ...Typography.HeadLine7, 
    color: Colors.light.black,
  },
  accordionBox: {
    height: 106,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    flexDirection: 'row',
    padding: 16,
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
  infoWrapper: {
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
    ...Typography.subtitle1, // 🚀 사용자 확인 완료된 상수 적용
    color: Colors.light.grayDark,
  },
  tagContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tagItem: {
    ...Typography.body2, // 본문2번 폰트
    color: Colors.light.primary, // 메인 컬러
    marginRight: 4,
  },
});