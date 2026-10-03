"use client";

import Link from "next/link";
import type { Fact, PatternCard } from "@/lib/saju/types";
import { IconArrowRight } from "../icons";
import { Badge, Card, Chip } from "../ui";
import { WhyChain } from "./WhyChain";

const CATEGORY_KO: Record<PatternCard["category"], string> = {
  self: "기질",
  balance: "균형",
  energy: "에너지",
  social: "관계·역할",
  cycle: "흐름",
};

function StrengthDots({ value }: { value: 1 | 2 | 3 }) {
  const label = value === 3 ? "뚜렷함" : value === 2 ? "보통" : "약함";
  return (
    <span className="inline-flex items-center gap-1" aria-label={`해석 강도 ${value}/3 (${label})`} role="img">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={i <= value ? "h-2 w-2 rounded-full bg-accent" : "h-2 w-2 rounded-full bg-line"}
        />
      ))}
      <span aria-hidden="true" className="ml-1 text-xs text-ink-mute">
        {label}
      </span>
    </span>
  );
}

export function askHrefForPattern(p: PatternCard): string {
  const q = `'${p.headline}' 패턴이 내 일상에서는 어떻게 나타나고, 어떻게 활용하면 좋을까요?`;
  return `/ask?q=${encodeURIComponent(q)}`;
}

export function PatternCardView({ card, facts }: { card: PatternCard; facts: Fact[] }) {
  return (
    <Card as="article" aria-labelledby={`pc-${card.id}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <Badge tone="accent">{CATEGORY_KO[card.category] ?? ""}</Badge>
          {card.title}
        </p>
        <StrengthDots value={card.strength} />
      </div>
      <h3 id={`pc-${card.id}`} className="mt-2.5 text-xl font-bold leading-snug text-ink">
        {card.headline}
      </h3>
      <p className="mt-2 text-base leading-relaxed text-ink-soft">{card.body}</p>
      {card.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="태그">
          {card.tags.map((t) => (
            <li key={t}>
              <Chip>#{t}</Chip>
            </li>
          ))}
        </ul>
      )}
      <WhyChain why={card.why} facts={facts} />
      <Link
        href={askHrefForPattern(card)}
        className="mt-1 inline-flex min-h-11 items-center gap-1 text-base font-semibold text-accent-deep underline-offset-4 hover:underline"
      >
        이 패턴에 대해 AI 에게 묻기
        <IconArrowRight size={18} />
      </Link>
    </Card>
  );
}
