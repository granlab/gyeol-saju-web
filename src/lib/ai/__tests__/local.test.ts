import { describe, expect, it } from "vitest";
import { askGyeol } from "../client";
import { handleAskLocal } from "../local";
import { makeRequest } from "./fixtures";

describe("handleAskLocal (정적 배포, 브라우저 측)", () => {
  it("일반 질문 → mock, 모델 없음", () => {
    const r = handleAskLocal(makeRequest("제 성격은?"));
    expect(r.mode).toBe("mock");
    expect(r.model).toBeNull();
  });

  it("위기 표현 → safety 분기, 핫라인 포함", () => {
    const r = handleAskLocal(makeRequest("죽고 싶어요"));
    expect(r.mode).toBe("safety");
    expect(r.safety.crisis).toBe(true);
    expect(r.safety.hotlines.length).toBeGreaterThan(0);
  });

  it("직전 발화가 위기면 짧은 후속 질문도 safety 유지", () => {
    const r = handleAskLocal(
      makeRequest("그래서 오늘은?", { history: [{ role: "user", content: "죽고 싶어요" }] }),
    );
    expect(r.mode).toBe("safety");
  });

  it("askGyeol 은 네트워크 없이 응답, 잘못된 입력은 한국어 오류", async () => {
    expect((await askGyeol(makeRequest("제 성격은?"))).mode).toBe("mock");
    await expect(askGyeol({} as never)).rejects.toThrow();
  });
});
