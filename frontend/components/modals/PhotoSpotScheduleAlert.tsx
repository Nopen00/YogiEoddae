import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { X } from 'lucide-react-native';
import React from 'react';
import { Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

// TODO: 목데이터. 실제 데이터 연동 시 포토스팟이 속한 장소(place) prop으로 교체
const MOCK_PLACE = {
  name: '장소 이름',
  category: '관광지',
  address: '서울 종로구',
  tags: ['로맨스', '드라마'],
};

interface PhotoSpotScheduleAlertProps {
  visible: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

export const PhotoSpotScheduleAlert = ({ visible, onClose, onConfirm }: PhotoSpotScheduleAlertProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.alertContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>일정 추가하기</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <View style={styles.imageWrapper}>
                  <View style={[styles.cardImage, { backgroundColor: Colors.light.grayLight }]} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{MOCK_PLACE.name}</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoText}>{MOCK_PLACE.category}</Text>
                    <Text style={styles.infoSep}>|</Text>
                    <Text style={styles.infoText} numberOfLines={1}>{MOCK_PLACE.address}</Text>
                  </View>
                  {MOCK_PLACE.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {MOCK_PLACE.tags.map(tag => (
                        <Text key={tag} style={styles.tagText}>#{tag}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.questionText}>이 장소를 추가하시겠습니까?</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                  <Text style={styles.confirmButtonText}>다음 단계</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.medium,
  },
  alertContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingBottom: Spacing.v.medium,
    maxHeight: '82%',
    ...Platform.select({
      ios: { shadowColor: Colors.light.black, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  headerTitle: { ...Typography.title1, color: Colors.light.black },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
    backgroundColor: Colors.light.white,
  },
  imageWrapper: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', flexShrink: 0 },
  cardImage: { width: '100%', height: '100%' },
  cardContent: { flex: 1, marginLeft: Spacing.h.medium },
  cardTitle: { ...Typography.title1, color: Colors.light.black },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small, gap: Spacing.h.xsmall },
  infoText: { ...Typography.subtitle1, color: Colors.light.grayDark, flexShrink: 1 },
  infoSep: { ...Typography.subtitle1, color: Colors.light.grayDark },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.h.xsmall, marginTop: Spacing.v.small },
  tagText: { ...Typography.body2, color: Colors.light.primary },
  questionText: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    textAlign: 'center',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.h.medium,
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.dark,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: { ...Typography.button2, color: Colors.light.white },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { ...Typography.button2, color: Colors.light.grayDark },
});
