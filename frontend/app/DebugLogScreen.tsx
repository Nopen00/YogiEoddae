import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { IconSize, IconStroke } from '@/constants/IconSize';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { clearLogs, getLogs, LogEntry } from '@/services/logger';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Copy, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 숨겨진 디버그 로그 화면 — MY 화면 타이틀 5연타로 진입. 사용자에게 노출할 화면이 아니라
// 개발/QA 중 "화면엔 그냥 비어있는데 왜 그런지 모르겠다" 싶을 때 바로 원인을 확인하기 위한 용도.

const LEVEL_COLOR: Record<LogEntry['level'], string> = {
  error: '#dc2626',
  warn: '#d97706',
  info: '#6b7280',
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
};

const DebugLogScreen = () => {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const load = useCallback(() => {
    getLogs().then(setLogs);
  }, []);

  useFocusEffect(load);

  const handleClear = () => {
    Alert.alert('로그 전체 삭제', '기록된 디버그 로그를 모두 지울까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await clearLogs(); load(); } },
    ]);
  };

  const handleCopy = async () => {
    const text = logs.map(l => `[${formatTime(l.time)}] ${l.level.toUpperCase()} ${l.tag}\n${l.message}`).join('\n\n');
    await Clipboard.setStringAsync(text || '(로그 없음)');
    Alert.alert('복사됨', '로그 전체가 클립보드에 복사됐습니다.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="디버그 로그"
        onBack={() => router.back()}
        right={
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleCopy} style={styles.headerButton} activeOpacity={0.7}>
              <Copy size={IconSize.xsmall} color={Colors.light.grayDark} strokeWidth={IconStroke.regular} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClear} style={styles.headerButton} activeOpacity={0.7}>
              <Trash2 size={IconSize.xsmall} color={Colors.light.error} strokeWidth={IconStroke.regular} />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>기록된 로그가 없습니다.</Text>
          </View>
        ) : (
          logs.map(entry => (
            <View key={entry.id} style={styles.entry}>
              <View style={styles.entryHeaderRow}>
                <Text style={[styles.levelBadge, { color: LEVEL_COLOR[entry.level] }]}>{entry.level.toUpperCase()}</Text>
                <Text style={styles.time}>{formatTime(entry.time)}</Text>
              </View>
              <Text style={styles.tag}>{entry.tag}</Text>
              <Text style={styles.message} selectable>{entry.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerButtons: { flexDirection: 'row', gap: Spacing.h.medium },
  headerButton: { padding: 4 },
  scrollContent: { paddingHorizontal: Spacing.h.medium, paddingBottom: Spacing.v.screenBottom },
  emptyState: { alignItems: 'center', marginTop: Spacing.v.xlarge },
  emptyText: { ...Typography.body2, color: Colors.light.grayDark },
  entry: {
    borderRadius: Spacing.r.small,
    borderWidth: 1,
    borderColor: Colors.light.grayLight,
    backgroundColor: Colors.light.white,
    padding: Spacing.v.small,
    marginTop: Spacing.v.small,
  },
  entryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelBadge: { ...Typography.button4, fontWeight: '700' },
  time: { ...Typography.body2, color: Colors.light.grayDark, fontSize: 11 },
  tag: { ...Typography.subtitle2, color: Colors.light.black, marginTop: 4 },
  message: { ...Typography.body2, color: Colors.light.dark, marginTop: 4, fontSize: 12 },
});

export default DebugLogScreen;
