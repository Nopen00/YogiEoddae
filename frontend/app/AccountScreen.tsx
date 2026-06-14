import { BackButton } from '@/components/make_component/BackButton';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { AlertCircle, Copy, Eye, EyeOff, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RECOVERY_CODE = 'ABCD-1234-EFGH-5678';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AccountScreen = () => {
  const router = useRouter();
  const [codeVisible, setCodeVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [resultPopup, setResultPopup] = useState<{ visible: boolean; isSuccess: boolean }>({ visible: false, isSuccess: true });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>계정</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionLabel}>계정 복구 코드</Text>

        <View style={styles.codeRow}>
          {codeVisible ? (
            <>
              <Text style={styles.codeText}>{RECOVERY_CODE}</Text>
              <View style={styles.codeActions}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => Clipboard.setStringAsync(RECOVERY_CODE)}>
                  <Copy size={24} color={Colors.light.grayDark} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setCodeVisible(false)} style={styles.eyeButton}>
                  <EyeOff size={24} color={Colors.light.grayDark} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setCodeVisible(true)}>
              <Eye size={24} color={Colors.light.grayDark} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.inputLabel}>계정 복구 코드 입력</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputBox}>
            <TextInput
              style={[styles.textInput, { color: inputValue ? Colors.light.black : Colors.light.grayLight }]}
              placeholder="복구 코드를 입력하세요"
              placeholderTextColor={Colors.light.grayLight}
              value={inputValue}
              onChangeText={setInputValue}
            />
            {inputValue.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => setInputValue('')} style={styles.clearButton}>
                <X size={24} color={Colors.light.black} />
              </TouchableOpacity>
            )}
          </View>
          {inputValue.length > 0 && (
            <TouchableOpacity style={styles.submitButton} activeOpacity={0.8} onPress={() => setPopupVisible(true)}>
              <Text style={styles.submitButtonText}>입력</Text>
            </TouchableOpacity>
          )}
        </View>

        {inputValue.length > 0 && (
          <View style={styles.warningRow}>
            <AlertCircle size={16} color={Colors.light.heart} />
            <Text style={styles.warningText}>복구 코드를 입력하면 되돌릴 수 없습니다.</Text>
          </View>
        )}
      </View>

      <Modal visible={popupVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>계정 복구를 진행하시겠습니까?</Text>
            <Text style={styles.popupDesc}>복구 코드를 입력하면 되돌릴 수 없습니다.</Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity style={styles.btnComplete} activeOpacity={0.8} onPress={() => {
                const isSuccess = inputValue.trim() === RECOVERY_CODE;
                setPopupVisible(false);
                setInputValue('');
                setResultPopup({ visible: true, isSuccess });
              }}>
                <Text style={styles.btnCompleteText}>완료</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancel} activeOpacity={0.8} onPress={() => { setPopupVisible(false); setInputValue(''); }}>
                <Text style={styles.btnCancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={resultPopup.visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setResultPopup({ ...resultPopup, visible: false })}
        >
          <View style={styles.resultPopup}>
            <Text style={styles.resultTitle}>
              {resultPopup.isSuccess ? '계정 복구에 성공했습니다.' : '계정 복구에 실패했습니다.'}
            </Text>
            {!resultPopup.isSuccess && (
              <Text style={styles.resultDesc}>복구 코드가 올바른지 다시 확인하세요.</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.small,
    paddingHorizontal: Spacing.h.medium,
    height: 56,
  },
  headerTitle: {
    ...Typography.HeadLine5,
    color: Colors.light.black,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  body: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionLabel: { ...Typography.title1, color: Colors.light.black },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  codeText: { ...Typography.body3, color: Colors.light.grayDark, flex: 1 },
  codeActions: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { marginLeft: 8 },
  divider: {
    height: 1,
    backgroundColor: Colors.light.grayLight,
    marginTop: 16,
  },
  inputLabel: { ...Typography.title1, color: Colors.light.black, marginTop: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
  },
  textInput: {
    flex: 1,
    paddingLeft: 16,
    paddingVertical: 0,
    textAlignVertical: 'center',
    ...Typography.body3,
  },
  clearButton: { marginLeft: 8, marginRight: 16 },
  submitButton: {
    width: 80,
    height: 40,
    marginLeft: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: { ...Typography.button2, color: Colors.light.white },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  warningText: { ...Typography.body2, color: Colors.light.heart, marginLeft: 4 },

  // 팝업
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: SCREEN_WIDTH - 64,
    height: 142,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  popupTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    textAlign: 'center',
  },
  popupDesc: {
    ...Typography.body2,
    color: Colors.light.heart,
    marginTop: 16,
    textAlign: 'center',
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  btnComplete: {
    width: 80,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCompleteText: { ...Typography.button2, color: Colors.light.grayDark },
  btnCancel: {
    width: 80,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.light.heart,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelText: { ...Typography.button2, color: Colors.light.white },
  resultPopup: {
    width: SCREEN_WIDTH - 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
  },
  resultTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  resultDesc: { ...Typography.body2, color: Colors.light.grayDark, textAlign: 'center', marginTop: 16 },
});

export default AccountScreen;
