"use client";

import { useCallback, useState } from "react";
import { askGyeol } from "@/lib/ai/client";
import { AI_DISCLOSURE, type AskMessage, type AskResponse } from "@/lib/ai/types";
import type { PatternCard, SajuChart, TodayFlow } from "@/lib/saju/types";
import { KEYS, isChat, readJSON, removeKey, writeJSON, type ChatEntry } from "@/lib/storage";
import { errorMessage } from "@/lib/format";
import { useStoredJSON } from "./useStore";

export const MAX_QUESTION_LENGTH = 1000;
export const HISTORY_LIMIT = 10;
/** 저장 상한(오래된 것부터 버림) */
const STORE_LIMIT = 200;

const EMPTY: ChatEntry[] = [];

export interface AskContext {
  chart: SajuChart;
  patterns: PatternCard[];
  today: TodayFlow;
  nickname?: string;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/** 서버 응답이 계약과 어긋나도 화면이 깨지지 않게 기본값 보정 */
function normalizeResponse(r: Partial<AskResponse> | null | undefined): AskResponse {
  const mode = r?.mode === "live" || r?.mode === "safety" || r?.mode === "restricted" ? r.mode : "mock";
  return {
    mode,
    model: typeof r?.model === "string" ? r.model : null,
    answer: typeof r?.answer === "string" && r.answer.trim() ? r.answer : "답변을 받지 못했어요.",
    groundedOn: Array.isArray(r?.groundedOn) ? r.groundedOn.filter((x) => typeof x === "string") : [],
    disclosure: typeof r?.disclosure === "string" && r.disclosure ? r.disclosure : AI_DISCLOSURE,
    safety: {
      crisis: Boolean(r?.safety?.crisis),
      restrictedTopic: r?.safety?.restrictedTopic ?? null,
      hotlines: Array.isArray(r?.safety?.hotlines) ? r.safety.hotlines : [],
    },
    softened: Boolean(r?.softened),
    suggestedFollowUps: Array.isArray(r?.suggestedFollowUps)
      ? r.suggestedFollowUps.filter((x) => typeof x === "string").slice(0, 3)
      : [],
  };
}

function append(entry: ChatEntry) {
  const cur = readJSON(KEYS.chat, isChat) ?? [];
  writeJSON(KEYS.chat, [...cur, entry].slice(-STORE_LIMIT));
}

export function useChat() {
  const entries = useStoredJSON(KEYS.chat, isChat) ?? EMPTY;
  const [pending, setPending] = useState(false);
  /** 실패한 질문(재시도용) */
  const [failed, setFailed] = useState<{ question: string; message: string } | null>(null);

  const request = useCallback(async (question: string, ctx: AskContext) => {
    // 방금 저장한 사용자 질문은 history 에서 제외하고 그 이전 최근 10개만 보낸다
    const all = readJSON(KEYS.chat, isChat) ?? [];
    const prior = all.length && all[all.length - 1].role === "user" && all[all.length - 1].content === question
      ? all.slice(0, -1)
      : all;
    const history: AskMessage[] = prior
      .slice(-HISTORY_LIMIT)
      .map((e) => ({ role: e.role, content: e.content }));

    setPending(true);
    setFailed(null);
    try {
      const raw = await askGyeol({
        question,
        history,
        chart: ctx.chart,
        patterns: ctx.patterns,
        today: ctx.today,
        nickname: ctx.nickname || undefined,
      });
      const response = normalizeResponse(raw);
      append({
        id: newId(),
        role: "assistant",
        content: response.answer,
        at: new Date().toISOString(),
        response,
      });
    } catch (e) {
      setFailed({ question, message: errorMessage(e) });
    } finally {
      setPending(false);
    }
  }, []);

  const send = useCallback(
    async (text: string, ctx: AskContext) => {
      const question = text.trim().slice(0, MAX_QUESTION_LENGTH);
      if (!question || pending) return;
      append({ id: newId(), role: "user", content: question, at: new Date().toISOString() });
      await request(question, ctx);
    },
    [pending, request],
  );

  const retry = useCallback(
    async (ctx: AskContext) => {
      if (!failed || pending) return;
      await request(failed.question, ctx);
    },
    [failed, pending, request],
  );

  const clear = useCallback(() => {
    removeKey(KEYS.chat);
    setFailed(null);
  }, []);

  /** 가장 최근 live/mock 응답의 mode (상단 배지용: 실제 AI 인지 목업인지) */
  const lastMode =
    [...entries].reverse().find((e) => e.response?.mode === "live" || e.response?.mode === "mock")?.response
      ?.mode ?? null;

  return { entries, pending, failed, send, retry, clear, lastMode };
}
