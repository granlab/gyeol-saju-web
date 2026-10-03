import { describe, expect, it } from "vitest";
import {
  ganzhiIndex,
  ganzhiOf,
  hourStemIndex,
  makeGanzhi,
  monthStemIndex,
  tenGod,
  tenGodOfBranch,
} from "../ganzhi";
import { STEMS } from "../types";

describe("육십갑자 인덱스", () => {
  it("甲子=0, 乙丑=1, 癸亥=59", () => {
    expect(makeGanzhi(0).name).toBe("甲子");
    expect(makeGanzhi(1).name).toBe("乙丑");
    expect(makeGanzhi(59).name).toBe("癸亥");
    expect(makeGanzhi(60).name).toBe("甲子");
  });
  it("戊午=54, 甲戌=10, 丙子=12", () => {
    expect(ganzhiOf("戊", "午").index).toBe(54);
    expect(ganzhiOf("甲", "戌").index).toBe(10);
    expect(ganzhiOf("丙", "子").index).toBe(12);
  });
  it("음양이 다른 조합은 거부", () => {
    expect(() => ganzhiIndex(0, 1)).toThrow();
  });
  it("한글 표기", () => {
    expect(ganzhiOf("庚", "辰").nameKo).toBe("경진");
    expect(ganzhiOf("庚", "辰").hiddenStems[0]).toBe("戊");
  });
});

describe("십성", () => {
  it("甲 일간 기준", () => {
    expect(tenGod("甲", "甲")).toBe("비견");
    expect(tenGod("甲", "乙")).toBe("겁재");
    expect(tenGod("甲", "丙")).toBe("식신");
    expect(tenGod("甲", "丁")).toBe("상관");
    expect(tenGod("甲", "戊")).toBe("편재");
    expect(tenGod("甲", "己")).toBe("정재");
    expect(tenGod("甲", "庚")).toBe("편관");
    expect(tenGod("甲", "辛")).toBe("정관");
    expect(tenGod("甲", "壬")).toBe("편인");
    expect(tenGod("甲", "癸")).toBe("정인");
  });
  it("癸 일간 기준 (음간)", () => {
    expect(tenGod("癸", "壬")).toBe("겁재");
    expect(tenGod("癸", "乙")).toBe("식신");
    expect(tenGod("癸", "丁")).toBe("편재");
    expect(tenGod("癸", "戊")).toBe("정관");
    expect(tenGod("癸", "庚")).toBe("정인");
  });
  it("지지는 본기 기준: 甲 일간에 午(본기 丁) → 상관, 子(본기 癸) → 정인", () => {
    expect(tenGodOfBranch("甲", "午")).toBe("상관");
    expect(tenGodOfBranch("甲", "子")).toBe("정인");
  });
  it("모든 일간×천간 조합이 예외 없이 계산된다", () => {
    for (const a of STEMS) for (const b of STEMS) expect(() => tenGod(a, b)).not.toThrow();
  });
});

describe("월건·시두법", () => {
  it("년상기월: 甲年 寅月=丙, 己年 寅月=丙, 乙年=戊, 丙年=庚, 丁年=壬, 戊年=甲", () => {
    expect(STEMS[monthStemIndex(0, 2)]).toBe("丙");
    expect(STEMS[monthStemIndex(5, 2)]).toBe("丙");
    expect(STEMS[monthStemIndex(1, 2)]).toBe("戊");
    expect(STEMS[monthStemIndex(2, 2)]).toBe("庚");
    expect(STEMS[monthStemIndex(3, 2)]).toBe("壬");
    expect(STEMS[monthStemIndex(4, 2)]).toBe("甲");
  });
  it("己卯年 子月 = 丙子", () => {
    // 己(5) 년, 子(0) 월
    expect(STEMS[monthStemIndex(5, 0)]).toBe("丙");
  });
  it("일상기시: 甲日 子時=甲, 乙日=丙, 丙日=戊, 丁日=庚, 戊日=壬, 癸日 子時=壬", () => {
    expect(STEMS[hourStemIndex(0, 0)]).toBe("甲");
    expect(STEMS[hourStemIndex(1, 0)]).toBe("丙");
    expect(STEMS[hourStemIndex(2, 0)]).toBe("戊");
    expect(STEMS[hourStemIndex(3, 0)]).toBe("庚");
    expect(STEMS[hourStemIndex(4, 0)]).toBe("壬");
    expect(STEMS[hourStemIndex(9, 0)]).toBe("壬");
    // 戊午日 → 壬子時 시작, 午(6) → 壬+6 = 戊午時
    expect(STEMS[hourStemIndex(4, 6)]).toBe("戊");
  });
});
