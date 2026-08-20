import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SortAlert, SortOption } from '@/components/modals/SortAlert';
import { Divider } from '@/components/ui/Divider';
import { PlaceThumb } from '@/components/ui/PlaceThumb';
import { TagRow } from '@/components/ui/TagRow';
import { TextSeparator } from '@/components/ui/TextSeparator';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { photoApi } from '@/services/api';
import type { Photo } from '@/services/types';
import { getProcessedTags } from '@/utils/getProcessedTags';
import { sortByOption } from '@/utils/sortByOption';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUpDown, Heart, Star } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SORT_OPTIONS: SortOption[] = ['이름순', '별점 높은 순', '하트 많은 순'];

const formatLikeCount = (count: number): string => {
  if (count < 100) return count.toString();
  return (Math.floor(count / 100) * 100).toLocaleString() + '+';
};

type PhotoSpotItem = Photo & { rating: number; like_count: number };

const UserPhotoSpotsScreen = () => {
  const router = useRouter();
  const { author, authorAvatar } = useLocalSearchParams<{ author: string; authorAvatar?: string }>();
  const [photos, setPhotos] = useState<PhotoSpotItem[]>([]);
  const [isSortVisible, setIsSortVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('이름순');

  useFocusEffect(
    useCallback(() => {
      photoApi.getList({ author }).then(res => {
        setPhotos(res.data.map(p => ({ ...p, rating: p.rating ?? 0, like_count: p.likes })));
      }).catch(() => {});
    }, [author])
  );

  const sortedPhotos = sortByOption(photos, sortOption, p => p.description);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader
        onBack={() => router.back()}
        title={author}
        right={
          <TouchableOpacity style={styles.sortButton} onPress={() => setIsSortVisible(true)} activeOpacity={0.7}>
            <ArrowUpDown size={IconSize.large} color={Colors.light.black} strokeWidth={IconStroke.regular} />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <PlaceThumb uri={authorAvatar} style={styles.profileAvatar} shape="circle" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{author}</Text>
            <Text style={styles.profileCount}>작성한 포토스팟 : {photos.length}개</Text>
          </View>
        </View>

        <Divider marginTop={Spacing.v.large} />

        {sortedPhotos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>게시된 포토스팟이 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {sortedPhotos.map((photo) => {
              const { visibleTags, extraCount } = getProcessedTags(photo.tags);
              return (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.sectionCard}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/PhotoSpotDetailScreen', params: { id: photo.id } })}
                >
                  <View style={styles.sectionImageWrapper}>
                    <PlaceThumb uri={photo.image_url} style={styles.sectionImage} />
                  </View>
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionTitle} numberOfLines={1}>{photo.description}</Text>
                    <View style={styles.metaRow}>
                      <Star size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                      <Text style={styles.metaText}> {photo.rating.toFixed(1)}</Text>
                      <TextSeparator color={Colors.light.grayDark} />
                      <Heart size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
                      <Text style={styles.metaText}> {formatLikeCount(photo.like_count)}</Text>
                    </View>
                    {visibleTags.length > 0 && (
                      <TagRow>
                        {visibleTags.map((tag, idx) => <Text key={idx} style={styles.sectionTag}>#{tag}</Text>)}
                        {extraCount > 0 && <Text style={styles.sectionTag}>+{extraCount}</Text>}
                      </TagRow>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <SortAlert
        visible={isSortVisible}
        options={SORT_OPTIONS}
        selected={sortOption}
        onClose={() => setIsSortVisible(false)}
        onSelect={setSortOption}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  sortButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.h.medium, paddingBottom: Spacing.v.screenBottom },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
  },
  profileAvatar: {
    width: Size.circleMd,
    height: Size.circleMd,
    borderRadius: Size.circleMd / 2,
    backgroundColor: Colors.light.grayLight,
  },
  profileInfo: { marginLeft: Spacing.h.medium },
  profileName: { ...Typography.title1, color: Colors.light.black },
  profileCount: { ...Typography.body2, color: Colors.light.grayDark, marginTop: Spacing.v.small },
  cardList: { marginTop: Spacing.v.large, gap: Spacing.v.medium },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.v.small },
  metaText: { ...Typography.body2, color: Colors.light.grayDark },
  sectionTag: { ...Typography.body2, color: Colors.light.dark },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.v.medium, marginTop: Spacing.v.xlarge },
  emptyTitle: { ...Typography.subtitle2, color: Colors.light.black },
});

export default UserPhotoSpotsScreen;
