"use client";

import { Suspense, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnswerCard, ModeBadge } from "@/components/ask/AnswerCard";
import { ChartGate, LoadingView, type ReadyChart } from "@/components/ChartGate";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconChat, IconRefresh, IconSend, IconTrash } from "@/components/icons";
import { NightSky } from "@/components/NightSky";
import { Button, Card, Chip, IconBubble, Notice, cx } from "@/components/ui";
import { MAX_QUESTION_LENGTH, useChat, type AskContext } from "@/lib/hooks/useChat";
import type { PatternCard } from "@/lib/saju/types";

export default function AskPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <AskWithParams />
    </Suspense>
  );
}

function AskWithParams() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").slice(0, MAX_QUESTION_LENGTH);
  return <ChartGate>{(s) => <AskView s={s} initialQ={q} />}</ChartGate>;
}

const DEFAULT_SUGGESTIONS = ["왜 요즘 일이 자꾸 꼬일까?", "내 강점을 일에 어떻게 쓸까?", "관계에서 반복되는 패턴은?"];

function buildSuggestions(patterns: PatternCard[] | null): string[] {
  const out: string[] = [];
  const find = (c: PatternCard["category"]) => patterns?.find((p) => p.category === c);
  const self = find("self");
  if (self) out.push(`'${self.headline}'인 내 강점을 일에 어떻게 쓸까?`);
  const social = find("social");
  if (social) out.push("관계에서 반복되는 패턴은?");
  const cycle = find("cycle");
  if (cycle) out.push("요즘 흐름에서 무엇을 준비하면 좋을까?");
  for (const d of DEFAULT_SUGGESTIONS) {
    if (out.length >= 3) break;
    if (!out.includes(d)) out.push(d);
  }
  return out.slice(0, 3);
}

