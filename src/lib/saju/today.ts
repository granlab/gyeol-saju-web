/**
 * 오늘의 흐름/행동 (결정적 규칙). LLM 호출 없음.
 *
 * - 오늘 천간 → 일간 기준 십성 그룹(5)
 * - 오늘 지지 오행 ↔ 일간 오행 관계(생·극·비화·설·재, 5)
 * - 위 두 축의 표 매핑으로 headline / scores / action 을 정한다(해시·랜덤 없음).
 */
import { ganzhiOfDate, yearMonthGanzhiOfDate } from "./chart";
import {
  BRANCH_RELATION_KO,
  GROUP_SCORE_DELTA,
  RELATION_SCORE_DELTA,
  SCORE_AREA_ORDER,
  SCORE_BASE,
  SCORE_MAX,
  SCORE_MIN,
  TODAY_ACTION,
  TODAY_HEADLINE,
  TODAY_RULE,
  type BranchRelation,
  type ScoreArea,
} from "./copy/today";
import { branchLabel, ganzhiLabel, stemLabel, stemShort } from "./copy/format";
import { CONTROLS, PRODUCES, tenGod } from "./ganzhi";
import { CAVEAT } from "./patterns";
import {
  TEN_GOD_GROUP,
  type Element,
  type Fact,
  type LuckCycle,
  type SajuChart,
  type TodayFlow,
} from "./types";

/** Date → KST 'YYYY-MM-DD' */
export function toKstDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** 오늘 지지 오행(other)이 일간 오행(dm)과 맺는 관계 (일간 입장) */
export function branchRelation(dm: Element, other: Element): BranchRelation {
  if (dm === other) return "same";
  if (PRODUCES[other] === dm) return "support";
  if (CONTROLS[other] === dm) return "pressure";
  if (PRODUCES[dm] === other) return "output";
  return "control";
}

function clamp(n: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(n)));
}

function findCurrentLuck(chart: SajuChart, todayYear: number): LuckCycle | null {
  const birthYear = Number(chart.input.date.slice(0, 4));
  if (!Number.isFinite(birthYear)) return null;
  const age = todayYear - birthYear;
  return chart.luckCycles.cycles.find((c) => c.startAge <= age && age <= c.endAge) ?? null;
}

/**
 * @param chart 사용자 원국
 * @param date  기준일 (기본 오늘, KST). 테스트 재현을 위해 주입 가능
 */
export function deriveToday(chart: SajuChart, date: Date = new Date()): TodayFlow {
  const ymd = toKstDateString(date);
  const dayGanzhi = ganzhiOfDate(ymd);
  const { year: yearGanzhi, month: monthGanzhi } = yearMonthGanzhiOfDate(ymd);

  const dm = chart.dayMaster;
  const dayTenGod = tenGod(dm.stem, dayGanzhi.stem);
  const group = TEN_GOD_GROUP[dayTenGod];
  const relation = branchRelation(dm.element, dayGanzhi.branchElement);

  const g = GROUP_SCORE_DELTA[group];
  const r = RELATION_SCORE_DELTA[relation];
  const scores: Record<ScoreArea, number> = {
    relation: clamp(SCORE_BASE + g.relation + r.relation),
    work: clamp(SCORE_BASE + g.work + r.work),
    self: clamp(SCORE_BASE + g.self + r.self),
  };
  let top: ScoreArea = SCORE_AREA_ORDER[0];
  for (const a of SCORE_AREA_ORDER) if (scores[a] > scores[top]) top = a;

  const headline = TODAY_HEADLINE[group][relation];
  const action = { ...TODAY_ACTION[group][top] };

  const currentLuck = findCurrentLuck(chart, Number(ymd.slice(0, 4)));

  const facts: Fact[] = [
    { id: "today.day", text: `오늘(${ymd})의 일진은 ${ganzhiLabel(dayGanzhi)}입니다`, source: "engine" },
    {
      id: "today.tengod",
      text: `일간 ${stemShort(dm.stem)} 기준으로 오늘 천간은 ${dayTenGod}에 해당합니다`,
      source: "rule",
    },
  ];
  if (currentLuck) {
    facts.push({
      id: "luck.current",
      text: `현재 대운은 ${ganzhiLabel(currentLuck.ganzhi)} (${currentLuck.startAge}~${currentLuck.endAge}세) 구간입니다`,
      source: "engine",
    });
  }

  const factIds = ["today.day", "today.tengod", "daymaster"];
  if (currentLuck) factIds.push("luck.current");

  return {
    date: ymd,
    dayGanzhi,
    monthGanzhi,
    yearGanzhi,
    dayTenGod,
    dayTenGodGroup: group,
    currentLuck,
    headline,
    scores,
    action,
    why: {
      structure: [
        `오늘 일진 ${ganzhiLabel(dayGanzhi)}`,
        `일간 기준 십성: ${dayTenGod}`,
        `오늘 지지 ${branchLabel(dayGanzhi.branch)} ↔ 일간 ${stemLabel(dm.stem)}: ${BRANCH_RELATION_KO[relation]}`,
      ],
      rule: TODAY_RULE,
      caveat: CAVEAT,
      factIds,
    },
    facts,
  };
}
