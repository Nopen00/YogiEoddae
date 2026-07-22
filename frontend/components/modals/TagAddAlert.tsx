// components/modals/TagAddAlert.tsx
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

interface TagAddAlertProps {
  visible: boolean;
  initialTags?: string[];
  onConfirm: (tags: string[]) => void;
  onClose: () => void;
}

export const TagAddAlert = ({ visible, initialTags = [], onConfirm, onClose }: TagAddAlertProps) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (visible) {
      setTags(initialTags);
      setInputText('');
    }
  }, [visible, initialTags]);

  const handleChangeText = (text: string) => {
    if (text.endsWith(' ')) {
      const word = text.trim();
      if (word && !tags.includes(word)) setTags((prev) => [...prev, word]);
      setInputText('');
    } else {
      setInputText(text);
    }
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const getFinalTags = () => {
    const word = inputText.trim();
    if (word && !tags.includes(word)) return [...tags, word];
    return tags;
  };

  const canConfirm = tags.length > 0 || inputText.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>태그 추가하기</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                </TouchableOpacity>
              </View>

              {tags.length > 0 && (
                <View style={styles.tagRow}>
                  {tags.map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>#{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <X size={20} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={handleChangeText}
                  placeholder="포토스팟에 추가할 태그를 작성해주세요."
                  placeholderTextColor={Colors.light.grayLight}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.confirmButton, !canConfirm && styles.buttonDisabled]}
                disabled={!canConfirm}
                activeOpacity={0.8}
                onPress={() => onConfirm(getFinalTags())}
              >
                <Text style={[styles.confirmButtonText, !canConfirm && styles.confirmButtonTextDisabled]}>추가하기</Text>
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
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.h.xsmall,
    marginTop: Spacing.v.medium,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.h.small,
    paddingHorizontal: Spacing.h.small,
    paddingVertical: Spacing.v.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: 999,
    backgroundColor: Colors.light.white,
  },
  tagChipText: { ...Typography.body2, color: Colors.light.primary },
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
  confirmButton: {
    height: Size.buttonMd,
    backgroundColor: Colors.light.primary,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.v.medium,
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
