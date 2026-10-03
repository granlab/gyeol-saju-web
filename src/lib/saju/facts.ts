/**
 * 차트 → Fact 목록 (LLM/카드가 인용하는 원자 근거). 비전문가도 읽을 수 있는 한국어 한 문장씩.
 * id 규약은 types.ts 참고.
 */
import { branchLabel, gzLabel, josa, signedMinutes, stemLabel, withJosa } from "./text";
import { TEN_GOD_GROUPS } from "./strength";
import type { SolarTermInternal } from "./solar-terms";
import { ELEMENT_KO, ELEMENTS, type Fact, type SajuChart, type TenGodGroup } from "./types";

export const TEN_GOD_GROUP_PLAIN: Record<TenGodGroup, string> = {
  비겁: "나와 같은 힘·동료",
  식상: "표현과 만들어 내는 힘",
  재성: "현실 감각과 재물을 다루는 힘",
  관성: "규칙과 책임의 힘",
  인성: "배움과 보살핌의 힘",
};

const POLARITY_KO = { yang: "양(陽)", yin: "음(陰)" } as const;

function fact(id: string, text: string): Fact {
  return { id, text, source: "engine" };
}

function termLabel(t: { name: string; hanja: string }): string {
  return `${t.name}(${t.hanja})`;
}

function kstShort(at: string): string {
  return `${at.slice(0, 10)} ${at.slice(11, 16)}`;
}

