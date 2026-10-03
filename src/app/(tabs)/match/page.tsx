"use client";

import { AppHeader, Overlap } from "@/components/AppHeader";
import { IconArrowRight, IconHeart, IconLock, IconSparkle, IconUsers } from "@/components/icons";
import { ButtonLink, Card, IconBubble, SoonBadge } from "@/components/ui";

/**
 * 궁합·커뮤니티·매칭은 구현 범위 밖 — 기능 자리만 '준비 중'으로 알린다(가짜 데이터·가짜 점수 없음).
 */
const SOON = [
  {
    Icon: IconHeart,
    title: "궁합 리포트",
    desc: "연인·친구·가족·동료 등 두 사람의 결이 어떻게 만나는지 설명해요.",
  },
  {
    Icon: IconUsers,
    title: "익명 커뮤니티",
    desc: "사주·연애·일상 고민을 나누는 안전한 공간.",
  },
  {
    Icon: IconSparkle,
    title: "운명의 짝 매칭",
    desc: "가치관 기반의 건강한 인연 연결. 안전 설계를 먼저 갖춘 뒤 열어요.",
  },
];

export default function MatchPage() {
  return (
    <>
      <AppHeader title="궁합" sub="두 사람의 결이 만나는 자리 · 준비 중이에요." />
      <Overlap>
        <Card className="text-center">
          <IconBubble tone="accent" className="mx-auto h-14 w-14 rounded-full">
            <IconLock size={26} />
          </IconBubble>
          <h2 className="mt-3 text-lg font-bold text-ink">아직 열리지 않은 기능이에요</h2>
          <p className="mt-1 text-sm text-ink-soft">
            지금은 나의 결·오늘의 결·AI 상담에 집중하고 있어요. 아래 기능은 안전 설계를 갖춘 뒤 순서대로 열 예정이에요.
          </p>
        </Card>

        <ul className="space-y-3" aria-label="준비 중인 기능">
          {SOON.map(({ Icon, title, desc }) => (
            <li key={title}>
              <Card as="article" className="flex items-start gap-3">
                <IconBubble tone="accent">
                  <Icon size={20} />
                </IconBubble>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-ink">{title}</h3>
                    <SoonBadge />
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{desc}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <ButtonLink href="/ask" variant="secondary" block>
          대신 AI 상담에서 관계 질문하기
          <IconArrowRight size={18} />
        </ButtonLink>
      </Overlap>
    </>
  );
}
