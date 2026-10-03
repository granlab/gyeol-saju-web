/**
 * 결(結) 만세력 엔진 — 공용 계약(타입)
 *
 * 원칙
 * - 계산은 이 모듈(코드)이 한다. LLM 은 여기서 나온 JSON 을 "설명"만 한다.
 * - 모든 출력은 결정적(deterministic)이어야 하며, 같은 입력 → 같은 출력.
 * - 사용자에게 보이는 문자열은 한국어. 간지 표기는 한자+한글 병기.
 *
 * 이 파일은 엔진 / 패턴 규칙 / 프론트 / AI 네 역할이 모두 import 하므로
 * 필드 삭제·개명 금지. 추가는 허용(optional 로).
 */

// ───────────────────────── 기본 상수·타입 ─────────────────────────

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export const STEMS_KO = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
export const BRANCHES_KO = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;

export type Stem = (typeof STEMS)[number];
export type Branch = (typeof BRANCHES)[number];

export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export const ELEMENTS: Element[] = ["wood", "fire", "earth", "metal", "water"];
export const ELEMENT_KO: Record<Element, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};
export const ELEMENT_PLAIN_KO: Record<Element, string> = {
  wood: "나무",
  fire: "불",
  earth: "흙",
  metal: "쇠",
  water: "물",
};

export type Polarity = "yang" | "yin";

/** 십성(十星). 일간 기준 관계. */
export type TenGod =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

/** 십성 5그룹 */
export type TenGodGroup = "비겁" | "식상" | "재성" | "관성" | "인성";
export const TEN_GOD_GROUP: Record<TenGod, TenGodGroup> = {
  비견: "비겁",
  겁재: "비겁",
  식신: "식상",
  상관: "식상",
  편재: "재성",
  정재: "재성",
  편관: "관성",
  정관: "관성",
  편인: "인성",
  정인: "인성",
};

export type PillarKey = "year" | "month" | "day" | "hour";
export const PILLAR_KO: Record<PillarKey, string> = {
  year: "년주",
  month: "월주",
  day: "일주",
  hour: "시주",
};

// ───────────────────────── 기둥(柱) ─────────────────────────

/** 간지 한 쌍의 최소 표현 (오늘 일진, 대운 등에 재사용) */
export interface GanZhi {
  stem: Stem;
  branch: Branch;
  /** 0..59 육십갑자 인덱스. 甲子=0 */
  index: number;
  /** '甲子' */
  name: string;
  /** '갑자' */
  nameKo: string;
  stemElement: Element;
  branchElement: Element;
  stemPolarity: Polarity;
  /** 지장간. 본기(本氣)가 첫 번째. */
  hiddenStems: Stem[];
}

export interface Pillar extends GanZhi {
  key: PillarKey;
  /** 일간 기준 천간 십성. 일주(일간 자신)는 null */
  stemTenGod: TenGod | null;
  /** 지지 본기(hiddenStems[0]) 기준 십성 */
  branchTenGod: TenGod;
}

// ───────────────────────── 입력 ─────────────────────────

export interface EngineOptions {
  /**
   * 일주 경계 규칙.
   * - 'zi-23' (기본): 보정 후 23:00 이후는 다음 날 일주로 본다(정자시법).
   * - 'midnight': 자정(00:00) 기준으로 일주가 바뀐다. 23:00~24:00(야자시)의 시주 천간은 다음 날 일간 기준(야자시법).
   */
  dayBoundary: "zi-23" | "midnight";
  /** 경도 보정(평균태양시). 기본 true. 서울 기준 약 -32분. */
  longitudeCorrection: boolean;
  /**
   * 한국 역사적 시간 규칙 반영. 기본 true.
   * - 표준시 UTC+8:30 기간: 1908-04-01~1911-12-31, 1954-03-21~1961-08-09
   * - 서머타임(+1h): 1948~1951, 1955~1960 각 하절기, 1987-05-10 02:00~10-11 03:00, 1988-05-08 02:00~10-09 03:00
   */
  historicalTimeRules: boolean;
}

export const DEFAULT_ENGINE_OPTIONS: EngineOptions = {
  dayBoundary: "zi-23",
  longitudeCorrection: true,
  historicalTimeRules: true,
};

export interface BirthInput {
  /** 양력 'YYYY-MM-DD'. 시계(표준시) 기준 날짜. */
  date: string;
  /** 'HH:mm' 시계 시간, 모르면 null → 시주 생략 */
  time: string | null;
  /** 대운 방향(양남음녀 순행) 계산에만 사용. null 이면 대운 생략 */
  gender: "female" | "male" | "other" | null;
  /** 출생지 동경(도). 기본 126.978(서울). */
  longitude?: number;
  /** 표시용 지명 */
  placeName?: string;
  options?: Partial<EngineOptions>;
}

