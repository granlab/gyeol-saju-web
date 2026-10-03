/**
 * 요약 지표: 오행 분포, 십성 그룹 분포, 신강/신약 점수.
 * 가중 방식: 천간 1.0, 지지는 지장간 본기 1.0·중기 0.5·여기 0.3.
 */
import { HIDDEN_STEMS, STEM_ELEMENT, tenGod } from "./ganzhi";
import { branchLabel, josa, stemLabel } from "./text";
import {
  ELEMENTS,
  type Element,
  type ElementSummary,
  type Pillar,
  type Stem,
  type Strength,
  TEN_GOD_GROUP,
  type TenGodGroup,
  type TenGodSummary,
} from "./types";

export const HIDDEN_WEIGHTS = [1.0, 0.5, 0.3];
export const TEN_GOD_GROUPS: TenGodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];
const EPS = 1e-9;

/** 글자 하나의 (천간, 가중치) 목록 */
export interface WeightedStem {
  pillar: Pillar["key"];
  part: "stem" | "branch";
  stem: Stem;
  weight: number;
}

/** 천간 1.0 + 지지 지장간 가중 */
export function weightedStems(pillars: Pillar[], opts: { includeDayStem: boolean }): WeightedStem[] {
  const out: WeightedStem[] = [];
  for (const p of pillars) {
    if (opts.includeDayStem || p.key !== "day") out.push({ pillar: p.key, part: "stem", stem: p.stem, weight: 1 });
    HIDDEN_STEMS[p.branch].forEach((s, i) =>
      out.push({ pillar: p.key, part: "branch", stem: s, weight: HIDDEN_WEIGHTS[i] }),
    );
  }
  return out;
}

/** 원시 가중치 → 합 100 정수 백분율 (최대잉여법, 동률은 keys 순서 앞) */
export function toPercent<K extends string>(raw: Record<K, number>, keys: K[]): Record<K, number> {
  const total = keys.reduce((a, k) => a + raw[k], 0);
  const out = {} as Record<K, number>;
  if (total <= 0) {
    keys.forEach((k, i) => (out[k] = i === 0 ? 100 : 0));
    return out;
  }
  const exact = keys.map((k) => (raw[k] / total) * 100);
  const floors = exact.map((x) => Math.floor(x + EPS));
  let rest = 100 - floors.reduce((a, b) => a + b, 0);
  const order = keys
    .map((_, i) => i)
    .sort((a, b) => {
      const ra = exact[a] - floors[a];
      const rb = exact[b] - floors[b];
      if (Math.abs(rb - ra) > EPS) return rb - ra;
      return a - b;
    });
  for (const i of order) {
    if (rest <= 0) break;
    floors[i] += 1;
    rest -= 1;
  }
  keys.forEach((k, i) => (out[k] = floors[i]));
  return out;
}

function argmax<K extends string>(raw: Record<K, number>, keys: K[]): K[] {
  const max = Math.max(...keys.map((k) => raw[k]));
  return keys.filter((k) => Math.abs(raw[k] - max) < EPS);
}
function argminFirst<K extends string>(raw: Record<K, number>, keys: K[]): K {
  const min = Math.min(...keys.map((k) => raw[k]));
  return keys.find((k) => Math.abs(raw[k] - min) < EPS) as K;
}

function zeroRecord<K extends string>(keys: K[]): Record<K, number> {
  const r = {} as Record<K, number>;
  for (const k of keys) r[k] = 0;
  return r;
}

export function summarizeElements(pillars: Pillar[]): ElementSummary & { raw: Record<Element, number> } {
  const counts = zeroRecord(ELEMENTS);
  for (const p of pillars) {
    counts[p.stemElement] += 1;
    counts[p.branchElement] += 1;
  }
  const raw = zeroRecord(ELEMENTS);
  for (const w of weightedStems(pillars, { includeDayStem: true })) raw[STEM_ELEMENT[w.stem]] += w.weight;
  return {
    counts,
    weighted: toPercent(raw, ELEMENTS),
    dominant: argmax(raw, ELEMENTS),
    missing: ELEMENTS.filter((e) => counts[e] === 0),
    weakest: argminFirst(raw, ELEMENTS),
    raw,
  };
}

