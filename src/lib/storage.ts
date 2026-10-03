/**
 * 결(結) 브라우저 저장소 — localStorage 전용. 서버 저장 없음.
 *
 * 키 설계 (접두 'gyeol:')
 *   gyeol:profile            StoredProfile   (BirthInput + 별칭 + 동의 + AI 사용 여부 + 생성 시각)
 *   gyeol:settings           StoredSettings  (엔진 옵션: 일주 경계)
 *   gyeol:chart              ChartCache      (SajuChart 캐시 + 입력 지문. engineVersion/입력이 다르면 재계산 후 덮어씀)
 *   gyeol:chat               ChatEntry[]     (대화 + AskResponse 메타)
 *   gyeol:today:YYYY-MM-DD   TodayRecord     (오늘의 행동 체크, 30초 피드백)
 *
 * 모든 접근은 try/catch. JSON 파싱·형태 검증 실패 시 null(=없음)로 취급한다.
 * SSR 안전: typeof window 체크. 변경 알림은 구독(subscribe)으로 같은 탭·다른 탭 모두 전파.
 */
import type { BirthInput, EngineOptions, SajuChart } from "@/lib/saju/types";
import type { AskResponse } from "@/lib/ai/types";

export const STORAGE_PREFIX = "gyeol:";

export const KEYS = {
  profile: "gyeol:profile",
  settings: "gyeol:settings",
  chart: "gyeol:chart",
  chat: "gyeol:chat",
  today: (date: string) => `gyeol:today:${date}`,
} as const;

/** 동의 문구가 바뀌면 올린다 */
export const CONSENT_VERSION = "2026-10-03";

export interface StoredProfile {
  birth: BirthInput;
  /** 별칭(선택). 실명 요구 금지 */
  nickname: string;
  /** 출생지 선택값. 도시명 또는 'abroad'(해외/모름 → 서울 경도로 계산) */
  placeChoice: string;
  consent: { agreed: true; version: string; at: string };
  aiEnabled: boolean;
  createdAt: string;
}

export interface StoredSettings {
  dayBoundary: EngineOptions["dayBoundary"];
}

export const DEFAULT_SETTINGS: StoredSettings = { dayBoundary: "zi-23" };

export interface ChartCache {
  /** 계산 입력 지문(JSON) */
  inputKey: string;
  engineVersion: string;
  savedAt: string;
  chart: SajuChart;
}

export interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
  /** assistant 메시지일 때 응답 메타 전체 */
  response?: AskResponse;
}

export interface TodayRecord {
  actionDone: boolean;
  /** 30초 피드백: 맞아요 / 글쎄요 */
  feedback: "yes" | "meh" | null;
  actionId?: string;
  updatedAt?: string;
}

export const EMPTY_TODAY: TodayRecord = { actionDone: false, feedback: null };

// ───────────────────────── 형태 검증 ─────────────────────────

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isProfile(v: unknown): v is StoredProfile {
  if (!isObj(v) || !isObj(v.birth)) return false;
  const b = v.birth;
  return (
    typeof b.date === "string" &&
    (b.time === null || typeof b.time === "string") &&
    typeof v.nickname === "string" &&
    typeof v.aiEnabled === "boolean" &&
    isObj(v.consent) &&
    v.consent.agreed === true
  );
}

export function isSettings(v: unknown): v is StoredSettings {
  return isObj(v) && (v.dayBoundary === "zi-23" || v.dayBoundary === "midnight");
}

export function isChartCache(v: unknown): v is ChartCache {
  return isObj(v) && typeof v.inputKey === "string" && typeof v.engineVersion === "string" && isObj(v.chart);
}

export function isChat(v: unknown): v is ChatEntry[] {
  return (
    Array.isArray(v) &&
    v.every(
      (e) =>
        isObj(e) &&
        typeof e.id === "string" &&
        (e.role === "user" || e.role === "assistant") &&
        typeof e.content === "string",
    )
  );
}

export function isTodayRecord(v: unknown): v is TodayRecord {
  return (
    isObj(v) &&
    typeof v.actionDone === "boolean" &&
    (v.feedback === null || v.feedback === "yes" || v.feedback === "meh")
  );
}

// ───────────────────────── 저수준 접근 ─────────────────────────

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* 구독자 오류는 무시 */
    }
  });
}

/** useSyncExternalStore 용 구독. 다른 탭의 변경(storage 이벤트)도 전파 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith(STORAGE_PREFIX)) listener();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export function readRaw(key: string): string | null {
  const s = storage();
  if (!s) return null;
  try {
    return s.getItem(key);
  } catch {
    return null;
  }
}

export function parseJSON<T>(raw: string | null, guard: (v: unknown) => v is T): T | null {
  if (raw === null) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return guard(v) ? v : null;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, guard: (v: unknown) => v is T): T | null {
  return parseJSON(readRaw(key), guard);
}

/** 저장 성공 여부 반환(용량 초과·사파리 비공개 모드 등에서 false) */
export function writeJSON(key: string, value: unknown): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(key, JSON.stringify(value));
    emit();
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(key);
  } catch {
    /* 무시 */
  }
  emit();
}

/** 'gyeol:' 로 시작하는 키 목록 */
export function listKeys(): string[] {
  const s = storage();
  if (!s) return [];
  const out: string[] = [];
  try {
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) out.push(k);
    }
  } catch {
    /* 무시 */
  }
  return out.sort();
}

/** 이 서비스가 저장한 모든 데이터 삭제 (한 번에 전부) */
export function clearAll(): void {
  const s = storage();
  if (!s) return;
  for (const k of listKeys()) {
    try {
      s.removeItem(k);
    } catch {
      /* 무시 */
    }
  }
  emit();
}

/** '내 데이터 보기'용 전체 덤프 (파싱 실패 값은 원문 문자열) */
export function dumpAll(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of listKeys()) {
    const raw = readRaw(k);
    if (raw === null) continue;
    try {
      out[k] = JSON.parse(raw);
    } catch {
      out[k] = raw;
    }
  }
  return out;
}

/** 저장 상태 서명(덤프 화면 갱신용) — 모든 gyeol: 키·값의 djb2 해시. 빈 저장소도 비어 있지 않은 문자열 */
export function storageSignature(): string {
  let h = 5381;
  for (const k of listKeys()) {
    const s = `${k}=${readRaw(k) ?? ""};`;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return `s${h >>> 0}`;
}

// ───────────────────────── 도메인 헬퍼 ─────────────────────────

/** 프로필 + 설정 → 엔진 입력 */
export function toEngineInput(profile: StoredProfile, settings: StoredSettings): BirthInput {
  return {
    ...profile.birth,
    options: { ...(profile.birth.options ?? {}), dayBoundary: settings.dayBoundary },
  };
}

export function chartInputKey(input: BirthInput): string {
  return JSON.stringify(input);
}