/** 온보딩 출생지 선택용 도시 목록(동경). 해외는 현재 미지원 → 서울 값 사용 후 warnings 에 기록 */
export interface City {
  name: string;
  longitude: number;
}
export const CITIES: City[] = [
  { name: "서울", longitude: 126.978 },
  { name: "부산", longitude: 129.075 },
  { name: "대구", longitude: 128.601 },
  { name: "인천", longitude: 126.705 },
  { name: "광주", longitude: 126.853 },
  { name: "대전", longitude: 127.385 },
  { name: "울산", longitude: 129.311 },
  { name: "세종", longitude: 127.289 },
  { name: "수원", longitude: 127.029 },
  { name: "창원", longitude: 128.681 },
  { name: "청주", longitude: 127.489 },
  { name: "전주", longitude: 127.148 },
  { name: "천안", longitude: 127.114 },
  { name: "강릉", longitude: 128.876 },
  { name: "포항", longitude: 129.365 },
  { name: "제주", longitude: 126.531 },
];

// ───────────────────────── 절기 ─────────────────────────

export interface SolarTermInfo {
  /** '입춘' */
  name: string;
  /** '立春' */
  hanja: string;
  /** 태양 황경(도). 입춘=315, 춘분=0, 하지=90 ... */
  longitude: number;
  /** 절입 시각. KST(+09:00) ISO 문자열 */
  at: string;
  /** 12절(節, 월 경계) 이면 true, 12중기(中氣)면 false */
  isMonthBoundary: boolean;
}

// ───────────────────────── 시간 해석 결과 ─────────────────────────

export interface ResolvedTime {
  /** 입력 시계 시각 ISO. 당시 실제 오프셋 표기(+09:00, +08:30, 서머타임이면 +10:00/+09:30). 시간 미상이면 12:00 가정 */
  civilISO: string;
  utcISO: string;
  /** 보정 후 평균태양시 'YYYY-MM-DDTHH:mm' (표기용, 오프셋 없음) */
  solarLocal: string;
  /** 당시 표준시 오프셋(분): 540 또는 510 */
  standardOffsetMinutes: number;
  /** 서머타임 보정(분): 60 또는 0 */
  dstMinutes: number;
  /** 경도 보정(분, 음수 가능). 예: 서울 -32 */
  longitudeCorrectionMinutes: number;
  /** 시계 시각에 더해 평균태양시가 되는 총 보정(분) */
  totalCorrectionMinutes: number;
  hourKnown: boolean;
  dayBoundaryRule: EngineOptions["dayBoundary"];
  /** 23:00~24:00 자시(야자시) 구간이어서 일주가 다음 날로 넘어갔으면 true */
  rolledToNextDay: boolean;
}

// ───────────────────────── 요약 지표 ─────────────────────────

export interface ElementSummary {
  /** 천간·지지 글자 단순 개수 (시주 있으면 8, 없으면 6) */
  counts: Record<Element, number>;
  /** 지장간 가중 포함 비율. 합 100 (정수 반올림) */
  weighted: Record<Element, number>;
  /** 가중치 최상위(동률 포함) */
  dominant: Element[];
  /** counts 가 0 인 오행 */
  missing: Element[];
  weakest: Element;
}

export interface TenGodSummary {
  /** 그룹별 가중 비율. 합 100 */
  byGroup: Record<TenGodGroup, number>;
  dominantGroup: TenGodGroup;
  weakestGroup: TenGodGroup;
  /** 일간 제외 모든 글자의 십성 목록 */
  list: Array<{ pillar: PillarKey; part: "stem" | "branch"; tenGod: TenGod }>;
}

export interface Strength {
  /** 0..100. 50 중심. 높을수록 신강 */
  score: number;
  label: "신강" | "중화" | "신약";
  /** 판정 근거 한국어 문장들 (예: '월지가 인성이라 일간을 돕습니다') */
  factors: string[];
}

export interface LuckCycle {
  /** 1부터 */
  order: number;
  startAge: number;
  endAge: number;
  startYear: number;
  ganzhi: GanZhi;
  stemTenGod: TenGod;
  branchTenGod: TenGod;
}

export interface LuckCycles {
  /** 양남음녀 순행(forward), 음남양녀 역행(backward). gender 없으면 null */
  direction: "forward" | "backward" | null;
  /** 대운수(첫 대운 시작 나이). 절입까지 일수 ÷ 3 반올림, 최소 1 */
  startAge: number | null;
  /** 계산 설명 한 문장 */
  note: string;
  cycles: LuckCycle[];
}

