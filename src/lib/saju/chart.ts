/**
 * 만세력 계산 엔진 진입점. 결정적(deterministic): 같은 입력 → 같은 출력.
 *
 * 흐름: 입력 검증 → 시간 해석(표준시·서머타임·경도 보정·일주 경계) → 절기 기준 년·월주
 *      → JDN 일주 → 시주 → 요약 지표(오행·십성·신강약) → 대운 → 경고·근거(Fact)
 */
import { dayGanzhiIndexFromJDN, jdnFromYMD, MS_PER_MINUTE, parseDate } from "./calendar";
import { buildFacts } from "./facts";
import {
  ganzhiIndex,
  hourStemIndex,
  makeGanzhi,
  mod,
  monthStemIndex,
  stemIndex,
  stemKo,
  tenGod,
  tenGodOfBranch,
} from "./ganzhi";
import { computeLuck } from "./luck";
import {
  getSolarTerms as getSolarTermsImpl,
  monthBranchIndexOfTerm,
  surroundingBoundaries,
  type SolarTermInternal,
  toPublicTerm,
} from "./solar-terms";
import { computeStrength, summarizeElements, summarizeTenGods } from "./strength";
import { DEFAULT_LONGITUDE, hourBranchIndex, resolveTime } from "./time-rules";
import {
  CITIES,
  DEFAULT_ENGINE_OPTIONS,
  type BirthInput,
  type EngineOptions,
  type GanZhi,
  type Pillar,
  type PillarKey,
  type SajuChart,
  type SolarTermInfo,
  type Stem,
} from "./types";

export const ENGINE_VERSION = "0.1.0";

export const DAY_MASTER_NICKNAME: Record<Stem, string> = {
  甲: "큰 나무(갑목)",
  乙: "풀과 덩굴(을목)",
  丙: "태양 같은 불(병화)",
  丁: "등불 같은 불(정화)",
  戊: "넓은 산(무토)",
  己: "기름진 밭(기토)",
  庚: "단단한 쇠(경금)",
  辛: "다듬어진 보석(신금)",
  壬: "큰 강과 바다(임수)",
  癸: "이슬과 빗물(계수)",
};

const NEAR_BOUNDARY_HOURS = 12;
const MS_PER_HOUR = 3_600_000;

function mergeOptions(partial: Partial<EngineOptions> | undefined): EngineOptions {
  const out: EngineOptions = { ...DEFAULT_ENGINE_OPTIONS };
  if (partial) {
    if (partial.dayBoundary !== undefined) out.dayBoundary = partial.dayBoundary;
    if (partial.longitudeCorrection !== undefined) out.longitudeCorrection = partial.longitudeCorrection;
    if (partial.historicalTimeRules !== undefined) out.historicalTimeRules = partial.historicalTimeRules;
  }
  if (out.dayBoundary !== "zi-23" && out.dayBoundary !== "midnight") {
    throw new Error(`일주 경계 옵션이 올바르지 않습니다: ${String(out.dayBoundary)}`);
  }
  return out;
}

/** 실제 UTC 순간 기준 절기 판정 → 사주년, 년·월 간지, 직전/직후 절 */
function yearMonthAt(utcMs: number, approxYear: number) {
  const { prev, next, lastIpchun } = surroundingBoundaries(utcMs, approxYear);
  const sajuYear = lastIpchun.year;
  const yStem = mod(sajuYear - 4, 10);
  const yBranch = mod(sajuYear - 4, 12);
  const year = makeGanzhi(ganzhiIndex(yStem, yBranch));
  const mBranch = monthBranchIndexOfTerm(prev.longitude);
  const month = makeGanzhi(ganzhiIndex(monthStemIndex(yStem, mBranch), mBranch));
  return { sajuYear, year, month, prev, next };
}

function makePillar(key: PillarKey, g: GanZhi, dayStem: Stem): Pillar {
  return {
    ...g,
    key,
    stemTenGod: key === "day" ? null : tenGod(dayStem, g.stem),
    branchTenGod: tenGodOfBranch(dayStem, g.branch),
  };
}

function placeNameOf(input: BirthInput, longitude: number): string {
  if (input.placeName) return input.placeName;
  const city = CITIES.find((c) => Math.abs(c.longitude - longitude) < 1e-6);
  return city ? city.name : `동경 ${longitude}°`;
}

