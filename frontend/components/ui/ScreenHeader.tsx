import { BackButton } from '@/components/ui/BackButton';
import { Colors } from '@/constants/Colors';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface ScreenHeaderProps {
  onBack?: () => void;
  title?: string;
  // 스크롤 시 본문 타이틀 대신 헤더에 뜨는 축약형 타이틀 — title과 달리 뒤로가기 옆에
  // 좌측 정렬로 놓이고, 긴 텍스트는 더보기 아이콘 쪽 여백을 남기고 말줄임 처리된다.
  scrollTitle?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  // 지정하면 타이틀이 탭 가능해진다(기본은 pointerEvents="none"이라 클릭이 그냥 통과함).
  // 숨겨진 진입점(예: MY 타이틀 5연타로 디버그 로그 화면 진입) 용도.
  onTitlePress?: () => void;
}

export function ScreenHeader({ onBack, title, scrollTitle, right, style, children, onTitlePress }: ScreenHeaderProps) {
  const hasFlexContent = !!(children || right || scrollTitle);
  return (
    <View style={[styles.header, style]}>
      {onBack ? <BackButton onPress={onBack} /> : <View style={styles.rightBalance} />}
      {title && (
        <View style={styles.titleContainer} pointerEvents={onTitlePress ? 'auto' : 'none'}>
          {onTitlePress ? (
            <TouchableOpacity onPress={onTitlePress} activeOpacity={1}>
              <Text style={styles.title}>{title}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}
        </View>
      )}
      {hasFlexContent && (
        <View style={styles.fill}>
          {scrollTitle ? (
            <Text style={styles.scrollTitle} numberOfLines={1} ellipsizeMode="tail">{scrollTitle}</Text>
          ) : children}
        </View>
      )}
      {right && <View style={styles.rightSlot}>{right}</View>}
      {children && !right && <View style={styles.rightBalance} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    paddingHorizontal: Spacing.h.medium,
    height: Size.header,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
    textAlign: 'center',
  },
  fill: {
    flex: 1,
  },
  scrollTitle: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
    marginLeft: Spacing.h.medium,
    marginRight: Spacing.h.xlarge,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightBalance: {
    width: 48,
  },
});
