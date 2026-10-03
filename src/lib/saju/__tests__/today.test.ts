import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GanZhi } from "../types";

const state = vi.hoisted(() => ({ day: null as GanZhi | null, calls: [] as string[] }));

vi.mock("../chart", async () => {
  const { makeGanzhi } = await import("../ganzhi");
  return {
    ganzhiOfDate: (d: string) => {
      state.calls.push(d);
      return state.day ?? makeGanzhi(0);
    },
    yearMonthGanzhiOfDate: () => ({ year: makeGanzhi(42), month: makeGanzhi(46) }), // 丙午년 庚戌월
  };
});

import { ganzhiOf, makeGanzhi, stemIndex, tenGod } from "../ganzhi";
import { CAVEAT } from "../patterns";
import { branchRelation, deriveToday, toKstDateString } from "../today";
import { TODAY_ACTION, TODAY_HEADLINE } from "../copy/today";
import {
  STEMS,
  TEN_GOD_GROUP,
  type Branch,
  type LuckCycle,
  type SajuChart,
  type Stem,
} from "../types";

// ───────────────────────── 픽스처 빌더 (오늘 계산에 필요한 필드 위주) ─────────────────────────

interface FixtureOverrides {
  day?: string;
  birthDate?: string;
  luckStartAge?: number | null;
}

function makeChartFixture(o: FixtureOverrides = {}): SajuChart {
  const dayStr = o.day ?? "甲子";
  const dm = dayStr[0] as Stem;
  const dayG = ganzhiOf(dm, dayStr[1] as Branch);
  const mk = (key: "year" | "month" | "day", g: GanZhi) => ({
    ...g,
    key,
    stemTenGod: key === "day" ? null : tenGod(dm, g.stem),
    branchTenGod: tenGod(dm, g.hiddenStems[0]),
  });
  const startAge = o.luckStartAge === undefined ? 4 : o.luckStartAge;
  const cycles: LuckCycle[] =
    startAge == null
      ? []
      : Array.from({ length: 8 }, (_, i) => {
          const g = makeGanzhi(10 + i);
          return {
            order: i + 1,
            startAge: startAge + i * 10,
            endAge: startAge + i * 10 + 9,
            startYear: 1995 + startAge + i * 10,
            ganzhi: g,
            stemTenGod: tenGod(dm, g.stem),
            branchTenGod: tenGod(dm, g.hiddenStems[0]),
          };
        });
  return {
    input: { date: o.birthDate ?? "1995-05-05", time: null, gender: startAge == null ? null : "female" },
    pillars: { year: mk("year", makeGanzhi(11)), month: mk("month", makeGanzhi(17)), day: mk("day", dayG), hour: null },
    dayMaster: { stem: dm, ko: "x", element: dayG.stemElement, polarity: dayG.stemPolarity, nickname: "x" },
    luckCycles: { direction: startAge == null ? null : "forward", startAge, note: "fixture", cycles },
    warnings: [],
    facts: [{ id: "daymaster", text: "일간", source: "engine" }],
  } as unknown as SajuChart;
}

const DATE = new Date("2026-10-02T16:00:00Z"); // KST 2026-10-03 01:00
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

beforeEach(() => {
  state.day = null;
  state.calls = [];
});

describe("toKstDateString", () => {
  it("UTC 자정 전후를 KST 날짜로 변환", () => {
    expect(toKstDateString(DATE)).toBe("2026-10-03");
    expect(toKstDateString(new Date("2026-10-03T14:59:00Z"))).toBe("2026-10-03");
    expect(toKstDateString(new Date("2026-10-03T15:00:00Z"))).toBe("2026-10-04");
  });
});