/** 출생 정보 → 사주 원국 전체 JSON */
export function computeChart(input: BirthInput): SajuChart {
  if (!input || typeof input !== "object") throw new Error("출생 정보가 비어 있습니다");
  const { y } = parseDate(input.date);
  if (input.time !== null && typeof input.time !== "string") {
    throw new Error("출생 시간은 'HH:mm' 문자열이거나 null 이어야 합니다");
  }
  if (input.gender !== null && !["female", "male", "other"].includes(input.gender as string)) {
    throw new Error(`성별 값이 올바르지 않습니다: ${String(input.gender)}`);
  }
  const longitude = input.longitude ?? DEFAULT_LONGITUDE;
  if (typeof longitude !== "number" || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error(`출생지 경도가 올바르지 않습니다: ${String(input.longitude)}`);
  }
  const options = mergeOptions(input.options);

  const t = resolveTime(input.date, input.time, longitude, options);
  const warnings = [...t.warnings];
  if (longitude < 124 || longitude > 132) {
    warnings.push("출생지 경도가 한반도 범위를 벗어나 시간 보정 정확도가 떨어질 수 있습니다");
  }

  // 년·월주: 실제 순간(UTC)과 절입 시각 비교
  const ym = yearMonthAt(t.utcMs, y);
  // 일주: 보정·경계 적용 후 사주 날짜의 JDN
  const dayG = makeGanzhi(dayGanzhiIndexFromJDN(t.dayJdn));
  const dayStem = dayG.stem;
  // 시주
  let hourG: GanZhi | null = null;
  if (t.solarMinutes !== null) {
    const hb = hourBranchIndex(t.solarMinutes);
    // 자정 규칙('midnight')에서 23시 이후(야자시)는 일주는 당일로 두되 시주 천간은 다음 날 일간 기준(야자시법).
    // 정자시 규칙('zi-23')은 일주 자체가 다음 날로 넘어가므로 당일 일간을 그대로 쓴다.
    const lateZi = options.dayBoundary === "midnight" && t.solarMinutes >= 23 * 60;
    const stemForHour = lateZi ? mod(stemIndex(dayStem) + 1, 10) : stemIndex(dayStem);
    hourG = makeGanzhi(ganzhiIndex(hourStemIndex(stemForHour, hb), hb));
    if (lateZi) warnings.push("야자시(23시 이후) 출생: 일주는 당일, 시주 천간은 다음 날 일간 기준으로 계산했습니다(야자시법)");
  }

  const pillars: SajuChart["pillars"] = {
    year: makePillar("year", ym.year, dayStem),
    month: makePillar("month", ym.month, dayStem),
    day: makePillar("day", dayG, dayStem),
    hour: hourG ? makePillar("hour", hourG, dayStem) : null,
  };
  const pillarList = [pillars.year, pillars.month, pillars.day, ...(pillars.hour ? [pillars.hour] : [])];

  const { raw: rawElements, ...elements } = summarizeElements(pillarList);
  void rawElements; // 내부 가중 합계는 공개 계약(ElementSummary)에 포함하지 않는다
  const tenGods = summarizeTenGods(pillarList, dayStem);
  const strength = computeStrength(pillarList, dayStem);

  // 절기 경계
  const dPrev = (t.utcMs - ym.prev.utcMs) / MS_PER_HOUR;
  const dNext = (ym.next.utcMs - t.utcMs) / MS_PER_HOUR;
  const nearestTerm: SolarTermInternal = dPrev <= dNext ? ym.prev : ym.next;
  const hoursToNearest = Math.round(Math.min(dPrev, dNext) * 10) / 10;
  const nearBoundary = hoursToNearest <= NEAR_BOUNDARY_HOURS;
  if (t.resolved.hourKnown) {
    if (nearBoundary) {
      warnings.push(
        `절기 경계와 ${hoursToNearest < 1 ? "1시간 이내" : `약 ${hoursToNearest}시간`} 차이라 월주가 바뀔 수 있습니다(출생 시각을 다시 확인해 주세요)`,
      );
      if (nearestTerm.longitude === 315) warnings.push("입춘 경계 근처라 년주도 함께 바뀔 수 있습니다");
    }
  } else if (hoursToNearest <= 24) {
    warnings.push(
      `출생 시간을 모르는데 절기 경계(${nearestTerm.name})와 가까운 날이라 실제 출생 시각에 따라 월주${nearestTerm.longitude === 315 ? "·년주" : ""}가 달라질 수 있습니다`,
    );
  }

  const luckCycles = computeLuck({
    gender: input.gender,
    yearStem: ym.year.stem,
    yearStemPolarity: ym.year.stemPolarity,
    monthGanzhi: ym.month,
    dayStem,
    birthUtcMs: t.utcMs,
    prevTerm: ym.prev,
    nextTerm: ym.next,
    sajuYear: ym.sajuYear,
    hourKnown: t.resolved.hourKnown,
  });

  const chartNoFacts: Omit<SajuChart, "facts"> = {
    engineVersion: ENGINE_VERSION,
    input: {
      ...input,
      ...(input.options ? { options: { ...input.options } } : {}),
    },
    options,
    resolved: t.resolved,
    pillars,
    dayMaster: {
      stem: dayStem,
      ko: stemKo(dayStem),
      element: dayG.stemElement,
      polarity: dayG.stemPolarity,
      nickname: DAY_MASTER_NICKNAME[dayStem],
    },
    elements,
    tenGods,
    strength,
    solarTerms: {
      monthTerm: toPublicTerm(ym.prev),
      nextMonthTerm: toPublicTerm(ym.next),
      hoursToNearestBoundary: hoursToNearest,
      nearBoundary,
    },
    luckCycles,
    warnings,
  };
  const facts = buildFacts(chartNoFacts, {
    placeName: placeNameOf(input, longitude),
    prevTerm: ym.prev,
    nextTerm: ym.next,
    nearestTerm,
  });
  return { ...chartNoFacts, facts };
}

/** 해당 양력 연도의 24절기 절입 시각(KST). 입춘부터가 아니라 소한(1월)부터 시간순 */
export function getSolarTerms(year: number): SolarTermInfo[] {
  return getSolarTermsImpl(year);
}

/** 임의 날짜(KST 'YYYY-MM-DD')의 일진 간지. 자정 기준(일진 조회용) */
export function ganzhiOfDate(date: string): GanZhi {
  const { y, m, d } = parseDate(date);
  return makeGanzhi(dayGanzhiIndexFromJDN(jdnFromYMD(y, m, d)));
}

/** 임의 날짜(KST)의 년·월 간지 (절기 기준, KST 정오 시점으로 판정) */
export function yearMonthGanzhiOfDate(date: string): { year: GanZhi; month: GanZhi } {
  const { y, m, d } = parseDate(date);
  const utcMs = Date.UTC(y, m - 1, d, 12) - 540 * MS_PER_MINUTE;
  const ym = yearMonthAt(utcMs, y);
  return { year: ym.year, month: ym.month };
}
