"use client";

import { useId, useState } from "react";
import type { Fact } from "@/lib/saju/types";
import { IconChevron } from "../icons";
import { FactChips } from "./FactChips";

export interface WhyData {
  structure: string[];
  rule: string;
  context?: string;
  suggestion?: string;
  caveat: string;
  factIds: string[];
}

const FALLBACK_CAVEAT = "전통 명리 관점의 해석이며 확정적 예측이 아닙니다.";

/** '왜?' 버튼 + 4단계 설명 체인 (사주 구조 → 해석 규칙 → 내 맥락 → 제안) */
export function WhyChain({ why, facts, label = "왜 이렇게 보나요?" }: { why: WhyData; facts: Fact[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const steps: Array<{ title: string; body: React.ReactNode }> = [
    {
      title: "사주 구조",
      body:
        why.structure.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {why.structure.map((s, i) => (
              <li key={i} className="rounded-lg bg-paper-deep px-2 py-0.5 text-sm text-ink">
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-ink-mute">구조 정보 없음</span>
        ),
    },
    { title: "해석 규칙", body: why.rule },
  ];
  if (why.context) steps.push({ title: "내 맥락", body: why.context });
  if (why.suggestion) steps.push({ title: "제안", body: why.suggestion });

  return (
    <div className="mt-4 border-t border-line pt-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between rounded-xl text-left text-base font-semibold text-accent-deep"
      >
        <span>{label}</span>
        <IconChevron open={open} size={20} />
      </button>
      {open && (
        <div id={id} className="pb-1 pt-1">
          <ol className="relative space-y-3 border-l-2 border-accent-soft pl-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[27px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white"
                >
                  {i + 1}
                </span>
                <p className="text-sm font-semibold text-ink-soft">{s.title}</p>
                <div className="mt-0.5 text-base text-ink">{s.body}</div>
              </li>
            ))}
          </ol>
          <FactChips factIds={why.factIds} facts={facts} />
          <p className="mt-3 text-sm text-ink-mute">{why.caveat || FALLBACK_CAVEAT}</p>
        </div>
      )}
    </div>
  );
}
