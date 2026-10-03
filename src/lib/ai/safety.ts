/**
 * 안전 분기(LLM 호출 전 규칙). 순수 함수.
 *
 * - crisis: 자해·자살·극도 위기 신호. 사주 질문 형태('내 사주에 죽을 운 있어?')도 crisis 로 본다
 *   (전략 보고서 '사주 특유의 AI 윤리': 해석 강화보다 안전 대응 우선).
 * - restricted: 질병·사망·임신·범죄·법률·투자·채용. 사주를 결정 근거로 쓰지 않도록 경계 응답.
 * - crisis 가 restricted 보다 우선한다.
 *
 * 매칭 방식
 * - crisis 는 공백을 모두 제거한 문자열에 대해 검사한다('죽고 싶' / '죽고싶' / '죽 고 싶' 모두 양성).
 * - restricted 는 원문에 대해 검사하되 패턴 안에서 \s* 로 띄어쓰기 변형을 허용한다.
 *
 * 알려진 한계(테스트에 문서화)
 * - '죽겠다 너무 웃겨' 같은 과장 표현: crisis 음성. '죽겠' 은 키워드에 넣지 않았다(과잉 양성 방지).
 * - '손목' 은 단독으로는 넣지 않고 '손목을 긋/자르' 같은 맥락에서만 양성('손목이 아파요' 는 health).
 * - '목숨 걸고' 는 관용 표현이라 제외.
 * - '유산' 은 상속 의미도 pregnancy 로 잡힌다(경계 응답이라 안전 쪽 오류).
 * - 키워드 기반이라 우회 표현(은어·오타·외국어)은 놓칠 수 있다. 외부 guardrail 의 1차 방어선일 뿐이다.
 */
import type { RestrictedTopic, SafetyAssessment } from "./types";

/** 공백 제거 문자열 기준 위기 패턴 */
const CRISIS_PATTERNS: RegExp[] = [
  /자살/,
  /죽고싶/,
  /죽어버리/,
  /죽어야겠/,
  /살기싫/,
  /살고싶지(가)?않/,
  /살(아갈|아야할)?이유(가|를|도)?(없|모르)/,
  /(더이상)?살(고싶은)?(생각|마음|의미)(이|가)?없/,
  /주(꼬|꾸)싶/,
  /죽구싶/,
  /뒤지고싶/,
  /자해/,
  /손목(을|에)?(긋|그어|그었|그을|자르|잘라|칼)/,
  /목숨(?!을?걸)/,
  /뛰어내리/,
  /사라지고싶/,
  /없어지고싶/,
  /죽을운/,
  /죽는운/,
  /수명이언제/,
  /언제죽/,
  /유서/,
  /다끝내고싶/,
  /극단적(인)?선택/,
  /목매/,
];

/** 원문 기준 주제 패턴. 배열 순서 = 우선순위 */
const RESTRICTED_PATTERNS: Array<[RestrictedTopic, RegExp[]]> = [
  [
    "death",
    [
      /죽음/,
      /죽는\s*(날|때|해|시기|나이)/,
      /죽을\s*(까|지|때|나이|팔자)/,
      /사망/,
      /수명/,
      /명이\s*짧/,
      /돌아가실/,
      /몇\s*살까지\s*살/,
      /언제까지\s*살/,
      /오래\s*살(까|지|아요|\s*수\s*있)/,
      /장수할/,
    ],
  ],
  [
    "health",
    [
      /(위|폐|간|유방|대장|갑상선|췌장|자궁|피부|혈액)?암(이|에|일|을|은|인|검사|진단|수술|$|[\s?.!])/,
      /질병/,
      /병원/,
      /지병/,
      /큰\s*병/,
      /병(이|에|을)\s*(있|생|나|걸|들|낫)/,
      // '마음이 아파요' 같은 감정 표현은 건강 주제가 아니다
      /(?<!마음이\s?|마음\s?|가슴이\s?|가슴\s?)아픈/,
      /(?<!마음이\s?|마음\s?|가슴이\s?|가슴\s?)아프(다|고|면|네|지)/,
      /(?<!마음이\s?|마음\s?|가슴이\s?|가슴\s?)아파(요|서|도|져|$|[\s?.!])/,
      /수술/,
      /진단/,
      /우울증/,
      /공황/,
    ],
  ],
  // '유산' 은 상속 의미(유산으로/유산을 받/유산 상속·분할)를 제외한다
  ["pregnancy", [/임신/, /유산(?!\s*(으로|을\s*받|상속|분할|정리|을\s*물려))/, /출산/, /(아이|아기)를?\s*가질/, /난임/, /불임/]],
  ["crime", [/범죄/, /사기\s*(쳐|치|를\s*치)/, /훔치/, /훔쳐/, /도둑질/, /마약/]],
  ["legal", [/소송/, /재판/, /고소/, /변호사/, /합의금/]],
  ["investment", [/주식/, /코인/, /비트\s*코인/, /투자/, /부동산\s*(을|를)?\s*(사|살까|매수)/, /로또/, /도박/, /베팅/, /배팅/, /토토/]],
  ["hiring", [/채용/, /뽑을까/, /해고/, /합격할까/, /붙을까/]],
];

export function assessSafety(text: string): SafetyAssessment {
  const source = (text ?? "").normalize("NFC");
  const compact = source.replace(/\s+/g, "");
  const matched: string[] = [];

  for (const re of CRISIS_PATTERNS) {
    const m = compact.match(re);
    if (m) matched.push(m[0]);
  }
  const crisis = matched.length > 0;

  let restrictedTopic: RestrictedTopic | null = null;
  for (const [topic, patterns] of RESTRICTED_PATTERNS) {
    for (const re of patterns) {
      const m = source.match(re);
      if (m) {
        if (restrictedTopic === null) restrictedTopic = topic;
        matched.push(m[0].trim());
      }
    }
  }

  return {
    crisis,
    // crisis 가 우선: crisis 면 restricted 분기는 쓰지 않지만 검수용으로 주제는 남긴다.
    restrictedTopic,
    matched: [...new Set(matched)],
  };
}
