import { ScheduleMoreMenuAlert } from '@/components/modals/ScheduleMoreMenuAlert';
import { PlaceThumb } from '@/components/ui/PlaceThumb';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { photoApi } from '@/services/api';
import type { Photo } from '@/services/types';
import { getProcessedTags } from '@/utils/getProcessedTags';
import { useFocusEffect, useRouter } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PhotoSpotManageScreen = () => {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);

  useFocusEffect(
    useCallback(() => {
      photoApi.getMine().then(res => setPhotos(res.data)).catch(() => {});
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader onBack={() => router.back()} title="포토스팟 관리" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>게시된 포토스팟이 없습니다.</Text>
            <Text style={styles.emptySubtitle}>포토스팟을 작성해보세요</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {photos.map((photo) => {
              const { visibleTags, extraCount } = getProcessedTags(photo.tags);
              return (
              <TouchableOpacity
                key={photo.id}
                style={[styles.sectionCard, openMenuId === photo.id && { zIndex: 100 }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (openMenuId !== null) { setOpenMenuId(null); return; }
                  router.push({ pathname: '/PhotoSpotDetailScreen', params: { id: photo.id } });
                }}
              >
                <View style={styles.sectionImageWrapper}>
                  <PlaceThumb uri={photo.image_url} style={styles.sectionImage} />
                </View>
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionTitle} numberOfLines={1}>{photo.description}</Text>
                  {visibleTags.length > 0 && (
                    <TagRow>
                      {visibleTags.map((tag, idx) => <Text key={idx} style={styles.sectionTag}>#{tag}</Text>)}
                      {extraCount > 0 && <Text style={styles.sectionTag}>+{extraCount}</Text>}
                    </TagRow>
                  )}
                </View>
                <View style={styles.moreIconWrapper}>
                  <TouchableOpacity
                    onPress={() => setOpenMenuId((prev) => (prev === photo.id ? null : photo.id))}
                    activeOpacity={0.7}
                    hitSlop={8}
                  >
                    <MoreVertical size={IconSize.large} color={Colors.light.black} />
                  </TouchableOpacity>
                  {openMenuId === photo.id && (
                    <ScheduleMoreMenuAlert
                      onEditPress={() => {
                        setOpenMenuId(null);
                        router.push({ pathname: '/PhotoSpotWriteScreen', params: { id: photo.id } });
                      }}
                      onDeletePress={() => {
                        setOpenMenuId(null);
                        setDeleteTarget(photo);
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={deleteTarget !== null} transparent animationType="fade">
        <View style={styles.deleteOverlay}>
          <View style={[styles.deletePopup, { width: width - 64 }]}>
            <Text style={styles.deleteTitle}>포토스팟을 삭제하시겠습니까?</Text>
            <Text style={styles.deleteDesc}>삭제된 포토스팟은 되돌릴 수 없습니다.</Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={styles.btnCancel}
                activeOpacity={0.8}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={styles.btnCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirm}
                activeOpacity={0.8}
                onPress={async () => {
                  if (!deleteTarget) return;
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  try {
                    await photoApi.remove(target.id);
                    setPhotos((prev) => prev.filter((p) => p.id !== target.id));
                  } catch {}
                }}
              >
                <Text style={styles.btnConfirmText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: { paddingHorizontal: Spacing.h.medium, paddingBottom: Spacing.v.screenBottom },
  cardList: { marginTop: Spacing.v.medium, gap: Spacing.v.medium },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
  },
  sectionImageWrapper: { width: Size.circleMd, height: Size.circleMd, borderRadius: Size.circleMd / 2, overflow: 'hidden', flexShrink: 0 },
  sectionImage: { width: '100%', height: '100%' },
  sectionContent: { flex: 1, marginLeft: Spacing.h.medium },
  sectionTitle: { ...Typography.title1, color: Colors.light.black },
  sectionTag: { ...Typography.body2, color: Colors.light.dark },
  moreIconWrapper: { alignSelf: 'center', marginLeft: Spacing.h.medium, zIndex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.v.medium, marginTop: Spacing.v.xlarge },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
  emptySubtitle: { ...Typography.body2, color: Colors.light.grayLight },
  deleteOverlay: { flex: 1, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  deletePopup: {
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingBottom: Spacing.v.medium,
  },
  deleteTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  deleteDesc: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.medium, textAlign: 'center' },
  deleteButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnConfirmText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },
});

export default PhotoSpotManageScreen;
