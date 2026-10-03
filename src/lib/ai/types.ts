/**
 * 결(結) AI 풀이 — 공용 계약(타입)
 *
 * 원칙
 * - 사주 계산은 엔진 JSON(SajuChart/PatternCard/TodayFlow)만 근거. LLM 은 설명·연결만.
 * - 단정 예언 금지. 질병·사망·임신·범죄·법률·투자·채용은 사주를 결정 근거로 쓰게 유도하지 않는다.
 * - 위기(자해·자살·극도 불안) 발언은 LLM 호출 전에 규칙으로 분기해 안전 안내를 우선한다.
 * - 모든 응답에 AI 생성 고지(disclosure)를 포함한다.
 * - ANTHROPIC_API_KEY 가 있으면 claude-sonnet-5-5 호출(mode 'live'), 없으면 목업(mode 'mock').
 */
import type { PatternCard, SajuChart, TodayFlow } from "@/lib/saju/types";

export interface AskMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AskRequest {
  question: string;
  /** 직전 대화(최근 N개). 서버는 최대 10개만 사용 */
  history: AskMessage[];
  chart: SajuChart;
  patterns: PatternCard[];
  today: TodayFlow;
  /** 사용자 별칭(선택). 실명 요구 금지 */
  nickname?: string;
}

/**
 * - live: 실제 Claude 호출
 * - mock: 키 없음 → 엔진 JSON 기반 템플릿 응답
 * - safety: 위기 발언 감지 → 안전 안내 (LLM 미호출)
 * - restricted: 금지 주제(질병·사망·임신·범죄·법률·투자·채용) → 경계 설정 응답
 */
export type AskMode = "live" | "mock" | "safety" | "restricted";

export type RestrictedTopic =
  | "health"
  | "death"
  | "pregnancy"
  | "crime"
  | "legal"
  | "investment"
  | "hiring";

export const RESTRICTED_TOPIC_KO: Record<RestrictedTopic, string> = {
  health: "질병·건강",
  death: "사망·수명",
  pregnancy: "임신·출산",
  crime: "범죄",
  legal: "법률·소송",
  investment: "투자·도박",
  hiring: "채용·인사 결정",
};

export interface Hotline {
  name: string;
  number: string;
  note?: string;
}

export interface SafetyAssessment {
  /** 자해·자살·극도 위기 신호 */
  crisis: boolean;
  restrictedTopic: RestrictedTopic | null;
  /** 매칭된 표현(디버그/검수용) */
  matched: string[];
}

export interface AskResponse {
  mode: AskMode;
  /** live 일 때 모델 ID, 아니면 null */
  model: string | null;
  /** 사용자에게 보여줄 본문(한국어, 마크다운 최소) */
  answer: string;
  /** 인용한 Fact id (SajuChart.facts / TodayFlow.facts). '왜?' 버튼이 표시 */
  groundedOn: string[];
  /** AI 생성 고지 문구. 항상 비어 있지 않음 */
  disclosure: string;
  safety: {
    crisis: boolean;
    restrictedTopic: RestrictedTopic | null;
    hotlines: Hotline[];
  };
  /** 단정 표현을 사후 필터가 완화했으면 true */
  softened: boolean;
  /** 이어서 물어볼 질문 제안 (0~3개) */
  suggestedFollowUps: string[];
}

export const AI_DISCLOSURE =
  "이 답변은 AI 가 생성한 해석입니다. 전통 명리 관점의 설명이며 확정적 예측이 아닙니다. 중요한 결정은 스스로의 판단과 전문가 상담을 우선하세요.";

export const MOCK_DISCLOSURE =
  "이 답변은 AI 연결 없이(API 키 미설정) 엔진 결과를 바탕으로 자동 생성된 목업 문장입니다. 전통 명리 관점의 설명이며 확정적 예측이 아닙니다.";

export const FALLBACK_DISCLOSURE =
  "AI 연결에 실패해 엔진 결과를 바탕으로 자동 생성된 목업 문장입니다. 전통 명리 관점의 설명이며 확정적 예측이 아닙니다.";

export const KOREA_HOTLINES: Hotline[] = [
  { name: "자살예방상담전화", number: "109", note: "24시간, 무료" },
  { name: "정신건강위기상담", number: "1577-0199", note: "24시간" },
  { name: "청소년상담전화", number: "1388", note: "24시간" },
];
