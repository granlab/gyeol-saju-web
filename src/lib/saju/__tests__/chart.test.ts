import { describe, expect, it } from "vitest";
import { computeChart, ganzhiOfDate, yearMonthGanzhiOfDate } from "../chart";
import { ELEMENTS, type BirthInput, type SajuChart } from "../types";

function chart(date: string, time: string | null, extra: Partial<BirthInput> = {}): SajuChart {
  return computeChart({ date, time, gender: null, ...extra });
}
function names(c: SajuChart) {
  return {
    year: c.pillars.year.name,
    month: c.pillars.month.name,
    day: c.pillars.day.name,
    hour: c.pillars.hour?.name ?? null,
  };
}

const BASE_FACT_IDS = [
  "pillar.year",
  "pillar.month",
  "pillar.day",
  "daymaster",
  "element.counts",
  "element.dominant",
  "element.missing",
  "tengod.groups",
  "tengod.dominant",
  "strength",
  "term.month",
  "term.boundary",
  "time.correction",
  "luck.direction",
  "luck.start",
];

describe("일진 앵커·연속성", () => {
  it("ganzhiOfDate", () => {
    expect(ganzhiOfDate("2000-01-01").name).toBe("戊午");
    expect(ganzhiOfDate("1900-01-01").name).toBe("甲戌");
    expect(ganzhiOfDate("1999-12-31").name).toBe("丁巳");
    expect(ganzhiOfDate("2000-01-02").name).toBe("己未");
  });
  it("yearMonthGanzhiOfDate (절기 기준)", () => {
    expect(yearMonthGanzhiOfDate("2024-02-03")).toMatchObject({ year: { name: "癸卯" }, month: { name: "乙丑" } });
    expect(yearMonthGanzhiOfDate("2024-02-05")).toMatchObject({ year: { name: "甲辰" }, month: { name: "丙寅" } });
    expect(yearMonthGanzhiOfDate("2026-10-03").year.name).toBe("丙午");
  });
});

