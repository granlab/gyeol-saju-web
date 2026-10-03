/**
 * 정적 배포(GitHub Pages)용 브라우저 측 AI 핸들러.
 * 안전 분기(위기·제한 주제) + 목업 응답만 수행한다. Claude 호출·API 키는 포함하지 않는다.
 * 서버(live) 경로는 handle.ts — 이 파일은 Anthropic SDK 를 import 하지 않는다(클라이언트 번들 보호).
 */
import { mockResponse } from "./mock";
import { restrictedResponse, safetyResponse } from "./responses";
import { assessSafety } from "./safety";
import { softenCertainty } from "./soften";
import type { AskRequest, AskResponse } from "./types";
import { computeChart, derivePatterns, deriveToday } from "@/lib/saju";

export function withSoften(r: Omit<AskResponse, "softened">): AskResponse {
  const s = softenCertainty(r.answer);
  return { ...r, answer: s.text, softened: s.softened };
}

/** 위기 신호는 현재 질문뿐 아니라 직전 사용자 발화까지 본다. 해당 없으면 null. */
export function safetyBranch(req: AskRequest): AskResponse | null {
  const assessment = assessSafety(req.question);
  const prevUser = [...(req.history ?? [])].reverse().find((m) => m.role === "user")?.content ?? "";
  const prevAssessment = prevUser ? assessSafety(prevUser) : null;
  if (assessment.crisis || prevAssessment?.crisis) {
    return safetyResponse(req, {
      ...assessment,
      crisis: true,
      matched: [...new Set([...assessment.matched, ...(prevAssessment?.matched ?? [])])],
    });
  }
  if (assessment.restrictedTopic) return restrictedResponse(req, assessment.restrictedTopic);
  return null;
}

/** 출생 입력(chart.input)으로 차트·패턴·오늘을 다시 계산해 근거 조작을 막는다(실패 시 원본). */
export function recomputeFromInput(req: AskRequest): AskRequest {
  const input = req.chart?.input;
  if (!input || typeof input.date !== "string") return req;
  try {
    const chart = computeChart({
      date: input.date,
      time: input.time ?? null,
      gender: input.gender ?? null,
      longitude: input.longitude,
      placeName: input.placeName,
      options: input.options,
    });
    const patterns = derivePatterns(chart);
    const base = /^\d{4}-\d{2}-\d{2}$/.test(req.today?.date ?? "")
      ? new Date(`${req.today.date}T12:00:00+09:00`)
      : new Date();
    return { ...req, chart, patterns, today: deriveToday(chart, base) };
  } catch {
    return req;
  }
}

export function handleAskLocal(raw: AskRequest): AskResponse {
  const req = recomputeFromInput(raw);
  try {
    return safetyBranch(req) ?? withSoften(mockResponse(req));
  } catch {
    return {
      mode: "mock",
      model: null,
      answer: "지금은 답변을 만들 수 없어요. 잠시 후 다시 시도해 주세요.",
      groundedOn: [],
      disclosure: "이 답변은 AI 연결 없이 자동 생성된 안내 문장입니다. 확정적 예측이 아닙니다.",
      safety: { crisis: false, restrictedTopic: null, hotlines: [] },
      softened: false,
      suggestedFollowUps: [],
    };
  }
}
