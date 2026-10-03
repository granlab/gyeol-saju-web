/**
 * 프론트가 호출하는 AI 질문 클라이언트. 시그니처 유지.
 * 정적 배포 구성: 서버 없이 브라우저에서 안전 분기 + 목업 응답을 만든다(Claude 호출·API 키 없음).
 */
import { handleAskLocal } from "./local";
import { parseAskRequest } from "./schema";
import type { AskRequest, AskResponse } from "./types";

export async function askGyeol(req: AskRequest): Promise<AskResponse> {
  const parsed = parseAskRequest(req);
  if (!parsed.ok) throw new Error(parsed.error);
  return handleAskLocal(parsed.data);
}
