import { describe, expect, it } from "vitest";
import { DEFAULT_ENGINE_OPTIONS } from "../types";
import {
  dstTransitionWarning,
  hourBranchIndex,
  isDst,
  resolveTime,
  standardOffsetMinutes,
  WARN_DST_GAP,
  WARN_DST_OVERLAP,
} from "../time-rules";
import { dayGanzhiIndexFromJDN, jdnFromYMD, parseDate, parseTime, ymdFromJDN } from "../calendar";

const OPTS = DEFAULT_ENGINE_OPTIONS;

describe("JDN·일진", () => {
  it("앵커: 2000-01-01 戊午(54), 1900-01-01 甲戌(10)", () => {
    expect(jdnFromYMD(2000, 1, 1)).toBe(2451545);
    expect(dayGanzhiIndexFromJDN(jdnFromYMD(2000, 1, 1))).toBe(54);
    expect(dayGanzhiIndexFromJDN(jdnFromYMD(1900, 1, 1))).toBe(10);
  });
  it("JDN 왕복", () => {
    for (const [y, m, d] of [
      [1900, 1, 1],
      [1900, 3, 1],
      [2000, 2, 29],
      [2100, 12, 31],
    ]) {
      expect(ymdFromJDN(jdnFromYMD(y, m, d))).toEqual({ y, m, d });
    }
  });
  it("입력 검증(한국어 메시지)", () => {
    expect(() => parseDate("2001-02-29")).toThrow(/존재하지 않는 날짜/);
    expect(() => parseDate("1899-12-31")).toThrow(/지원 범위/);
    expect(() => parseDate("2000/01/01")).toThrow(/형식/);
    expect(() => parseTime("24:00")).toThrow(/존재하지 않는 시각/);
    expect(() => parseTime("9:30")).toThrow(/형식/);
  });
});

describe("표준시·서머타임 테이블", () => {
  it("표준시 오프셋 구간", () => {
    expect(standardOffsetMinutes("1900-06-01T12:00")).toBe(510);
    expect(standardOffsetMinutes("1910-06-01T12:00")).toBe(510);
    expect(standardOffsetMinutes("1912-01-01T00:00")).toBe(540);
    expect(standardOffsetMinutes("1954-03-20T23:59")).toBe(540);
    expect(standardOffsetMinutes("1954-03-21T00:00")).toBe(510);
    expect(standardOffsetMinutes("1961-08-09T23:59")).toBe(510);
    expect(standardOffsetMinutes("1961-08-10T00:00")).toBe(540);
  });
  it("서머타임 경계(1987)", () => {
    expect(isDst("1987-05-10T01:59")).toBe(false);
    expect(isDst("1987-05-10T02:00")).toBe(true);
    expect(isDst("1987-10-11T02:59")).toBe(true);
    expect(isDst("1987-10-11T03:00")).toBe(false);
    expect(isDst("1948-09-12T23:00")).toBe(true);
    expect(isDst("1952-07-01T12:00")).toBe(false);
  });
  it("시지 판정", () => {
    expect(hourBranchIndex(23 * 60)).toBe(0);
    expect(hourBranchIndex(59)).toBe(0);
    expect(hourBranchIndex(60)).toBe(1);
    expect(hourBranchIndex(11 * 60 + 28)).toBe(6);
    expect(hourBranchIndex(22 * 60 + 59)).toBe(11);
  });
});

describe("resolveTime", () => {
  it("서울 기본: 경도 보정 −32분", () => {
    const r = resolveTime("1990-05-01", "14:30", 126.978, OPTS).resolved;
    expect(r.civilISO).toBe("1990-05-01T14:30:00+09:00");
    expect(r.utcISO).toBe("1990-05-01T05:30:00Z");
    expect(r.solarLocal).toBe("1990-05-01T13:58");
    expect(r.longitudeCorrectionMinutes).toBe(-32);
    expect(r.totalCorrectionMinutes).toBe(-32);
  });
  it("1987 서머타임: dst 60, 총 −92, 12:28", () => {
    const t = resolveTime("1987-06-15", "14:00", 126.978, OPTS);
    expect(t.resolved.dstMinutes).toBe(60);
    expect(t.resolved.totalCorrectionMinutes).toBe(-92);
    expect(t.resolved.solarLocal).toBe("1987-06-15T12:28");
    expect(t.resolved.utcISO).toBe("1987-06-15T04:00:00Z");
    expect(t.warnings).toContain("서머타임 기간 출생으로 1시간을 보정했습니다");
  });
  it("서머타임 전환 구간 경고: 시작(건너뛴 1시간)·종료(중복 1시간)", () => {
    expect(dstTransitionWarning("1987-05-10T02:30")).toBe(WARN_DST_GAP);
    expect(dstTransitionWarning("1987-05-10T01:59")).toBeNull();
    expect(dstTransitionWarning("1987-05-10T03:00")).toBeNull();
    expect(dstTransitionWarning("1987-10-11T02:30")).toBe(WARN_DST_OVERLAP);
    expect(dstTransitionWarning("1987-10-11T01:59")).toBeNull();
    expect(dstTransitionWarning("1987-10-11T03:00")).toBeNull();
    expect(dstTransitionWarning("1987-06-15T14:00")).toBeNull();
    const gap = resolveTime("1987-05-10", "02:30", 126.978, OPTS);
    expect(gap.warnings).toContain(WARN_DST_GAP);
    const overlap = resolveTime("1987-10-11", "02:30", 126.978, OPTS);
    expect(overlap.warnings).toContain(WARN_DST_OVERLAP);
    expect(overlap.resolved.dstMinutes).toBe(60);
    // 시간 미상이면 전환 경고 없음
    expect(resolveTime("1987-05-10", null, 126.978, OPTS).warnings).not.toContain(WARN_DST_GAP);
  });
  it("1958 UTC+8:30 + 서머타임: 경도 보정 −2", () => {
    const r = resolveTime("1958-07-01", "10:00", 126.978, OPTS).resolved;
    expect(r.standardOffsetMinutes).toBe(510);
    expect(r.dstMinutes).toBe(60);
    expect(r.longitudeCorrectionMinutes).toBe(-2);
    expect(r.solarLocal).toBe("1958-07-01T08:58");
  });
  it("역사 규칙·경도 보정 끄기", () => {
    const r = resolveTime("1987-06-15", "14:00", 126.978, {
      ...OPTS,
      historicalTimeRules: false,
      longitudeCorrection: false,
    }).resolved;
    expect(r.dstMinutes).toBe(0);
    expect(r.standardOffsetMinutes).toBe(540);
    expect(r.totalCorrectionMinutes).toBe(0);
    expect(r.solarLocal).toBe("1987-06-15T14:00");
  });
  it("1908 이전 경고", () => {
    const t = resolveTime("1905-03-03", "12:00", 126.978, OPTS);
    expect(t.resolved.standardOffsetMinutes).toBe(510);
    expect(t.warnings).toContain("1908년 이전 출생은 표준시 기록이 불확실합니다");
  });
  it("부산 경도 보정", () => {
    const r = resolveTime("2000-01-01", "12:00", 129.075, OPTS).resolved;
    expect(r.longitudeCorrectionMinutes).toBe(Math.round((129.075 - 135) * 4));
  });
});
