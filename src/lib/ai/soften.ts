/**
 * 단정 완화 사후 필터. live/mock 응답에만 적용(safety/restricted 제외).
 * 명시된 패턴만 치환한다. 문장 전체를 재작성하지 않는다.
 */

const RULES: Array<[RegExp, string]> = [
  [/반드시 /g, ""],
  [/틀림없이 /g, ""],
  [/확실히 /g, ""],
  [/100\s?%/g, "상당히"],
  [/할 것입니다/g, "할 가능성이 있다고 해석됩니다"],
  [/될 것입니다/g, "될 수 있다고 해석됩니다"],
];

export function softenCertainty(text: string): { text: string; softened: boolean } {
  let out = text;
  for (const [re, rep] of RULES) {
    out = out.replace(re, rep);
  }
  return { text: out, softened: out !== text };
}
