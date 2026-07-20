// components/modals/ScheduleEditNameAlert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface ScheduleEditNameAlertProps {
  visible: boolean;
  currentTitle: string;
  onConfirm: (newTitle: string) => void;
  onClose: () => void;
}

export const ScheduleEditNameAlert = ({
  visible,
  currentTitle,
  onConfirm,
  onClose,
}: ScheduleEditNameAlertProps) => {
  const [name, setName] = useState(currentTitle);

  useEffect(() => {
    if (visible) setName(currentTitle);
  }, [visible, currentTitle]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>일정 수정하기</Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X
                    size={IconSize.large}
                    color={Colors.light.grayLight}
                    strokeWidth={IconStroke.regular}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="일정에 어울리는 이름을 지어주세요."
                  placeholderTextColor={Colors.light.grayLight}
                  autoFocus
                />
                {name.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setName('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.clearButton}
                  >
                    <X
                      size={IconSize.medium}
                      color={Colors.light.grayLight}
                      strokeWidth={IconStroke.regular}
                    />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, !name.trim() && styles.buttonDisabled]}
                  disabled={!name.trim()}
                  activeOpacity={0.8}
                  onPress={() => onConfirm(name.trim())}
                >
                  <Text style={[styles.confirmButtonText, !name.trim() && styles.confirmButtonTextDisabled]}>변경</Text>
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
  container: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.medium,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  inputBox: {
    marginTop: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...Typography.body3,
    color: Colors.light.black,
    paddingLeft: Spacing.h.medium,
    paddingRight: Spacing.h.xsmall,
    paddingVertical: 14,
  },
  clearButton: {
    paddingRight: Spacing.h.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.h.medium,
    marginTop: Spacing.v.medium,
  },
  confirmButton: {
    flex: 1,
    height: Size.buttonMd,
    backgroundColor: Colors.light.primary,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.light.grayLight,
  },
  confirmButtonText: {
    ...Typography.button2,
    color: Colors.light.white,
  },
  confirmButtonTextDisabled: {
    color: Colors.light.grayDark,
  },
  cancelButton: {
    flex: 1,
    height: Size.buttonMd,
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
