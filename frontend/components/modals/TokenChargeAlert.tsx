import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { TOKEN_PACKAGES, userApi } from '@/services/api';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator, Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';

interface TokenChargeAlertProps {
  visible: boolean;
  onClose: () => void;
  onCharged: (newBalance: number) => void;
}

type Step =
  | { kind: 'select' }
  | { kind: 'charging'; packageId: string }
  | { kind: 'result'; success: true; tokens: number; balance: number }
  | { kind: 'result'; success: false };

export const TokenChargeAlert = ({ visible, onClose, onCharged }: TokenChargeAlertProps) => {
  const [step, setStep] = useState<Step>({ kind: 'select' });

  const handleClose = () => {
    setStep({ kind: 'select' });
    onClose();
  };

  const handlePick = async (packageId: string, tokens: number) => {
    setStep({ kind: 'charging', packageId });
    try {
      const res = await userApi.chargeToken(packageId);
      setStep({ kind: 'result', success: true, tokens, balance: res.data.token_balance });
      onCharged(res.data.token_balance);
    } catch {
      setStep({ kind: 'result', success: false });
    }
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
              <Text style={styles.title}>토큰 충전하기</Text>
              <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
              </TouchableOpacity>
            </View>

            {step.kind === 'result' ? (
              <View style={styles.resultBody}>
                <Text style={styles.resultTitle}>
                  {step.success ? `${step.tokens}토큰이 충전되었습니다.` : '충전에 실패했습니다.'}
                </Text>
                {step.success && (
                  <Text style={styles.resultDesc}>현재 보유 토큰: {step.balance}</Text>
                )}
                <TouchableOpacity style={styles.confirmButton} onPress={handleClose}>
                  <Text style={styles.confirmButtonText}>확인</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.packageList}>
                  {TOKEN_PACKAGES.map(pkg => (
                    <TouchableOpacity
                      key={pkg.id}
                      style={styles.packageRow}
                      activeOpacity={0.7}
                      disabled={step.kind === 'charging'}
                      onPress={() => handlePick(pkg.id, pkg.tokens)}
                    >
                      <Text style={styles.packageTokens}>{pkg.tokens.toLocaleString()} 토큰</Text>
                      {step.kind === 'charging' && step.packageId === pkg.id ? (
                        <ActivityIndicator size="small" color={Colors.light.grayDark} />
                      ) : (
                        <Text style={styles.packagePrice}>{pkg.price.toLocaleString()}원</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.warningRow}>
                  <Image
                    source={require('@/assets/icon-exports/by-size/16px_xsmall/16px_xsmall_alert-circle.png')}
                    style={styles.warningIcon}
                  />
                  <Text style={styles.warningText}>
                    본 결제는 데모 기능입니다. 실제 금액이 청구되거나 환불이 발생하지 않으며, 토큰은 테스트 목적으로만 지급됩니다.
                  </Text>
                </View>
              </>
            )}
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
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
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
  title: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  packageList: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    gap: Spacing.v.small,
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: Size.buttonMd,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingHorizontal: Spacing.h.medium,
  },
  packageTokens: {
    ...Typography.title2,
    color: Colors.light.black,
  },
  packagePrice: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    gap: Spacing.h.xsmall,
  },
  warningIcon: {
    width: IconSize.xsmall,
    height: IconSize.xsmall,
    marginTop: 2,
  },
  warningText: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    flex: 1,
  },
  resultBody: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    alignItems: 'center',
  },
  resultTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    textAlign: 'center',
  },
  resultDesc: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    marginTop: Spacing.v.medium,
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: Spacing.v.large,
    alignSelf: 'stretch',
    height: Size.buttonMd,
    backgroundColor: Colors.light.dark,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    ...Typography.button2,
    color: Colors.light.white,
  },
});