function AskView({ s, initialQ }: { s: ReadyChart; initialQ: string }) {
  const { entries, pending, failed, send, retry, clear, lastMode } = useChat();
  const [text, setText] = useState(initialQ);
  const [confirmClear, setConfirmClear] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const counterId = useId();

  const aiEnabled = s.profile.aiEnabled;
  const ctx: AskContext | null =
    s.patterns && s.today
      ? { chart: s.chart, patterns: s.patterns, today: s.today, nickname: s.profile.nickname || undefined }
      : null;
  const canAsk = aiEnabled && ctx !== null;
  const facts = [...s.chart.facts, ...(s.today?.facts ?? [])];
  const suggestions = buildSuggestions(s.patterns);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [entries.length, pending]);

  async function submit(q: string) {
    if (!ctx || !canAsk) return;
    const trimmed = q.trim();
    if (!trimmed || pending) return;
    setText("");
    await send(trimmed, ctx);
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* 상단 고정 헤더 + 고지 배너 — 숨기지 않는다 */}
      <NightSky variant="band" className="pt-safe sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2 px-5 pb-1 pt-4">
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <IconBubble tone="night" className="h-8 w-8 rounded-xl">
              <IconChat size={18} />
            </IconBubble>
            AI 상담
          </h1>
          <div className="flex items-center gap-1">
            {lastMode && <ModeBadge mode={lastMode} />}
            {entries.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                aria-label="대화 지우기"
                title="대화 지우기"
              >
                <IconTrash size={20} />
              </button>
            )}
          </div>
        </div>
        <p className="px-5 pb-3 text-xs leading-relaxed text-night-text" role="note">
          AI 가 생성한 해석 · 확정적 예측이 아님 · 대화는 이 브라우저에만 저장
        </p>
      </NightSky>

      <div className="flex-1 space-y-4 px-5 py-4">
        {!aiEnabled && (
          <Notice tone="caution">
            AI 상담 기능이 꺼져 있어요.{" "}
            <Link href="/settings" className="font-semibold underline underline-offset-2">
              마이에서 켜기
            </Link>
          </Notice>
        )}
        {aiEnabled && !ctx && (
          <Notice tone="caution">
            AI 에게 보낼 계산 결과(패턴·오늘의 흐름)가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.
          </Notice>
        )}

        {entries.length === 0 && (
          <Card className="border-accent-soft bg-accent-soft/70">
            <div className="flex gap-3">
              <IconBubble tone="accent" className="h-11 w-11 bg-white shadow-sm">
                <IconChat size={22} />
              </IconBubble>
              <div>
                <p className="text-base font-bold text-ink">무엇이든 편하게 물어보세요</p>
                <p className="mt-1 text-sm text-ink-soft">
                  내 사주 계산 결과를 근거로 답해요. 질병·사망·임신·투자·채용·법률 판단은 하지 않아요.
                </p>
              </div>
            </div>
          </Card>
        )}

        <ol className="space-y-4" aria-live="polite">
          {entries.map((e) =>
            e.role === "user" ? (
              <li key={e.id} className="flex justify-end">
                <p className="bg-cta max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-md px-4 py-2.5 text-base text-white shadow-[0_6px_16px_rgba(109,92,224,0.22)]">
                  {e.content}
                </p>
              </li>
            ) : (
              <li key={e.id}>
                {e.response ? (
                  <AnswerCard
                    response={e.response}
                    facts={facts}
                    onFollowUp={(q) => void submit(q)}
                    followUpDisabled={!canAsk || pending}
                  />
                ) : (
                  <p className="whitespace-pre-wrap rounded-3xl bg-white p-4 shadow-card">{e.content}</p>
                )}
              </li>
            ),
          )}
        </ol>

        {pending && (
          <div className="flex items-center gap-2 text-ink-soft" role="status">
            <span className="inline-flex gap-1" aria-hidden="true">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
            </span>
            답변을 정리하고 있어요…
          </div>
        )}

        {failed && !pending && (
          <Card className="border-caution/30 bg-caution-soft/70" role="alert">
            <p className="font-semibold">답변을 받지 못했어요</p>
            <p className="mt-1 text-sm text-ink-soft">네트워크나 서버 상태를 확인한 뒤 다시 시도해 주세요.</p>
            <div className="mt-3">
              <Button variant="secondary" onClick={() => ctx && void retry(ctx)} disabled={!canAsk}>
                <IconRefresh size={18} /> 다시 시도
              </Button>
            </div>
          </Card>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="bottom-above-tabbar sticky z-20 border-t border-white bg-paper/95 px-4 pb-3 pt-2 backdrop-blur">
        {entries.length === 0 && (
          <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="추천 질문">
            {suggestions.map((q) => (
              <li key={q}>
                <Chip onClick={canAsk && !pending ? () => setText(q) : undefined} ariaLabel={`추천 질문 입력: ${q}`}>
                  {q}
                </Chip>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(text);
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            질문 입력
          </label>
          <textarea
            id={inputId}
            rows={1}
            value={text}
            maxLength={MAX_QUESTION_LENGTH}
            disabled={!canAsk}
            aria-describedby={counterId}
            placeholder={aiEnabled ? "예: 요즘 이직이 계속 고민돼" : "AI 상담 기능이 꺼져 있어요"}
            onChange={(e) => setText(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void submit(text);
              }
            }}
            className="max-h-36 min-h-12 flex-1 resize-none rounded-3xl border border-line bg-white px-4 py-3 text-base text-ink shadow-card placeholder:text-ink-mute/70 focus:border-accent focus:outline-none disabled:bg-paper-deep"
          />
          <button
            type="submit"
            disabled={!canAsk || pending || !text.trim()}
            aria-label="질문 보내기"
            className="bg-cta inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-[0_6px_16px_rgba(109,92,224,0.3)] disabled:shadow-none"
          >
            <IconSend size={20} />
          </button>
        </form>
        <p
          id={counterId}
          className={cx(
            "mt-1 text-right text-xs tabular-nums",
            text.length >= MAX_QUESTION_LENGTH ? "text-safety" : "text-ink-mute",
          )}
        >
          {text.length} / {MAX_QUESTION_LENGTH}
        </p>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="대화를 모두 지울까요?"
        confirmLabel="지우기"
        danger
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
      >
        이 브라우저에 저장된 대화 기록이 삭제되고 되돌릴 수 없어요.
      </ConfirmDialog>
    </div>
  );
}
