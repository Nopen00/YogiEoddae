import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface AddPlaceAlertProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (type: 'import' | 'search') => void;
}

export const AddPlaceAlert = ({ visible, onClose, onConfirm }: AddPlaceAlertProps) => {
  const [selected, setSelected] = useState<'import' | 'search' | null>(null);

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.alertContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>장소 추가하기</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.optionButton, selected === 'import' && styles.optionButtonSelected]}
                onPress={() => setSelected(prev => prev === 'import' ? null : 'import')}
              >
                <Text style={[styles.optionTitle, selected === 'import' && styles.optionTitleSelected]}>장소 가져오기</Text>
                <Text style={[styles.optionSubtitle, selected === 'import' && styles.optionSubtitleSelected]}>저장소에서 가져오기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, selected === 'search' && styles.optionButtonSelected]}
                onPress={() => setSelected(prev => prev === 'search' ? null : 'search')}
              >
                <Text style={[styles.optionTitle, selected === 'search' && styles.optionTitleSelected]}>검색하기</Text>
                <Text style={[styles.optionSubtitle, selected === 'search' && styles.optionSubtitleSelected]}>검색으로 가져오기</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.confirmButton, !selected && styles.confirmButtonDisabled]}
              disabled={!selected}
              onPress={() => { if (selected) { onConfirm(selected); handleClose(); } }}
            >
              <Text style={[styles.confirmButtonText, !selected && styles.confirmButtonTextDisabled]}>추가하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
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
    ...Shadows.card,
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
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.h.medium,
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  optionButton: {
    flex: 1,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  optionTitle: {
    ...Typography.title2,
    color: Colors.light.black,
    textAlign: 'center',
  },
  optionTitleSelected: {
    color: Colors.light.white,
  },
  optionSubtitle: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    marginTop: Spacing.v.small,
    textAlign: 'center',
  },
  optionSubtitleSelected: {
    color: Colors.light.grayLight,
  },
  confirmButton: {
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
    height: Size.buttonMd,
    backgroundColor: Colors.light.primary,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.light.grayLight,
  },
  confirmButtonText: {
    ...Typography.button2,
    color: Colors.light.white,
  },
  confirmButtonTextDisabled: {
    color: Colors.light.grayDark,
  },
});
