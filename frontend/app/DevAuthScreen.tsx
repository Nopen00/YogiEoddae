// 실제 로그인/회원가입 디자인이 나오기 전, JWT 연동 테스트용 임시 화면.
// 디자인 없음 — 강혜진 작업 완료 시 이 파일은 삭제하고 정식 화면으로 교체.
import { authApi } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DevAuthScreen = () => {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    setMessage('처리 중...');
    try {
      const res = mode === 'login'
        ? await authApi.login({ username, password })
        : await authApi.signup({ username, nickname, password });
      setMessage(`성공: ${res.data.username} (id ${res.data.id})`);
    } catch (e: any) {
      setMessage(`실패: ${JSON.stringify(e?.response?.data ?? e?.message ?? e)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>[테스트용] 로그인 / 회원가입</Text>
        <Text style={styles.notice}>정식 디자인이 아직 없어서 JWT 연동 테스트만을 위한 화면입니다.</Text>

        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]} onPress={() => setMode('login')}>
            <Text style={styles.modeButtonText}>로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeButton, mode === 'signup' && styles.modeButtonActive]} onPress={() => setMode('signup')}>
            <Text style={styles.modeButtonText}>회원가입</Text>
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} placeholder="아이디" value={username} onChangeText={setUsername} autoCapitalize="none" />
        {mode === 'signup' && (
          <TextInput style={styles.input} placeholder="닉네임" value={nickname} onChangeText={setNickname} />
        )}
        <TextInput style={styles.input} placeholder="비밀번호" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{mode === 'login' ? '로그인' : '회원가입'}</Text>
        </TouchableOpacity>

        {!!message && <Text style={styles.message}>{message}</Text>}

        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/AccountScreen')}>
          <Text style={styles.linkText}>내 정보 화면으로 이동</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  body: { padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  notice: { fontSize: 12, color: '#c00' },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  modeButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, alignItems: 'center' },
  modeButtonActive: { backgroundColor: '#eee' },
  modeButtonText: { fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, fontSize: 14 },
  submitButton: { marginTop: 8, padding: 12, backgroundColor: '#333', borderRadius: 6, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  message: { fontSize: 12, color: '#333', marginTop: 8 },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { fontSize: 13, color: '#06c' },
});

export default DevAuthScreen;
