// components/modals/PlaceSelectAlert.tsx
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { CATEGORY_LABEL, shortAddress } from '@/constants/labels';
import { Shadows } from '@/constants/Shadows';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { placeApi } from '@/services/api';
import type { Place } from '@/services/types';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { AddPlaceConfirmAlert } from './AddPlaceConfirmAlert';
import { TagRow } from '../ui/TagRow';
import { TextSeparator } from '../ui/TextSeparator';

const PAGE_SIZE = 3;

interface PlaceSelectAlertProps {
  visible: boolean;
  onConfirm: (place: Place) => void;
  onClose: () => void;
}

export const PlaceSelectAlert = ({ visible, onConfirm, onClose }: PlaceSelectAlertProps) => {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [inputText, setInputText] = useState('');
  const [page, setPage] = useState(0);
  const [confirmTarget, setConfirmTarget] = useState<Place | null>(null);

  useEffect(() => {
    if (visible) {
      setInputText('');
      setPage(0);
      setConfirmTarget(null);
      placeApi.getList().then((res) => setAllPlaces(res.data.results)).catch(() => {});
    }
  }, [visible]);

  const keyword = inputText.trim();
  const filteredPlaces = keyword ? allPlaces.filter((p) => p.name.includes(keyword)) : [];
  const pageCount = Math.max(1, Math.ceil(filteredPlaces.length / PAGE_SIZE));
  const visiblePlaces = filteredPlaces.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleChangeText = (text: string) => {
    setInputText(text);
    setPage(0);
  };

  return (
    <>
    <Modal visible={visible && !confirmTarget} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>장소 선택하기</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={IconSize.large} color={Colors.light.grayLight} strokeWidth={IconStroke.regular} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBarContainer}>
                <Search size={24} color={Colors.light.primary} strokeWidth={IconStroke.regular} />
                <TextInput
                  style={[styles.searchInput, inputText.length > 0 && { marginRight: Spacing.h.small }]}
                  value={inputText}
                  onChangeText={handleChangeText}
                  placeholder="포토스팟의 장소를 검색해주세요."
                  placeholderTextColor={Colors.light.grayLight}
                  autoFocus
                />
                {inputText.length > 0 && (
                  <TouchableOpacity onPress={() => handleChangeText('')} activeOpacity={0.7}>
                    <X size={IconSize.medium} color={Colors.light.grayDark} />
                  </TouchableOpacity>
                )}
              </View>

              {keyword.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>검색어가 없습니다.</Text>
                  <Text style={styles.emptyDesc}>검색어를 입력해주세요.</Text>
                </View>
              ) : filteredPlaces.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>검색 결과가 없습니다.</Text>
                  <Text style={styles.emptyDesc}>검색어가 정확한지 확인해주세요.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.placeList}>
                    {visiblePlaces.map((place) => (
                      <TouchableOpacity
                        key={place.id}
                        style={styles.placeCard}
                        activeOpacity={0.8}
                        onPress={() => setConfirmTarget(place)}
                      >
                        <View style={styles.placeImageWrapper}>
                          <Image source={{ uri: place.image_url }} style={styles.placeImage} resizeMode="cover" />
                        </View>
                        <View style={styles.placeCardContent}>
                          <Text style={styles.placeCardTitle} numberOfLines={1}>{place.name}</Text>
                          <View style={styles.placeInfoRow}>
                            <Text style={styles.placeInfoText}>{CATEGORY_LABEL[place.category] ?? place.category}</Text>
                            <TextSeparator />
                            <Text style={styles.placeInfoText} numberOfLines={1}>{shortAddress(place.address)}</Text>
                          </View>
                          {place.tags.length > 0 && (
                            <TagRow>
                              {place.tags.map((tag) => (
                                <Text key={tag.id} style={styles.tagText}>#{tag.name}</Text>
                              ))}
                            </TagRow>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.pagerRow}>
                    <TouchableOpacity
                      onPress={() => setPage((p) => Math.max(0, p - 1))}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <ChevronLeft size={20} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                    </TouchableOpacity>
                    <Text style={styles.pagerText}>{page + 1}/{pageCount}</Text>
                    <TouchableOpacity
                      onPress={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <ChevronRight size={20} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>

    {confirmTarget && (
      <AddPlaceConfirmAlert
        visible
        place={confirmTarget}
        title="장소 선택하기"
        questionText="이 장소를 선택하시겠습니까?"
        confirmText="선택하기"
        onBack={() => setConfirmTarget(null)}
        onClose={() => { setConfirmTarget(null); onClose(); }}
        onConfirm={() => { onConfirm(confirmTarget); setConfirmTarget(null); }}
      />
    )}
    </>
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
  searchBarContainer: {
    marginTop: Spacing.v.medium,
    height: Size.header,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    borderRadius: Size.header,
    paddingHorizontal: Spacing.h.medium,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.h.small,
    ...Typography.body3,
    color: Colors.light.black,
    height: '100%',
    paddingVertical: 0,
  },
  emptyState: {
    paddingTop: Spacing.v.medium,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
  },
  emptyDesc: {
    ...Typography.body2,
    color: Colors.light.grayLight,
    marginTop: Spacing.v.medium,
  },
  placeList: {
    marginTop: Spacing.v.medium,
    gap: Spacing.v.medium,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    padding: Spacing.h.medium,
    backgroundColor: Colors.light.white,
  },
  placeImageWrapper: { width: Size.circleMd, height: Size.circleMd, borderRadius: Size.circleMd / 2, overflow: 'hidden', flexShrink: 0 },
  placeImage: { width: '100%', height: '100%' },
  placeCardContent: { flex: 1, marginLeft: Spacing.h.medium },
  placeCardTitle: { ...Typography.title1, color: Colors.light.black },
  placeInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small },
  placeInfoText: { ...Typography.subtitle1, color: Colors.light.grayDark, flexShrink: 1 },
  tagText: { ...Typography.body2, color: Colors.light.dark },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.v.medium,
  },
  pagerText: {
    ...Typography.subtitle2,
    color: Colors.light.grayDark,
    marginHorizontal: Spacing.h.medium,
  },
});
