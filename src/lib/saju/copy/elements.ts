/**
 * 오행 5종 '많을 때 / 없을 때' 문구 테이블 (element-balance 카드).
 */
import type { Element } from "../types";

export interface ElementCopy {
  many: string;
  missing: string;
  manyContext: string;
  missingContext: string;
  manySuggestion: string;
  missingSuggestion: string;
}

export const ELEMENT_COPY: Record<Element, ElementCopy> = {
  wood: {
    many: "목(木) 기운이 두드러져 성장·시작·계획에 마음이 쉽게 가고, 일을 벌이는 속도가 빠른 편으로 해석됩니다.",
    missing: "목(木) 기운이 비어 있어 새 일을 시작하는 첫걸음에 시간이 조금 더 걸릴 수 있다고 봅니다.",
    manyContext: "하고 싶은 일이 동시에 여러 개 떠오른다면 이 기운의 쏠림과 연결해 볼 수 있습니다.",
    missingContext: "시작이 망설여질 때, 준비가 부족해서라기보다 첫 단추가 무겁게 느껴지는 것일 수 있습니다.",
    manySuggestion: "새로 벌이고 싶은 일은 목록에만 적고, 이번 주에는 하나만 고르는 것을 제안합니다.",
    missingSuggestion: "미뤄 둔 일을 '5분짜리 첫 단계'로 쪼개 오늘 그 단계만 해 보는 것을 제안합니다.",
  },
  fire: {
    many: "화(火) 기운이 두드러져 표현과 열정이 앞서고, 감정 온도가 빠르게 오르내리는 편으로 해석됩니다.",
    missing: "화(火) 기운이 비어 있어 마음을 겉으로 드러내거나 나를 알리는 일에 의식적인 노력이 필요하다고 봅니다.",
    manyContext: "신나게 시작했다가 쉽게 지치는 흐름이 있다면 이 기운의 쏠림과 연결해 볼 수 있습니다.",
    missingContext: "속으로는 충분히 좋아하는데 상대가 잘 모른다는 말을 듣는다면 이 빈자리와 연결해 볼 수 있습니다.",
    manySuggestion: "열정이 오른 순간에 바로 답하기보다 한 시간 뒤에 다시 보고 정하는 것을 제안합니다.",
    missingSuggestion: "고마웠던 일 하나를 말이나 메시지로 직접 표현해 보는 것을 제안합니다.",
  },
  earth: {
    many: "토(土) 기운이 두드러져 안정과 책임을 중시하고, 변화보다 지키는 쪽에 무게를 두는 편으로 해석됩니다.",
    missing: "토(土) 기운이 비어 있어 생활 리듬과 경계를 꾸준히 유지하는 데 신경을 더 쓰면 좋다고 봅니다.",
    manyContext: "익숙한 방식을 바꾸는 데 유난히 에너지가 많이 든다면 이 기운의 쏠림과 연결해 볼 수 있습니다.",
    missingContext: "일정이 자주 흐트러지거나 쉬는 시간이 들쭉날쭉하다면 이 빈자리와 연결해 볼 수 있습니다.",
    manySuggestion: "평소와 다른 길로 걷거나 새 메뉴를 골라 보는 작은 변화를 시도해 보는 것을 제안합니다.",
    missingSuggestion: "매일 같은 시각에 하는 작은 습관 하나를 정해 보는 것을 제안합니다.",
  },
  metal: {
    many: "금(金) 기운이 두드러져 기준과 원칙이 분명하고, 정리와 판단이 빠른 편으로 해석됩니다.",
    missing: "금(金) 기운이 비어 있어 거절하거나 선을 긋는 일이 상대적으로 어렵게 느껴질 수 있다고 봅니다.",
    manyContext: "나와 남에게 같은 잣대를 엄격하게 대고 있다면 이 기운의 쏠림과 연결해 볼 수 있습니다.",
    missingContext: "부탁을 거절하지 못해 일정이 꽉 차는 일이 잦다면 이 빈자리와 연결해 볼 수 있습니다.",
    manySuggestion: "오늘 내린 판단 하나에 '다른 사람이라면 어떻게 볼까'를 한 줄 덧붙여 보는 것을 제안합니다.",
    missingSuggestion: "거절 문장 하나를 미리 적어 두고 필요할 때 그대로 써 보는 것을 제안합니다.",
  },
  water: {
    many: "수(水) 기운이 두드러져 생각과 감수성이 깊고, 정보를 넓게 받아들이는 편으로 해석됩니다.",
    missing: "수(水) 기운이 비어 있어 쉬어 가며 생각을 정리하는 시간을 의식적으로 챙기면 좋다고 봅니다.",
    manyContext: "생각이 꼬리를 물어 결정을 미루게 된다면 이 기운의 쏠림과 연결해 볼 수 있습니다.",
    missingContext: "바쁘게 움직이다 정작 내 마음을 돌아볼 틈이 없다면 이 빈자리와 연결해 볼 수 있습니다.",
    manySuggestion: "고민 중인 일은 생각을 세 줄로 적고 그중 하나만 실행해 보는 것을 제안합니다.",
    missingSuggestion: "잠들기 전 5분 동안 오늘 있었던 일을 천천히 떠올려 보는 것을 제안합니다.",
  },
};

export const ELEMENT_BALANCED_BODY =
  "다섯 기운이 비교적 고르게 분포해, 한쪽으로 크게 치우치지 않은 구조로 해석됩니다. 상황에 따라 필요한 기운을 꺼내 쓰기 쉬운 대신, 스스로 무게중심을 정해 주는 것이 도움이 된다고 봅니다.";

export const ELEMENT_BALANCED_CONTEXT =
  "어느 쪽에도 크게 끌리지 않아 선택이 어렵게 느껴진다면 이 고른 분포와 연결해 볼 수 있습니다.";

export const ELEMENT_BALANCED_SUGGESTION =
  "이번 주에 가장 신경 쓰고 싶은 영역(관계·일·나) 하나를 정해 적어 두는 것을 제안합니다.";

export const ELEMENT_RULE =
  "원국 여덟 글자(시간 미상이면 여섯 글자)와 지장간의 오행 비중을 세어, 많은 기운은 자주 쓰는 성향으로, 빈 기운은 의식적으로 채우면 좋은 영역으로 해석합니다.";

export const BOUNDARY_NOTE = "출생 시각이 절기 경계와 가까워 월주 해석은 확인이 필요합니다.";
