/**
 * 한국 시간 규칙: 역사적 표준시 오프셋, 서머타임, 경도(평균태양시) 보정, 일주 경계.
 * 시계 시각(입력) → 실제 UTC 순간 → 평균태양시(사주 판정용) 로 변환한다.
 */
import type { EngineOptions, ResolvedTime } from "./types";
import {
  formatIsoWithOffset,
  formatLocalMinute,
  formatUtcIso,
  jdnOfLocalMs,
  localMs,
  minutesOfDay,
  MS_PER_MINUTE,
  parseDate,
  parseTime,
} from "./calendar";

export const DEFAULT_LONGITUDE = 126.978;

/** [시작, 끝) 구간을 로컬 벽시계 'YYYY-MM-DDTHH:mm' 로 표기 */
interface ClockRange {
  from: string;
  to: string;
}

/**
 * 표준시 오프셋(분). 범위 밖(1908-04-01 이전)은 510 으로 간주.
 * 1908-04-01~1911-12-31 +8:30, 1912-01-01~1954-03-20 +9, 1954-03-21~1961-08-09 +8:30, 1961-08-10~ +9
 */
const STANDARD_OFFSETS: Array<ClockRange & { offset: number }> = [
  { from: "1908-04-01T00:00", to: "1912-01-01T00:00", offset: 510 },
  { from: "1912-01-01T00:00", to: "1954-03-21T00:00", offset: 540 },
  { from: "1954-03-21T00:00", to: "1961-08-10T00:00", offset: 510 },
  { from: "1961-08-10T00:00", to: "9999-12-31T00:00", offset: 540 },
];

/**
 * 서머타임(+60분) 기간. 시계(당시 표기) 기준, [from, to).
 * 한국천문연구원/위키 자료 기준, 1948~1960 구간 일자는 재검증 필요.
 * (일자만 알려진 구간은 시작일 00:00 ~ 종료일 다음날 00:00 로 처리)
 */
const DST_RANGES: ClockRange[] = [
  { from: "1948-06-01T00:00", to: "1948-09-13T00:00" },
  { from: "1949-04-03T00:00", to: "1949-09-11T00:00" },
  { from: "1950-04-01T00:00", to: "1950-09-10T00:00" },
  { from: "1951-05-06T00:00", to: "1951-09-09T00:00" },
  { from: "1955-05-05T00:00", to: "1955-09-09T00:00" },
  { from: "1956-05-20T00:00", to: "1956-09-30T00:00" },
  { from: "1957-05-05T00:00", to: "1957-09-22T00:00" },
  { from: "1958-05-04T00:00", to: "1958-09-21T00:00" },
  { from: "1959-05-03T00:00", to: "1959-09-20T00:00" },
  { from: "1960-05-01T00:00", to: "1960-09-18T00:00" },
  { from: "1987-05-10T02:00", to: "1987-10-11T03:00" },
  { from: "1988-05-08T02:00", to: "1988-10-09T03:00" },
];

export const WARN_PRE_1908 = "1908년 이전 출생은 표준시 기록이 불확실합니다";
export const WARN_DST = "서머타임 기간 출생으로 1시간을 보정했습니다";
export const WARN_HOUR_UNKNOWN = "출생 시간 미상으로 시주를 생략했습니다";
export const WARN_ROLLED = "야자시(23시 이후) 출생으로 일주를 다음 날로 계산했습니다(정자시법)";

function inRange(clock: string, r: ClockRange): boolean {
  return clock >= r.from && clock < r.to;
}

export function standardOffsetMinutes(clockLocal: string): number {
  const hit = STANDARD_OFFSETS.find((r) => inRange(clockLocal, r));
  return hit ? hit.offset : 510;
}

export function isDst(clockLocal: string): boolean {
  return DST_RANGES.some((r) => inRange(clockLocal, r));
}

export const WARN_DST_GAP =
  "서머타임 시작 전환 시각(건너뛴 1시간) 구간의 시계 시각이라 실제 시각이 1시간 다를 수 있습니다";
