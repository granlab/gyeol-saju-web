import { describe, expect, it } from "vitest";
import { ganzhiOf, makeGanzhi, stemIndex, tenGod } from "../ganzhi";
import { CAVEAT, derivePatterns } from "../patterns";
import * as dayMasterCopy from "../copy/dayMaster";
import * as elementsCopy from "../copy/elements";
import * as tenGodsCopy from "../copy/tenGods";
import * as strengthCopy from "../copy/strength";
import * as luckCopy from "../copy/luck";
import * as todayCopy from "../copy/today";
import {
  DEFAULT_ENGINE_OPTIONS,
  ELEMENTS,
  ELEMENT_KO,
  STEMS,
  TEN_GOD_GROUP,
  type Branch,
  type Element,
  type Fact,
  type PatternCard,
  type Pillar,
  type PillarKey,
  type SajuChart,
  type Stem,
  type Strength,
  type TenGodGroup,
  type TenGodSummary,
} from "../types";

// ───────────────────────── 픽스처 빌더 ─────────────────────────

const GROUPS: TenGodGroup[] = ["비겁", "식상", "재성", "관성", "인성"];
const NICK: Record<Element, string> = { wood: "나무", fire: "불", earth: "흙", metal: "쇠", water: "물" };

interface FixtureOverrides {
  /** 간지 문자열 '甲寅'. hour 는 null 가능 */
  year?: string;
  month?: string;
  day?: string;
  hour?: string | null;
  gender?: SajuChart["input"]["gender"];
  strength?: Partial<Strength>;
  dominantGroup?: TenGodGroup;
  weakestGroup?: TenGodGroup;
  warnings?: string[];
  nearBoundary?: boolean;
  luckStartAge?: number;
}

function pillar(key: PillarKey, gz: string, dm: Stem): Pillar {
  const g = ganzhiOf(gz[0] as Stem, gz[1] as Branch);
  return {
    ...g,
    key,
    stemTenGod: key === "day" ? null : tenGod(dm, g.stem),
    branchTenGod: tenGod(dm, g.hiddenStems[0]),
  };
}

