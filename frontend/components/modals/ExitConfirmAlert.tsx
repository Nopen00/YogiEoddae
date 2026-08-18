// components/modals/ExitConfirmAlert.tsx
import { Colors } from '@/constants/Colors';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface ExitConfirmAlertProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// 홈 화면에서 하드웨어 뒤로가기를 누르면 뜨는 종료 확인 팝업.
// Modal의 onRequestClose가 안드로이드 뒤로가기를 자동으로 받아서 처리하므로,
// 팝업이 떠있는 상태에서 뒤로가기를 한 번 더 누르면 종료 대신 팝업만 닫힌다.
export const ExitConfirmAlert = ({ visible, onCancel, onConfirm }: ExitConfirmAlertProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.alertContainer}>
              <Text style={styles.title}>앱을 종료하시겠습니까?</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                  <Text style={styles.confirmButtonText}>종료</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.medium,
  },
  alertContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingVertical: Spacing.v.large,
    paddingHorizontal: Spacing.h.medium,
    ...Shadows.card,
  },
  title: {
    ...Typography.title1,
    color: Colors.light.black,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.h.medium,
    marginTop: Spacing.v.large,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    ...Typography.button2,
    color: Colors.light.white,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...Typography.button2,
    color: Colors.light.grayDark,
  },
});
