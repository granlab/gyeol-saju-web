/**
 * 간지(干支) 기본 테이블과 십성 계산. 엔진·패턴 규칙이 공통으로 사용한다.
 * 순수 함수. 외부 의존 없음.
 */
import {
  BRANCHES,
  BRANCHES_KO,
  STEMS,
  STEMS_KO,
  type Branch,
  type Element,
  type GanZhi,
  type Polarity,
  type Stem,
  type TenGod,
} from "./types";

export const STEM_ELEMENT: Record<Stem, Element> = {
  甲: "wood",
  乙: "wood",
  丙: "fire",
  丁: "fire",
  戊: "earth",
  己: "earth",
  庚: "metal",
  辛: "metal",
  壬: "water",
  癸: "water",
};

export const STEM_POLARITY: Record<Stem, Polarity> = {
  甲: "yang",
  乙: "yin",
  丙: "yang",
  丁: "yin",
  戊: "yang",
  己: "yin",
  庚: "yang",
  辛: "yin",
  壬: "yang",
  癸: "yin",
};

export const BRANCH_ELEMENT: Record<Branch, Element> = {
  子: "water",
  丑: "earth",
  寅: "wood",
  卯: "wood",
  辰: "earth",
  巳: "fire",
  午: "fire",
  未: "earth",
  申: "metal",
  酉: "metal",
  戌: "earth",
  亥: "water",
};

/** 지지 자체의 음양(子寅辰午申戌 양). 십성 판정에는 지장간 본기의 음양을 쓴다. */
export const BRANCH_POLARITY: Record<Branch, Polarity> = {
  子: "yang",
  丑: "yin",
  寅: "yang",
  卯: "yin",
  辰: "yang",
  巳: "yin",
  午: "yang",
  未: "yin",
  申: "yang",
  酉: "yin",
  戌: "yang",
  亥: "yin",
};

/** 지장간(支藏干). 첫 번째가 본기(本氣), 이어서 중기·여기. */
export const HIDDEN_STEMS: Record<Branch, Stem[]> = {
  子: ["癸", "壬"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙", "甲"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "庚", "戊"],
  午: ["丁", "己", "丙"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛", "庚"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲", "戊"],
};

/** 상생: A 가 B 를 낳는다 (목→화→토→금→수→목) */
export const PRODUCES: Record<Element, Element> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

/** 상극: A 가 B 를 다스린다 (목→토, 토→수, 수→화, 화→금, 금→목) */
export const CONTROLS: Record<Element, Element> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

export function stemIndex(s: Stem): number {
  return STEMS.indexOf(s);
}
export function branchIndex(b: Branch): number {
  return BRANCHES.indexOf(b);
}
export function stemKo(s: Stem): string {
  return STEMS_KO[stemIndex(s)];
}
export function branchKo(b: Branch): string {
  return BRANCHES_KO[branchIndex(b)];
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * 천간 인덱스(0..9)와 지지 인덱스(0..11) → 육십갑자 인덱스(0..59).
 * 음양이 다른 조합(예: 甲丑)은 존재하지 않으므로 예외.
 */
export function ganzhiIndex(stemIdx: number, branchIdx: number): number {
  const s = mod(stemIdx, 10);
  const b = mod(branchIdx, 12);
  if ((s - b) % 2 !== 0) {
    throw new Error(`invalid ganzhi pair: stem ${STEMS[s]} branch ${BRANCHES[b]}`);
  }
  // n ≡ s (mod 10), n ≡ b (mod 12). n = s + 10k, 10k ≡ b-s (mod 12) → 5k ≡ (b-s)/2 (mod 6) → k ≡ 5·d (mod 6)
  const d = mod((b - s) / 2, 6);
  const k = mod(5 * d, 6);
  return s + 10 * k;
}

/** 육십갑자 인덱스 → GanZhi (甲子=0) */
export function makeGanzhi(index: number): GanZhi {
  const i = mod(index, 60);
  const stem = STEMS[i % 10];
  const branch = BRANCHES[i % 12];
  return {
    stem,
    branch,
    index: i,
    name: `${stem}${branch}`,
    nameKo: `${stemKo(stem)}${branchKo(branch)}`,
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
    stemPolarity: STEM_POLARITY[stem],
    hiddenStems: [...HIDDEN_STEMS[branch]],
  };
}

export function ganzhiOf(stem: Stem, branch: Branch): GanZhi {
  return makeGanzhi(ganzhiIndex(stemIndex(stem), branchIndex(branch)));
}

/**
 * 일간(dayMaster) 기준 다른 천간(other)의 십성.
 * 같은 오행: 같은 음양 비견 / 다른 음양 겁재
 * 일간이 낳는 오행: 식신 / 상관
 * 일간이 다스리는 오행: 편재 / 정재
 * 일간을 다스리는 오행: 편관 / 정관
 * 일간을 낳는 오행: 편인 / 정인
 */
export function tenGod(dayMaster: Stem, other: Stem): TenGod {
  const dm = STEM_ELEMENT[dayMaster];
  const ot = STEM_ELEMENT[other];
  const same = STEM_POLARITY[dayMaster] === STEM_POLARITY[other];
  if (dm === ot) return same ? "비견" : "겁재";
  if (PRODUCES[dm] === ot) return same ? "식신" : "상관";
  if (CONTROLS[dm] === ot) return same ? "편재" : "정재";
  if (CONTROLS[ot] === dm) return same ? "편관" : "정관";
  if (PRODUCES[ot] === dm) return same ? "편인" : "정인";
  throw new Error(`unreachable ten-god relation ${dayMaster}/${other}`);
}

/** 지지의 십성: 지장간 본기 기준 */
export function tenGodOfBranch(dayMaster: Stem, branch: Branch): TenGod {
  return tenGod(dayMaster, HIDDEN_STEMS[branch][0]);
}

/** 년간 → 寅월 천간 (년상기월법): 甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲 */
export function monthStemIndex(yearStemIdx: number, monthBranchIdx: number): number {
  // 寅(2) 이 첫 달. 寅월 천간 = (년간%5)*2 + 2
  const yinStem = (mod(yearStemIdx, 5) * 2 + 2) % 10;
  const offset = mod(monthBranchIdx - 2, 12);
  return (yinStem + offset) % 10;
}

/** 일간 → 子시 천간 (일상기시법): 甲己→甲, 乙庚→丙, 丙辛→戊, 丁壬→庚, 戊癸→壬 */
export function hourStemIndex(dayStemIdx: number, hourBranchIdx: number): number {
  const ziStem = (mod(dayStemIdx, 5) * 2) % 10;
  return (ziStem + mod(hourBranchIdx, 12)) % 10;
}