export function makeChartFixture(o: FixtureOverrides = {}): SajuChart {
  const dayStr = o.day ?? "甲子";
  const dm = dayStr[0] as Stem;
  const hourStr = o.hour === undefined ? "甲子" : o.hour;
  const pillars = {
    year: pillar("year", o.year ?? "甲子", dm),
    month: pillar("month", o.month ?? "丙寅", dm),
    day: pillar("day", dayStr, dm),
    hour: hourStr ? pillar("hour", hourStr, dm) : null,
  };
  const all = [pillars.year, pillars.month, pillars.day, pillars.hour].filter((p): p is Pillar => p !== null);

  const counts = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<Element, number>;
  for (const p of all) {
    counts[p.stemElement] += 1;
    counts[p.branchElement] += 1;
  }
  const total = all.length * 2;
  const weighted = Object.fromEntries(ELEMENTS.map((e) => [e, Math.round((counts[e] * 100) / total)])) as Record<
    Element,
    number
  >;
  const maxW = Math.max(...ELEMENTS.map((e) => weighted[e]));
  const dominant = ELEMENTS.filter((e) => weighted[e] === maxW);
  const missing = ELEMENTS.filter((e) => counts[e] === 0);
  const weakest = ELEMENTS.reduce((a, b) => (weighted[b] < weighted[a] ? b : a));

  const list: TenGodSummary["list"] = [];
  for (const p of all) {
    if (p.stemTenGod) list.push({ pillar: p.key, part: "stem", tenGod: p.stemTenGod });
    list.push({ pillar: p.key, part: "branch", tenGod: p.branchTenGod });
  }
  const byGroup = Object.fromEntries(GROUPS.map((g) => [g, 0])) as Record<TenGodGroup, number>;
  for (const it of list) byGroup[TEN_GOD_GROUP[it.tenGod]] += 1;
  for (const g of GROUPS) byGroup[g] = Math.round((byGroup[g] * 100) / list.length);
  const domG = o.dominantGroup ?? GROUPS.reduce((a, b) => (byGroup[b] > byGroup[a] ? b : a));
  const weakG = o.weakestGroup ?? GROUPS.reduce((a, b) => (byGroup[b] < byGroup[a] ? b : a));

  const strength: Strength = {
    score: 50,
    label: "중화",
    factors: ["월지가 일간을 크게 돕지도 누르지도 않습니다"],
    ...o.strength,
  };

  const gender = o.gender === undefined ? "female" : o.gender;
  const direction = gender ? "forward" : null;
  const startAge = gender ? (o.luckStartAge ?? 4) : null;
  const cycles = gender
    ? Array.from({ length: 8 }, (_, i) => {
        const g = makeGanzhi(pillars.month.index + i + 1);
        return {
          order: i + 1,
          startAge: (startAge ?? 0) + i * 10,
          endAge: (startAge ?? 0) + i * 10 + 9,
          startYear: 1995 + (startAge ?? 0) + i * 10,
          ganzhi: g,
          stemTenGod: tenGod(dm, g.stem),
          branchTenGod: tenGod(dm, g.hiddenStems[0]),
        };
      })
    : [];

  const facts: Fact[] = [
    ...all.map((p) => ({ id: `pillar.${p.key}`, text: `${p.key} ${p.name}`, source: "engine" as const })),
    { id: "daymaster", text: `일간 ${dm}`, source: "engine" },
    { id: "element.counts", text: "오행 개수", source: "engine" },
    { id: "element.dominant", text: "두드러진 오행", source: "engine" },
    ...(missing.length ? [{ id: "element.missing", text: "없는 오행", source: "engine" as const }] : []),
    { id: "tengod.groups", text: "십성 그룹", source: "engine" },
    { id: "tengod.dominant", text: "주된 십성 그룹", source: "engine" },
    { id: "strength", text: "신강도", source: "rule" },
    { id: "term.month", text: "월 절기", source: "engine" },
    { id: "term.boundary", text: "절기 경계", source: "engine" },
    { id: "time.correction", text: "시간 보정", source: "engine" },
    ...(direction
      ? [
          { id: "luck.direction", text: "대운 방향", source: "rule" as const },
          { id: "luck.start", text: "대운 시작", source: "engine" as const },
        ]
      : []),
  ];

  const dmEl = pillars.day.stemElement;
  return {
    engineVersion: "fixture",
    input: { date: "1995-05-05", time: hourStr ? "10:30" : null, gender },
    options: DEFAULT_ENGINE_OPTIONS,
    resolved: {
      civilISO: "1995-05-05T10:30:00+09:00",
      utcISO: "1995-05-05T01:30:00Z",
      solarLocal: "1995-05-05T09:58",
      standardOffsetMinutes: 540,
      dstMinutes: 0,
      longitudeCorrectionMinutes: -32,
      totalCorrectionMinutes: -32,
      hourKnown: hourStr !== null,
      dayBoundaryRule: "zi-23",
      rolledToNextDay: false,
    },
    pillars,
    dayMaster: {
      stem: dm,
      ko: "x",
      element: dmEl,
      polarity: pillars.day.stemPolarity,
      nickname: NICK[dmEl],
    },
    elements: { counts, weighted, dominant, missing, weakest },
    tenGods: { byGroup, dominantGroup: domG, weakestGroup: weakG, list },
    strength,
    solarTerms: {
      monthTerm: { name: "입하", hanja: "立夏", longitude: 45, at: "1995-05-06T05:00:00+09:00", isMonthBoundary: true },
      nextMonthTerm: { name: "망종", hanja: "芒種", longitude: 75, at: "1995-06-06T09:00:00+09:00", isMonthBoundary: true },
      hoursToNearestBoundary: 200,
      nearBoundary: o.nearBoundary ?? false,
    },
    luckCycles: { direction, startAge, note: "fixture", cycles },
    warnings: o.warnings ?? [],
    facts,
  };
}