export const WARN_DST_OVERLAP =
  "서머타임 종료 전환 시각(두 번 존재하는 1시간) 구간이라 시계 시각이 모호합니다(서머타임 적용으로 계산)";

function plusMinutes(local: string, minutes: number): string {
  return formatLocalMinute(Date.parse(`${local}:00Z`) + minutes * MS_PER_MINUTE);
}

/** 서머타임 전환(시작: 건너뛴 1시간 / 종료: 중복 1시간) 구간이면 경고 문구, 아니면 null */
export function dstTransitionWarning(clockLocal: string): string | null {
  for (const r of DST_RANGES) {
    if (clockLocal >= r.from && clockLocal < plusMinutes(r.from, 60)) return WARN_DST_GAP;
    if (clockLocal >= plusMinutes(r.to, -60) && clockLocal < r.to) return WARN_DST_OVERLAP;
  }
  return null;
}

/** 표준자오선(도): UTC+9 → 135, UTC+8:30 → 127.5 */
export function standardMeridian(offsetMinutes: number): number {
  return offsetMinutes / 4;
}

export interface TimeResolution {
  resolved: ResolvedTime;
  /** 출생 순간 UTC 밀리초 (시간 미상이면 12:00 가정) */
  utcMs: number;
  /** 평균태양시(가상 UTC 밀리초) */
  solarMs: number;
  /** 일주 판정용 날짜 JDN (경계 규칙 적용 후) */
  dayJdn: number;
  /** 평균태양시 자정 이후 분. 시간 미상이면 null */
  solarMinutes: number | null;
  warnings: string[];
}

export function resolveTime(
  date: string,
  time: string | null,
  longitude: number,
  options: EngineOptions,
): TimeResolution {
  const { y, m, d } = parseDate(date);
  const hourKnown = time !== null && time !== undefined;
  const clockMinutes = hourKnown ? parseTime(time as string) : 12 * 60;
  const clockMs = localMs(y, m, d, clockMinutes);
  const clockLocal = formatLocalMinute(clockMs);
  const warnings: string[] = [];

  let offset = 540;
  let dst = 0;
  if (options.historicalTimeRules) {
    offset = standardOffsetMinutes(clockLocal);
    if (clockLocal < "1908-04-01T00:00") warnings.push(WARN_PRE_1908);
    if (isDst(clockLocal)) {
      dst = 60;
      warnings.push(WARN_DST);
    }
    if (hourKnown) {
      const transition = dstTransitionWarning(clockLocal);
      if (transition) warnings.push(transition);
    }
  }
  const lonCorr = options.longitudeCorrection
    ? Math.round((longitude - standardMeridian(offset)) * 4)
    : 0;
  const total = lonCorr - dst;

  const utcMs = clockMs - (offset + dst) * MS_PER_MINUTE;
  const solarMs = clockMs + total * MS_PER_MINUTE;
  const solarMinutes = minutesOfDay(solarMs);

  let dayJdn = jdnOfLocalMs(solarMs);
  let rolled = false;
  if (hourKnown && options.dayBoundary === "zi-23" && solarMinutes >= 23 * 60) {
    dayJdn += 1;
    rolled = true;
    warnings.push(WARN_ROLLED);
  }
  if (!hourKnown) warnings.push(WARN_HOUR_UNKNOWN);

  const resolved: ResolvedTime = {
    civilISO: formatIsoWithOffset(utcMs, offset + dst),
    utcISO: formatUtcIso(utcMs),
    solarLocal: formatLocalMinute(solarMs),
    standardOffsetMinutes: offset,
    dstMinutes: dst,
    longitudeCorrectionMinutes: lonCorr,
    totalCorrectionMinutes: total,
    hourKnown,
    dayBoundaryRule: options.dayBoundary,
    rolledToNextDay: rolled,
  };
  return { resolved, utcMs, solarMs, dayJdn, solarMinutes: hourKnown ? solarMinutes : null, warnings };
}

/** 평균태양시 분 → 시지 인덱스 (子 23:00~00:59 = 0) */
export function hourBranchIndex(solarMinutes: number): number {
  return Math.floor(((solarMinutes + 60) % (24 * 60)) / 120);
}
