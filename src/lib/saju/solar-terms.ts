/**
 * 24절기 절입 시각 계산.
 * Meeus《Astronomical Algorithms》25장 태양 위치 저정밀(low accuracy) 식으로 겉보기 황경을 구하고,
 * 황경이 15°의 배수를 지나는 순간을 뉴턴 반복으로 찾는다. ΔT 는 Espenak–Meeus 다항식 근사.
 * 결과는 분 단위로 반올림한다(저정밀 식 자체 오차 ~0.01° ≈ 15분 이내).
 */
import type { SolarTermInfo } from "./types";
import { formatIsoWithOffset, MS_PER_DAY, MS_PER_MINUTE } from "./calendar";

interface TermDef {
  name: string;
  hanja: string;
  longitude: number;
  isMonthBoundary: boolean;
}

/** 소한부터 양력 1년 순서 */
export const TERM_DEFS: readonly TermDef[] = [
  { name: "소한", hanja: "小寒", longitude: 285, isMonthBoundary: true },
  { name: "대한", hanja: "大寒", longitude: 300, isMonthBoundary: false },
  { name: "입춘", hanja: "立春", longitude: 315, isMonthBoundary: true },
  { name: "우수", hanja: "雨水", longitude: 330, isMonthBoundary: false },
  { name: "경칩", hanja: "驚蟄", longitude: 345, isMonthBoundary: true },
  { name: "춘분", hanja: "春分", longitude: 0, isMonthBoundary: false },
  { name: "청명", hanja: "淸明", longitude: 15, isMonthBoundary: true },
  { name: "곡우", hanja: "穀雨", longitude: 30, isMonthBoundary: false },
  { name: "입하", hanja: "立夏", longitude: 45, isMonthBoundary: true },
  { name: "소만", hanja: "小滿", longitude: 60, isMonthBoundary: false },
  { name: "망종", hanja: "芒種", longitude: 75, isMonthBoundary: true },
  { name: "하지", hanja: "夏至", longitude: 90, isMonthBoundary: false },
  { name: "소서", hanja: "小暑", longitude: 105, isMonthBoundary: true },
  { name: "대서", hanja: "大暑", longitude: 120, isMonthBoundary: false },
  { name: "입추", hanja: "立秋", longitude: 135, isMonthBoundary: true },
  { name: "처서", hanja: "處暑", longitude: 150, isMonthBoundary: false },
  { name: "백로", hanja: "白露", longitude: 165, isMonthBoundary: true },
  { name: "추분", hanja: "秋分", longitude: 180, isMonthBoundary: false },
  { name: "한로", hanja: "寒露", longitude: 195, isMonthBoundary: true },
  { name: "상강", hanja: "霜降", longitude: 210, isMonthBoundary: false },
  { name: "입동", hanja: "立冬", longitude: 225, isMonthBoundary: true },
  { name: "소설", hanja: "小雪", longitude: 240, isMonthBoundary: false },
  { name: "대설", hanja: "大雪", longitude: 255, isMonthBoundary: true },
  { name: "동지", hanja: "冬至", longitude: 270, isMonthBoundary: false },
];

const DEG = Math.PI / 180;
const J2000 = 2451545.0;
const UNIX_EPOCH_JD = 2440587.5;
const KST_OFFSET_MIN = 540;

function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

function norm180(x: number): number {
  const r = norm360(x);
  return r > 180 ? r - 360 : r;
}

/** 태양 겉보기 황경(도). jde = 역학시(TT) 율리우스일 */
export function apparentSolarLongitude(jde: number): number {
  const T = (jde - J2000) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = norm360(M) * DEG;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  const trueLon = L0 + C;
  const omega = (125.04 - 1934.136 * T) * DEG;
  return norm360(trueLon - 0.00569 - 0.00478 * Math.sin(omega));
}

/** ΔT(초) = TT − UT. Espenak & Meeus(NASA) 다항식의 간단형 */
export function deltaTSeconds(yearFraction: number): number {
  const y = yearFraction;
  if (y < 1900) {
    const t = y - 1860;
    return (
      7.62 + 0.5737 * t - 0.251754 * t ** 2 + 0.01680668 * t ** 3 - 0.0004473624 * t ** 4 + t ** 5 / 233174
    );
  }
  if (y < 1920) {
    const t = y - 1900;
    return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
  }
  if (y < 1941) {
    const t = y - 1920;
    return 21.2 + 0.84493 * t - 0.0761 * t ** 2 + 0.0020936 * t ** 3;
  }
  if (y < 1961) {
    const t = y - 1950;
    return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547;
  }
  if (y < 1986) {
    const t = y - 1975;
    return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718;
  }
  if (y < 2005) {
    const t = y - 2000;
    return (
      63.86 +
      0.3345 * t -
      0.060374 * t ** 2 +
      0.0017275 * t ** 3 +
      0.000651814 * t ** 4 +
      0.00002373599 * t ** 5
    );
  }
  if (y < 2050) {
    const t = y - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t ** 2;
  }
  const u = (y - 1820) / 100;
  return -20 + 32 * u * u - 0.5628 * (2150 - y);
}