// ───────────────────────── 공통 검사 ─────────────────────────

const FORBIDDEN = /반드시|틀림없|운명|불행|흉|망한다|이혼|죽|병에/;

function allText(c: PatternCard): string {
  return [c.title, c.headline, c.body, ...c.tags, ...c.why.structure, c.why.rule, c.why.context, c.why.suggestion, c.why.caveat].join(
    "\n",
  );
}

const ID_ORDER = ["day-master", "element-balance", "energy-style", "social-role", "strength", "luck-cycle"];

const FIXTURES: Record<string, SajuChart> = {
  // 신강 甲 일간, 목 과다
  strongWood: makeChartFixture({
    year: "甲寅",
    month: "丙寅",
    day: "甲寅",
    hour: "丁卯",
    gender: "female",
    strength: { label: "신강", score: 82, factors: ["월지 寅(인목)이 일간과 같은 목 기운입니다", "비겁이 많아 일간을 돕습니다"] },
  }),
  // 신약 癸 일간, 수 약함, 시주 없음
  weakWaterNoHour: makeChartFixture({
    year: "丙午",
    month: "丁巳",
    day: "癸未",
    hour: null,
    gender: "male",
    strength: { label: "신약", score: 18, factors: ["월지 巳(사화)가 일간의 힘을 덜어 갑니다"] },
    warnings: ["시간 미상으로 시주 생략", "절기 경계 3시간 이내"],
  }),
  // 중화 戊 일간, 성별 없음
  balancedEarthNoGender: makeChartFixture({
    year: "壬子",
    month: "甲寅",
    day: "戊午",
    hour: "辛酉",
    gender: null,
    strength: { label: "중화", score: 50, factors: [] },
  }),
};

describe("derivePatterns — 픽스처 3종", () => {
  for (const [name, chart] of Object.entries(FIXTURES)) {
    describe(name, () => {
      const cards = derivePatterns(chart);
      it("카드 수 5 또는 6, id 순서 고정", () => {
        expect([5, 6]).toContain(cards.length);
        expect(cards.map((c) => c.id)).toEqual(ID_ORDER.slice(0, cards.length));
        expect(cards.length).toBe(chart.luckCycles.direction ? 6 : 5);
      });
      it("모든 카드에 caveat 포함", () => {
        for (const c of cards) expect(c.why.caveat).toContain(CAVEAT);
      });
      it("금칙어 미포함", () => {
        for (const c of cards) expect(allText(c)).not.toMatch(FORBIDDEN);
      });
      it("factIds 가 chart.facts 에 존재하고 비어 있지 않음", () => {
        const ids = new Set(chart.facts.map((f) => f.id));
        for (const c of cards) {
          expect(c.why.factIds.length).toBeGreaterThan(0);
          for (const id of c.why.factIds) expect(ids.has(id)).toBe(true);
        }
      });
      it("결정성: 두 번 호출 deep equal", () => {
        expect(derivePatterns(chart)).toEqual(cards);
      });
      it("body 2문장 이상, 20자 이상", () => {
        for (const c of cards) expect(c.body.length).toBeGreaterThanOrEqual(20);
      });
    });
  }

  it("신강 甲: 일간 카드·목 과다·신강 카드 내용", () => {
    const cards = derivePatterns(FIXTURES.strongWood);
    const dmCard = cards[0];
    expect(dmCard.headline).toBe("밖으로 뻗는 큰 나무");
    expect(dmCard.why.structure[0]).toBe("일간 甲(갑목), 양의 나무");
    expect(dmCard.why.factIds).toEqual(["daymaster", "pillar.day"]);
    expect(dmCard.strength).toBe(3);
    const el = cards[1];
    expect(el.headline).toContain(`${ELEMENT_KO.wood} 기운이 두드러지`);
    expect(el.headline).toContain("비어 있음");
    expect(el.strength).toBe(3);
    const st = cards[4];
    expect(st.why.structure).toEqual(FIXTURES.strongWood.strength.factors);
    expect(st.headline).toContain("힘을 쓰는 법");
    expect(cards[5].why.factIds).toEqual(["luck.direction", "luck.start"]);
  });

  it("시주 없음: '시주' 단어 미포함, 절기 경계 문장 추가", () => {
    const cards = derivePatterns(FIXTURES.weakWaterNoHour);
    for (const c of cards) expect(allText(c)).not.toContain("시주");
    expect(cards[1].body).toContain("출생 시각이 절기 경계와 가까워 월주 해석은 확인이 필요합니다");
    expect(cards[4].headline).toContain("힘을 받는 법");
  });

  it("성별 없음: luck-cycle 생략, 신강 요인이 비면 점수 문장", () => {
    const cards = derivePatterns(FIXTURES.balancedEarthNoGender);
    expect(cards.find((c) => c.id === "luck-cycle")).toBeUndefined();
    expect(cards[4].why.structure[0]).toContain("50/100");
    expect(cards[0].headline).toBe("넓고 묵직하게 버티는 산");
  });

  it("social-role 은 월지 본기 십성을 따른다", () => {
    const chart = FIXTURES.strongWood; // 甲 일간, 월지 寅 본기 甲 → 비견
    const c = derivePatterns(chart)[3];
    expect(chart.pillars.month.branchTenGod).toBe("비견");
    expect(c.headline).toBe("나란히 걷는 동료형");
    expect(c.strength).toBe(2);
  });
});

