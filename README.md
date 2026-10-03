# 결(結) — AI 명리 코치 (웹 목업 프로토타입)

"미래를 맞히는 앱"이 아니라 사주로 자기 패턴을 이해하고 선택을 돕는 설명 가능한 AI 코치.
근거 보고서: `docs/strategy-report.pdf` (텍스트본 `docs/strategy-report.txt`). 진행 상태·검수 결과: `docs/STATUS.md`.

## 범위 (운영자 결정 2026-10-03)
- DB 없음, 호스팅 없음. 로컬에서 도는 목업 프로토타입 (Next.js + TypeScript).
- 흐름: 생년월일시 입력 → 결정적 만세력 계산 → 핵심 패턴 카드 → "왜?" 설명 → AI 질문 → 오늘의 흐름/행동.
- 저장은 브라우저 localStorage 만. 서버 저장 금지.
- AI: `ANTHROPIC_API_KEY` 가 있으면 실제 호출, 없으면 목업 응답. 키는 `.env.local`(gitignore).
- 계산은 LLM 이 하지 않는다. 코드(`src/lib/saju`)가 사주를 계산하고 LLM 은 설명만.
- 안전: 단정 예언 금지, 질병·사망·투자·임신 근거 사용 유도 금지, 위기 발언 시 안전 안내 분기, AI 생성 고지.

## 실행
```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY 를 넣으면 실제 Claude(claude-sonnet-5-5) 호출, 비우면 목업
npm run dev                  # http://localhost:3000 (모바일 폭으로 보는 것을 권장)
npm test                     # vitest: 엔진 회귀·패턴·AI 안전 분기 테스트
npm run build                # 프로덕션 빌드 확인
```

## 구조
```
src/lib/saju/     만세력 엔진 (절기 천문계산, 한국 시간 규칙, 사주 원국·대운·근거 Fact) + 패턴 카드·오늘 규칙
src/lib/ai/       AI 풀이 (안전 분기, 목업 응답, Claude 호출, 단정 완화)   src/app/api/ask/route.ts
src/app/          화면: / 온보딩 · /me 나의 결 · /today 오늘의 결 · /ask 묻기 · /settings 설정·데이터
src/lib/storage.ts  localStorage(gyeol:*) 전용 저장
```