/** 황경 target 을 지나는 TT 율리우스일 (guess 근처에서 뉴턴 반복) */
function solveLongitude(target: number, guessJde: number): number {
  let jde = guessJde;
  for (let i = 0; i < 60; i++) {
    const diff = norm180(target - apparentSolarLongitude(jde));
    jde += (diff * 365.2422) / 360;
    if (Math.abs(diff) < 1e-8) break;
  }
  return jde;
}

/** 엔진 내부용: 절입 시각을 실제 UTC 밀리초로 들고 있는 절기 */
export interface SolarTermInternal extends SolarTermInfo {
  /** 절입 시각 UTC 밀리초 (분 단위 반올림) */
  utcMs: number;
  /** 이 절기가 속한 양력 연도(getSolarTerms 인자) */
  year: number;
}

const cache = new Map<number, SolarTermInternal[]>();

/** 해당 양력 연도의 24절기(소한부터). 메모이즈. */
export function solarTermsInternal(year: number): SolarTermInternal[] {
  const hit = cache.get(year);
  if (hit) return hit;
  const jan6 = Date.UTC(year, 0, 6) / MS_PER_DAY + UNIX_EPOCH_JD;
  const out = TERM_DEFS.map((def, k) => {
    const jde = solveLongitude(def.longitude, jan6 + k * 15.2184);
    const dt = deltaTSeconds(year + (k + 0.5) / 24);
    const jdUt = jde - dt / 86400;
    const rawMs = (jdUt - UNIX_EPOCH_JD) * MS_PER_DAY;
    const utcMs = Math.round(rawMs / MS_PER_MINUTE) * MS_PER_MINUTE;
    return {
      name: def.name,
      hanja: def.hanja,
      longitude: def.longitude,
      at: formatIsoWithOffset(utcMs, KST_OFFSET_MIN),
      isMonthBoundary: def.isMonthBoundary,
      utcMs,
      year,
    };
  });
  cache.set(year, out);
  return out;
}

/** 공개 API 형태(SolarTermInfo 필드만) */
export function toPublicTerm(t: SolarTermInternal): SolarTermInfo {
  return { name: t.name, hanja: t.hanja, longitude: t.longitude, at: t.at, isMonthBoundary: t.isMonthBoundary };
}

/** 해당 양력 연도의 24절기 절입 시각(KST). 소한부터 시간순 */
export function getSolarTerms(year: number): SolarTermInfo[] {
  if (!Number.isInteger(year)) throw new Error(`연도는 정수여야 합니다: ${year}`);
  return solarTermsInternal(year).map(toPublicTerm);
}

/** utcMs 기준 직전 절(≤)·직후 절(>)과 직전 입춘 */
export function surroundingBoundaries(
  utcMs: number,
  approxYear: number,
): { prev: SolarTermInternal; next: SolarTermInternal; lastIpchun: SolarTermInternal } {
  const list = [approxYear - 1, approxYear, approxYear + 1].flatMap((y) =>
    solarTermsInternal(y).filter((t) => t.isMonthBoundary),
  );
  let idx = -1;
  for (let i = 0; i < list.length; i++) if (list[i].utcMs <= utcMs) idx = i;
  if (idx < 0 || idx + 1 >= list.length) throw new Error(`절기 탐색 범위를 벗어났습니다: ${approxYear}`);
  let lastIpchun: SolarTermInternal | undefined;
  for (let i = idx; i >= 0; i--) {
    if (list[i].longitude === 315) {
      lastIpchun = list[i];
      break;
    }
  }
  if (!lastIpchun) throw new Error(`입춘 탐색에 실패했습니다: ${approxYear}`);
  return { prev: list[idx], next: list[idx + 1], lastIpchun };
}

/** 절(월 경계) 황경 → 월지 인덱스 (입춘315→寅2, 경칩345→卯3, 소한285→丑1) */
export function monthBranchIndexOfTerm(longitude: number): number {
  const k = Math.round((longitude - 315) / 30);
  return (((2 + k) % 12) + 12) % 12;
}
