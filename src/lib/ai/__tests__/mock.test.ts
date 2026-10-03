import { describe, expect, it } from "vitest";
import { buildMockAnswer, classifyQuestion, mockResponse } from "../mock";
import { MOCK_DISCLOSURE } from "../types";
import { allFactIds, makeRequest } from "./fixtures";

const FORBIDDEN = /반드시|틀림없|운명|불행|흉하/;

const QUESTIONS: Array<[string, string]> = [
  ["relation", "남자친구랑 자주 싸우는데 제 연애 패턴은요?"],
  ["work", "회사에서 이직을 고민 중이에요"],
  ["self", "제 성격의 장점은 뭔가요?"],
  ["timing", "요즘 흐름은 어때요?"],
];

describe("mock — 분류", () => {
  for (const [cat, q] of QUESTIONS) {
    it(`${cat}: ${q}`, () => expect(classifyQuestion(q)).toBe(cat));
  }
  it("키워드 없음 → other", () => expect(classifyQuestion("안녕하세요")).toBe("other"));
});

describe("mock — 응답", () => {
  for (const [cat, q] of QUESTIONS) {
    it(`${cat} 응답 계약`, () => {
      const req = makeRequest(q);
      const r = mockResponse(req);
      expect(r.mode).toBe("mock");
      expect(r.model).toBeNull();
      expect(r.answer.trim().length).toBeGreaterThan(0);
      expect(r.answer).not.toMatch(FORBIDDEN);
      expect(r.answer).toContain("전통 명리 관점에서");
      expect(r.answer).toContain("다음에 해볼 작은 행동");
      expect(r.disclosure).toBe(MOCK_DISCLOSURE);
      expect(r.suggestedFollowUps).toHaveLength(2);
      const ids = new Set(allFactIds(req));
      expect(r.groundedOn.length).toBeGreaterThan(0);
      for (const id of r.groundedOn) expect(ids.has(id), id).toBe(true);
      // today factIds 포함
      expect(r.groundedOn).toContain("today.day");
    });
  }

  it("카테고리별 패턴 매핑", () => {
    expect(buildMockAnswer(makeRequest(QUESTIONS[0][1])).answer).toContain("스스로 밀고 나가는 에너지");
    expect(buildMockAnswer(makeRequest(QUESTIONS[1][1])).answer).toContain("앞장서서 길을 여는 역할");
    expect(buildMockAnswer(makeRequest(QUESTIONS[2][1])).answer).toContain("밖으로 뻗는 큰 나무");
    expect(buildMockAnswer(makeRequest(QUESTIONS[3][1])).answer).toContain("표현이 늘어나는 대운");
  });

  it("없는 fact id(not.a.fact)는 groundedOn 에서 제외", () => {
    const r = buildMockAnswer(makeRequest(QUESTIONS[1][1]));
    expect(r.groundedOn).not.toContain("not.a.fact");
    expect(r.groundedOn).toContain("tengod.dominant");
  });

  it("결정적: 같은 입력 → 같은 출력", () => {
    for (const [, q] of QUESTIONS) {
      expect(mockResponse(makeRequest(q))).toEqual(mockResponse(makeRequest(q)));
    }
  });

  it("'왜' 질문이면 why.rule 을 인용", () => {
    const r = buildMockAnswer(makeRequest("제 성격은 왜 이렇게 고집이 셀까요?"));
    expect(r.answer).toContain("day-master 규칙");
  });

  it("nickname 을 호칭으로 사용, 없으면 '당신'", () => {
    expect(buildMockAnswer(makeRequest("제 성격은?", { nickname: "솔" })).answer).toContain("솔님");
    expect(buildMockAnswer(makeRequest("제 성격은?")).answer).toContain("당신");
  });

  it("패턴이 없으면 today 기반으로 응답", () => {
    const r = mockResponse(makeRequest("요즘 흐름은?", { patterns: [] }));
    expect(r.answer).toContain("말하기보다 듣는 날");
    expect(r.groundedOn).toEqual(["today.day", "today.tengod"]);
  });
});
