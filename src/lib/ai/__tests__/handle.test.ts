import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { handleAsk, REFUSAL_ANSWER, TRUNCATED_NOTE, type CreateMessage } from "../handle";
import { RULE_DISCLOSURE } from "../responses";
import { parseAskRequest } from "../schema";
import { AI_DISCLOSURE, MOCK_DISCLOSURE } from "../types";
import { makeRequest } from "./fixtures";

function fakeMessage(text: string, stop_reason: Anthropic.Message["stop_reason"] = "end_turn"): Anthropic.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-5-5",
    content: [{ type: "text", text, citations: null }],
    stop_reason,
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  } as unknown as Anthropic.Message;
}

describe("handleAsk", () => {
  it("키 없음 → mock", async () => {
    const r = await handleAsk(makeRequest("제 성격은?"), {});
    expect(r.mode).toBe("mock");
    expect(r.disclosure).toBe(MOCK_DISCLOSURE);
    expect(r.answer.length).toBeGreaterThan(0);
  });

  it("공백 키도 mock (createMessage 미호출)", async () => {
    const create = vi.fn();
    const r = await handleAsk(makeRequest("제 성격은?"), { apiKey: "  ", createMessage: create as unknown as CreateMessage });
    expect(r.mode).toBe("mock");
    expect(create).not.toHaveBeenCalled();
  });

  it("crisis → safety, hotlines 채움, LLM 미호출", async () => {
    const create = vi.fn();
    const r = await handleAsk(makeRequest("내 사주에 죽을 운 있어?"), { apiKey: "k", createMessage: create as unknown as CreateMessage });
    expect(r.mode).toBe("safety");
    expect(r.safety.crisis).toBe(true);
    expect(r.safety.hotlines.length).toBeGreaterThan(0);
    expect(r.answer).toContain("사주 해석은 잠시 멈추고");
    expect(r.answer).toContain("109");
    expect(r.answer).toContain("119");
    expect(r.disclosure).toBe(RULE_DISCLOSURE);
    expect(create).not.toHaveBeenCalled();
  });

  it("직전 사용자 메시지가 crisis 면 후속 질문도 safety 유지, LLM 미호출", async () => {
    const create = vi.fn();
    const req = makeRequest("그래도 내 운세는 어때?", {
      history: [
        { role: "user", content: "죽고 싶어요" },
        { role: "assistant", content: "사주 해석은 잠시 멈추고…" },
      ],
    });
    const r = await handleAsk(req, { apiKey: "k", createMessage: create as unknown as CreateMessage });
    expect(r.mode).toBe("safety");
    expect(r.safety.crisis).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });

  it("restricted → restricted, LLM 미호출", async () => {
    const create = vi.fn();
    const r = await handleAsk(makeRequest("비트코인 지금 사도 될까요?"), { apiKey: "k", createMessage: create as unknown as CreateMessage });
    expect(r.mode).toBe("restricted");
    expect(r.safety.restrictedTopic).toBe("investment");
    expect(r.answer).toContain("투자·도박");
    expect(r.answer).toContain("사주를 그 결정의 근거로 쓰지 않기를 권해요");
    expect(r.answer).toContain("금융 전문가");
    expect(r.disclosure).toBe(RULE_DISCLOSURE);
    expect(create).not.toHaveBeenCalled();
  });

  it("live: 파라미터 규칙, 근거 파싱, soften", async () => {
    const create = vi.fn<CreateMessage>(async () =>
      fakeMessage("전통 명리 관점에서는 이렇게 해석됩니다. 반드시 좋아질 것입니다.\n[근거: daymaster, today.day, fake.id]"),
    );
    const r = await handleAsk(makeRequest("제 성격은?"), { apiKey: "k", model: "claude-sonnet-5-5", createMessage: create });
    expect(r.mode).toBe("live");
    expect(r.model).toBe("claude-sonnet-5-5");
    expect(r.disclosure).toBe(AI_DISCLOSURE);
    expect(r.groundedOn).toEqual(["daymaster", "today.day"]);
    expect(r.answer).not.toContain("[근거");
    expect(r.answer).not.toContain("반드시");
    expect(r.softened).toBe(true);

    const params = create.mock.calls[0][0];
    expect(params.max_tokens).toBe(2048);
    expect(params.output_config).toEqual({ effort: "low" });
    expect(params).not.toHaveProperty("temperature");
    expect(params).not.toHaveProperty("top_p");
    expect(params).not.toHaveProperty("thinking");
    expect(params).not.toHaveProperty("tool_choice");
    expect(params.messages[params.messages.length - 1].role).toBe("user");
  });

  it("live: refusal → 대체 문장, mode live 유지", async () => {
    const create = vi.fn<CreateMessage>(async () => fakeMessage("", "refusal"));
    const r = await handleAsk(makeRequest("제 성격은?"), { apiKey: "k", createMessage: create });
    expect(r.mode).toBe("live");
    expect(r.answer).toBe(REFUSAL_ANSWER);
    expect(r.groundedOn).toEqual([]);
  });

  it("live: max_tokens → 말줄임 안내", async () => {
    const create = vi.fn<CreateMessage>(async () => fakeMessage("길게 이어지는 답", "max_tokens"));
    const r = await handleAsk(makeRequest("제 성격은?"), { apiKey: "k", createMessage: create });
    expect(r.answer).toContain(TRUNCATED_NOTE);
  });

  it("AuthenticationError → 목업 폴백 + 표기", async () => {
    const create = vi.fn<CreateMessage>(async () => {
      throw new Anthropic.AuthenticationError(401, undefined, "invalid x-api-key", new Headers());
    });
    const r = await handleAsk(makeRequest("제 성격은?"), { apiKey: "bad", createMessage: create });
    expect(r.mode).toBe("mock");
    expect(r.answer.endsWith("(API 키 인증 실패로 목업 응답)")).toBe(true);
  });

  it("APIConnectionError → 목업 폴백 + 사유", async () => {
    const create = vi.fn<CreateMessage>(async () => {
      throw new Anthropic.APIConnectionError({ message: "down" });
    });
    const r = await handleAsk(makeRequest("제 성격은?"), { apiKey: "k", createMessage: create });
    expect(r.mode).toBe("mock");
    expect(r.answer).toContain("연결 실패로 목업 응답");
  });
});

describe("parseAskRequest", () => {
  it("정상 요청 통과", () => {
    expect(parseAskRequest(JSON.parse(JSON.stringify(makeRequest("질문")))).ok).toBe(true);
  });
  it("history 생략 시 기본값 []", () => {
    const { history: _h, ...rest } = makeRequest("질문");
    void _h;
    const r = parseAskRequest(JSON.parse(JSON.stringify(rest)));
    expect(r.ok && r.data.history).toEqual([]);
  });
  it("필수 필드 누락 → 한국어 오류", () => {
    const bad = JSON.parse(JSON.stringify(makeRequest("질문")));
    delete bad.chart.facts;
    const r = parseAskRequest(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("요청 형식이 올바르지 않아요");
  });
  it("빈 질문 거부", () => {
    expect(parseAskRequest({ ...makeRequest("   ") }).ok).toBe(false);
  });
});
