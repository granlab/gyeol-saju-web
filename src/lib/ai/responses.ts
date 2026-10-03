/**
 * 규칙 기반 안전 응답(LLM 미호출). safety / restricted 모드.
 */
import { callNameOf } from "./prompt";
import {
  KOREA_HOTLINES,
  RESTRICTED_TOPIC_KO,
  type AskRequest,
  type AskResponse,
  type RestrictedTopic,
  type SafetyAssessment,
} from "./types";

/** safety/restricted 응답 고지(AI 미사용) */
export const RULE_DISCLOSURE = "규칙 기반 안전 안내입니다(AI 미사용)";

const EXPERTS: Record<RestrictedTopic, string> = {
  health: "의사 등 의료 전문가(마음이 힘들다면 정신건강의학과 전문의나 정신건강위기상담 1577-0199)",
  death: "의료진이나 상담 전문가, 그리고 믿을 수 있는 가족·지인",
  pregnancy: "산부인과 전문의나 보건소 상담",
  crime: "경찰(112)이나 변호사",
  legal: "변호사나 대한법률구조공단(132)",
  investment: "공인된 금융 전문가·재무상담사(도박 문제라면 한국도박문제예방치유원 1336)",
  hiring: "인사·노무 전문가(공인노무사)와 공정한 평가 기준",
};

export function safetyResponse(req: AskRequest, a: SafetyAssessment): AskResponse {
  const callName = callNameOf(req);
  const lines = KOREA_HOTLINES.map((h) => `- ${h.name} ${h.number}${h.note ? ` (${h.note})` : ""}`);
  const answer = [
    `${callName}, 지금 많이 힘드신 것 같아요. 이런 마음을 꺼내 말해 준 것만으로도 충분히 용기 있는 일이에요.`,
    "사주 해석은 잠시 멈추고, 지금은 당신의 안전이 가장 중요해요. 지금 바로 이야기할 수 있는 곳이 있어요.",
    "",
    ...lines,
    "",
    "혼자 견디지 말고 가까운 사람에게 지금 연락해 주세요. 당장 위험하다고 느껴지면 119 에 전화해 주세요.",
  ].join("\n");
  return {
    mode: "safety",
    model: null,
    answer,
    groundedOn: [],
    disclosure: RULE_DISCLOSURE,
    safety: { crisis: true, restrictedTopic: a.restrictedTopic, hotlines: [...KOREA_HOTLINES] },
    softened: false,
    suggestedFollowUps: [],
  };
}

export function restrictedResponse(req: AskRequest, topic: RestrictedTopic): AskResponse {
  const callName = callNameOf(req);
  const topicKo = RESTRICTED_TOPIC_KO[topic];
  const answer = [
    `${topicKo}에 관한 질문은 사주로 판단할 수 있는 영역이 아니에요.`,
    `전통 명리는 성향과 흐름을 해석하는 하나의 관점일 뿐이라, ${callName}이 사주를 그 결정의 근거로 쓰지 않기를 권해요.`,
    `이 부분은 이런 곳과 상의해 주세요: ${EXPERTS[topic]}.`,
    "대신 이 고민 앞에서 드러나는 나의 기질과 반응 패턴을 살펴보거나, 마음을 정리하는 일은 함께할 수 있어요.",
  ].join(" ");
  return {
    mode: "restricted",
    model: null,
    answer,
    groundedOn: [],
    disclosure: RULE_DISCLOSURE,
    safety: { crisis: false, restrictedTopic: topic, hotlines: [] },
    softened: false,
    suggestedFollowUps: ["이런 고민 앞에서 내가 자주 보이는 반응 패턴은?", "불안할 때 내 기질에 맞는 마음 정리 방법은?"],
  };
}
