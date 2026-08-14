import { PlaceSelectAlert } from '@/components/modals/PlaceSelectAlert';
import { TagAddAlert } from '@/components/modals/TagAddAlert';
import { VisitDate, VisitDateAlert } from '@/components/modals/VisitDateAlert';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Shadows } from '@/constants/Shadows';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { photoApi } from '@/services/api';
import type { Place } from '@/services/types';
import { Calendar, ChevronRight, Edit2, Map, Plus, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';

const { width } = Dimensions.get('window');
const imageWidth = width - Spacing.h.medium * 2;
const imageHeight = (imageWidth * 3) / 4;

const MAX_EXTRA_IMAGES = 10;
const DESC_PLACEHOLDER = '- 메인 이미지, 제목, 태그, 장소, 설명을 모두 작성해야 완료할 수 있어요.\n- 포토스팟에 대한 설명을 남겨주세요. (10자 이상)\n- 사진을 최대 10장 첨부 할 수 있어요. (선택)';

const formatVisitDateValue = (date: VisitDate) =>
  `${date.year}.${String(date.month + 1).padStart(2, '0')}.${String(date.day).padStart(2, '0')}`;

const formatVisitDate = (date: VisitDate) => `${formatVisitDateValue(date)} 방문`;

const visitDateKey = (date: VisitDate | null) => (date ? formatVisitDateValue(date) : '');

const parseVisitDate = (value: string): VisitDate | null => {
  if (!value) return null;
  if (value.includes('.')) {
    const [year, month, day] = value.split('.').map(Number);
    if (!year || !month || !day) return null;
    return { year, month: month - 1, day };
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
};

const PhotoSpotWriteScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isTagPopupVisible, setIsTagPopupVisible] = useState(false);
  const [visitDate, setVisitDate] = useState<VisitDate | null>(null);
  const [isDateVisible, setIsDateVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isPlacePopupVisible, setIsPlacePopupVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [isUnsavedWarningVisible, setIsUnsavedWarningVisible] = useState(false);
  const [isSubmitSuccessVisible, setIsSubmitSuccessVisible] = useState(false);
  const [isSubmitFailVisible, setIsSubmitFailVisible] = useState(false);
  const [isEditConfirmVisible, setIsEditConfirmVisible] = useState(false);
  const [isImageBlockedVisible, setIsImageBlockedVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialSnapshotRef = useRef({ title: '', tags: [] as string[], description: '', visitDateKey: '', placeId: null as number | null });

  useEffect(() => {
    if (!id) return;
    photoApi.getDetail(Number(id)).then((res) => {
      const { photo, place } = res.data;
      setMainImage(photo.image_url);
      setTitle(photo.description);
      setTags(photo.tags.map((t) => t.name));
      setDescription(photo.content ?? '');
      const parsedDate = parseVisitDate(photo.travel_date);
      setVisitDate(parsedDate);
      setSelectedPlace(place);
      initialSnapshotRef.current = {
        title: photo.description,
        tags: photo.tags.map((t) => t.name),
        description: photo.content ?? '',
        visitDateKey: visitDateKey(parsedDate),
        placeId: place.id,
      };
    }).catch(() => {});
  }, [id]);

  const isSubmitEnabled =
    mainImage !== null &&
    title.trim().length > 0 &&
    tags.length > 0 &&
    description.trim().length >= 10 &&
    selectedPlace !== null;

  const missingFieldLabels: string[] = [];
  if (mainImage === null) missingFieldLabels.push('메인 이미지');
  if (title.trim().length === 0) missingFieldLabels.push('제목');
  if (tags.length === 0) missingFieldLabels.push('태그');
  if (description.trim().length < 10) missingFieldLabels.push('설명(10자 이상)');
  if (selectedPlace === null) missingFieldLabels.push('장소');

  const hasUnsavedChanges = () => {
    const snap = initialSnapshotRef.current;
    if (title !== snap.title) return true;
    if (tags.length !== snap.tags.length || tags.some((t, i) => t !== snap.tags[i])) return true;
    if (description !== snap.description) return true;
    if (visitDateKey(visitDate) !== snap.visitDateKey) return true;
    if ((selectedPlace?.id ?? null) !== snap.placeId) return true;
    if (!isEditMode && (mainImage !== null || extraImages.length > 0)) return true;
    return false;
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) setIsUnsavedWarningVisible(true);
    else router.back();
  };

  const ensureMediaLibraryPermission = async () => {
    const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (status === 'granted') return true;
    if (!canAskAgain) {
      Alert.alert('사진 접근 권한이 필요합니다', '설정에서 사진 접근 권한을 허용해주세요.');
      return false;
    }
    const { status: requested } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (requested !== 'granted') {
      Alert.alert('사진 접근 권한이 필요합니다', '사진을 선택하려면 접근 권한을 허용해주세요.');
      return false;
    }
    return true;
  };

  const handlePickMainImage = async () => {
    if (isEditMode) {
      setIsImageBlockedVisible(true);
      return;
    }
    try {
      if (!(await ensureMediaLibraryPermission())) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled) {
        setMainImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('이미지를 불러오지 못했습니다', '잠시 후 다시 시도해주세요.');
    }
  };

  const handlePickExtraImages = async () => {
    if (isEditMode) {
      setIsImageBlockedVisible(true);
      return;
    }
    const remaining = MAX_EXTRA_IMAGES - extraImages.length;
    if (remaining <= 0) return;
    try {
      if (!(await ensureMediaLibraryPermission())) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });
      if (!result.canceled) {
        setExtraImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, MAX_EXTRA_IMAGES));
      }
    } catch {
      Alert.alert('이미지를 불러오지 못했습니다', '잠시 후 다시 시도해주세요.');
    }
  };

  const removeExtraImage = (uri: string) => {
    setExtraImages((prev) => prev.filter((u) => u !== uri));
  };

  const handleCreate = async () => {
    if (!isSubmitEnabled || !mainImage || !selectedPlace) return;
    setIsSubmitting(true);
    try {
      const [mainRes, subResList] = await Promise.all([
        photoApi.uploadImage(mainImage),
        Promise.all(extraImages.map((uri) => photoApi.uploadImage(uri))),
      ]);
      await photoApi.upload({
        place_id: selectedPlace.id,
        image_url: mainRes.data.image_url,
        sub_image_urls: subResList.map((res) => res.data.image_url),
        description: title,
        content: description,
        tags,
        travel_date: visitDate ? formatVisitDateValue(visitDate) : undefined,
      });
      setIsSubmitSuccessVisible(true);
    } catch {
      setIsSubmitFailVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPress = () => {
    if (!isSubmitEnabled || isSubmitting) return;
    if (isEditMode) setIsEditConfirmVisible(true);
    else handleCreate();
  };

  const handleConfirmEdit = async () => {
    setIsEditConfirmVisible(false);
    if (!id) return;
    try {
      await photoApi.update(Number(id), {
        description: title,
        content: description,
        tags,
        travel_date: visitDate ? formatVisitDateValue(visitDate) : undefined,
      });
      setIsSubmitSuccessVisible(true);
    } catch {
      setIsSubmitFailVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={handleBack} title={isEditMode ? '포토스팟 수정' : '포토스팟 작성'} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={[styles.imageBox, { width: imageWidth, height: imageHeight }]}
          onPress={handlePickMainImage}
          activeOpacity={0.8}
        >
          {mainImage ? (
            <Image source={{ uri: mainImage }} style={styles.mainImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Plus size={IconSize.xlarge} color={Colors.light.grayDark} strokeWidth={IconStroke.thin} />
              <Text style={styles.imagePlaceholderText}>메인 이미지를 추가해주세요.</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.titleInputRow}>
          <Edit2 size={IconSize.large} color={title ? Colors.light.black : Colors.light.grayLight} strokeWidth={IconStroke.regular} />
          <TextInput
            style={[styles.titleInput, { color: title ? Colors.light.black : Colors.light.grayLight }]}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 작성해주세요."
            placeholderTextColor={Colors.light.grayLight}
          />
        </View>

        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>#{tag}</Text>
              <TouchableOpacity
                onPress={() => setTags((prev) => prev.filter((t) => t !== tag))}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.tagAddButton} activeOpacity={0.7} onPress={() => setIsTagPopupVisible(true)}>
            {tags.length === 0 ? (
              <Text style={styles.tagAddButtonText}>#태그 추가</Text>
            ) : (
              <Plus size={IconSize.xsmall} color={Colors.light.primary} strokeWidth={IconStroke.regular} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBoxWrapper}>
          <Shadow distance={4} startColor="rgba(0, 0, 0, 0.15)" offset={[0, 0]} stretch>
            <View style={styles.infoBox}>
              <TouchableOpacity style={styles.infoRow} onPress={() => setIsPlacePopupVisible(true)} activeOpacity={0.7}>
                <Map size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                <Text style={styles.dateText}>
                  {selectedPlace ? selectedPlace.name : '방문한 장소를 선택해주세요. (필수)'}
                </Text>
                <ChevronRight size={16} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.infoRowSpaced} onPress={() => setIsDateVisible(true)} activeOpacity={0.7}>
                <Calendar size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                <Text style={styles.dateText}>
                  {visitDate ? formatVisitDate(visitDate) : '방문한 날짜를 선택해주세요. (필수)'}
                </Text>
                <ChevronRight size={16} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
              </TouchableOpacity>

              <TextInput
                style={styles.descInput}
                value={description}
                onChangeText={setDescription}
                placeholder={DESC_PLACEHOLDER}
                placeholderTextColor={Colors.light.grayDark}
                multiline
                textAlignVertical="top"
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                {extraImages.length < MAX_EXTRA_IMAGES && (
                  <TouchableOpacity style={styles.imageAddButton} onPress={handlePickExtraImages} activeOpacity={0.7}>
                    <Plus size={32} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                  </TouchableOpacity>
                )}
                {extraImages.map((uri, index) => (
                  <View
                    key={uri}
                    style={[styles.imageThumbWrapper, index === 0 && { marginLeft: Spacing.h.small }]}
                  >
                    <Image source={{ uri }} style={styles.imageThumb} />
                    <TouchableOpacity
                      style={styles.imageRemoveButton}
                      onPress={() => removeExtraImage(uri)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={24} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Shadow>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!isSubmitEnabled || isSubmitting) && styles.submitButtonDisabled]}
          activeOpacity={isSubmitEnabled && !isSubmitting ? 0.8 : 1}
          onPress={handleSubmitPress}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.light.grayDark} />
          ) : (
            <Text style={[styles.submitButtonText, !isSubmitEnabled && styles.submitButtonTextDisabled]}>{isEditMode ? '수정 완료' : '작성 완료'}</Text>
          )}
        </TouchableOpacity>

        {!isSubmitEnabled && missingFieldLabels.length > 0 && (
          <Text style={styles.missingFieldsText}>{missingFieldLabels.join(', ')} 입력이 필요해요.</Text>
        )}
      </ScrollView>

      <TagAddAlert
        visible={isTagPopupVisible}
        initialTags={tags}
        onClose={() => setIsTagPopupVisible(false)}
        onConfirm={(newTags) => {
          setTags(newTags);
          setIsTagPopupVisible(false);
        }}
      />

      <VisitDateAlert
        visible={isDateVisible}
        onClose={() => setIsDateVisible(false)}
        onConfirm={(date) => { setVisitDate(date); setIsDateVisible(false); }}
        initialDate={visitDate}
      />

      <PlaceSelectAlert
        visible={isPlacePopupVisible}
        onClose={() => setIsPlacePopupVisible(false)}
        onConfirm={(place) => {
          setSelectedPlace(place);
          setIsPlacePopupVisible(false);
        }}
      />

      <Modal visible={isUnsavedWarningVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.unsavedPopup}>
            <Text style={styles.unsavedTitle}>포토스팟이 아직 완료되지 않았습니다.</Text>
            <Text style={styles.unsavedDesc}>완료되지 않은 작성사항은 반영되지 않습니다.</Text>
            <View style={styles.unsavedButtons}>
              <TouchableOpacity
                style={styles.btnStay}
                activeOpacity={0.8}
                onPress={() => setIsUnsavedWarningVisible(false)}
              >
                <Text style={styles.btnStayText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDiscard}
                activeOpacity={0.8}
                onPress={() => {
                  setIsUnsavedWarningVisible(false);
                  router.back();
                }}
              >
                <Text style={styles.btnDiscardText}>무시</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isSubmitSuccessVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.submitResultOverlay}
          activeOpacity={1}
          onPress={() => { setIsSubmitSuccessVisible(false); router.back(); }}
        >
          <View style={styles.submitResultPopupBox}>
            <Text style={styles.submitResultTitle}>포토스팟이 작성되었습니다.</Text>
            <Text style={styles.submitResultDesc}>게시까지 최대 7일이 소요됩니다.</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isSubmitFailVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.submitResultOverlay}
          activeOpacity={1}
          onPress={() => setIsSubmitFailVisible(false)}
        >
          <View style={styles.submitResultPopupBox}>
            <Text style={styles.submitResultTitle}>포토스팟 작성을 실패했습니다.</Text>
            <Text style={styles.submitResultDesc}>잠시 후 다시 시도해주세요.</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isImageBlockedVisible} transparent animationType="none">
        <TouchableOpacity
          style={styles.submitResultOverlay}
          activeOpacity={1}
          onPress={() => setIsImageBlockedVisible(false)}
        >
          <View style={styles.submitResultPopupBox}>
            <Text style={styles.submitResultTitle}>사진 추가를 실패했습니다.</Text>
            <Text style={styles.submitResultDesc}>수정할 때는 사진 추가가 불가능합니다.</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isEditConfirmVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.unsavedPopup}>
            <Text style={styles.unsavedTitle}>포토스팟을 수정하시겠습니까?</Text>
            <Text style={styles.unsavedDesc}>수정결과에 따라 재심사를 받을 수 있습니다.</Text>
            <View style={styles.unsavedButtons}>
              <TouchableOpacity
                style={styles.btnStay}
                activeOpacity={0.8}
                onPress={() => setIsEditConfirmVisible(false)}
              >
                <Text style={styles.btnStayText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDiscard}
                activeOpacity={0.8}
                onPress={handleConfirmEdit}
              >
                <Text style={styles.btnDiscardText}>수정</Text>
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
  content: { paddingBottom: Spacing.v.screenBottom },
  imageBox: {
    marginTop: Spacing.v.small,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  mainImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    ...Typography.title2,
    color: Colors.light.grayDark,
    marginLeft: Spacing.h.small,
  },
  titleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
  },
  titleInput: {
    flex: 1,
    ...Typography.HeadLine5,
    marginLeft: Spacing.h.small,
    padding: 0,
  },
  tagAddButton: {
    paddingHorizontal: Spacing.h.small,
    paddingVertical: Spacing.v.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: 999,
    backgroundColor: Colors.light.white,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.h.small,
    marginTop: Spacing.v.small,
    marginHorizontal: Spacing.h.medium,
  },
  tagAddButtonText: { ...Typography.body2, color: Colors.light.dark },
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
  tagChipText: { ...Typography.body2, color: Colors.light.dark },
  infoBoxWrapper: { marginTop: Spacing.v.large, marginHorizontal: Spacing.h.medium },
  infoBox: {
    borderRadius: Spacing.r.small,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
    backgroundColor: Colors.light.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.h.small,
  },
  dateText: { ...Typography.subtitle2, color: Colors.light.grayDark },
  infoRowSpaced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.h.small,
    marginTop: Spacing.v.medium,
  },
  descInput: {
    marginTop: Spacing.v.medium,
    ...Typography.body2,
    color: Colors.light.black,
  },
  imageRow: { marginTop: Spacing.v.medium, gap: Spacing.h.small },
  imageAddButton: {
    width: Size.reviewUpload,
    height: Size.reviewUpload,
    backgroundColor: Colors.light.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageThumbWrapper: { width: Size.reviewUpload, height: Size.reviewUpload },
  imageThumb: { width: Size.reviewUpload, height: Size.reviewUpload },
  imageRemoveButton: { position: 'absolute', top: 0, right: 0 },
  submitButton: {
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    paddingVertical: Spacing.v.medium,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { backgroundColor: Colors.light.grayLight },
  submitButtonText: { ...Typography.button2, color: Colors.light.white },
  submitButtonTextDisabled: { color: Colors.light.grayDark },
  missingFieldsText: {
    ...Typography.body2,
    color: Colors.light.error,
    textAlign: 'center',
    marginTop: Spacing.v.small,
    marginHorizontal: Spacing.h.medium,
  },
  overlay: { flex: 1, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  unsavedPopup: {
    width: width - 64,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingBottom: Spacing.v.medium,
    ...Shadows.card,
  },
  unsavedTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  unsavedDesc: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.medium, textAlign: 'center' },
  unsavedButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnDiscard: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnDiscardText: { ...Typography.button2, color: Colors.light.white },
  btnStay: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnStayText: { ...Typography.button2, color: Colors.light.grayDark },
  submitResultOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.xlarge,
  },
  submitResultPopupBox: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    alignItems: 'center',
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  submitResultTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  submitResultDesc: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.medium, textAlign: 'center' },
});

export default PhotoSpotWriteScreen;
