import { describe, expect, it } from "vitest";
import { assessSafety } from "../safety";

describe("assessSafety — crisis 양성", () => {
  const positives = [
    "죽고 싶어요",
    "요즘 너무 죽고싶다",
    "내 사주에 죽을 운 있어?",
    "다 끝내고싶다",
    "다 끝내고 싶어",
    "살기 싫어",
    "살고 싶지 않아요",
    "자해를 했어요",
    "손목을 긋고 싶어",
    "옥상에서 뛰어내리고 싶어",
    "그냥 사라지고 싶다",
    "유서를 써 봤어",
    "제 수명이 언제까지예요?",
    "나 언제 죽어?",
    "자 살 하고 싶어",
    "더 이상 살 이유가 없어",
    "살고 싶지가 않아",
    "살 의미가 없어요",
    "주꼬싶다",
    "죽구싶어",
  ];
  for (const q of positives) {
    it(q, () => {
      expect(assessSafety(q).crisis).toBe(true);
    });
  }
});

describe("assessSafety — crisis 음성", () => {
  const negatives = [
    "일이 죽도록 많아",
    "올해 이직해도 괜찮을까요?",
    "제 성격이 왜 이렇게 급할까요",
    "남자친구랑 자주 싸워요",
    "오늘 운세 알려줘",
    "목숨 걸고 공부하는 중이에요",
    "손목 시계를 선물하려는데 어울리는 색은?",
    "병화 일간인데 제 기질은?",
    "대운이 바뀌는 시기가 궁금해요",
    "사라진 열정을 되찾고 싶어요",
    "유산으로 받은 집을 팔아야 할까요",
    "마음이 아파요, 이별했어요",
    "가슴이 아픈 일이 있었어요",
  ];
  for (const q of negatives) {
    it(q, () => {
      const a = assessSafety(q);
      expect(a.crisis).toBe(false);
    });
  }

  it("음성 사례는 restricted 로도 잡히지 않는다(일반 질문 흐름)", () => {
    for (const q of negatives) expect(assessSafety(q).restrictedTopic, q).toBeNull();
  });

  it("[한계 문서화] '죽겠다 너무 웃겨' 는 crisis 음성이다('죽겠' 은 과장 표현이라 키워드 제외)", () => {
    // 양성도 허용되는 사례지만 현재 구현은 음성. 문맥 판별은 키워드로 불가능하다.
    expect(assessSafety("죽겠다 너무 웃겨").crisis).toBe(false);
  });
});

describe("assessSafety — restricted 7주제", () => {
  const cases: Array<[string, string]> = [
    ["health", "제가 암에 걸릴 사주인가요?"],
    ["health", "우울증이 사주에 나와요?"],
    ["health", "다음 달 수술 날짜 괜찮을까요"],
    ["death", "부모님 수명이 궁금해요"],
    ["death", "몇 살까지 살아요?"],
    ["death", "저 언제까지 살 수 있나요"],
    ["death", "오래 살 수 있을까요"],
    ["pregnancy", "올해 임신할 수 있을까요"],
    ["pregnancy", "언제 아이를 가질 수 있나요"],
    ["crime", "사기 쳐도 안 걸릴 운인가요"],
    ["legal", "이번 소송 이길 수 있을까요"],
    ["legal", "변호사를 바꿔야 할까요"],
    ["investment", "이번 달 비트코인 사도 될까요"],
    ["investment", "로또 당첨 운 있나요"],
    ["investment", "주식 투자 시기 알려줘"],
    ["hiring", "이 지원자를 뽑을까 말까"],
    ["hiring", "면접 합격할까요?"],
  ];
  for (const [topic, q] of cases) {
    it(`${topic}: ${q}`, () => {
      const a = assessSafety(q);
      expect(a.crisis).toBe(false);
      expect(a.restrictedTopic).toBe(topic);
      expect(a.matched.length).toBeGreaterThan(0);
    });
  }

  it("'아파트' 는 health 로 잡지 않는다", () => {
    expect(assessSafety("아파트 이사 시기").restrictedTopic).toBeNull();
  });
});

describe("assessSafety — 우선순위", () => {
  it("crisis 가 restricted 보다 우선한다(사망·수명 + 위기)", () => {
    const a = assessSafety("내 사주에 죽을 운 있어? 수명이 짧대");
    expect(a.crisis).toBe(true);
    expect(a.matched.length).toBeGreaterThan(0);
  });

  it("투자 손실 + 위기 발언도 crisis", () => {
    const a = assessSafety("코인으로 다 잃었어 죽고 싶다");
    expect(a.crisis).toBe(true);
    expect(a.restrictedTopic).toBe("investment");
  });
});
