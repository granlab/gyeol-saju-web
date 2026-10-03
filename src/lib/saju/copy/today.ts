/**
 * 오늘의 흐름 문구 테이블.
 * - TODAY_HEADLINE: 오늘 천간 십성 그룹(5) × 오늘 지지 오행과 일간의 관계(5) = 25문장
 * - TODAY_ACTION: 십성 그룹(5) × 점수 최상위 영역(3) = 15개 '오늘 한 가지 행동' (10분 이내)
 * 선택은 해시가 아니라 규칙 매핑(결정적).
 */
import type { TenGodGroup } from "../types";

/**
 * 오늘 지지 오행이 일간 오행과 맺는 관계 (일간 입장)
 * - support : 지지가 일간을 생함 (생)
 * - pressure: 지지가 일간을 극함 (극)
 * - same    : 같은 오행 (비화)
 * - output  : 일간이 지지를 생함 (설)
 * - control : 일간이 지지를 극함 (재)
 */
export type BranchRelation = "support" | "pressure" | "same" | "output" | "control";

export const BRANCH_RELATION_KO: Record<BranchRelation, string> = {
  support: "지지가 일간을 돕는 관계(생)",
  pressure: "지지가 일간을 누르는 관계(극)",
  same: "지지와 일간이 같은 오행(비화)",
  output: "일간이 지지를 낳아 힘을 내어 주는 관계(설)",
  control: "일간이 지지를 다스리는 관계(재)",
};

export const TODAY_HEADLINE: Record<TenGodGroup, Record<BranchRelation, string>> = {
  비겁: {
    support: "내 페이스를 믿고 가도 좋은 날",
    pressure: "고집보다 한 걸음 물러서는 날",
    same: "혼자 집중할 일을 고르기 좋은 날",
    output: "함께하는 사람에게 힘을 나누는 날",
    control: "내 몫을 분명히 정리하는 날",
  },
  식상: {
    support: "떠오른 생각을 작게 꺼내 보는 날",
    pressure: "말하기보다 듣는 날",
    same: "내 방식으로 만들어 보기 좋은 날",
    output: "표현을 아껴 핵심만 말하는 날",
    control: "아이디어를 결과물로 옮기는 날",
  },
  재성: {
    support: "작게 시작하기 좋은 날",
    pressure: "욕심을 덜고 우선순위를 줄이는 날",
    same: "할 일 목록을 현실적으로 다듬는 날",
    output: "들인 노력을 차분히 점검하는 날",
    control: "정리하고 마무리하기 좋은 날",
  },
  관성: {
    support: "맡은 역할에 기대어 차분히 가는 날",
    pressure: "약속을 줄이고 정리하는 날",
    same: "기준은 지키되 혼자 짊어지지 않는 날",
    output: "책임과 휴식 사이 균형을 잡는 날",
    control: "규칙 안에서 효율을 찾는 날",
  },
  인성: {
    support: "배우고 채우기 좋은 날",
    pressure: "생각을 줄이고 몸을 움직이는 날",
    same: "조용히 정리하며 충전하는 날",
    output: "읽은 것을 한 줄로 남기는 날",
    control: "도움을 청해도 괜찮은 날",
  },
};

export type ScoreArea = "relation" | "work" | "self";
/** 동점일 때 우선순위 (결정적) */
export const SCORE_AREA_ORDER: ScoreArea[] = ["relation", "work", "self"];

/** 십성 그룹별 점수 가중 (±5). 오늘 지지 관계 가중(±10)과 합쳐 15개 행동이 모두 도달 가능하도록 조정 */
export const GROUP_SCORE_DELTA: Record<TenGodGroup, Record<ScoreArea, number>> = {
  비겁: { relation: -5, work: 0, self: 5 },
  식상: { relation: 5, work: 0, self: -5 },
  재성: { relation: 0, work: 5, self: -5 },
  관성: { relation: -5, work: 5, self: 0 },
  인성: { relation: 0, work: -5, self: 5 },
};

/** 오늘 지지 오행과 일간 관계별 점수 가중 */
export const RELATION_SCORE_DELTA: Record<BranchRelation, Record<ScoreArea, number>> = {
  support: { relation: 0, work: 0, self: 10 },
  pressure: { relation: 0, work: 10, self: -10 },
  same: { relation: -5, work: -5, self: 10 },
  output: { relation: 10, work: 0, self: -5 },
  control: { relation: 0, work: 10, self: 0 },
};

export const SCORE_BASE = 55;
export const SCORE_MIN = 25;
export const SCORE_MAX = 85;

export const TODAY_ACTION: Record<TenGodGroup, Record<ScoreArea, { id: string; text: string }>> = {
  비겁: {
    relation: { id: "send-one-thanks", text: "오늘 함께한 사람에게 고맙다는 말 한 줄 보내기" },
    work: { id: "focus-one-solo-task", text: "혼자 끝낼 수 있는 일 하나를 골라 10분만 집중하기" },
    self: { id: "walk-without-phone", text: "10분 동안 휴대폰 없이 걷기" },
  },
  식상: {
    relation: { id: "listen-to-the-end", text: "대화 한 번은 끝까지 듣고 나서 말하기" },
    work: { id: "memo-one-idea", text: "떠오른 아이디어 하나를 세 줄로 메모하기" },
    self: { id: "write-mood-three-lines", text: "오늘 기분을 세 줄로 적어 보기" },
  },
  재성: {
    relation: { id: "defer-one-reply", text: "급하지 않은 답장 하나는 내일로 미루기" },
    work: { id: "trim-one-todo", text: "오늘 할 일 목록에서 하나를 지우거나 미루기" },
    self: { id: "review-time-spent", text: "오늘 쓴 시간을 한 줄로 돌아보기" },
  },
  관성: {
    relation: { id: "decline-one-request", text: "부담되는 부탁 하나를 정중히 미루기" },
    work: { id: "log-one-decision", text: "오늘 결정 한 가지를 메모로 남기기" },
    self: { id: "set-stop-time", text: "오늘 일을 멈출 시각을 미리 정해 두기" },
  },
  인성: {
    relation: { id: "ask-one-question", text: "막힌 일 하나를 누군가에게 짧게 물어보기" },
    work: { id: "read-ten-minutes", text: "관심 분야 글 하나를 10분 동안 읽기" },
    self: { id: "slow-breath-five", text: "자리에서 5분 동안 천천히 호흡하며 쉬기" },
  },
};

export const TODAY_RULE =
  "오늘 일진의 천간이 일간과 맺는 십성 그룹과, 일진 지지의 오행이 일간을 돕는지·누르는지를 조합해 오늘의 한 문장과 점수를 정합니다. 점수는 예언이 아니라 오늘 관계·일·나 중 어디에 주의를 더 둘지 나눠 보는 지표입니다.";
