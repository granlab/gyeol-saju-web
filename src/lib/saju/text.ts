/** 한국어 표기 도우미 (조사, 한자+한글 병기, 부호) */
import { branchKo, stemKo } from "./ganzhi";
import type { Branch, GanZhi, Stem } from "./types";

/** 마지막 한글 음절의 종성 인덱스(0 = 받침 없음). '甲(갑)' 처럼 괄호가 뒤에 와도 한글을 찾는다 */
function lastJong(word: string): number {
  for (let i = word.length - 1; i >= 0; i--) {
    const ch = word.charCodeAt(i);
    if (ch >= 0xac00 && ch <= 0xd7a3) return (ch - 0xac00) % 28;
    // 숫자로 끝나면 읽는 소리 기준: 영(ㅇ)·일(ㄹ)·이·삼(ㅁ)·사·오·육(ㄱ)·칠(ㄹ)·팔(ㄹ)·구
    if (ch >= 0x30 && ch <= 0x39) return [21, 8, 0, 16, 0, 0, 1, 8, 8, 0][ch - 0x30];
  }
  return 0;
}

/** 조사 선택. pair 예: '이/가', '은/는', '을/를', '과/와', '으로/로' */
export function josa(word: string, pair: "이/가" | "은/는" | "을/를" | "과/와" | "으로/로"): string {
  const [withB, withoutB] = pair.split("/");
  const jong = lastJong(word);
  if (pair === "으로/로") return jong === 0 || jong === 8 ? withoutB : withB; // ㄹ 받침은 '로'
  return jong !== 0 ? withB : withoutB;
}

/** '甲(갑)' */
export function stemLabel(s: Stem): string {
  return `${s}(${stemKo(s)})`;
}
/** '寅(인)' */
export function branchLabel(b: Branch): string {
  return `${b}(${branchKo(b)})`;
}
/** '甲子(갑자)' */
export function gzLabel(g: GanZhi): string {
  return `${g.name}(${g.nameKo})`;
}

/** 부호 있는 분: −32 / +5 / 0 (유니코드 마이너스) */
export function signedMinutes(n: number): string {
  if (n === 0) return "0";
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`;
}

/** 단어 + 알맞은 조사 */
export function withJosa(word: string, pair: Parameters<typeof josa>[1]): string {
  return `${word}${josa(word, pair)}`;
}
