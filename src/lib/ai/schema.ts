/**
 * /api/ask 요청 검증(느슨한 스키마). 최소 필수 필드만 확인하고 나머지는 통과(loose).
 */
import { z } from "zod";
import type { AskRequest } from "./types";

const factSchema = z.looseObject({ id: z.string().min(1).max(80), text: z.string().max(2000) });

const chartSchema = z.looseObject({
  facts: z.array(factSchema).max(200),
  dayMaster: z.looseObject({ stem: z.string().min(1), nickname: z.string() }),
  pillars: z.looseObject({ day: z.looseObject({ name: z.string().min(1) }) }),
});

const patternSchema = z.looseObject({
  id: z.string().min(1),
  title: z.string(),
  headline: z.string(),
  body: z.string(),
  why: z.looseObject({ rule: z.string(), suggestion: z.string(), factIds: z.array(z.string()) }),
});

const todaySchema = z.looseObject({
  date: z.string(),
  headline: z.string(),
  action: z.looseObject({ id: z.string(), text: z.string() }),
  why: z.looseObject({ factIds: z.array(z.string()) }),
  facts: z.array(factSchema).max(50),
});

export const askRequestSchema = z.object({
  question: z.string().trim().min(1).max(5000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(10000) }))
    .max(100)
    .default([]),
  chart: chartSchema,
  patterns: z.array(patternSchema).max(50),
  today: todaySchema,
  nickname: z.string().max(40).optional(),
});

export type ParseResult = { ok: true; data: AskRequest } | { ok: false; error: string };

export function parseAskRequest(body: unknown): ParseResult {
  const r = askRequestSchema.safeParse(body);
  if (!r.success) {
    const where = r.error.issues[0]?.path.join(".") || "본문";
    return { ok: false, error: `요청 형식이 올바르지 않아요 (${where}). 사주 정보를 다시 계산한 뒤 시도해 주세요.` };
  }
  // 느슨한 스키마를 통과한 데이터는 엔진 계약(AskRequest)을 따른다고 간주한다.
  return { ok: true, data: r.data as unknown as AskRequest };
}
