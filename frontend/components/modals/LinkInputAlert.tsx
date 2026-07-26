// components/modals/LinkInputAlert.tsx
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

interface LinkInputAlertProps {
  visible: boolean;
  currentLink: string;
  onConfirm: (newLink: string) => void;
  onClose: () => void;
}

export const LinkInputAlert = ({
  visible,
  currentLink,
  onConfirm,
  onClose,
}: LinkInputAlertProps) => {
  const [link, setLink] = useState(currentLink);

  useEffect(() => {
    if (visible) setLink(currentLink);
  }, [visible, currentLink]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>링크 입력</Text>
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
                  value={link}
                  onChangeText={setLink}
                  placeholder="참고할 링크를 입력해주세요."
                  placeholderTextColor={Colors.light.grayLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  autoFocus
                />
                {link.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setLink('')}
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

              <TouchableOpacity
                style={[styles.confirmButton, !link.trim() && styles.buttonDisabled]}
                disabled={!link.trim()}
                activeOpacity={0.8}
                onPress={() => onConfirm(link.trim())}
              >
                <Text style={[styles.confirmButtonText, !link.trim() && styles.confirmButtonTextDisabled]}>입력하기</Text>
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
  confirmButton: {
    marginTop: Spacing.v.medium,
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
});
