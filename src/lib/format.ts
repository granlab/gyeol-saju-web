/**
 * UI 전용 표기 유틸 (계산 로직 없음).
 */
import type { Element, TenGodGroup } from "@/lib/saju/types";

/** Tailwind 정적 클래스 (동적 문자열 조합 금지 — 빌드 시 스캔되도록 리터럴 유지) */
export const ELEMENT_BG: Record<Element, string> = {
  wood: "bg-wood",
  fire: "bg-fire",
  earth: "bg-earth",
  metal: "bg-metal",
  water: "bg-water",
};

export const TEN_GOD_GROUPS: TenGodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];

export const TEN_GOD_GROUP_DESC: Record<TenGodGroup, string> = {
  비겁: "나·동료",
  식상: "표현·생산",
  재성: "현실·관리",
  관성: "책임·규칙",
  인성: "배움·돌봄",
};

export const GENDER_KO: Record<"female" | "male" | "other", string> = {
  female: "여성",
  male: "남성",
  other: "기타",
};

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** KST 기준 'YYYY-MM-DD' */
export function kstDateKey(ms: number): string {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' → '2026년 10월 3일 (토)' */
export function formatDateKo(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return date;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return `${y}년 ${mo}월 ${d}일 (${WEEKDAY_KO[wd]})`;
}

/** 분 → '+1시간 2분' / '-32분' */
export function formatMinutes(min: number): string {
  if (!Number.isFinite(min) || min === 0) return "0분";
  const sign = min > 0 ? "+" : "-";
  const abs = Math.abs(Math.round(min));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h > 0 ? `${h}시간 ` : ""}${m > 0 || h === 0 ? `${m}분` : ""}`.trim();
}

/** 'YYYY-MM-DDTHH:mm' → 'YYYY년 M월 D일 HH:mm' */
export function formatLocalDateTime(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s);
  if (!m) return s;
  return `${Number(m[1])}년 ${Number(m[2])}월 ${Number(m[3])}일 ${m[4]}:${m[5]}`;
}

/** Fact id → 짧은 한국어 라벨 */
const FACT_LABELS: Record<string, string> = {
  "pillar.year": "년주",
  "pillar.month": "월주",
  "pillar.day": "일주",
  "pillar.hour": "시주",
  daymaster: "일간",
  "element.counts": "오행 개수",
  "element.dominant": "강한 오행",
  "element.missing": "없는 오행",
  "tengod.groups": "십성 분포",
  "tengod.dominant": "두드러진 십성",
  strength: "기운의 세기",
  "term.month": "월 절기",
  "term.boundary": "절기 경계",
  "time.correction": "시간 보정",
  "luck.direction": "대운 방향",
  "luck.current": "현재 대운",
  "today.day": "오늘 일진",
  "today.tengod": "오늘의 십성",
};

export function factLabel(id: string): string {
  return FACT_LABELS[id] ?? id;
}

export function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
