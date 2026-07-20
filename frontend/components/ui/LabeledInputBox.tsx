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
  errorMessage?: string;
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
}: LabeledInputBoxProps) {
  return (
    <>
      <View style={[styles.box, errorMessage && styles.boxError]}>
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, errorMessage && styles.inputLabelError]}>{label}</Text>
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
          {errorMessage && (
            <AlertCircle size={IconSize.large} color={Colors.light.error} style={styles.errorIcon} />
          )}
        </View>
      </View>
      {errorMessage && (
        <View style={styles.errorRow}>
          <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
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
  inputSection: { flex: 1 },
  inputLabel: { ...Typography.body1, color: Colors.light.grayLight, marginBottom: Spacing.v.small },
  inputLabelError: { color: Colors.light.error },
  input: { padding: 0, ...Typography.body3 },
  boxRightIcons: { flexDirection: 'row', alignItems: 'center' },
  errorIcon: { marginLeft: Spacing.h.small },
  errorRow: {
    marginTop: Spacing.v.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: { ...Typography.body2, color: Colors.light.error, marginLeft: Spacing.h.small },
});
