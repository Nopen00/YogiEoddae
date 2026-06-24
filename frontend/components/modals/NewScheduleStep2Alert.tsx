// components/make_component/NewScheduleStep2Alert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { ArrowLeft, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface DateRange {
  year: number;
  month: number;
  startDay: number;
  endDay: number;
}

interface NewScheduleStep2AlertProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onConfirm: (courseType: 'import' | 'create', name: string) => void;
  range: DateRange;
}

const formatDate = (year: number, month: number, day: number) =>
  `${year}.${String(month + 1).padStart(2, '0')}.${String(day).padStart(2, '0')}`;

export const NewScheduleStep2Alert = ({ visible, onClose, onBack, onConfirm, range }: NewScheduleStep2AlertProps) => {
  const [name, setName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<'import' | 'create' | null>(null);
  const isSingleDay = range.startDay === range.endDay;
  const startStr = formatDate(range.year, range.month, range.startDay);
  const endStr = formatDate(range.year, range.month, range.endDay);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.alertContainer}>
              <View style={styles.header}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <ArrowLeft size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
                </TouchableOpacity>
                <Text style={styles.title}>일정 만들기</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
                </TouchableOpacity>
              </View>
              <View style={styles.dateRow}>
                {isSingleDay ? (
                  <Text style={styles.dateText}>{startStr}</Text>
                ) : (
                  <>
                    <Text style={styles.dateText}>{startStr}</Text>
                    <Text style={styles.dateText}>-</Text>
                    <Text style={styles.dateText}>{endStr}</Text>
                  </>
                )}
              </View>
              <Text style={styles.sectionLabel}>일정 명칭</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="일정의 이름을 지어주세요."
                  placeholderTextColor={Colors.light.grayLight}
                />
              </View>
              <Text style={[styles.sectionLabel, { marginTop: Spacing.v.large }]}>코스 만들기</Text>
              <View style={styles.courseButtonRow}>
                <TouchableOpacity
                  style={[styles.courseButton, selectedCourse === 'import' && styles.courseButtonSelected]}
                  onPress={() => setSelectedCourse('import')}
                >
                  <Text style={[styles.courseButtonTitle, selectedCourse === 'import' && styles.courseButtonTitleSelected]}>코스 가져오기</Text>
                  <Text style={[styles.courseButtonSubtitle, selectedCourse === 'import' && styles.courseButtonSubtitleSelected]}>저장소에서 가져오기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.courseButton, selectedCourse === 'create' && styles.courseButtonSelected]}
                  onPress={() => setSelectedCourse('create')}
                >
                  <Text style={[styles.courseButtonTitle, selectedCourse === 'create' && styles.courseButtonTitleSelected]}>직접 만들기</Text>
                  <Text style={[styles.courseButtonSubtitle, selectedCourse === 'create' && styles.courseButtonSubtitleSelected]}>자유롭게 만들어보기</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.nextButton, (!name.trim() || !selectedCourse) && styles.nextButtonDisabled]}
                disabled={!name.trim() || !selectedCourse}
                onPress={() => selectedCourse && onConfirm(selectedCourse, name)}
              >
                <Text style={styles.nextButtonText}>다음 단계</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.medium,
  },
  alertContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingBottom: Spacing.v.medium,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  title: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.h.xsmall,
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  dateText: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
  },
  sectionLabel: {
    ...Typography.title2,
    color: Colors.light.black,
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  inputBox: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
  },
  input: {
    ...Typography.body3,
    color: Colors.light.black,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: 14,
  },
  courseButtonRow: {
    flexDirection: 'row',
    gap: Spacing.h.medium,
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  courseButton: {
    flex: 1,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    alignItems: 'center',
  },
  courseButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  courseButtonTitle: {
    ...Typography.title2,
    color: Colors.light.black,
    textAlign: 'center',
  },
  courseButtonTitleSelected: {
    color: Colors.light.white,
  },
  courseButtonSubtitle: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    marginTop: Spacing.v.small,
    textAlign: 'center',
  },
  courseButtonSubtitleSelected: {
    color: Colors.light.grayLight,
  },
  nextButton: {
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
    height: 48,
    backgroundColor: Colors.light.dark,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: Colors.light.grayLight,
  },
  nextButtonText: {
    ...Typography.button2,
    color: Colors.light.white,
  },
});
