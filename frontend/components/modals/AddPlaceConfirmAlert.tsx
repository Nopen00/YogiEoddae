// components/modals/AddPlaceConfirmAlert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CATEGORY_LABEL, shortAddress } from '@/constants/labels';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { ArrowLeft, X } from 'lucide-react-native';
import React from 'react';
import { Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import type { Place } from '../../services/types';

interface AddPlaceConfirmAlertProps {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onConfirm: () => void;
  place: Place;
}

export const AddPlaceConfirmAlert = ({ visible, onClose, onBack, onConfirm, place }: AddPlaceConfirmAlertProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.alertContainer}>
              <View style={styles.header}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <ArrowLeft size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
                </TouchableOpacity>
                <Text style={styles.title}>장소 추가하기</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
                </TouchableOpacity>
              </View>
              <View style={styles.card}>
                <View style={styles.imageWrapper}>
                  {place.image_url ? (
                    <Image source={{ uri: place.image_url }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, { backgroundColor: Colors.light.grayLight }]} />
                  )}
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{place.name}</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoText}>{CATEGORY_LABEL[place.category] ?? place.category}</Text>
                    <Text style={styles.infoSep}>|</Text>
                    <Text style={styles.infoText} numberOfLines={1}>{shortAddress(place.address)}</Text>
                  </View>
                  {place.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {place.tags.map(tag => (
                        <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.questionText}>이 장소를 추가하시겠습니까?</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                  <Text style={styles.confirmButtonText}>추가하기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onBack}>
                  <Text style={styles.cancelButtonText}>취소</Text>
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    flexShrink: 1,
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
    color: Colors.light.primary,
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
    backgroundColor: Colors.light.dark,
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
