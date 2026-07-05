// components\make_component\SearchBar.tsx
import { Colors } from '@/constants/Colors';
import { IconSize } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { BackButton } from './BackButton'; // ✅ named import로 변경

interface SearchBarProps extends TextInputProps {
  onBackPress?: () => void;
  onClearPress?: () => void;
  /** 지정하면 입력이 비활성화되고 탭 시 이 콜백만 호출됩니다 (검색 대기 화면 진입 등). */
  onPress?: () => void;
}

const SearchBar = ({ onBackPress, onClearPress, onPress, value, editable, ...props }: SearchBarProps) => (
  <View style={styles.headerRow}>
    <BackButton onPress={onBackPress} />
    <View style={styles.flexOne}>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={[styles.searchInput, value && value.length > 0 && { marginRight: Spacing.h.small }]}
          placeholderTextColor={Colors.light.grayLight}
          value={value}
          editable={onPress ? false : editable}
          {...props}
        />
        {value && value.length > 0 && (
          <TouchableOpacity onPress={onClearPress} activeOpacity={0.7}>
            <X size={IconSize.medium} color={Colors.light.grayDark} />
          </TouchableOpacity>
        )}
      </View>
      {onPress && (
        <TouchableWithoutFeedback onPress={onPress}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  flexOne: { flex: 1, height: Size.header, position: 'relative' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.small,
  },
  searchBarContainer: {
    flex: 1,
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
    ...Typography.body3,
    color: Colors.light.black,
    height: '100%',
    paddingVertical: 0,
  },
});

export default SearchBar;