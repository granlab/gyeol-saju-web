/**
 * 대운(大運). 양남음녀 순행, 음남양녀 역행.
 * 대운수 = 출생~절입(순행: 다음 절, 역행: 직전 절) 일수 ÷ 3 반올림, 최소 1.
 */
import { makeGanzhi, tenGod, tenGodOfBranch } from "./ganzhi";
import { MS_PER_DAY } from "./calendar";
import type { SolarTermInternal } from "./solar-terms";
import { josa, stemLabel } from "./text";
import type { BirthInput, GanZhi, LuckCycles, Stem } from "./types";

export function computeLuck(params: {
  gender: BirthInput["gender"];
  yearStem: GanZhi["stem"];
  yearStemPolarity: GanZhi["stemPolarity"];
  monthGanzhi: GanZhi;
  dayStem: Stem;
  birthUtcMs: number;
  prevTerm: SolarTermInternal;
  nextTerm: SolarTermInternal;
  sajuYear: number;
  hourKnown: boolean;
}): LuckCycles {
  const { gender } = params;
  if (gender !== "male" && gender !== "female") {
    return {
      direction: null,
      startAge: null,
      note:
        gender === "other"
          ? "대운 방향은 전통적으로 성별(양남음녀)로 정해서, 성별을 '기타'로 고른 경우 대운을 생략했습니다"
          : "성별 정보가 없어 대운 방향을 정하지 않았습니다",
      cycles: [],
    };
  }
  const yang = params.yearStemPolarity === "yang";
  const forward = (yang && gender === "male") || (!yang && gender === "female");
  const term = forward ? params.nextTerm : params.prevTerm;
  const days = Math.abs(term.utcMs - params.birthUtcMs) / MS_PER_DAY;
  const startAge = Math.max(1, Math.round(days / 3));

  const cycles = Array.from({ length: 10 }, (_, i) => {
    const g = makeGanzhi(params.monthGanzhi.index + (forward ? i + 1 : -(i + 1)));
    const age = startAge + i * 10;
    return {
      order: i + 1,
      startAge: age,
      endAge: age + 9,
      startYear: params.sajuYear + age,
      ganzhi: g,
      stemTenGod: tenGod(params.dayStem, g.stem),
      branchTenGod: tenGodOfBranch(params.dayStem, g.branch),
    };
  });

  const ys = stemLabel(params.yearStem);
  const pol = yang ? "양(陽)" : "음(陰)";
  const who = gender === "male" ? "남성" : "여성";
  const dir = forward ? "순행" : "역행";
  const span = forward
    ? `출생부터 다음 절기 ${term.name}(${term.hanja})까지`
    : `직전 절기 ${term.name}(${term.hanja})부터 출생까지`;
  const daysText = (Math.round(days * 10) / 10).toFixed(1);
  const assumed = params.hourKnown ? "" : " 출생 시간 미상이라 정오를 가정했습니다.";
  return {
    direction: forward ? "forward" : "backward",
    startAge,
    note: `년간 ${ys}${josa(ys, "이/가")} ${pol}이고 ${who}이라 ${dir}하며, ${span} ${daysText}일을 3으로 나눠 대운수 ${startAge}로 계산했습니다.${assumed}`,
    cycles,
  };
}
