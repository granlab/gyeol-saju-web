/**
 * 테스트 픽스처. chart.ts(스텁)는 쓰지 않고 types.ts 계약대로 직접 구성한다.
 * 값은 형태 검증용이며 실제 만세력 결과와 무관하다.
 */
import { makeGanzhi, tenGod, tenGodOfBranch } from "@/lib/saju/ganzhi";
import type { PatternCard, Pillar, PillarKey, SajuChart, TodayFlow } from "@/lib/saju/types";
import type { AskRequest } from "../types";

const DAY_INDEX = 0; // 甲子

function pillar(key: PillarKey, index: number): Pillar {
  const g = makeGanzhi(index);
  const dm = makeGanzhi(DAY_INDEX).stem;
  return {
    ...g,
    key,
    stemTenGod: key === "day" ? null : tenGod(dm, g.stem),
    branchTenGod: tenGodOfBranch(dm, g.branch),
  };
}

export function makeChart(): SajuChart {
  return {
    engineVersion: "test",
    input: { date: "1990-01-01", time: "12:00", gender: "female" },
    options: { dayBoundary: "zi-23", longitudeCorrection: true, historicalTimeRules: true },
    resolved: {
      civilISO: "1990-01-01T12:00:00+09:00",
      utcISO: "1990-01-01T03:00:00Z",
      solarLocal: "1990-01-01T11:28",
      standardOffsetMinutes: 540,
      dstMinutes: 0,
      longitudeCorrectionMinutes: -32,
      totalCorrectionMinutes: -32,
      hourKnown: true,
      dayBoundaryRule: "zi-23",
      rolledToNextDay: false,
    },
    pillars: { year: pillar("year", 5), month: pillar("month", 13), day: pillar("day", DAY_INDEX), hour: pillar("hour", 6) },
    dayMaster: { stem: "甲", ko: "갑", element: "wood", polarity: "yang", nickname: "큰 나무(갑목)" },
    elements: {
      counts: { wood: 3, fire: 1, earth: 2, metal: 0, water: 2 },
      weighted: { wood: 35, fire: 15, earth: 25, metal: 0, water: 25 },
      dominant: ["wood"],
      missing: ["metal"],
      weakest: "metal",
    },
    tenGods: {
      byGroup: { 비겁: 35, 식상: 15, 재성: 25, 관성: 0, 인성: 25 },
      dominantGroup: "비겁",
      weakestGroup: "관성",
      list: [],
    },
    strength: { score: 62, label: "신강", factors: ["월지가 일간을 돕습니다"] },
    solarTerms: {
      monthTerm: { name: "대설", hanja: "大雪", longitude: 255, at: "1989-12-07T12:00:00+09:00", isMonthBoundary: true },
      nextMonthTerm: { name: "소한", hanja: "小寒", longitude: 285, at: "1990-01-05T23:00:00+09:00", isMonthBoundary: true },
      hoursToNearestBoundary: 107,
      nearBoundary: false,
    },
    luckCycles: { direction: "backward", startAge: 3, note: "테스트", cycles: [] },
    warnings: [],
    facts: [
      { id: "pillar.day", text: "일주는 甲子(갑자)입니다.", source: "engine" },
      { id: "daymaster", text: "일간은 甲(갑목), 큰 나무입니다.", source: "engine" },
      { id: "element.dominant", text: "목(木) 기운이 가장 많습니다.", source: "engine" },
      { id: "element.missing", text: "금(金) 기운이 없습니다.", source: "engine" },
      { id: "tengod.dominant", text: "비겁 그룹이 가장 많습니다.", source: "engine" },
      { id: "strength", text: "신강(62점)으로 판정됩니다.", source: "engine" },
      { id: "luck.current", text: "현재 대운은 丙寅(병인)입니다.", source: "engine" },
    ],
  };
}

function card(id: string, category: PatternCard["category"], headline: string, factIds: string[]): PatternCard {
  return {
    id,
    category,
    title: `${id} 카드`,
    headline,
    body: `${headline}의 성향으로 읽힙니다. 상황에 따라 다르게 드러날 수 있습니다.`,
    strength: 2,
    tags: [id],
    why: {
      structure: ["일간 甲"],
      rule: `${id} 규칙: 일간과 주변 기운의 관계를 본다`,
      context: "일상에서는 이렇게 보일 수 있어요.",
      suggestion: `${id} 관점에서 오늘 한 가지를 메모해 보기`,
      caveat: "전통 명리 관점의 해석이며 확정적 예측이 아닙니다.",
      factIds,
    },
  };
}

export function makePatterns(): PatternCard[] {
  return [
    card("day-master", "self", "밖으로 뻗는 큰 나무", ["daymaster", "pillar.day"]),
    card("element-balance", "balance", "나무가 많고 쇠가 비어 있는 구성", ["element.dominant", "element.missing"]),
    card("energy-style", "energy", "스스로 밀고 나가는 에너지", ["tengod.dominant"]),
    card("social-role", "social", "앞장서서 길을 여는 역할", ["tengod.dominant", "not.a.fact"]),
    card("strength", "self", "버티는 힘이 강한 편", ["strength"]),
    card("luck-cycle", "cycle", "표현이 늘어나는 대운", ["luck.current"]),
  ];
}

export function makeToday(): TodayFlow {
  return {
    date: "2026-10-03",
    dayGanzhi: makeGanzhi(10),
    monthGanzhi: makeGanzhi(46),
    yearGanzhi: makeGanzhi(42),
    dayTenGod: "비견",
    dayTenGodGroup: "비겁",
    currentLuck: null,
    headline: "말하기보다 듣는 날",
    scores: { relation: 60, work: 50, self: 70 },
    action: { id: "listen", text: "대화에서 먼저 질문 하나 던지기" },
    why: { structure: ["오늘 일진 甲戌"], rule: "오늘 천간이 일간과 같은 기운이다", caveat: "확정적 예측이 아닙니다.", factIds: ["today.day", "today.tengod"] },
    facts: [
      { id: "today.day", text: "오늘 일진은 甲戌(갑술)입니다.", source: "engine" },
      { id: "today.tengod", text: "오늘 천간은 일간 기준 비견입니다.", source: "rule" },
    ],
  };
}

export function makeRequest(question: string, extra: Partial<AskRequest> = {}): AskRequest {
  return { question, history: [], chart: makeChart(), patterns: makePatterns(), today: makeToday(), ...extra };
}

export function allFactIds(req: AskRequest): string[] {
  return [...req.chart.facts.map((f) => f.id), ...req.today.facts.map((f) => f.id)];
}