export function buildFacts(
  chart: Omit<SajuChart, "facts">,
  ctx: { placeName: string; prevTerm: SolarTermInternal; nextTerm: SolarTermInternal; nearestTerm: SolarTermInternal },
): Fact[] {
  const { pillars, dayMaster, elements, tenGods, strength, resolved, luckCycles } = chart;
  const facts: Fact[] = [];
  const dm = stemLabel(dayMaster.stem);
  const solarHM = resolved.solarLocal.slice(11, 16);

  facts.push(
    fact("pillar.year", `년주는 ${withJosa(gzLabel(pillars.year), "으로/로")}, 입춘을 기준으로 정한 태어난 해의 기운입니다.`),
  );
  facts.push(
    fact(
      "pillar.month",
      `월주는 ${withJosa(gzLabel(pillars.month), "으로/로")}, ${termLabel(ctx.prevTerm)} 이후에 태어나 ${branchLabel(pillars.month.branch)}월의 계절 기운을 받습니다.`,
    ),
  );
  facts.push(
    fact(
      "pillar.day",
      `일주는 ${withJosa(gzLabel(pillars.day), "으로/로")}, 나 자신을 뜻하는 일간 ${dm}${josa(dm, "이/가")} 여기에 있습니다.`,
    ),
  );
  if (pillars.hour) {
    const hb = branchLabel(pillars.hour.branch);
    facts.push(
      fact("pillar.hour", `시주는 ${withJosa(gzLabel(pillars.hour), "으로/로")}, 평균태양시 ${solarHM}${josa(solarHM, "은/는")} ${hb}시에 해당합니다.`),
    );
  }

  facts.push(
    fact(
      "daymaster",
      `일간은 ${withJosa(dm, "으로/로")}, ${dayMaster.nickname}처럼 ${ELEMENT_KO[dayMaster.element]}·${POLARITY_KO[dayMaster.polarity]}의 성질을 가진 기운입니다.`,
    ),
  );

  const total = ELEMENTS.reduce((a, e) => a + elements.counts[e], 0);
  facts.push(
    fact(
      "element.counts",
      `${total === 8 ? "여덟" : "여섯"} 글자의 오행 개수는 ${ELEMENTS.map((e) => `${ELEMENT_KO[e]} ${elements.counts[e]}`).join(", ")}개입니다.`,
    ),
  );

  const dom = elements.dominant;
  facts.push(
    fact(
      "element.dominant",
      dom.length === 1
        ? `지장간까지 가중해 보면 ${ELEMENT_KO[dom[0]]} 기운이 ${elements.weighted[dom[0]]}%로 가장 많습니다.`
        : `지장간까지 가중해 보면 ${dom.map((e) => `${ELEMENT_KO[e]} ${elements.weighted[e]}%`).join(", ")}로 여러 기운이 함께 가장 많습니다.`,
    ),
  );

  facts.push(
    fact(
      "element.missing",
      elements.missing.length === 0
        ? `다섯 오행이 모두 한 글자 이상 있으며, 가장 약한 기운은 ${ELEMENT_KO[elements.weakest]}(${elements.weighted[elements.weakest]}%)입니다.`
        : `${elements.missing.map((e) => ELEMENT_KO[e]).join(", ")} 기운은 겉 글자로는 드러나지 않습니다(지장간 포함 가중 비율 ${elements.missing
            .map((e) => `${ELEMENT_KO[e]} ${elements.weighted[e]}%`)
            .join(", ")}).`,
    ),
  );

  facts.push(
    fact(
      "tengod.groups",
      `일간 기준 십성 그룹 비율은 ${TEN_GOD_GROUPS.map((g) => `${g} ${tenGods.byGroup[g]}%`).join(", ")}입니다.`,
    ),
  );
  const dg = tenGods.dominantGroup;
  const wg = tenGods.weakestGroup;
  facts.push(
    fact(
      "tengod.dominant",
      `가장 두드러진 십성 그룹은 ${dg}(${TEN_GOD_GROUP_PLAIN[dg]}, ${tenGods.byGroup[dg]}%)이고, 가장 적은 그룹은 ${wg}(${TEN_GOD_GROUP_PLAIN[wg]}, ${tenGods.byGroup[wg]}%)입니다.`,
    ),
  );

  facts.push(
    fact(
      "strength",
      `일간의 힘을 간이 점수로 보면 ${strength.score}점으로 ${strength.label}에 가깝습니다(60 이상 신강, 40 이하 신약).`,
    ),
  );

  facts.push(
    fact(
      "term.month",
      `${ctx.prevTerm.name}(${ctx.prevTerm.hanja}, ${kstShort(ctx.prevTerm.at)} KST) 이후, ${ctx.nextTerm.name}(${ctx.nextTerm.hanja}, ${kstShort(ctx.nextTerm.at)} KST) 이전에 태어나 월지를 ${branchLabel(pillars.month.branch)}${josa(branchLabel(pillars.month.branch), "으로/로")} 정했습니다.`,
    ),
  );
  const h = chart.solarTerms.hoursToNearestBoundary;
  facts.push(
    fact(
      "term.boundary",
      `가장 가까운 절기 경계인 ${withJosa(termLabel(ctx.nearestTerm), "과/와")} 약 ${h}시간 떨어져 있어 ${
        chart.solarTerms.nearBoundary || (!resolved.hourKnown && h <= 24)
          ? "출생 시각에 따라 월주가 달라질 수 있습니다"
          : "월주가 바뀔 가능성은 낮습니다"
      }${resolved.hourKnown ? "" : "(출생 시간 미상, 정오 가정)"}.`,
    ),
  );

  facts.push(fact("time.correction", timeCorrectionText(resolved, ctx.placeName)));

  facts.push(
    fact(
      "luck.direction",
      luckCycles.direction === null
        ? `${luckCycles.note}.`
        : `대운은 ${luckCycles.direction === "forward" ? "순행(월주에서 앞으로 나아감)" : "역행(월주에서 거꾸로 나아감)"}합니다.`,
    ),
  );
  const first = luckCycles.cycles[0];
  facts.push(
    fact(
      "luck.start",
      luckCycles.startAge === null || !first
        ? "대운 방향을 정하지 않아 대운수와 첫 대운은 계산하지 않았습니다."
        : `대운수는 ${luckCycles.startAge}로, ${first.startAge}세(${first.startYear}년 무렵)부터 첫 대운 ${gzLabel(first.ganzhi)}${josa(gzLabel(first.ganzhi), "이/가")} 시작됩니다.`,
    ),
  );
  return facts;
}

function timeCorrectionText(r: SajuChart["resolved"], place: string): string {
  const solarHM = r.solarLocal.slice(11, 16);
  const parts: string[] = [];
  if (r.standardOffsetMinutes === 510) parts.push("당시 표준시 UTC+8:30을 기준으로");
  if (r.dstMinutes > 0) parts.push(`서머타임 ${r.dstMinutes}분을 빼고`);
  if (r.longitudeCorrectionMinutes !== 0) {
    parts.push(`출생지 ${place} 기준 경도 보정 ${signedMinutes(r.longitudeCorrectionMinutes)}분을 적용해`);
  }
  const prefix = r.hourKnown ? "" : "출생 시간을 몰라 정오(12:00)를 가정하고, ";
  if (parts.length === 0) {
    return `${prefix}별도 시간 보정 없이 평균태양시 ${solarHM}${josa(solarHM, "으로/로")} 계산했습니다.`;
  }
  return `${prefix}${parts.join(" ")} 평균태양시 ${solarHM}${josa(solarHM, "으로/로")} 계산했습니다.`;
}
