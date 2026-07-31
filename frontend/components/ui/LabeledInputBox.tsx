import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { AlertCircle, Eye, EyeOff } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface LabeledInputBoxProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  secure?: boolean;
  visible?: boolean;
  onToggleVisible?: () => void;
  errorMessage?: string | string[];
  noTopMargin?: boolean;
  hasError?: boolean;
}

export function LabeledInputBox({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  secure,
  visible,
  onToggleVisible,
  errorMessage,
  noTopMargin,
  hasError: hasErrorProp,
}: LabeledInputBoxProps) {
  const errorMessages = (Array.isArray(errorMessage) ? errorMessage : errorMessage ? [errorMessage] : []).filter(Boolean);
  const hasError = hasErrorProp || errorMessages.length > 0;

  return (
    <>
      <View style={[styles.box, noTopMargin && styles.boxNoTopMargin, hasError && styles.boxError]}>
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, hasError && styles.inputLabelError]}>{label}</Text>
          <TextInput
            style={[styles.input, { color: value ? Colors.light.black : Colors.light.grayLight }]}
            placeholder={placeholder}
            placeholderTextColor={Colors.light.grayLight}
            value={value}
            onChangeText={onChangeText}
            onBlur={onBlur}
            secureTextEntry={secure ? !visible : false}
          />
        </View>
        <View style={styles.boxRightIcons}>
          {onToggleVisible && (
            <TouchableOpacity activeOpacity={0.7} onPress={onToggleVisible}>
              {visible ? (
                <EyeOff size={IconSize.large} color={Colors.light.grayLight} />
              ) : (
                <Eye size={IconSize.large} color={Colors.light.grayLight} />
              )}
            </TouchableOpacity>
          )}
          {hasError && (
            <AlertCircle size={IconSize.large} color={Colors.light.error} style={styles.errorIcon} />
          )}
        </View>
      </View>
      {errorMessages.map((message, i) => (
        <View key={i} style={[styles.errorRow, i > 0 && styles.errorRowSpaced]}>
          <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
          <Text style={styles.errorText}>{message}</Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: Spacing.v.large,
    minHeight: Size.buttonSm,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  boxError: { borderColor: Colors.light.error },
  boxNoTopMargin: { marginTop: 0 },
  inputSection: { flex: 1 },
  inputLabel: { ...Typography.body1, color: Colors.light.grayDark, marginBottom: Spacing.v.small },
  inputLabelError: { color: Colors.light.error },
  input: { padding: 0, ...Typography.body3 },
  boxRightIcons: { flexDirection: 'row', alignItems: 'center' },
  errorIcon: { marginLeft: Spacing.h.small },
  errorRow: {
    marginTop: Spacing.v.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorRowSpaced: {
    marginTop: Spacing.v.small,
  },
  errorText: { ...Typography.body2, color: Colors.light.error, marginLeft: Spacing.h.small },
});