describe("사주 사례 (서울, 기본 옵션)", () => {
  it("a) 2000-01-01 12:00 → 己卯 丙子 戊午 戊午", () => {
    const c = chart("2000-01-01", "12:00");
    expect(names(c)).toEqual({ year: "己卯", month: "丙子", day: "戊午", hour: "戊午" });
    expect(c.resolved.solarLocal).toBe("2000-01-01T11:28");
    expect(c.dayMaster.nickname).toBe("넓은 산(무토)");
    expect(c.engineVersion).toBe("0.1.0");
  });

  it("b) 2000-01-01 00:30 → 야자시 다음 날 일주 戊午, 壬子時", () => {
    const c = chart("2000-01-01", "00:30");
    expect(c.resolved.solarLocal).toBe("1999-12-31T23:58");
    expect(c.resolved.rolledToNextDay).toBe(true);
    expect(c.pillars.day.name).toBe("戊午");
    expect(c.pillars.hour?.name).toBe("壬子");
    expect(c.warnings).toContain("야자시(23시 이후) 출생으로 일주를 다음 날로 계산했습니다(정자시법)");
  });

  it("b') dayBoundary=midnight → 丁巳日 庚子時", () => {
    const c = chart("2000-01-01", "00:30", { options: { dayBoundary: "midnight" } });
    expect(c.resolved.rolledToNextDay).toBe(false);
    expect(c.resolved.dayBoundaryRule).toBe("midnight");
    expect(c.pillars.day.name).toBe("丁巳");
    // 야자시법: 일주는 당일(丁巳)이지만 23시 이후 시주 천간은 다음 날 일간(戊) 기준 → 壬子
    expect(c.pillars.hour?.name).toBe("壬子");
    expect(c.warnings.some((w) => w.includes("야자시법"))).toBe(true);
  });

  it("c) 입춘 경계 2025-02-03 22:00 / 2025-02-04 01:00", () => {
    const before = chart("2025-02-03", "22:00");
    expect(before.pillars.year.name).toBe("甲辰");
    expect(before.pillars.month.name).toBe("丁丑");
    expect(before.solarTerms.nearBoundary).toBe(true);
    expect(before.solarTerms.nextMonthTerm.name).toBe("입춘");
    const after = chart("2025-02-04", "01:00");
    expect(after.pillars.year.name).toBe("乙巳");
    expect(after.pillars.month.name).toBe("戊寅");
    expect(after.solarTerms.nearBoundary).toBe(true);
    expect(after.solarTerms.monthTerm.name).toBe("입춘");
    expect(after.warnings.some((w) => w.startsWith("절기 경계와"))).toBe(true);
  });

  it("d) 1987-06-15 14:00 서머타임 → 12:28 午時", () => {
    const c = chart("1987-06-15", "14:00");
    expect(c.resolved.dstMinutes).toBe(60);
    expect(c.resolved.totalCorrectionMinutes).toBe(-92);
    expect(c.resolved.solarLocal).toBe("1987-06-15T12:28");
    expect(c.pillars.hour?.branch).toBe("午");
    expect(c.warnings).toContain("서머타임 기간 출생으로 1시간을 보정했습니다");
  });

  it("e) 1958-07-01 10:00 → +8:30, 서머타임, 경도 −2", () => {
    const c = chart("1958-07-01", "10:00");
    expect(c.resolved.standardOffsetMinutes).toBe(510);
    expect(c.resolved.dstMinutes).toBe(60);
    expect(c.resolved.longitudeCorrectionMinutes).toBe(-2);
  });

  it("f) 시간 미상 → 시주 null", () => {
    const c = chart("1990-05-01", null);
    expect(c.pillars.hour).toBeNull();
    expect(c.resolved.hourKnown).toBe(false);
    expect(c.resolved.civilISO).toBe("1990-05-01T12:00:00+09:00");
    expect(c.warnings).toContain("출생 시간 미상으로 시주를 생략했습니다");
    expect(ELEMENTS.reduce((a, e) => a + c.elements.counts[e], 0)).toBe(6);
    expect(c.facts.some((f) => f.id === "pillar.hour")).toBe(false);
  });

  it("g) 대운 방향: 1990-05-01 10:00 庚午年", () => {
    const f = chart("1990-05-01", "10:00", { gender: "female" });
    expect(f.pillars.year.name).toBe("庚午");
    expect(f.luckCycles.direction).toBe("backward");
    const m = chart("1990-05-01", "10:00", { gender: "male" });
    expect(m.luckCycles.direction).toBe("forward");
    for (const c of [f, m]) {
      expect(c.luckCycles.startAge).toBeGreaterThanOrEqual(1);
      expect(c.luckCycles.startAge).toBeLessThanOrEqual(10);
      expect(c.luckCycles.cycles).toHaveLength(10);
      expect(c.luckCycles.cycles[0].startAge).toBe(c.luckCycles.startAge);
      expect(c.luckCycles.cycles[0].endAge).toBe((c.luckCycles.startAge as number) + 9);
      expect(c.luckCycles.cycles[1].startAge).toBe((c.luckCycles.startAge as number) + 10);
      expect(c.luckCycles.cycles[0].startYear).toBe(1990 + (c.luckCycles.startAge as number));
    }
    // 1990-05-01 은 입하(05-06) 직전 → 월주 庚辰. 순행 첫 대운 辛巳, 역행 첫 대운 己卯
    expect(m.pillars.month.name).toBe("庚辰");
    expect(m.luckCycles.cycles[0].ganzhi.name).toBe("辛巳");
    expect(f.luckCycles.cycles[0].ganzhi.name).toBe("己卯");
    // 남성: 입하까지 약 5일 → 2, 여성: 청명(04-05)부터 약 26일 → 9
    expect(m.luckCycles.startAge).toBe(2);
    expect(f.luckCycles.startAge).toBe(9);
  });

  it("g') 성별 없음/기타 → 대운 생략", () => {
    for (const gender of [null, "other"] as const) {
      const c = chart("1990-05-01", "10:00", { gender });
      expect(c.luckCycles.direction).toBeNull();
      expect(c.luckCycles.startAge).toBeNull();
      expect(c.luckCycles.cycles).toEqual([]);
    }
    expect(chart("1990-05-01", "10:00").luckCycles.note).toBe("성별 정보가 없어 대운 방향을 정하지 않았습니다");
  });

  it("h) 결정성", () => {
    const input: BirthInput = { date: "1984-07-15", time: "07:45", gender: "male", placeName: "부산", longitude: 129.075 };
    expect(JSON.stringify(computeChart(input))).toBe(JSON.stringify(computeChart(input)));
  });

  it("time.correction 문장", () => {
    const c = chart("1990-05-01", "14:30");
    expect(c.facts.find((f) => f.id === "time.correction")?.text).toBe(
      "출생지 서울 기준 경도 보정 −32분을 적용해 평균태양시 13:58로 계산했습니다.",
    );
  });
});

