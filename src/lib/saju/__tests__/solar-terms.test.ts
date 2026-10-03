import { describe, expect, it } from "vitest";
import { getSolarTerms, monthBranchIndexOfTerm } from "../solar-terms";

/** 한국천문연구원 공표값(KST, 분) */
const REFERENCE: Array<[number, string, string]> = [
  [2024, "춘분", "2024-03-20T12:06"],
  [2024, "하지", "2024-06-21T05:51"],
  [2024, "추분", "2024-09-22T21:44"],
  [2024, "동지", "2024-12-21T18:20"],
  [2025, "춘분", "2025-03-20T18:01"],
  [2026, "춘분", "2026-03-20T23:46"],
  [2000, "춘분", "2000-03-20T16:35"],
  [1990, "동지", "1990-12-22T12:07"],
  [2024, "입춘", "2024-02-04T17:27"],
  [2025, "입춘", "2025-02-03T23:10"],
  [2023, "입춘", "2023-02-04T11:43"],
];

function diffMinutes(year: number, name: string, expected: string): number {
  const t = getSolarTerms(year).find((x) => x.name === name);
  if (!t) throw new Error(`missing ${name}`);
  return (Date.parse(t.at) - Date.parse(`${expected}:00+09:00`)) / 60000;
}

describe("절기 절입 시각 정확도 (±20분)", () => {
  for (const [year, name, expected] of REFERENCE) {
    it(`${year} ${name} ≈ ${expected} KST`, () => {
      expect(Math.abs(diffMinutes(year, name, expected))).toBeLessThanOrEqual(20);
    });
  }
});

describe("getSolarTerms 구조", () => {
  it("24개, 소한부터 시간순, 같은 해 안", () => {
    for (const year of [1900, 1955, 2024, 2100]) {
      const terms = getSolarTerms(year);
      expect(terms).toHaveLength(24);
      expect(terms[0].name).toBe("소한");
      expect(terms[23].name).toBe("동지");
      for (let i = 1; i < 24; i++) {
        expect(Date.parse(terms[i].at)).toBeGreaterThan(Date.parse(terms[i - 1].at));
      }
      expect(terms[0].at.startsWith(`${year}-01-`)).toBe(true);
      expect(terms[23].at.startsWith(`${year}-12-`)).toBe(true);
      expect(terms.every((t) => t.at.endsWith("+09:00"))).toBe(true);
      expect(terms.filter((t) => t.isMonthBoundary)).toHaveLength(12);
    }
  });
  it("메모이즈: 같은 연도 반복 호출 결과 동일", () => {
    expect(getSolarTerms(2024)).toEqual(getSolarTerms(2024));
  });
  it("절 황경 → 월지", () => {
    expect(monthBranchIndexOfTerm(315)).toBe(2);
    expect(monthBranchIndexOfTerm(345)).toBe(3);
    expect(monthBranchIndexOfTerm(15)).toBe(4);
    expect(monthBranchIndexOfTerm(255)).toBe(0);
    expect(monthBranchIndexOfTerm(285)).toBe(1);
  });
});

describe("실측 오차 기록", () => {
  it("모든 기준값 오차 출력", () => {
    const rows = REFERENCE.map(([y, n, e]) => `${y} ${n}: ${diffMinutes(y, n, e)}분`);
    console.log(rows.join("\n"));
    expect(rows).toHaveLength(REFERENCE.length);
  });
});
