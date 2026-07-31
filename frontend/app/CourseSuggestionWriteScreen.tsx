import { LinkInputAlert } from '@/components/modals/LinkInputAlert';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Shadows } from '@/constants/Shadows';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { COURSE_SUGGESTION_TOKEN_COST, courseSuggestionApi, userApi } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Edit2, Link } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shadow } from 'react-native-shadow-2';

const { width } = Dimensions.get('window');
// 링크 행: 아이콘 + 텍스트 + 화살표가 짧은 텍스트일 땐 서로 붙어있다가, 텍스트가 길어질 때만 이 폭에서 "..."로 잘리도록 상한선을 둠
// infoBoxWrapper의 marginHorizontal(좌우)과 infoBox의 paddingHorizontal(좌우)을 모두 제해야 실제 가용 폭이 나옴
const LINK_TEXT_MAX_WIDTH = width - Spacing.h.medium * 4 - IconSize.large - Spacing.h.small * 2 - 16;

const DESC_PLACEHOLDER = '- 해당 미디어에 대한 설명을 남겨주세요. (10자 이상)\n- 등장한 인물이나 줄거리, 제작사 같은 잡다한 정보도 좋아요.';

type MediaTypeOption = 'movie' | 'drama' | 'youtube';

const MEDIA_TYPE_OPTIONS: { key: MediaTypeOption; label: string }[] = [
  { key: 'movie', label: '영화' },
  { key: 'drama', label: '드라마' },
  { key: 'youtube', label: '유튜브' },
];