export function summarizeTenGods(pillars: Pillar[], dayStem: Stem): TenGodSummary {
  const list: TenGodSummary["list"] = [];
  for (const p of pillars) {
    if (p.key !== "day" && p.stemTenGod) list.push({ pillar: p.key, part: "stem", tenGod: p.stemTenGod });
    list.push({ pillar: p.key, part: "branch", tenGod: p.branchTenGod });
  }
  const raw = zeroRecord(TEN_GOD_GROUPS);
  for (const w of weightedStems(pillars, { includeDayStem: false })) {
    raw[TEN_GOD_GROUP[tenGod(dayStem, w.stem)]] += w.weight;
  }
  return {
    byGroup: toPercent(raw, TEN_GOD_GROUPS),
    dominantGroup: argmax(raw, TEN_GOD_GROUPS)[0],
    weakestGroup: argminFirst(raw, TEN_GOD_GROUPS),
    list,
  };
}

function supports(dayStem: Stem, other: Stem): boolean {
  const g = TEN_GOD_GROUP[tenGod(dayStem, other)];
  return g === "비겁" || g === "인성";
}

/**
 * 간단 신강/신약 점수.
 * 득령(월지 본기 비겁·인성) +25, 득지(일지 본기 비겁·인성) +15,
 * 나머지 글자(일간·월지·일지 제외) 중 비겁·인성 가중 비율 × 60. 0..100 클램프.
 */
export function computeStrength(pillars: Pillar[], dayStem: Stem): Strength {
  const month = pillars.find((p) => p.key === "month") as Pillar;
  const day = pillars.find((p) => p.key === "day") as Pillar;
  const dm = stemLabel(dayStem);
  const factors: string[] = [];
  let score = 0;

  const monthMain = HIDDEN_STEMS[month.branch][0];
  const mGroup = TEN_GOD_GROUP[tenGod(dayStem, monthMain)];
  const mLabel = branchLabel(month.branch);
  if (supports(dayStem, monthMain)) {
    score += 25;
    factors.push(`월지 ${mLabel}${josa(mLabel, "이/가")} ${mGroup}이라 일간 ${dm}의 힘을 받습니다(득령).`);
  } else {
    factors.push(`월지 ${mLabel}${josa(mLabel, "이/가")} ${mGroup}이라 태어난 계절이 일간 ${dm}${josa(dm, "을/를")} 직접 돕지는 않습니다(실령).`);
  }

  const dayMain = HIDDEN_STEMS[day.branch][0];
  const dGroup = TEN_GOD_GROUP[tenGod(dayStem, dayMain)];
  const dLabel = branchLabel(day.branch);
  if (supports(dayStem, dayMain)) {
    score += 15;
    factors.push(`일지 ${dLabel}${josa(dLabel, "이/가")} ${dGroup}이라 일간이 뿌리를 내립니다(득지).`);
  } else {
    factors.push(`일지 ${dLabel}${josa(dLabel, "이/가")} ${dGroup}이라 일간의 뿌리는 약한 편입니다(실지).`);
  }

  const rest = weightedStems(pillars, { includeDayStem: false }).filter(
    (w) => !(w.part === "branch" && (w.pillar === "month" || w.pillar === "day")),
  );
  const total = rest.reduce((a, w) => a + w.weight, 0);
  const sup = rest.filter((w) => supports(dayStem, w.stem)).reduce((a, w) => a + w.weight, 0);
  const ratio = total > 0 ? sup / total : 0;
  score += ratio * 60;
  const pct = Math.round(ratio * 100);
  factors.push(
    `나머지 글자 중 일간을 돕는 비겁·인성 비중은 약 ${pct}%로 ${ratio >= 0.5 ? "주변의 지원이 많은 편입니다(득세)" : "주변의 지원은 적은 편입니다(실세)"}.`,
  );

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const label: Strength["label"] = finalScore >= 60 ? "신강" : finalScore <= 40 ? "신약" : "중화";
  factors.push(`종합 점수 ${finalScore}점으로 ${label}에 가깝습니다(간이 판정).`);
  return { score: finalScore, label, factors };
}
