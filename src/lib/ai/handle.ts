/**
 * /api/ask 핵심 로직(순수 핸들러). 라우트는 검증만 하고 여기로 위임한다.
 *
 * 흐름: assessSafety → crisis(safety) → restricted → 키 있으면 live, 없으면 mock.
 * live 실패 시 목업으로 폴백하고 사유를 표기한다. 이 함수는 throw 하지 않는다.
 * 로그에 질문 원문·생년월일을 남기지 않는다.
 */
import Anthropic from "@anthropic-ai/sdk";
import { classifyQuestion, FOLLOW_UPS, mockResponse } from "./mock";
import { buildMessages, buildSystemPrompt, parseGrounding, validFactIds } from "./prompt";
import { safetyBranch } from "./local";
import { softenCertainty } from "./soften";
import { AI_DISCLOSURE, type AskRequest, type AskResponse } from "./types";

export const DEFAULT_MODEL = "claude-sonnet-5-5";
export const MAX_TOKENS = 2048;

export type CreateMessage = (params: Anthropic.MessageCreateParamsNonStreaming) => Promise<Anthropic.Message>;

export interface HandleOptions {
  /** 비어 있지 않을 때만 live */
  apiKey?: string;
  model?: string;
  /** 테스트용 주입. 없으면 SDK 클라이언트(환경변수 키) 사용 */
  createMessage?: CreateMessage;
}

let sharedClient: Anthropic | null = null;
function defaultCreateMessage(): CreateMessage {
  if (!sharedClient) sharedClient = new Anthropic({ timeout: 30_000, maxRetries: 1 });
  const client = sharedClient;
  return (params) => client.messages.create(params);
}

export const REFUSAL_ANSWER =
  "이 질문에는 답하기 어려워요. 대신 지금 고민 앞에서 드러나는 나의 기질이나 오늘 해볼 작은 행동을 함께 정리해 볼 수 있어요.";
export const TRUNCATED_NOTE = "(답변이 길어 중간에 끊겼어요. 더 짧게 나눠 물어봐 주세요.)";

function fallbackNote(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "(API 키 인증 실패로 목업 응답)";
  if (err instanceof Anthropic.RateLimitError) return "(요청이 많아 잠시 AI 연결이 제한되어 목업 응답)";
  if (err instanceof Anthropic.APIConnectionError) return "(AI 서버 연결 실패로 목업 응답)";
  if (err instanceof Anthropic.APIError) return "(AI 서버 오류로 목업 응답)";
  return "(일시적인 오류로 목업 응답)";
}

function logError(err: unknown): void {
  // 개인정보 보호: 질문·생년월일·차트는 기록하지 않는다. 오류 종류와 상태만.
  const name = err instanceof Error ? err.constructor.name : typeof err;
  const status = err instanceof Anthropic.APIError ? err.status : undefined;
  const requestId = err instanceof Anthropic.APIError ? err.requestID : undefined;
  console.warn(`[ask] live 호출 실패 → 목업 폴백: ${name}${status ? ` status=${status}` : ""}${requestId ? ` request_id=${requestId}` : ""}`);
}

function withSoften(r: Omit<AskResponse, "softened">): AskResponse {
  const s = softenCertainty(r.answer);
  return { ...r, answer: s.text, softened: s.softened };
}

async function liveResponse(req: AskRequest, model: string, create: CreateMessage): Promise<AskResponse> {
  const response = await create({
    model,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(req),
    messages: buildMessages(req),
    output_config: { effort: "low" },
  });

  const base = {
    mode: "live" as const,
    model,
    disclosure: AI_DISCLOSURE,
    safety: { crisis: false, restrictedTopic: null, hotlines: [] },
    suggestedFollowUps: [...FOLLOW_UPS[classifyQuestion(req.question)]],
  };

  if (response.stop_reason === "refusal") {
    return { ...base, answer: REFUSAL_ANSWER, groundedOn: [], softened: false };
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const patternFactIds: Record<string, string[]> = {};
  for (const p of req.patterns) patternFactIds[p.id] = p.why?.factIds ?? [];
  const parsed = parseGrounding(text, validFactIds(req), patternFactIds);

  let answer = parsed.body || REFUSAL_ANSWER;
  if (response.stop_reason === "max_tokens") answer = `${answer}\n\n${TRUNCATED_NOTE}`;

  return withSoften({ ...base, answer, groundedOn: parsed.groundedOn });
}

export async function handleAsk(req: AskRequest, opts: HandleOptions = {}): Promise<AskResponse> {
  const branch = safetyBranch(req);
  if (branch) return branch;

  const apiKey = opts.apiKey?.trim();
  if (!apiKey) return withSoften(mockResponse(req));

  const model = opts.model || DEFAULT_MODEL;
  try {
    return await liveResponse(req, model, opts.createMessage ?? defaultCreateMessage());
  } catch (err) {
    logError(err);
    return withSoften(mockResponse(req, fallbackNote(err)));
  }
}
