// components/SearchBar.tsx
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { ArrowLeft, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

interface SearchBarProps extends TextInputProps {
  onBackPress?: () => void;
  onClearPress?: () => void;
}

const SearchBar = ({ onBackPress, onClearPress, value, ...props }: SearchBarProps) => (
  <View style={styles.headerRow}>
    <TouchableOpacity onPress={onBackPress} style={styles.backButton} activeOpacity={0.7}>
      <ArrowLeft size={24} color={Colors.light.black} strokeWidth={2.5} />
    </TouchableOpacity>

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
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.h.medium, marginTop: Spacing.v.small },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.h.small },
  searchBarContainer: { flex: 1, height: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.white, borderWidth: Spacing.lw.small, borderColor: Colors.light.grayLight, borderRadius: 56, paddingHorizontal: Spacing.h.medium },
  searchInput: { flex: 1, ...Typography.body3, color: Colors.light.black, height: '100%', paddingVertical: 0 },
});

export default SearchBar;