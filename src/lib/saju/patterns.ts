/**
 * 사주 구조 → 핵심 패턴 카드 (결정적 규칙 엔진). LLM 호출 없음.
 *
 * 카드 순서(고정): day-master, element-balance, energy-style, social-role, strength, [luck-cycle]
 * - luck-cycle 은 luckCycles.direction 이 null 이면 생략 → 5장 또는 6장.
 * - 시간 미상(hour=null)이어도 어떤 카드도 시간 기둥을 전제로 말하지 않는다.
 * - 같은 chart → 같은 카드 (랜덤·해시 없음).
 */
import { DAY_MASTER_COPY } from "./copy/dayMaster";
import {
  BOUNDARY_NOTE,
  ELEMENT_BALANCED_BODY,
  ELEMENT_BALANCED_CONTEXT,
  ELEMENT_BALANCED_SUGGESTION,
  ELEMENT_COPY,
  ELEMENT_RULE,
} from "./copy/elements";
import { branchLabel, elementList, ganzhiLabel, stemLabel, stemShort } from "./copy/format";
import { LUCK_COPY, LUCK_DIRECTION_KO } from "./copy/luck";
import { STRENGTH_COPY, STRENGTH_RULE } from "./copy/strength";
import { ENERGY_RULE, GROUP_ENERGY, SOCIAL_ROLE, SOCIAL_RULE } from "./copy/tenGods";
import { ELEMENTS, ELEMENT_KO, type PatternCard, type PatternWhy, type SajuChart, type TenGodGroup } from "./types";

export const CAVEAT = "전통 명리 관점의 해석이며 확정적 예측이 아닙니다.";

const GROUP_ORDER: TenGodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];

/** chart.facts 에 실제로 있는 id 만 남긴다(엔진 버전 차이에 안전). */
function keepFacts(chart: SajuChart, ids: string[]): string[] {
  const have = new Set(chart.facts.map((f) => f.id));
  return ids.filter((id) => have.has(id));
}

function why(chart: SajuChart, w: Omit<PatternWhy, "caveat" | "factIds"> & { factIds: string[]; caveatExtra?: string }): PatternWhy {
  const { caveatExtra, ...rest } = w;
  return {
    ...rest,
    caveat: caveatExtra ? `${CAVEAT} ${caveatExtra}` : CAVEAT,
    factIds: keepFacts(chart, w.factIds),
  };
}

export function isNearTermBoundary(chart: SajuChart): boolean {
  return chart.warnings.some((w) => w.includes("절기 경계")) || chart.solarTerms?.nearBoundary === true;
}

// ───────────────────────── 1) 일간 기질 ─────────────────────────

function dayMasterCard(chart: SajuChart): PatternCard {
  const stem = chart.dayMaster.stem;
  const c = DAY_MASTER_COPY[stem];
  return {
    id: "day-master",
    category: "self",
    title: "당신의 기본 기질",
    headline: c.headline,
    body: [c.strength, c.shade, c.scene].join(" "),
    strength: 3,
    tags: [`${stemLabel(stem)}`, ...c.tags],
    why: why(chart, {
      structure: [`일간 ${stemLabel(stem)}, ${c.nature}`, `일주 ${ganzhiLabel(chart.pillars.day)}`],
      rule: "일간은 사주의 중심으로 보고 그 오행·음양의 성질을 기본 기질로 해석합니다.",
      context: c.context,
      suggestion: c.suggestion,
      factIds: ["daymaster", "pillar.day"],
    }),
  };
}

// ───────────────────────── 2) 오행 균형 ─────────────────────────

function elementBalanceCard(chart: SajuChart): PatternCard {
  const { dominant, missing, weighted } = chart.elements;
  const single = dominant.length === 1 ? dominant[0] : null;
  const maxWeight = Math.max(...ELEMENTS.map((e) => weighted[e] ?? 0));

  let headline: string;
  if (single && missing.length) headline = `${ELEMENT_KO[single]} 기운이 두드러지고 ${elementList(missing)} 기운이 비어 있음`;
  else if (single) headline = `${ELEMENT_KO[single]} 기운이 두드러짐`;
  else if (missing.length) headline = `${elementList(missing)} 기운이 비어 있음`;
  else if (dominant.length > 1) headline = `${elementList(dominant)} 기운이 나란히 앞섬`;
  else headline = "다섯 기운이 고르게 어우러짐";

  const sentences: string[] = [];
  if (single) {
    sentences.push(ELEMENT_COPY[single].many);
  } else if (dominant.length > 1 && !missing.length) {
    sentences.push(
      `${elementList(dominant)} 기운이 비슷한 비중으로 앞서는 구조로 해석됩니다.`,
      "상황에 따라 필요한 기운을 꺼내 쓰기 쉬운 대신, 스스로 무게중심을 정해 주는 것이 도움이 된다고 봅니다.",
    );
  }
  if (missing.length > 1) sentences.push(`원국에 ${elementList(missing)} 기운이 보이지 않습니다.`);
  if (missing.length) sentences.push(ELEMENT_COPY[missing[0]].missing);
  if (!sentences.length) sentences.push(ELEMENT_BALANCED_BODY);
  const boundary = isNearTermBoundary(chart);
  if (boundary) sentences.push(BOUNDARY_NOTE);

  let context = ELEMENT_BALANCED_CONTEXT;
  let suggestion = ELEMENT_BALANCED_SUGGESTION;
  if (missing.length) {
    context = ELEMENT_COPY[missing[0]].missingContext;
    suggestion = ELEMENT_COPY[missing[0]].missingSuggestion;
  } else if (single) {
    context = ELEMENT_COPY[single].manyContext;
    suggestion = ELEMENT_COPY[single].manySuggestion;
  }

  const structure = [`오행 비율: ${ELEMENTS.map((e) => `${ELEMENT_KO[e]} ${weighted[e] ?? 0}`).join(" · ")}`];
  if (dominant.length) structure.push(`두드러진 기운: ${elementList(dominant)}`);
  if (missing.length) structure.push(`비어 있는 기운: ${elementList(missing)}`);
  if (boundary) structure.push("출생 시각이 절기 경계와 가까움");

  const factIds = ["element.counts", "element.dominant"];
  if (missing.length) factIds.push("element.missing");
  if (boundary) factIds.push("term.boundary");

  return {
    id: "element-balance",
    category: "balance",
    title: "다섯 기운의 균형",
    headline,
    body: sentences.join(" "),
    strength: maxWeight >= 35 || missing.length > 0 ? 3 : 2,
    tags: [...dominant.map((e) => `${ELEMENT_KO[e]} 강함`), ...missing.map((e) => `${ELEMENT_KO[e]} 없음`)],
    why: why(chart, {
      structure,
      rule: ELEMENT_RULE,
      context,
      suggestion,
      factIds,
    }),
  };
}

