import AsyncStorage from '@react-native-async-storage/async-storage';

// 숨겨진 디버그 로그 — MY 화면 타이틀 5연타로 진입하는 로그 화면(DebugLogScreen)에서 확인한다.
// API 요청 실패, 처리되지 않은 JS 예외를 여기 모아둬서, 화면엔 그냥 "비어있음"으로만
// 보이는 문제(예: catch(() => {})로 조용히 삼켜진 에러)를 재배포 없이 바로 들여다볼 수 있게 한다.

export type LogLevel = 'error' | 'warn' | 'info';

export interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  tag: string;
  message: string;
}

const STORAGE_KEY = 'debug_logs_v1';
const MAX_ENTRIES = 200;

let logs: LogEntry[] = [];
let nextId = 1;
let loaded = false;
let loadPromise: Promise<void> | null = null;

const persist = () => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs)).catch(() => {});
};

const ensureLoaded = async () => {
  if (loaded) return;
  if (!loadPromise) {
    loadPromise = AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            logs = JSON.parse(raw);
            nextId = (logs[logs.length - 1]?.id ?? 0) + 1;
          } catch {
            logs = [];
          }
        }
      })
      .catch(() => {})
      .finally(() => { loaded = true; });
  }
  await loadPromise;
};

// 앱 시작 시 미리 로드해둬서, 로그 화면을 처음 열었을 때 지연 없이 보이게 한다.
ensureLoaded();

export const logEvent = (level: LogLevel, tag: string, message: string) => {
  const entry: LogEntry = { id: nextId++, time: new Date().toISOString(), level, tag, message };
  logs.push(entry);
  if (logs.length > MAX_ENTRIES) logs = logs.slice(logs.length - MAX_ENTRIES);
  persist();
};

export const getLogs = async (): Promise<LogEntry[]> => {
  await ensureLoaded();
  return [...logs].reverse();
};

export const clearLogs = async () => {
  logs = [];
  await AsyncStorage.removeItem(STORAGE_KEY);
};
