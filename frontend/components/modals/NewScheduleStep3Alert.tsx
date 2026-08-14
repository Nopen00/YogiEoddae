// components/modals/NewScheduleStep3Alert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { ArrowLeft, X } from 'lucide-react-native';
import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import type { Media } from '../../services/types';

interface NewScheduleStep3AlertProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onConfirm: () => void;
  media: Media;
}

const MEDIA_TYPE_LABEL: Record<string, string> = {
  drama: '드라마', movie: '영화', youtube: '유튜브', etc: '기타',
};

export const NewScheduleStep3Alert = ({ visible, onClose, onBack, onConfirm, media }: NewScheduleStep3AlertProps) => {
  const typeLabel = MEDIA_TYPE_LABEL[media.media_type] ?? media.media_type;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.alertContainer}>
              <View style={styles.header}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <ArrowLeft size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                </TouchableOpacity>
                <Text style={styles.title}>일정 만들기</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                </TouchableOpacity>
              </View>
              <View style={styles.card}>
                <View style={styles.imageWrapper}>
                  {media.thumbnail_url ? (
                    <Image source={{ uri: media.thumbnail_url }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, { backgroundColor: Colors.light.grayLight }]} />
                  )}
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{media.title}</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoText}>{media.place_count ?? 0}개 장소</Text>
                    <Text style={styles.infoSep}>|</Text>
                    <Text style={styles.infoText}>{typeLabel}</Text>
                  </View>
                  {media.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {media.tags.map(tag => (
                        <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.questionText}>이 코스를 선택하시겠습니까?</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                  <Text style={styles.confirmButtonText}>만들기</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.medium,
  },
  alertContainer: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    paddingBottom: Spacing.v.medium,
    ...Shadows.card,
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
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
    backgroundColor: Colors.light.white,
  },
  imageWrapper: {
    width: Size.circleMd,
    height: Size.circleMd,
    borderRadius: Size.circleMd / 2,
    overflow: 'hidden',
    flexShrink: 0,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.h.medium,
  },
  cardTitle: {
    ...Typography.title1,
    color: Colors.light.black,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    gap: Spacing.h.xsmall,
  },
  infoText: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
  },
  infoSep: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.h.xsmall,
    marginTop: Spacing.v.small,
  },
  tagText: {
    ...Typography.body2,
    color: Colors.light.dark,
  },
  questionText: {
    ...Typography.subtitle1,
    color: Colors.light.grayDark,
    textAlign: 'center',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.h.medium,
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: Spacing.r.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    ...Typography.button2,
    color: Colors.light.white,
  },
  cancelButton: {
    flex: 1,
    height: 48,
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