// ───────────────────────── 근거(Fact) ─────────────────────────

/**
 * LLM/카드가 인용하는 원자 단위 근거.
 * id 규약 (patterns/today/AI 가 참조하므로 유지):
 *   pillar.year | pillar.month | pillar.day | pillar.hour
 *   daymaster
 *   element.counts | element.dominant | element.missing
 *   tengod.groups | tengod.dominant
 *   strength
 *   term.month        (월지를 정한 절기 구간)
 *   term.boundary     (가장 가까운 절기와의 시간차)
 *   time.correction   (적용된 시간 보정)
 *   luck.direction | luck.start   (computeChart: 방향, 대운수·첫 대운)
 *   today.day | today.tengod | luck.current   (deriveToday 가 추가: 오늘 일진, 십성, 현재 대운)
 */
export interface Fact {
  id: string;
  /** 사람이 읽는 한국어 한 문장 */
  text: string;
  source: "engine" | "rule";
}

// ───────────────────────── 차트(원국) ─────────────────────────

export interface SajuChart {
  engineVersion: string;
  input: BirthInput;
  options: EngineOptions;
  resolved: ResolvedTime;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    /** 시간 미상이면 null */
    hour: Pillar | null;
  };
  dayMaster: {
    stem: Stem;
    ko: string; // '갑'
    element: Element;
    polarity: Polarity;
    /** 예: '큰 나무(갑목)' — 비전문가용 별칭 */
    nickname: string;
  };
  elements: ElementSummary;
  tenGods: TenGodSummary;
  strength: Strength;
  solarTerms: {
    /** 출생 시각 직전 절(월 경계) */
    monthTerm: SolarTermInfo;
    /** 출생 시각 직후 절(월 경계) */
    nextMonthTerm: SolarTermInfo;
    /** 가장 가까운 절(월 경계)까지 시간(시). 양수 */
    hoursToNearestBoundary: number;
    /** 12시간 이내면 true → 월주가 바뀔 수 있음을 사용자에게 고지 */
    nearBoundary: boolean;
  };
  luckCycles: LuckCycles;
  /** 사용자 고지용 경고. 예: '절기 경계 3시간 이내', '시간 미상으로 시주 생략', '서머타임 보정 적용' */
  warnings: string[];
  facts: Fact[];
}

// ───────────────────────── 패턴 카드 ─────────────────────────

export type PatternCategory = "self" | "balance" | "energy" | "social" | "cycle";

export interface PatternWhy {
  /** 1단계: 어떤 사주 구조에서 나왔나 (예: '일간 甲(갑목)', '월지 寅') */
  structure: string[];
  /** 2단계: 적용한 전통 해석 규칙 한 문장 */
  rule: string;
  /** 3단계: 사용자 맥락과 연결 (일상 언어) */
  context: string;
  /** 4단계: 작은 제안 (행동/관점) */
  suggestion: string;
  /** 고정 문구 포함: '전통 명리 관점의 해석이며 확정적 예측이 아닙니다.' */
  caveat: string;
  /** 인용한 Fact id */
  factIds: string[];
}

export interface PatternCard {
  /** 'day-master' | 'element-balance' | 'energy-style' | 'social-role' | 'strength' | 'luck-cycle' 등 */
  id: string;
  category: PatternCategory;
  /** 카드 제목 (예: '당신의 기본 기질') */
  title: string;
  /** 한 줄 핵심 (예: '밖으로 뻗는 큰 나무') */
  headline: string;
  /** 2~3문장 설명 */
  body: string;
  /** 해석 강도 1(약)~3(뚜렷) */
  strength: 1 | 2 | 3;
  tags: string[];
  why: PatternWhy;
}

// ───────────────────────── 오늘의 흐름 ─────────────────────────

export interface TodayFlow {
  /** 'YYYY-MM-DD' (KST) */
  date: string;
  dayGanzhi: GanZhi;
  monthGanzhi: GanZhi;
  yearGanzhi: GanZhi;
  /** 오늘 일진 천간의 일간 기준 십성 */
  dayTenGod: TenGod;
  dayTenGodGroup: TenGodGroup;
  /** 현재 대운 (없으면 null) */
  currentLuck: LuckCycle | null;
  /** 오늘의 한 문장 (예: '말하기보다 듣는 날') */
  headline: string;
  /** 0..100. 예언이 아니라 '주의 배분' 지표 */
  scores: { relation: number; work: number; self: number };
  /** 오늘 한 가지 행동 */
  action: { id: string; text: string };
  why: {
    structure: string[];
    rule: string;
    caveat: string;
    factIds: string[];
  };
  /** 오늘 관련 Fact (today.day, today.tengod 등) */
  facts: Fact[];
}
