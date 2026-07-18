import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AlertCircle, ChevronRight, Copy, Edit3, Eye, EyeOff, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RECOVERY_CODE = 'ABCD-1234-EFGH-5678';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AccountScreen = () => {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [nickname] = useState('내이름은김철수');
  const [userId] = useState('id1234');
  const [email] = useState('1234@1234.com');
  const [codeVisible, setCodeVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [resultPopup, setResultPopup] = useState<{ visible: boolean; isSuccess: boolean }>({ visible: false, isSuccess: true });

  const handlePickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader onBack={() => router.back()} title="내 정보" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.v.screenBottom }}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]} />
            )}
            <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={handlePickProfileImage}>
              <Edit3 size={IconSize.medium} color={Colors.light.white} strokeWidth={IconStroke.regular} />
            </TouchableOpacity>
          </View>
        </View>

        <Divider marginTop={Spacing.v.large} style={{ marginHorizontal: Spacing.h.medium }} />

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7}>
          <Text style={styles.sectionRowTitle}>닉네임 변경</Text>
          <View style={styles.sectionRowRight}>
            <Text style={styles.sectionRowValue}>{nickname}</Text>
            <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7}>
          <Text style={styles.sectionRowTitle}>아이디 변경</Text>
          <View style={styles.sectionRowRight}>
            <Text style={styles.sectionRowValue}>{userId}</Text>
            <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7} onPress={() => router.push('/PasswordChangeScreen')}>
          <Text style={styles.sectionRowTitle}>비밀번호 변경</Text>
          <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7}>
          <Text style={styles.sectionRowTitle}>이메일 변경</Text>
          <View style={styles.sectionRowRight}>
            <Text style={styles.sectionRowValue}>{email}</Text>
            <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
          </View>
        </TouchableOpacity>

        <Divider marginTop={Spacing.v.large} style={{ marginHorizontal: Spacing.h.medium }} />

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7}>
          <Text style={styles.sectionRowTitleGray}>로그아웃</Text>
          <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7}>
          <Text style={styles.sectionRowTitleGray}>회원 탈퇴</Text>
          <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>계정 복구 코드</Text>

          <View style={styles.codeRow}>
            {codeVisible ? (
              <>
                <Text style={styles.codeText}>{RECOVERY_CODE}</Text>
                <View style={styles.codeActions}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => Clipboard.setStringAsync(RECOVERY_CODE)}>
                    <Copy size={IconSize.large} color={Colors.light.grayDark} />
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setCodeVisible(false)} style={styles.eyeButton}>
                    <EyeOff size={IconSize.large} color={Colors.light.grayDark} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity activeOpacity={0.7} onPress={() => setCodeVisible(true)}>
                <Eye size={IconSize.large} color={Colors.light.grayDark} />
              </TouchableOpacity>
            )}
          </View>

          <Divider />

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
                  <X size={IconSize.large} color={Colors.light.black} />
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
              <AlertCircle size={IconSize.xsmall} color={Colors.light.error} />
              <Text style={styles.warningText}>복구 코드를 입력하면 되돌릴 수 없습니다.</Text>
            </View>
          )}
        </View>
      </ScrollView>

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
  body: {
    marginTop: 64,
    paddingHorizontal: Spacing.h.medium,
  },
  profileSection: {
    marginTop: Spacing.v.medium,
    alignItems: 'center',
  },
  profileImageWrapper: {
    width: Size.avatarXl,
    height: Size.avatarXl,
  },
  profileImage: {
    width: Size.avatarXl,
    height: Size.avatarXl,
    borderRadius: Size.avatarXl / 2,
  },
  profileImagePlaceholder: { backgroundColor: Colors.light.grayLight },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.grayLight,
    borderWidth: 2,
    borderColor: Colors.light.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.h.medium,
    marginTop: Spacing.v.large,
  },
  sectionRowTitle: { ...Typography.title1, color: Colors.light.black },
  sectionRowTitleGray: { ...Typography.title1, color: Colors.light.grayDark },
  sectionRowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.h.small },
  sectionRowValue: { ...Typography.subtitle2, color: Colors.light.grayDark },
  sectionLabel: { ...Typography.title1, color: Colors.light.black },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
  },
  codeText: { ...Typography.body3, color: Colors.light.grayDark, flex: 1 },
  codeActions: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { marginLeft: Spacing.h.small },
  inputLabel: { ...Typography.title1, color: Colors.light.black, marginTop: Spacing.v.medium },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: Size.buttonSm,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
  },
  textInput: {
    flex: 1,
    paddingLeft: Spacing.h.medium,
    paddingVertical: 0,
    textAlignVertical: 'center',
    ...Typography.body3,
  },
  clearButton: { marginLeft: Spacing.h.small, marginRight: Spacing.h.medium },
  submitButton: {
    width: 80,
    height: Size.buttonSm,
    marginLeft: Spacing.h.medium,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: { ...Typography.button2, color: Colors.light.white },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.v.medium,
  },
  warningText: { ...Typography.body2, color: Colors.light.error, marginLeft: Spacing.h.xsmall },

  // 팝업
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: SCREEN_WIDTH - 64,
    height: 142,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingTop: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    ...Shadows.card,
  },
  popupTitle: {
    ...Typography.subtitle2,
    color: Colors.light.black,
    textAlign: 'center',
  },
  popupDesc: {
    ...Typography.body2,
    color: Colors.light.error,
    marginTop: Spacing.v.medium,
    textAlign: 'center',
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.h.medium,
    marginTop: Spacing.v.medium,
  },
  btnComplete: {
    width: 80,
    height: Size.buttonSm,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCompleteText: { ...Typography.button2, color: Colors.light.grayDark },
  btnCancel: {
    width: 80,
    height: Size.buttonSm,
    borderRadius: Spacing.r.small,
    backgroundColor: Colors.light.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelText: { ...Typography.button2, color: Colors.light.white },
  resultPopup: {
    width: SCREEN_WIDTH - 64,
    borderRadius: Spacing.r.small,
    borderWidth: Spacing.lw.small,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    paddingVertical: Spacing.v.medium,
    paddingHorizontal: Spacing.h.medium,
    ...Shadows.card,
    alignItems: 'center',
  },
  resultTitle: { ...Typography.subtitle2, color: Colors.light.black, textAlign: 'center' },
  resultDesc: { ...Typography.body2, color: Colors.light.grayDark, textAlign: 'center', marginTop: Spacing.v.medium },
});

export default AccountScreen;