// ───────────────────────── 3) 에너지 쓰는 방식 ─────────────────────────

function energyStyleCard(chart: SajuChart): PatternCard {
  const { dominantGroup, weakestGroup, byGroup } = chart.tenGods;
  const c = GROUP_ENERGY[dominantGroup];
  const body = weakestGroup !== dominantGroup ? `${c.body} ${GROUP_ENERGY[weakestGroup].weakest}` : c.body;
  return {
    id: "energy-style",
    category: "energy",
    title: "에너지를 쓰는 방식",
    headline: c.headline,
    body,
    strength: (byGroup[dominantGroup] ?? 0) >= 35 ? 3 : 2,
    tags: [dominantGroup, ...c.tags],
    why: why(chart, {
      structure: [
        `십성 그룹 비율: ${GROUP_ORDER.map((g) => `${g} ${byGroup[g] ?? 0}`).join(" · ")}`,
        `가장 큰 그룹: ${c.label}`,
        `가장 약한 그룹: ${GROUP_ENERGY[weakestGroup].label}`,
      ],
      rule: ENERGY_RULE,
      context: c.context,
      suggestion: c.suggestion,
      factIds: ["tengod.groups", "tengod.dominant"],
    }),
  };
}

// ───────────────────────── 4) 사회적 역할 ─────────────────────────

function socialRoleCard(chart: SajuChart): PatternCard {
  const month = chart.pillars.month;
  const tg = month.branchTenGod;
  const c = SOCIAL_ROLE[tg];
  return {
    id: "social-role",
    category: "social",
    title: "사회적 역할 성향",
    headline: c.headline,
    body: c.body,
    strength: 2,
    tags: [tg, ...c.tags],
    why: why(chart, {
      structure: [
        `월지 ${branchLabel(month.branch)}`,
        `월지 본기 ${stemShort(month.hiddenStems[0])} → 일간 기준 ${tg}`,
      ],
      rule: SOCIAL_RULE,
      context: c.context,
      suggestion: c.suggestion,
      factIds: ["pillar.month", "term.month"],
    }),
  };
}

// ───────────────────────── 5) 신강·신약 ─────────────────────────

function strengthCard(chart: SajuChart): PatternCard {
  const s = chart.strength;
  const c = STRENGTH_COPY[s.label];
  return {
    id: "strength",
    category: "self",
    title: "힘을 쓰는 법, 힘을 받는 법",
    headline: c.headline,
    body: c.body,
    strength: s.label === "중화" ? 2 : 3,
    tags: [s.label, ...c.tags],
    why: why(chart, {
      structure: s.factors.length ? [...s.factors] : [`일간의 힘 점수 ${s.score}/100 (${s.label})`],
      rule: STRENGTH_RULE,
      context: c.context,
      suggestion: c.suggestion,
      factIds: ["strength"],
    }),
  };
}

// ───────────────────────── 6) 대운 방향 ─────────────────────────

function luckCycleCard(chart: SajuChart): PatternCard | null {
  const { direction, startAge } = chart.luckCycles;
  if (direction == null) return null;
  const dirKo = LUCK_DIRECTION_KO[direction];
  const structure = [`대운 방향: ${dirKo}`];
  if (startAge != null) structure.push(`대운 시작 나이: ${startAge}세`);
  return {
    id: "luck-cycle",
    category: "cycle",
    title: LUCK_COPY.title,
    headline: LUCK_COPY.headline(dirKo, startAge),
    body: LUCK_COPY.body(dirKo, startAge),
    strength: 1,
    tags: ["대운", dirKo],
    why: why(chart, {
      structure,
      rule: LUCK_COPY.rule,
      context: LUCK_COPY.context,
      suggestion: LUCK_COPY.suggestion,
      caveatExtra: LUCK_COPY.caveatExtra,
      factIds: ["luck.direction", "luck.start"],
    }),
  };
}

export function derivePatterns(chart: SajuChart): PatternCard[] {
  const cards: PatternCard[] = [
    dayMasterCard(chart),
    elementBalanceCard(chart),
    energyStyleCard(chart),
    socialRoleCard(chart),
    strengthCard(chart),
  ];
  const luck = luckCycleCard(chart);
  if (luck) cards.push(luck);
  return cards;
}
