import { describe, expect, it } from "vitest";
import { softenCertainty } from "../soften";

describe("softenCertainty — 치환", () => {
  const cases: Array<[string, string]> = [
    ["반드시 좋은 사람을 만납니다.", "좋은 사람을 만납니다."],
    ["틀림없이 성공합니다.", "성공합니다."],
    ["올해는 확실히 바쁩니다.", "올해는 바쁩니다."],
    ["100% 맞는 흐름이에요.", "상당히 맞는 흐름이에요."],
    ["이직을 할 것입니다.", "이직을 할 가능성이 있다고 해석됩니다."],
    ["관계가 좋아지게 될 것입니다.", "관계가 좋아지게 될 수 있다고 해석됩니다."],
  ];
  for (const [input, expected] of cases) {
    it(input, () => {
      const r = softenCertainty(input);
      expect(r.text).toBe(expected);
      expect(r.softened).toBe(true);
    });
  }
});

describe("softenCertainty — 무변경", () => {
  const unchanged = [
    "전통 명리 관점에서는 표현이 늘어나는 시기로 해석됩니다.",
    "실제 결과는 선택과 상황에 달려 있습니다.",
    "오늘은 먼저 질문 하나를 던져 보세요.",
  ];
  for (const input of unchanged) {
    it(input, () => {
      const r = softenCertainty(input);
      expect(r.text).toBe(input);
      expect(r.softened).toBe(false);
    });
  }
});
