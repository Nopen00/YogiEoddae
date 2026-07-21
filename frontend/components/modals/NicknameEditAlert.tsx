// components/modals/NicknameEditAlert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { AlertCircle, X } from 'lucide-react-native';
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

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]*$/;

type NicknameError = 'invalidChar' | 'invalidLength' | null;

const getNicknameError = (nickname: string): NicknameError => {
  if (!NICKNAME_REGEX.test(nickname)) return 'invalidChar';
  if (nickname.length < 2 || nickname.length > 10) return 'invalidLength';
  return null;
};

const ERROR_MESSAGE: Record<Exclude<NicknameError, null>, string> = {
  invalidChar: '한글, 영문, 숫자만 입력가능합니다.',
  invalidLength: '2~10자로 입력해주세요.',
};

interface NicknameEditAlertProps {
  visible: boolean;
  onConfirm: (newNickname: string) => void;
  onClose: () => void;
}

export const NicknameEditAlert = ({
  visible,
  onConfirm,
  onClose,
}: NicknameEditAlertProps) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<NicknameError>(null);

  useEffect(() => {
    if (visible) {
      setNickname('');
      setError(null);
    }
  }, [visible]);

  const handleChangeNickname = (text: string) => {
    setNickname(text);
    if (error) setError(null);
  };

  const handleBlurNickname = () => {
    if (!nickname.trim()) return;
    setError(getNicknameError(nickname));
  };

  const handleConfirm = () => {
    const nextError = getNicknameError(nickname);
    if (nextError) {
      setError(nextError);
      return;
    }
    onConfirm(nickname);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>닉네임 변경</Text>
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

              <View style={[styles.inputBox, error && styles.inputBoxError]}>
                <View style={styles.inputSection}>
                  <Text style={[styles.inputLabel, error && styles.inputLabelError]}>닉네임</Text>
                  <TextInput
                    style={styles.input}
                    value={nickname}
                    onChangeText={handleChangeNickname}
                    onBlur={handleBlurNickname}
                    placeholder="한글, 영문, 숫자 (2~10자)"
                    placeholderTextColor={Colors.light.grayLight}
                    autoFocus
                  />
                </View>
                <View style={styles.boxRightIcons}>
                  {nickname.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setNickname('')}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X
                        size={IconSize.medium}
                        color={Colors.light.grayLight}
                        strokeWidth={IconStroke.regular}
                      />
                    </TouchableOpacity>
                  )}
                  {error && (
                    <AlertCircle
                      size={IconSize.large}
                      color={Colors.light.error}
                      style={styles.errorIcon}
                    />
                  )}
                </View>
              </View>

              {error && (
                <View style={styles.errorRow}>
                  <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
                  <Text style={styles.errorText}>{ERROR_MESSAGE[error]}</Text>
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, !nickname.trim() && styles.buttonDisabled]}
                  disabled={!nickname.trim()}
                  activeOpacity={0.8}
                  onPress={handleConfirm}
                >
                  <Text style={[styles.confirmButtonText, !nickname.trim() && styles.confirmButtonTextDisabled]}>변경</Text>
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
    alignItems: 'flex-end',
  },
  inputBoxError: { borderColor: Colors.light.error },
  inputSection: {
    flex: 1,
    paddingLeft: Spacing.h.medium,
    paddingVertical: Spacing.v.small,
  },
  inputLabel: { ...Typography.body1, color: Colors.light.grayLight, marginBottom: Spacing.v.small },
  inputLabelError: { color: Colors.light.error },
  input: {
    ...Typography.body3,
    color: Colors.light.black,
    padding: 0,
    paddingRight: Spacing.h.xsmall,
  },
  boxRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.h.medium,
    paddingBottom: Spacing.v.small,
  },
  errorIcon: { marginLeft: Spacing.h.small },
  errorRow: {
    marginTop: Spacing.v.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: { ...Typography.body2, color: Colors.light.error, marginLeft: Spacing.h.small },
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
