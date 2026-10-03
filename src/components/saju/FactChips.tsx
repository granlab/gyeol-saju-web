"use client";

import { useState } from "react";
import type { Fact } from "@/lib/saju/types";
import { factLabel } from "@/lib/format";
import { cx } from "../ui";

/** 근거 Fact 칩. 탭하면 해당 근거 문장을 펼친다. */
export function FactChips({ factIds, facts, title = "근거" }: { factIds: string[]; facts: Fact[]; title?: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const uniq = Array.from(new Set(factIds));
  const items = uniq.map((id) => ({ id, fact: facts.find((f) => f.id === id) ?? null }));
  if (items.length === 0) return null;
  const opened = items.find((i) => i.id === openId);

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-sm font-semibold text-ink-soft">{title}</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map(({ id, fact }) => (
          <li key={id}>
            <button
              type="button"
              aria-expanded={openId === id}
              aria-label={`근거: ${factLabel(id)} ${openId === id ? "접기" : "펼치기"}`}
              title={fact?.text ?? "엔진 결과에서 찾을 수 없는 근거입니다"}
              onClick={() => setOpenId((cur) => (cur === id ? null : id))}
              className={cx(
                "inline-flex min-h-11 items-center gap-1 rounded-full border px-3 text-sm",
                openId === id ? "border-accent bg-accent-soft text-accent-deep" : "border-line bg-white text-ink-soft",
              )}
            >
              <span aria-hidden="true" className="text-xs text-ink-mute">
                {fact?.source === "rule" ? "규칙" : "계산"}
              </span>
              {factLabel(id)}
            </button>
          </li>
        ))}
      </ul>
      {opened && (
        <p className="mt-2 rounded-2xl bg-paper-deep px-4 py-3 text-sm text-ink-soft" aria-live="polite">
          {opened.fact?.text ?? "이 근거 항목은 현재 계산 결과에 포함되어 있지 않아요."}
        </p>
      )}
    </div>
  );
}