describe("deriveToday — 10 일간 × 60 일진 전수", () => {
  it("throw 없음, 점수 범위, headline, action slug, facts", () => {
    const headlines = new Set<string>();
    const actions = new Set<string>();
    for (const dmStem of STEMS) {
      const chart = makeChartFixture({ day: makeGanzhi(stemIndex(dmStem)).name });
      for (let i = 0; i < 60; i++) {
        state.day = makeGanzhi(i);
        const t = deriveToday(chart, DATE);
        expect(t.date).toBe("2026-10-03");
        expect(t.dayGanzhi.index).toBe(i);
        expect(t.dayTenGod).toBe(tenGod(dmStem, state.day.stem));
        expect(t.dayTenGodGroup).toBe(TEN_GOD_GROUP[t.dayTenGod]);
        for (const v of Object.values(t.scores)) {
          expect(Number.isInteger(v)).toBe(true);
          expect(v).toBeGreaterThanOrEqual(25);
          expect(v).toBeLessThanOrEqual(85);
        }
        expect(t.headline.length).toBeGreaterThan(0);
        expect(t.action.id).toMatch(SLUG);
        expect(t.action.text.length).toBeGreaterThan(0);
        const factIds = t.facts.map((f) => f.id);
        expect(factIds).toContain("today.day");
        expect(factIds).toContain("today.tengod");
        expect(t.why.factIds).toEqual(expect.arrayContaining(["today.day", "today.tengod", "daymaster"]));
        expect(t.why.caveat).toContain(CAVEAT);
        expect(t.why.rule).toContain("주의");
        expect(t.why.structure[0]).toBe(`오늘 일진 ${state.day.name}(${state.day.nameKo})`);
        expect(t.why.structure[1]).toBe(`일간 기준 십성: ${t.dayTenGod}`);
        headlines.add(t.headline);
        actions.add(t.action.id);
      }
    }
    expect(state.calls.every((d) => d === "2026-10-03")).toBe(true);
    expect(headlines.size).toBeGreaterThanOrEqual(15);
    expect(actions.size).toBe(15);
  });

  it("문구 테이블 크기: headline 25개 모두 서로 다름, action id 15개 모두 서로 다름", () => {
    const hs = Object.values(TODAY_HEADLINE).flatMap((r) => Object.values(r));
    expect(new Set(hs).size).toBe(25);
    const as = Object.values(TODAY_ACTION).flatMap((r) => Object.values(r).map((a) => a.id));
    expect(new Set(as).size).toBe(15);
    for (const id of as) expect(id).toMatch(SLUG);
  });

  it("결정성: 같은 입력 → 같은 출력", () => {
    state.day = makeGanzhi(33);
    const chart = makeChartFixture({ day: "丙寅" });
    expect(deriveToday(chart, DATE)).toEqual(deriveToday(chart, DATE));
  });
});

describe("deriveToday — 회귀 고정", () => {
  it("甲 일간 × 丁卯 일진 → 상관·비화", () => {
    state.day = ganzhiOf("丁", "卯");
    const t = deriveToday(makeChartFixture({ day: "甲子" }), DATE);
    expect(t.dayTenGod).toBe("상관");
    expect(t.headline).toBe("내 방식으로 만들어 보기 좋은 날");
    expect(t.scores).toEqual({ relation: 55, work: 50, self: 60 });
    expect(t.action.id).toBe("write-mood-three-lines");
    expect(t.facts[0]).toEqual({ id: "today.day", text: "오늘(2026-10-03)의 일진은 丁卯(정묘)입니다", source: "engine" });
    expect(t.facts[1]).toEqual({
      id: "today.tengod",
      text: "일간 甲(갑) 기준으로 오늘 천간은 상관에 해당합니다",
      source: "rule",
    });
  });

  it("甲 일간 × 壬子 일진 → 편인·생", () => {
    state.day = ganzhiOf("壬", "子");
    const t = deriveToday(makeChartFixture({ day: "甲子" }), DATE);
    expect(t.dayTenGod).toBe("편인");
    expect(t.headline).toBe("배우고 채우기 좋은 날");
    expect(t.scores).toEqual({ relation: 55, work: 50, self: 70 });
    expect(t.action.id).toBe("slow-breath-five");
  });

  it("癸 일간 × 戊午 일진 → 정관·재", () => {
    state.day = ganzhiOf("戊", "午");
    const t = deriveToday(makeChartFixture({ day: "癸亥" }), DATE);
    expect(t.dayTenGod).toBe("정관");
    expect(t.headline).toBe("규칙 안에서 효율을 찾는 날");
  });
});

describe("deriveToday — 현재 대운", () => {
  it("만나이(오늘 연도 − 출생 연도)가 구간 안이면 currentLuck + luck.current fact", () => {
    state.day = makeGanzhi(0);
    const t = deriveToday(makeChartFixture({ birthDate: "1995-05-05", luckStartAge: 4 }), DATE);
    // 2026 − 1995 = 31 → 24~33 구간(3번째)
    expect(t.currentLuck?.order).toBe(3);
    expect(t.facts.map((f) => f.id)).toContain("luck.current");
    expect(t.why.factIds).toContain("luck.current");
  });
  it("대운 없으면 null", () => {
    state.day = makeGanzhi(0);
    const t = deriveToday(makeChartFixture({ luckStartAge: null }), DATE);
    expect(t.currentLuck).toBeNull();
    expect(t.facts.map((f) => f.id)).not.toContain("luck.current");
  });
});

describe("branchRelation", () => {
  it("생·극·비화·설·재", () => {
    expect(branchRelation("wood", "water")).toBe("support");
    expect(branchRelation("wood", "metal")).toBe("pressure");
    expect(branchRelation("wood", "wood")).toBe("same");
    expect(branchRelation("wood", "fire")).toBe("output");
    expect(branchRelation("wood", "earth")).toBe("control");
  });
});
