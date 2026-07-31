// components/modals/SortAlert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Check, X } from 'lucide-react-native';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export const SORT_OPTIONS = [
  '관련도 높은 순',
  '이름순',
  '별점 높은 순',
  '하트 많은 순',
  '장소 많은 순',
  '장소 적은 순',
] as const;

export type SortOption = typeof SORT_OPTIONS[number];

interface SortAlertProps<T extends string> {
  visible: boolean;
  title?: string;
  options: readonly T[];
  disabledOptions?: readonly T[];
  selected: T;
  onClose: () => void;
  onSelect: (option: T) => void;
}

export const SortAlert = <T extends string = SortOption>({ visible, title = '정렬 기준', options, disabledOptions, selected, onClose, onSelect }: SortAlertProps<T>) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
              </TouchableOpacity>
            </View>
            <View style={styles.optionList}>
              {options.map((option) => {
                const isSelected = option === selected;
                const isDisabled = disabledOptions?.includes(option) ?? false;
                return (
                  <TouchableOpacity
                    key={option}
                    style={styles.optionRow}
                    activeOpacity={isDisabled ? 1 : 0.7}
                    disabled={isDisabled}
                    onPress={() => { onSelect(option); onClose(); }}
                  >
                    <Text style={isDisabled ? styles.optionTextDisabled : (isSelected ? styles.optionTextSelected : styles.optionTextUnselected)}>
                      {option}{isDisabled ? ' (선택 불가)' : ''}
                    </Text>
                    {isSelected && !isDisabled && (
                      <Check size={IconSize.xsmall} color={Colors.light.primary} strokeWidth={IconStroke.regular} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.medium,
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
  title: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  optionList: {
    marginTop: Spacing.v.medium,
    gap: Spacing.v.medium,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTextSelected: {
    ...Typography.title2,
    color: Colors.light.dark,
    flex: 1,
    flexShrink: 1,
    marginRight: Spacing.h.small,
  },
  optionTextUnselected: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    flex: 1,
    flexShrink: 1,
    marginRight: Spacing.h.small,
  },
  optionTextDisabled: {
    ...Typography.subtitle2,
    color: Colors.light.grayDark,
    flex: 1,
    flexShrink: 1,
    marginRight: Spacing.h.small,
  },
});
