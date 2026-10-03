"use client";

import { useState, type ReactNode } from "react";
import { KOREA_HOTLINES, RESTRICTED_TOPIC_KO, type AskResponse } from "@/lib/ai/types";
import type { Fact } from "@/lib/saju/types";
import { factLabel } from "@/lib/format";
import { IconChevron, IconPhone, IconShield } from "../icons";
import { Badge, Chip, cx } from "../ui";

/** 최소 마크다운: 줄바꿈, '- ' 목록, **굵게** */
export function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: number) => {
    if (list.length) {
      out.push(
        <ul key={`l${key}`} className="my-1 list-disc space-y-0.5 pl-5">
          {list.map((l, i) => (
            <li key={i}>{inline(l)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  lines.forEach((ln, i) => {
    const m = /^\s*[-*•]\s+(.*)$/.exec(ln);
    if (m) {
      list.push(m[1]);
      return;
    }
    flush(i);
    if (ln.trim() === "") return;
    out.push(
      <p key={i} className="my-1">
        {inline(ln.replace(/^#+\s*/, ""))}
      </p>,
    );
  });
  flush(lines.length);
  return <div className="text-base leading-relaxed">{out}</div>;
}

function inline(s: string): ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <b key={i}>{p.slice(2, -2)}</b> : p,
  );
}

function telHref(n: string) {
  return `tel:${n.replace(/[^0-9+]/g, "")}`;
}

export function ModeBadge({ mode }: { mode: AskResponse["mode"] }) {
  if (mode === "live") return <Badge tone="accent">실제 AI</Badge>;
  if (mode === "mock") return <Badge tone="caution">목업 응답(API 키 없음)</Badge>;
  if (mode === "safety") return <Badge tone="safety">안전 안내</Badge>;
  return <Badge tone="caution">경계 안내</Badge>;
}

export function AnswerCard({
  response,
  facts,
  onFollowUp,
  followUpDisabled,
}: {
  response: AskResponse;
  facts: Fact[];
  onFollowUp: (q: string) => void;
  followUpDisabled?: boolean;
}) {
  const [showGround, setShowGround] = useState(false);

  if (response.mode === "safety") {
    const hotlines = response.safety.hotlines.length > 0 ? response.safety.hotlines : KOREA_HOTLINES;
    return (
      <article
        className="rounded-3xl border-2 border-safety/40 bg-safety-soft p-5 text-ink"
        role="alert"
        aria-label="안전 안내"
      >
        <div className="flex items-center gap-2 text-safety">
          <IconShield size={22} />
          <h3 className="text-lg font-bold">지금, 도움을 받을 수 있어요</h3>
        </div>
        <div className="mt-2">
          <MiniMarkdown text={response.answer} />
        </div>
        <ul className="mt-4 space-y-2">
          {hotlines.map((h) => (
            <li key={h.number}>
              <a
                href={telHref(h.number)}
                className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2 text-ink shadow-sm hover:bg-paper"
                aria-label={`${h.name} ${h.number}로 전화하기`}
              >
                <span>
                  <span className="block font-semibold">{h.name}</span>
                  {h.note && <span className="block text-sm text-ink-mute">{h.note}</span>}
                </span>
                <span className="flex items-center gap-1.5 text-lg font-bold text-safety">
                  <IconPhone size={18} />
                  {h.number}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-ink-soft">위급한 상황이라면 112 또는 119 에 바로 연락해 주세요.</p>
      </article>
    );
  }

  const restricted = response.mode === "restricted";
  const topic = response.safety.restrictedTopic;

  return (
    <article
      className={cx(
        "rounded-3xl border p-5",
        restricted ? "border-caution/40 bg-caution-soft" : "border-line bg-white/90",
      )}
      aria-label={restricted ? "경계 안내" : "AI 답변"}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <ModeBadge mode={response.mode} />
        {response.softened && <Badge>표현을 완화했어요</Badge>}
      </div>
      {restricted && (
        <h3 className="mb-1 text-base font-bold text-caution">
          {topic ? `'${RESTRICTED_TOPIC_KO[topic] ?? topic}'` : "이 주제"}는 사주로 판단하지 않아요
        </h3>
      )}
      <MiniMarkdown text={response.answer} />

      {response.groundedOn.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            aria-expanded={showGround}
            onClick={() => setShowGround((v) => !v)}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-deep"
          >
            근거 보기 ({response.groundedOn.length})
            <IconChevron open={showGround} size={18} />
          </button>
          {showGround && (
            <ul className="mt-1 space-y-1.5">
              {response.groundedOn.map((id) => {
                const f = facts.find((x) => x.id === id);
                return (
                  <li key={id} className="rounded-2xl bg-paper-deep px-3 py-2 text-sm">
                    <span className="font-semibold text-ink-soft">{factLabel(id)}</span>
                    <span className="ml-2 text-ink">{f?.text ?? "계산 결과에서 찾을 수 없는 근거예요."}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {response.suggestedFollowUps.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-sm text-ink-mute">이어서 물어보기</p>
          <ul className="flex flex-wrap gap-1.5">
            {response.suggestedFollowUps.map((q) => (
              <li key={q}>
                <Chip onClick={followUpDisabled ? undefined : () => onFollowUp(q)} ariaLabel={`질문하기: ${q}`}>
                  {q}
                </Chip>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 border-t border-line pt-2 text-xs leading-relaxed text-ink-mute">{response.disclosure}</p>
    </article>
  );
}
