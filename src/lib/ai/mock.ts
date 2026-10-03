/**
 * 목업 응답(API 키 없음 / API 오류 폴백). 결정적 템플릿 — 랜덤 금지.
 * 엔진 JSON(PatternCard, TodayFlow)의 문장만 끼워 넣는다. 새 계산 없음.
 */
import type { PatternCard } from "@/lib/saju/types";
import { callNameOf, validFactIds } from "./prompt";
import { josa } from "@/lib/saju/text";
import { FALLBACK_DISCLOSURE, MOCK_DISCLOSURE, type AskRequest, type AskResponse } from "./types";

export type QuestionCategory = "relation" | "work" | "self" | "timing" | "other";

const CATEGORY_KEYWORDS: Array<[QuestionCategory, RegExp]> = [
  [
    "relation",
    /연애|사랑|남자\s*친구|여자\s*친구|남친|여친|애인|결혼|배우자|남편|아내|친구|관계|가족|부모|엄마|아빠|형제|자매|이별|헤어|재회|썸|궁합|사람들/,
  ],
  [
    "work",
    /직장|회사|이직|퇴사|취업|커리어|업무|승진|사업|창업|직업|진로|상사|동료|프로젝트|일이|일을|일은|일할|일하|공부|시험/,
  ],
  ["timing", /언제|시기|타이밍|올해|내년|이번\s*달|다음\s*달|요즘|오늘|내일|대운|운세|흐름|때가/],
  ["self", /성격|기질|성향|나는|내가|나를|나\s*자신|장점|단점|강점|약점|어떤\s*사람|오행|일간|본성|자존감/],
];

export function classifyQuestion(question: string): QuestionCategory {
  for (const [cat, re] of CATEGORY_KEYWORDS) if (re.test(question)) return cat;
  return "other";
}

/** 카테고리별 우선 패턴 id. 'today' 는 패턴 대신 TodayFlow 를 쓴다는 뜻 */
const CATEGORY_PATTERNS: Record<QuestionCategory, string[]> = {
  relation: ["energy-style", "day-master"],
  work: ["social-role", "strength"],
  self: ["day-master", "element-balance"],
  timing: ["luck-cycle", "today"],
  other: ["day-master", "element-balance"],
};

const CATEGORY_KO: Record<QuestionCategory, string> = {
  relation: "관계",
  work: "일과 진로",
  self: "자기 이해",
  timing: "흐름과 시기",
  other: "지금의 고민",
};

export const FOLLOW_UPS: Record<QuestionCategory, [string, string]> = {
  relation: ["가까운 사람과 부딪힐 때 내가 자주 보이는 패턴은?", "관계에서 내 강점을 살리는 말투는 어떤 걸까요?"],
  work: ["내 기질에 맞는 일하는 방식은 어떤 걸까요?", "일이 막힐 때 내가 기대기 쉬운 습관은?"],
  self: ["내 기질의 강점이 지나칠 때는 어떻게 보이나요?", "부족한 기운을 일상에서 보완하는 작은 방법은?"],
  timing: ["오늘 흐름에서 특히 아껴 쓸 에너지는 뭘까요?", "지금 대운에서 의식하면 좋은 관점은?"],
  other: ["내 기본 기질을 한 문장으로 설명하면?", "오늘 해볼 작은 행동을 하나 더 추천해 주세요."],
};

export function pickPattern(category: QuestionCategory, patterns: PatternCard[]): PatternCard | null {
  for (const id of CATEGORY_PATTERNS[category]) {
    if (id === "today") return null;
    const p = patterns.find((x) => x.id === id);
    if (p) return p;
  }
  return patterns[0] ?? null;
}

function sentence(s: string | undefined | null): string {
  const t = (s ?? "").trim();
  if (!t) return "";
  return /[.!?。…)]$/.test(t) ? t : `${t}.`;
}

function stripQuoteEnd(s: string): string {
  return (s ?? "").trim().replace(/[.!?。]+$/, "");
}

export interface MockResult {
  answer: string;
  groundedOn: string[];
  category: QuestionCategory;
}

/** 순수 템플릿 생성(soften·disclosure 적용 전) */
export function buildMockAnswer(req: AskRequest): MockResult {
  const category = classifyQuestion(req.question);
  const pattern = pickPattern(category, req.patterns ?? []);
  const today = req.today;
  const callName = callNameOf(req);
  const nickname = req.chart.dayMaster.nickname;
  const asksWhy = /왜/.test(req.question);

  const parts: string[] = [];

  if (pattern) {
    parts.push(
      `${CATEGORY_KO[category]} 면에서 보면, 일간이 ${nickname}인 ${callName}${josa(callName, "은/는")} 전통 명리 관점에서 '${stripQuoteEnd(pattern.headline)}'${josa(stripQuoteEnd(pattern.headline), "으로/로")} 해석됩니다.`,
    );
    parts.push(sentence(pattern.body));
    if (asksWhy && pattern.why?.rule) {
      parts.push(`이렇게 보는 이유는 '${stripQuoteEnd(pattern.why.rule)}'라는 전통 해석 규칙 때문이에요.`);
    }
    if (category === "timing") {
      parts.push(`오늘(${today.date})은 '${stripQuoteEnd(today.headline)}' 흐름으로 읽히지만, 실제 결과는 선택과 상황에 달려 있습니다.`);
    } else {
      parts.push(`실제 모습은 상황과 선택에 따라 달라지니, 하나의 관점으로만 참고해 주세요.`);
    }
    const action = pattern.why?.suggestion ? stripQuoteEnd(pattern.why.suggestion) : stripQuoteEnd(today.action.text);
    parts.push(`다음에 해볼 작은 행동: ${action}.`);
  } else {
    parts.push(
      `일간이 ${nickname}인 ${callName}에게 오늘(${today.date})은 전통 명리 관점에서 '${stripQuoteEnd(today.headline)}' 흐름으로 해석됩니다.`,
    );
    if (asksWhy && today.why?.rule) {
      parts.push(`이렇게 보는 이유는 '${stripQuoteEnd(today.why.rule)}'라는 전통 해석 규칙 때문이에요.`);
    }
    parts.push("이는 주의를 어디에 둘지에 대한 힌트일 뿐이고, 실제 결과는 선택과 상황에 달려 있습니다.");
    parts.push(`다음에 해볼 작은 행동: ${stripQuoteEnd(today.action.text)}.`);
  }

  const valid = validFactIds(req);
  const ids = [...(pattern?.why?.factIds ?? []), ...(today.why?.factIds ?? [])].filter((id) => valid.has(id));

  return {
    answer: parts.filter(Boolean).join(" "),
    groundedOn: [...new Set(ids)],
    category,
  };
}

/** 목업 AskResponse 를 만든다. soften 은 호출부(handle)에서 적용 */
export function mockResponse(req: AskRequest, note?: string): Omit<AskResponse, "softened"> {
  const r = buildMockAnswer(req);
  return {
    mode: "mock",
    model: null,
    answer: note ? `${r.answer}\n\n${note}` : r.answer,
    groundedOn: r.groundedOn,
    // 폴백(키는 있으나 호출 실패)일 때는 '키 미설정' 문구가 사실과 다르므로 고지를 바꾼다
    disclosure: note ? FALLBACK_DISCLOSURE : MOCK_DISCLOSURE,
    safety: { crisis: false, restrictedTopic: null, hotlines: [] },
    suggestedFollowUps: [...FOLLOW_UPS[r.category]],
  };
}
