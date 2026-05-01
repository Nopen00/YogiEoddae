import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import BackButton from './BackButton'; // 새롭게 만든 컴포넌트 임포트

interface SearchBarProps extends TextInputProps {
  onBackPress?: () => void;
  onClearPress?: () => void;
}

const SearchBar = ({ onBackPress, onClearPress, value, ...props }: SearchBarProps) => (
  <View style={styles.headerRow}>
    {/* 분리된 컴포넌트 적용: 코드가 훨씬 깔끔해졌습니다. */}
    <BackButton onPress={onBackPress} />

    <View style={styles.searchBarContainer}>
      <TextInput
        style={[styles.searchInput, value && value.length > 0 && { marginRight: Spacing.h.small }]}
        placeholderTextColor={Colors.light.grayLight}
        value={value} 
        {...props}
      />
      {value && value.length > 0 && (
        <TouchableOpacity onPress={onClearPress} activeOpacity={0.7}>
          <X size={20} color={Colors.light.grayDark} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.h.medium, 
    marginTop: Spacing.v.small 
  },
  searchBarContainer: { 
    flex: 1, 
    height: 56, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.light.white, 
    borderWidth: Spacing.lw.small, 
    borderColor: Colors.light.grayLight, 
    borderRadius: 56, 
    paddingHorizontal: Spacing.h.medium 
  },
  searchInput: { 
    flex: 1, 
    ...Typography.body3, 
    color: Colors.light.black, 
    height: '100%', 
    paddingVertical: 0 
  },
});

export default SearchBar;