describe("derivePatterns — 10 일간 × 5 dominantGroup × 3 label 전수", () => {
  const labels: Strength["label"][] = ["신강", "중화", "신약"];
  it("모든 카드 body 20자 이상, 금칙어 없음, caveat 포함, 순서 고정", () => {
    let n = 0;
    for (const stem of STEMS) {
      // 일간 stem 과 같은 인덱스의 지지 → 유효 간지 (甲子, 乙丑, ...)
      const dayGz = makeGanzhi(stemIndex(stem)).name;
      for (const g of GROUPS) {
        for (const label of labels) {
          for (const hour of [dayGz, null] as const) {
            const chart = makeChartFixture({
              day: dayGz,
              hour,
              dominantGroup: g,
              weakestGroup: GROUPS[(GROUPS.indexOf(g) + 2) % 5],
              strength: { label, score: label === "신강" ? 75 : label === "신약" ? 25 : 50 },
              gender: n % 3 === 0 ? null : "female",
            });
            const cards = derivePatterns(chart);
            expect(cards.map((c) => c.id)).toEqual(ID_ORDER.slice(0, cards.length));
            for (const c of cards) {
              expect(c.body.length).toBeGreaterThanOrEqual(20);
              expect(c.headline.length).toBeGreaterThan(0);
              expect(allText(c)).not.toMatch(FORBIDDEN);
              expect(c.why.caveat).toContain(CAVEAT);
              if (hour === null) expect(allText(c)).not.toContain("시주");
            }
            n++;
          }
        }
      }
    }
    expect(n).toBe(10 * 5 * 3 * 2);
  });
});

describe("문구 테이블 전수 금칙어 검사", () => {
  it("copy/** 의 모든 문자열에 금칙어·단정 어미 없음", () => {
    for (const mod of [dayMasterCopy, elementsCopy, tenGodsCopy, strengthCopy, luckCopy, todayCopy]) {
      const text = JSON.stringify(mod);
      expect(text).not.toMatch(FORBIDDEN);
      expect(text).not.toMatch(/할 것이다|될 것이다/);
    }
    const luckText = [luckCopy.LUCK_COPY.headline("순행", 3), luckCopy.LUCK_COPY.body("역행", null)].join(" ");
    expect(luckText).not.toMatch(FORBIDDEN);
  });
});