const CourseSuggestionWriteScreen = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [mediaType, setMediaType] = useState<MediaTypeOption | null>(null);
  const [description, setDescription] = useState('');
  const [isUnsavedWarningVisible, setIsUnsavedWarningVisible] = useState(false);
  const [isSubmitSuccessVisible, setIsSubmitSuccessVisible] = useState(false);
  const [isSubmitFailVisible, setIsSubmitFailVisible] = useState(false);
  const [isLinkPopupVisible, setIsLinkPopupVisible] = useState(false);
  const [isTokenConfirmVisible, setIsTokenConfirmVisible] = useState(false);
  const [isTokenInsufficientVisible, setIsTokenInsufficientVisible] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const initialSnapshotRef = useRef({ title: '', link: '', mediaType: null as MediaTypeOption | null, description: '' });

  useFocusEffect(
    useCallback(() => {
      userApi.getMe().then(res => setTokenBalance(res.data.token_balance)).catch(() => {});
    }, [])
  );

  const isSubmitEnabled =
    title.trim().length > 0 &&
    link.trim().length > 0 &&
    mediaType !== null &&
    description.trim().length > 0;

  const hasUnsavedChanges = () => {
    const snap = initialSnapshotRef.current;
    if (title !== snap.title) return true;
    if (link !== snap.link) return true;
    if (mediaType !== snap.mediaType) return true;
    if (description !== snap.description) return true;
    return false;
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) setIsUnsavedWarningVisible(true);
    else router.back();
  };

  const handleSubmit = () => {
    if (!isSubmitEnabled) return;
    if (tokenBalance < COURSE_SUGGESTION_TOKEN_COST) {
      setIsTokenInsufficientVisible(true);
      return;
    }
    setIsTokenConfirmVisible(true);
  };

  const handleConfirmTokenUse = async () => {
    setIsTokenConfirmVisible(false);
    try {
      const res = await courseSuggestionApi.create({ title, link, media_type: mediaType ?? '', description });
      setTokenBalance(res.data.token_balance);
      setIsSubmitSuccessVisible(true);
    } catch {
      setIsSubmitFailVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={handleBack} title="코스 건의하기" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.titleInputRow}>
          <Edit2 size={IconSize.large} color={title ? Colors.light.black : Colors.light.grayLight} strokeWidth={IconStroke.regular} />
          <TextInput
            style={[styles.titleInput, { color: title ? Colors.light.black : Colors.light.grayLight }]}
            value={title}
            onChangeText={setTitle}
            placeholder="미디어의 제목을 입력해주세요."
            placeholderTextColor={Colors.light.grayLight}
          />
        </View>

        <View style={styles.infoBoxWrapper}>
          <Shadow distance={4} startColor="rgba(0, 0, 0, 0.15)" offset={[0, 0]} stretch>
            <View style={styles.infoBox}>
              <TouchableOpacity style={styles.infoRow} onPress={() => setIsLinkPopupVisible(true)} activeOpacity={0.7}>
                <Link size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                <Text style={styles.dateText} numberOfLines={1} ellipsizeMode="tail">
                  {link ? link : '참고할 링크를 입력해주세요. (필수)'}
                </Text>
                <ChevronRight size={16} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
              </TouchableOpacity>

              <Text style={styles.mediaTypeLabel}>해당 미디어의 유형을 선택해주세요. (필수)</Text>
              <View style={styles.mediaTypeRow}>
                {MEDIA_TYPE_OPTIONS.map((option) => {
                  const isSelected = mediaType === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.mediaTypeChip, isSelected && styles.mediaTypeChipSelected]}
                      activeOpacity={0.7}
                      onPress={() => setMediaType(option.key)}
                    >
                      <Text style={[styles.mediaTypeChipText, isSelected && styles.mediaTypeChipTextSelected]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.descInput}
                value={description}
                onChangeText={setDescription}
                placeholder={DESC_PLACEHOLDER}
                placeholderTextColor={Colors.light.grayDark}
                multiline
                textAlignVertical="top"
              />
            </View>
          </Shadow>
        </View>

        <Text style={styles.tokenBalanceText}>현재 토큰 : {tokenBalance} 토큰</Text>

        <TouchableOpacity
          style={[styles.submitButton, !isSubmitEnabled && styles.submitButtonDisabled]}
          activeOpacity={isSubmitEnabled ? 0.8 : 1}
          onPress={handleSubmit}
        >
          <Text style={[styles.submitButtonCostText, !isSubmitEnabled && styles.submitButtonTextDisabled]}>{COURSE_SUGGESTION_TOKEN_COST} 토큰 소모</Text>
          <Text style={[styles.submitButtonText, !isSubmitEnabled && styles.submitButtonTextDisabled]}>건의하기</Text>
        </TouchableOpacity>
      </ScrollView>

      <LinkInputAlert
        visible={isLinkPopupVisible}
        currentLink={link}
        onClose={() => setIsLinkPopupVisible(false)}
        onConfirm={(newLink) => { setLink(newLink); setIsLinkPopupVisible(false); }}
      />

      <Modal visible={isUnsavedWarningVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.unsavedPopup}>
            <Text style={styles.unsavedTitle}>건의가 아직 완료되지 않았습니다.</Text>
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

      <Modal visible={isTokenConfirmVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.unsavedPopup}>
            <Text style={styles.unsavedTitle}>{COURSE_SUGGESTION_TOKEN_COST}개의 토큰을 사용합니다.</Text>
            <Text style={styles.unsavedDesc}>현재 토큰 : {tokenBalance.toLocaleString()} 토큰</Text>
            <View style={styles.unsavedButtons}>
              <TouchableOpacity
                style={styles.btnStay}
                activeOpacity={0.8}
                onPress={() => setIsTokenConfirmVisible(false)}
              >
                <Text style={styles.btnStayText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDiscard}
                activeOpacity={0.8}
                onPress={handleConfirmTokenUse}
              >
                <Text style={styles.btnDiscardText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isTokenInsufficientVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmPopup}>
            <Text style={styles.confirmTitle}>토큰이 부족합니다.</Text>
            <Text style={styles.confirmDesc}>현재 토큰 : {tokenBalance.toLocaleString()} 토큰</Text>
            <Text style={styles.confirmDescSpaced}>필요 토큰 : {COURSE_SUGGESTION_TOKEN_COST.toLocaleString()} 토큰</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.btnCancel}
                activeOpacity={0.8}
                onPress={() => setIsTokenInsufficientVisible(false)}
              >
                <Text style={styles.btnCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirm}
                activeOpacity={0.8}
                onPress={() => {
                  setIsTokenInsufficientVisible(false);
                  router.push('/TokenChargeScreen');
                }}
              >
                <Text style={styles.btnConfirmText}>충전</Text>
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
            <Text style={styles.submitResultTitle}>건의가 성공적으로 전송되었습니다!</Text>
            <Text style={styles.submitResultDesc}>반영에는 시간이 다소 걸릴 수 있습니다.</Text>
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
            <Text style={styles.submitResultTitle}>건의 전송을 실패했습니다.</Text>
            <Text style={styles.submitResultDesc}>잠시 후 다시 시도해주세요.</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingBottom: Spacing.v.screenBottom },
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
  dateText: { maxWidth: LINK_TEXT_MAX_WIDTH, ...Typography.subtitle2, color: Colors.light.grayDark },
  mediaTypeLabel: {
    ...Typography.subtitle2,
    color: Colors.light.grayDark,
    marginTop: Spacing.v.medium,
  },
  mediaTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.h.small,
    marginTop: Spacing.v.small,
  },
  mediaTypeChip: {
    paddingHorizontal: Spacing.h.small,
    paddingVertical: Spacing.v.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: 999,
    backgroundColor: Colors.light.white,
  },
  mediaTypeChipSelected: {
    borderColor: Colors.light.dark,
    backgroundColor: Colors.light.primary,
  },
  mediaTypeChipText: { ...Typography.body2, color: Colors.light.dark },
  mediaTypeChipTextSelected: { color: Colors.light.white },
  descInput: {
    marginTop: Spacing.v.medium,
    ...Typography.body2,
    color: Colors.light.black,
  },
  tokenBalanceText: {
    marginTop: Spacing.v.large,
    ...Typography.subtitle2,
    color: Colors.light.dark,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    paddingHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { backgroundColor: Colors.light.grayLight },
  submitButtonCostText: { ...Typography.button4, color: Colors.light.white },
  submitButtonText: { ...Typography.button2, color: Colors.light.white, marginTop: Spacing.v.small },
  submitButtonTextDisabled: { color: Colors.light.grayDark },
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
  confirmOverlay: { flex: 1, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  confirmPopup: {
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
  confirmTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  confirmDesc: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.medium, textAlign: 'center' },
  confirmDescSpaced: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.small, textAlign: 'center' },
  confirmButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnConfirmText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },
});

export default CourseSuggestionWriteScreen;
