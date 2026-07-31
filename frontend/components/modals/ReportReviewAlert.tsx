// components/modals/ReportReviewAlert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Shadows } from '@/constants/Shadows';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Check, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const { width } = Dimensions.get('window');

const REPORT_REASONS = ['욕설/비방', '스팸/광고성 내용', '음란물/불건전한 내용', '개인정보 노출', '기타'] as const;
const ETC_REASON = '기타';

interface ReportReviewAlertProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void | Promise<void>;
  selectTitle?: string;
  confirmTitle?: string;
  confirmDesc?: string;
  successText?: string;
}

export const ReportReviewAlert = ({
  visible,
  onClose,
  onSubmit,
  selectTitle = '신고 사유 선택',
  confirmTitle = '이 리뷰를 신고하시겠습니까?',
  confirmDesc = '허위 신고 시 서비스 이용에 제재를 받을 수 있습니다.',
  successText = '신고가 접수되었습니다.',
}: ReportReviewAlertProps) => {
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [etcText, setEtcText] = useState('');

  useEffect(() => {
    if (!visible) {
      setStep('select');
      setSelectedReason(null);
      setEtcText('');
    }
  }, [visible]);

  const isEtc = selectedReason === ETC_REASON;
  const finalReason = isEtc ? etcText.trim() : (selectedReason ?? '');
  const canProceed = selectedReason !== null && (!isEtc || finalReason.length > 0);

  const handleReport = async () => {
    await onSubmit(finalReason);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.successPopupBox}>
            <Text style={styles.successText}>{successText}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            {step === 'select' ? (
              <View style={[styles.container, { width: width - 64 }]}>
                <View style={styles.header}>
                  <Text style={styles.title}>{selectTitle}</Text>
                  <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionList}>
                  {REPORT_REASONS.map((reason) => {
                    const isSelected = reason === selectedReason;
                    return (
                      <View key={reason}>
                        <TouchableOpacity
                          style={styles.optionRow}
                          activeOpacity={0.7}
                          onPress={() => setSelectedReason(reason)}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                            {isSelected && <Check size={14} color={Colors.light.white} strokeWidth={IconStroke.regular} />}
                          </View>
                          <Text style={styles.optionText}>{reason}</Text>
                        </TouchableOpacity>

                        {reason === ETC_REASON && isEtc && (
                          <TextInput
                            style={styles.etcInput}
                            value={etcText}
                            onChangeText={setEtcText}
                            placeholder="구체적인 신고 사유를 입력해주세요. (필수)"
                            placeholderTextColor={Colors.light.grayDark}
                            multiline
                            textAlignVertical="top"
                          />
                        )}
                      </View>
                    );
                  })}
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.btnCancel} activeOpacity={0.8} onPress={onClose}>
                    <Text style={styles.btnCancelText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnConfirm, !canProceed && styles.btnConfirmDisabled]}
                    activeOpacity={0.8}
                    disabled={!canProceed}
                    onPress={() => setStep('confirm')}
                  >
                    <Text style={styles.btnConfirmText}>신고</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.confirmContainer, { width: width - 64 }]}>
                <Text style={styles.confirmTitle}>{confirmTitle}</Text>
                <Text style={styles.confirmDesc}>{confirmDesc}</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.btnCancel} activeOpacity={0.8} onPress={onClose}>
                    <Text style={styles.btnCancelText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnConfirm} activeOpacity={0.8} onPress={handleReport}>
                    <Text style={styles.btnConfirmText}>신고</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  container: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.v.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...Typography.title1, color: Colors.light.black },
  optionList: {
    marginTop: Spacing.v.medium,
    gap: Spacing.v.medium,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.light.primary },
  optionText: { ...Typography.body2, color: Colors.light.black, marginLeft: Spacing.h.small },
  etcInput: {
    marginTop: Spacing.v.small,
    minHeight: 72,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
    ...Typography.body2,
    color: Colors.light.black,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.h.medium,
    marginTop: Spacing.v.large,
  },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnConfirmDisabled: { backgroundColor: Colors.light.grayLight },
  btnConfirmText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },
  confirmContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingBottom: Spacing.v.medium,
  },
  confirmTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  confirmDesc: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.medium, textAlign: 'center' },
  successPopupBox: {
    width: width - 64,
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    alignItems: 'center',
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    ...Shadows.card,
  },
  successText: { ...Typography.subtitle2, color: Colors.light.black },
});
