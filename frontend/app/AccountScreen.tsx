import { NicknameEditAlert } from '@/components/modals/NicknameEditAlert';
import { Divider } from '@/components/ui/Divider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Size } from '@/constants/Size';
import { Shadows } from '@/constants/Shadows';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { authApi, userApi } from '@/services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ChevronRight, Edit3 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AccountScreen = () => {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [nicknameEditVisible, setNicknameEditVisible] = useState(false);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [nicknameSuccessVisible, setNicknameSuccessVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      userApi.getMe().then((res) => {
        setNickname(res.data.nickname);
        setUserId(res.data.username);
        setEmail(res.data.email);
      }).catch(() => {
        router.replace('/LoginScreen');
      });
    }, [])
  );

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

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7} onPress={() => setNicknameEditVisible(true)}>
          <Text style={styles.sectionRowTitle}>닉네임 변경</Text>
          <View style={styles.sectionRowRight}>
            <Text style={styles.sectionRowValue}>{nickname}</Text>
            <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7} onPress={() => router.push('/IdChangeScreen')}>
          <Text style={styles.sectionRowTitle}>아이디 변경</Text>
          <View style={styles.sectionRowRight}>
            <Text style={styles.sectionRowValue}>{userId}</Text>
            <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7} onPress={() => router.push('/PasswordEditScreen')}>
          <Text style={styles.sectionRowTitle}>비밀번호 변경</Text>
          <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionRow}
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: '/EmailChangeScreen', params: { mode: email ? 'change' : 'setup' } })}
        >
          <View style={styles.sectionRowTitleWrapper}>
            <Text style={styles.sectionRowTitle}>{email ? '연동 이메일 변경' : '연동 이메일 설정'}</Text>
          </View>
          <View style={styles.sectionRowRight}>
            <Text style={styles.sectionRowValue}>{email || '이메일이 없습니다.'}</Text>
            <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
          </View>
        </TouchableOpacity>

        <Divider marginTop={Spacing.v.large} style={{ marginHorizontal: Spacing.h.medium }} />

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7} onPress={() => setLogoutConfirmVisible(true)}>
          <Text style={styles.sectionRowTitleGray}>로그아웃</Text>
          <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sectionRow} activeOpacity={0.7} onPress={() => router.push('/WithdrawalScreen')}>
          <Text style={styles.sectionRowTitleGray}>회원 탈퇴</Text>
          <ChevronRight size={IconSize.medium} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
        </TouchableOpacity>
      </ScrollView>

      <NicknameEditAlert
        visible={nicknameEditVisible}
        onConfirm={async (newNickname) => {
          await userApi.updateNickname(newNickname);
          setNickname(newNickname);
          setNicknameEditVisible(false);
          setNicknameSuccessVisible(true);
        }}
        onClose={() => setNicknameEditVisible(false)}
      />

      <Modal visible={nicknameSuccessVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setNicknameSuccessVisible(false)}
        >
          <View style={styles.resultPopup}>
            <Text style={styles.resultTitle}>닉네임이 변경되었습니다.</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={logoutConfirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmPopup}>
            <Text style={styles.confirmTitle}>로그아웃하시겠습니까?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.btnCancel}
                activeOpacity={0.8}
                onPress={() => setLogoutConfirmVisible(false)}
              >
                <Text style={styles.btnCancelText}>아니오</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirm}
                activeOpacity={0.8}
                onPress={async () => {
                  setLogoutConfirmVisible(false);
                  await authApi.logout();
                  router.replace('/');
                }}
              >
                <Text style={styles.btnConfirmText}>예</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
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
  sectionRowTitleWrapper: { position: 'relative' },
  sectionRowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.h.small },
  sectionRowValue: { ...Typography.subtitle2, color: Colors.light.grayDark },

  // 팝업
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
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

  confirmOverlay: { flex: 1, backgroundColor: Colors.light.overlay, justifyContent: 'center', alignItems: 'center' },
  confirmPopup: {
    width: SCREEN_WIDTH - 64,
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
  confirmButtons: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.h.medium, marginTop: Spacing.v.medium },
  btnConfirm: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  btnConfirmText: { ...Typography.button2, color: Colors.light.white },
  btnCancel: { width: 80, height: Size.buttonSm, borderRadius: Spacing.r.small, backgroundColor: Colors.light.grayLight, justifyContent: 'center', alignItems: 'center' },
  btnCancelText: { ...Typography.button2, color: Colors.light.grayDark },
});

export default AccountScreen;