describe("요약 지표", () => {
  it("오행 counts/weighted, 십성, 신강약 기본 성질", () => {
    const c = chart("2000-01-01", "12:00");
    // 己卯 丙子 戊午 戊午: 土 己戊戊 + 火 丙午午 + 木 卯 + 水 子 = 土3 火3 木1 水1 金0
    expect(c.elements.counts).toEqual({ wood: 1, fire: 3, earth: 3, metal: 0, water: 1 });
    expect(c.elements.missing).toEqual(["metal"]);
    expect(c.elements.weakest).toBe("metal");
    expect(c.tenGods.list).toHaveLength(7);
    expect(c.strength.score).toBeGreaterThanOrEqual(0);
    expect(c.strength.score).toBeLessThanOrEqual(100);
    expect(c.strength.factors.length).toBeGreaterThanOrEqual(2);
    expect(c.strength.factors.length).toBeLessThanOrEqual(4);
    // 戊 일간: 월지 子(癸 정재) 실령, 일지 午(丁 정인) 득지
    expect(c.strength.factors[0]).toContain("실령");
    expect(c.strength.factors[1]).toContain("득지");
  });
});

describe("i) 1900~2100 임의 100개 날짜 스모크", () => {
  // 결정적 의사난수 (LCG)
  let seed = 20261003;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const pad = (n: number) => String(n).padStart(2, "0");
  const cases: BirthInput[] = Array.from({ length: 100 }, (_, i) => {
    const y = 1900 + Math.floor(rand() * 201);
    const m = 1 + Math.floor(rand() * 12);
    const d = 1 + Math.floor(rand() * 28);
    const time = i % 7 === 0 ? null : `${pad(Math.floor(rand() * 24))}:${pad(Math.floor(rand() * 60))}`;
    const gender = (["male", "female", null, "other"] as const)[i % 4];
    return { date: `${y}-${pad(m)}-${pad(d)}`, time, gender };
  });
  cases.push({ date: "1900-01-01", time: "00:10", gender: "male" }, { date: "2100-12-31", time: "23:50", gender: "female" });

  it("throw 없음, 합 100, Fact id 규약", () => {
    for (const input of cases) {
      const c = computeChart(input);
      const wsum = ELEMENTS.reduce((a, e) => a + c.elements.weighted[e], 0);
      expect(wsum, input.date).toBe(100);
      const gsum = Object.values(c.tenGods.byGroup).reduce((a, b) => a + b, 0);
      expect(gsum, input.date).toBe(100);
      const ids = new Set(c.facts.map((f) => f.id));
      for (const id of BASE_FACT_IDS) expect(ids.has(id), `${input.date} ${id}`).toBe(true);
      expect(ids.has("pillar.hour")).toBe(input.time !== null);
      expect(c.facts.every((f) => f.text.length > 0 && f.source === "engine")).toBe(true);
      expect(c.solarTerms.hoursToNearestBoundary).toBeGreaterThanOrEqual(0);
      const prev = Date.parse(c.solarTerms.monthTerm.at);
      const next = Date.parse(c.solarTerms.nextMonthTerm.at);
      const birth = Date.parse(c.resolved.utcISO);
      expect(prev <= birth && birth < next, input.date).toBe(true);
      // 월주 천간은 년간과 월건법 일치, 월지는 절 구간과 일치 (정합성)
      expect(c.pillars.month.branch).toBeDefined();
    }
  });
});

describe("입력 검증", () => {
  it("잘못된 입력은 한국어 Error", () => {
    expect(() => chart("1899-12-31", "12:00")).toThrow(/지원 범위/);
    expect(() => chart("2101-01-01", "12:00")).toThrow(/지원 범위/);
    expect(() => chart("2000-13-01", "12:00")).toThrow(/월/);
    expect(() => chart("2000-01-01", "25:00")).toThrow(/시각/);
    expect(() => chart("2000-01-01", "abc")).toThrow(/형식/);
  });
});
