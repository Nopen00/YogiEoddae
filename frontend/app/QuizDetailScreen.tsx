// app\QuizDetailScreen.tsx
import { Divider } from '@/components/ui/Divider';
import { MetaRow } from '@/components/ui/MetaRow';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { Colors } from '@/constants/Colors';
import { MEDIA_TYPE_LABEL } from '@/constants/labels';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { mediaApi } from '@/services/api';
import type { Media, MediaPlace } from '@/services/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuizDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const imageWidth = width - Spacing.h.medium * 2;
  const imageHeight = (imageWidth * 3) / 4;

  const [media, setMedia] = useState<Media | null>(null);
  const [mediaPlaces, setMediaPlaces] = useState<MediaPlace[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [successVisible, setSuccessVisible] = useState(false);
  const [failVisible, setFailVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [loadError, setLoadError] = useState(false);

  const fetchDetail = useCallback(() => {
    if (!id || Number.isNaN(Number(id))) {
      setLoadError(true);
      return;
    }
    setLoadError(false);
    mediaApi.getDetail(Number(id)).then(res => setMedia(res.data)).catch(() => setLoadError(true));
    mediaApi.getPlaces(Number(id)).then(res => setMediaPlaces(res.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const alreadySubmitted = media?.is_submitted === true;
  const allAnswered =
    !alreadySubmitted &&
    mediaPlaces.length > 0 &&
    mediaPlaces.every(mp => (answers[mp.id] ?? '').trim().length > 0);
  const isSubmitEnabled = allAnswered && !isSubmitting;

  const handleSubmit = async () => {
    if (!id || !isSubmitEnabled || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      await mediaApi.submitQuiz(Number(id), answers);
      setSuccessVisible(true);
    } catch {
      setFailVisible(true);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} />

      {loadError && !media ? (
        <View style={styles.loadErrorContainer}>
          <Text style={styles.loadErrorText}>정보를 불러오지 못했습니다.</Text>
          <Text style={styles.loadErrorSubText}>삭제되었거나 일시적인 오류일 수 있습니다.</Text>
          <TouchableOpacity style={styles.loadErrorRetryButton} activeOpacity={0.8} onPress={fetchDetail}>
            <Text style={styles.loadErrorRetryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
        <View style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
          <Image source={{ uri: media?.thumbnail_url ?? undefined }} style={styles.mainImage} resizeMode="cover" />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.titleText}>{media?.title ?? '로딩 중...'}</Text>

          <MetaRow>
            <Text style={styles.metaText}>{mediaPlaces.length}개 장소</Text>
            <TextSeparator />
            <Text style={styles.metaText}>{MEDIA_TYPE_LABEL[media?.media_type ?? ''] ?? media?.media_type}</Text>
          </MetaRow>

          <TagRow>
            {media?.tags.map(tag => (
              <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
            ))}
          </TagRow>

          <Divider marginTop={Spacing.v.large} />
        </View>

        {mediaPlaces.map((mp, index) => (
          <View key={mp.id} style={index === 0 ? styles.questionBlock : [styles.questionBlock, styles.questionBlockSpaced]}>
            <Text style={styles.questionTitle}>{index + 1}. 이 장소는 어디일까?</Text>
            <View style={[styles.questionImageWrapper, { width: imageWidth, height: imageHeight }]}>
              <Image source={{ uri: mp.place.image_url ?? undefined }} style={styles.questionImage} resizeMode="cover" />
            </View>
            <View style={styles.answerBox}>
              <TextInput
                style={styles.answerInput}
                placeholder="답을 적어주세요."
                placeholderTextColor={Colors.light.grayLight}
                value={answers[mp.id] ?? ''}
                onChangeText={(text) => setAnswers(prev => ({ ...prev, [mp.id]: text }))}
              />
            </View>
          </View>
        ))}

        <Divider marginTop={Spacing.v.large} style={{ marginHorizontal: Spacing.h.medium }} />

        {alreadySubmitted && (
          <Text style={styles.alreadySubmittedText}>이미 제출한 퀴즈입니다.</Text>
        )}

        <TouchableOpacity
          style={[styles.submitButton, !isSubmitEnabled && styles.submitButtonDisabled]}
          activeOpacity={0.8}
          disabled={!isSubmitEnabled}
          onPress={handleSubmit}
        >
          <Text style={[styles.submitButtonText, !isSubmitEnabled && styles.submitButtonTextDisabled]}>제출하기</Text>
        </TouchableOpacity>
      </ScrollView>
      )}

      <Modal visible={successVisible} transparent animationType="none">
        <TouchableOpacity style={styles.resultOverlay} activeOpacity={1} onPress={() => { setSuccessVisible(false); router.back(); }}>
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>퀴즈가 정상적으로 제출되었습니다.</Text>
            <Text style={styles.resultSub1}>3 토큰이 우편함으로 지급되었습니다.</Text>
            <Text style={styles.resultSub2}>결과 보상은 영업일 기준 2~3일 이내 지급됩니다.</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={failVisible} transparent animationType="none">
        <TouchableOpacity style={styles.resultOverlay} activeOpacity={1} onPress={() => setFailVisible(false)}>
          <View style={styles.resultPopupBox}>
            <Text style={styles.resultTitle}>퀴즈 제출에 실패하였습니다.</Text>
            <Text style={styles.resultSub1}>잠시후 다시 시도해주세요.</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadErrorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.h.medium, gap: Spacing.v.small },
  loadErrorText: { ...Typography.subtitle2, color: Colors.light.black },
  loadErrorSubText: { ...Typography.body2, color: Colors.light.grayDark },
  loadErrorRetryButton: {
    marginTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.large,
    paddingVertical: Spacing.v.small,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
  },
  loadErrorRetryText: { ...Typography.button2, color: Colors.light.white },
  imageContainer: {
    marginTop: Spacing.v.small,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  mainImage: { width: '100%', height: '100%' },
  infoContainer: { paddingHorizontal: Spacing.h.medium, marginTop: Spacing.v.medium },
  titleText: { ...Typography.HeadLine5, color: Colors.light.black },
  metaText: { ...Typography.body2, color: Colors.light.grayDark },
  tagText: { ...Typography.body2, color: Colors.light.dark },
  questionBlock: { marginTop: Spacing.v.large },
  questionBlockSpaced: { marginTop: Spacing.v.large },
  questionTitle: { ...Typography.title1, color: Colors.light.black, marginHorizontal: Spacing.h.medium },
  questionImageWrapper: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    overflow: 'hidden',
    backgroundColor: Colors.light.grayLight,
  },
  questionImage: { width: '100%', height: '100%' },
  answerBox: {
    marginTop: Spacing.v.medium,
    marginHorizontal: Spacing.h.medium,
    minHeight: Size.buttonSm,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Spacing.r.small,
    paddingVertical: Spacing.v.small,
    justifyContent: 'center',
  },
  answerInput: { paddingLeft: Spacing.h.medium, paddingVertical: 0, ...Typography.body3, color: Colors.light.black },
  submitButton: {
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
    paddingVertical: Spacing.v.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: { backgroundColor: Colors.light.grayLight },
  alreadySubmittedText: {
    ...Typography.body2,
    color: Colors.light.grayDark,
    textAlign: 'center',
    marginTop: Spacing.v.large,
    marginHorizontal: Spacing.h.medium,
  },
  submitButtonText: { ...Typography.button2, color: Colors.light.white },
  submitButtonTextDisabled: { color: Colors.light.grayDark },
  resultOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    paddingHorizontal: Spacing.h.xlarge,
  },
  resultPopupBox: {
    backgroundColor: Colors.light.white,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    alignItems: 'center',
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
  },
  resultTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  resultSub1: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.medium, textAlign: 'center' },
  resultSub2: { ...Typography.body2, color: Colors.light.dark, marginTop: Spacing.v.small, textAlign: 'center' },
});
