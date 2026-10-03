/**
 * 그레고리력 날짜 산술. 율리우스일(JDN)·일진 인덱스·로컬 시각 포맷.
 * 내부적으로 "로컬 벽시계 시각"은 Date.UTC 로 만든 밀리초(가상 UTC)로 다룬다.
 */
import { mod } from "./ganzhi";

export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;

export interface YMD {
  y: number;
  m: number;
  d: number;
}

/** 그레고리력 → JDN (정오 기준 정수 율리우스일) */
export function jdnFromYMD(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

/** JDN → 그레고리력 */
export function ymdFromJDN(jdn: number): YMD {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    d: e - Math.floor((153 * m + 2) / 5) + 1,
    m: m + 3 - 12 * Math.floor(m / 10),
    y: 100 * b + d - 4800 + Math.floor(m / 10),
  };
}

/** 육십갑자 일진 인덱스 (甲子=0). 2000-01-01 → 54(戊午) */
export function dayGanzhiIndexFromJDN(jdn: number): number {
  return mod(jdn + 49, 60);
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})$/;

/** 'YYYY-MM-DD' 파싱 + 검증. 실패 시 한국어 메시지로 throw */
export function parseDate(date: string, minYear = 1900, maxYear = 2100): YMD {
  const m = typeof date === "string" ? DATE_RE.exec(date) : null;
  if (!m) throw new Error(`날짜 형식이 올바르지 않습니다(YYYY-MM-DD): ${String(date)}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < minYear || y > maxYear) {
    throw new Error(`지원 범위(${minYear}~${maxYear}년)를 벗어난 날짜입니다: ${date}`);
  }
  if (mo < 1 || mo > 12) throw new Error(`존재하지 않는 월입니다: ${date}`);
  const back = ymdFromJDN(jdnFromYMD(y, mo, d));
  if (d < 1 || back.y !== y || back.m !== mo || back.d !== d) {
    throw new Error(`존재하지 않는 날짜입니다: ${date}`);
  }
  return { y, m: mo, d };
}

/** 'HH:mm' → 자정 이후 분. 실패 시 한국어 메시지로 throw */
export function parseTime(time: string): number {
  const m = typeof time === "string" ? TIME_RE.exec(time) : null;
  if (!m) throw new Error(`시간 형식이 올바르지 않습니다(HH:mm): ${String(time)}`);
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) throw new Error(`존재하지 않는 시각입니다: ${time}`);
  return h * 60 + mi;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 가상 UTC 밀리초(로컬 벽시계) → 'YYYY-MM-DDTHH:mm' */
export function formatLocalMinute(ms: number): string {
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}T${pad2(
    dt.getUTCHours(),
  )}:${pad2(dt.getUTCMinutes())}`;
}

/** 실제 UTC 밀리초 + 오프셋(분) → ISO 'YYYY-MM-DDTHH:mm:00+HH:MM' */
export function formatIsoWithOffset(utcMs: number, offsetMinutes: number): string {
  const local = formatLocalMinute(utcMs + offsetMinutes * MS_PER_MINUTE);
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  return `${local}:00${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

export function formatUtcIso(utcMs: number): string {
  return `${formatLocalMinute(utcMs)}:00Z`;
}

/** 로컬 벽시계 → 가상 UTC 밀리초 */
export function localMs(y: number, m: number, d: number, minutes: number): number {
  return Date.UTC(y, m - 1, d) + minutes * MS_PER_MINUTE;
}

/** 가상 UTC 밀리초 → 그 로컬 날짜의 JDN */
export function jdnOfLocalMs(ms: number): number {
  const dt = new Date(ms);
  return jdnFromYMD(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** 가상 UTC 밀리초 → 자정 이후 분 */
export function minutesOfDay(ms: number): number {
  const dt = new Date(ms);
  return dt.getUTCHours() * 60 + dt.getUTCMinutes();
}
