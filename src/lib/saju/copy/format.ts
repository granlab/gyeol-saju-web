/**
 * 표기 헬퍼: 한자 간지 + 한글 병기.
 */
import { branchKo, stemKo, STEM_ELEMENT, BRANCH_ELEMENT } from "../ganzhi";
import { ELEMENT_KO, type Branch, type Element, type GanZhi, type Stem } from "../types";

/** 오행 한 글자 한글 (목/화/토/금/수) */
export function elementChar(e: Element): string {
  return ELEMENT_KO[e].charAt(0);
}

/** '甲(갑목)' */
export function stemLabel(s: Stem): string {
  return `${s}(${stemKo(s)}${elementChar(STEM_ELEMENT[s])})`;
}

/** '甲(갑)' */
export function stemShort(s: Stem): string {
  return `${s}(${stemKo(s)})`;
}

/** '寅(인목)' */
export function branchLabel(b: Branch): string {
  return `${b}(${branchKo(b)}${elementChar(BRANCH_ELEMENT[b])})`;
}

/** '甲子(갑자)' */
export function ganzhiLabel(g: GanZhi): string {
  return `${g.name}(${g.nameKo})`;
}

/** '목(木)·화(火)' */
export function elementList(es: Element[]): string {
  return es.map((e) => ELEMENT_KO[e]).join("·");
}
