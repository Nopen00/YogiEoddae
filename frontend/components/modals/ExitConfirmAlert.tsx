// components/modals/ExitConfirmAlert.tsx
import { Colors } from '@/constants/Colors';
import { Shadows } from '@/constants/Shadows';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const { width } = Dimensions.get('window');

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
                <TouchableOpacity style={styles.btnCancel} activeOpacity={0.8} onPress={onCancel}>
                  <Text style={styles.btnCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnConfirm} activeOpacity={0.8} onPress={onConfirm}>
                  <Text style={styles.btnConfirmText}>종료</Text>
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
    alignItems: 'center',
  },
  alertContainer: {
    width: width - 64,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingBottom: Spacing.v.medium,
    ...Shadows.card,
  },
  title: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnConfirmText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },
});
