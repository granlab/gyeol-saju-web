"use client";

import { useMemo, useState } from "react";
import { AppHeader, Overlap, SegmentedTabs } from "@/components/AppHeader";
import { ChartGate, ErrorView, type ReadyChart } from "@/components/ChartGate";
import { IconBriefcase, IconCheck, IconHeart, IconLeaf, IconMoon, IconSparkle, IconToday } from "@/components/icons";
import { ScoreRing } from "@/components/ScoreRing";
import { WhyChain } from "@/components/saju/WhyChain";
import { Badge, Button, ButtonLink, Card, IconBubble, cx } from "@/components/ui";
import { useToday } from "@/lib/hooks/useToday";
import { clamp, formatDateKo } from "@/lib/format";
import { deriveToday } from "@/lib/saju";
import type { TodayFlow } from "@/lib/saju/types";

export default function TodayPage() {
  return <ChartGate>{(s) => <TodayGate s={s} />}</ChartGate>;
}

function TodayGate({ s }: { s: ReadyChart }) {
  if (!s.today) {
    if (!s.todayKey) return null;
    return (
      <ErrorView title="오늘의 흐름을 계산하지 못했어요" message={s.todayError ?? undefined}>
        <ButtonLink href="/me" variant="secondary">
          나의 결 보기
        </ButtonLink>
      </ErrorView>
    );
  }
  return <TodayView s={s} today={s.today} />;
}

type AreaKey = keyof TodayFlow["scores"];

/** 영역 표기 — 엔진의 관계/일/나 를 3분할 컬러 카드로 */
const AREAS: Array<{
  key: AreaKey;
  label: string;
  sub: string;
  Icon: typeof IconHeart;
  tone: "love" | "work" | "mind";
  card: string;
  num: string;
}> = [
  { key: "relation", label: "관계", sub: "연애·사람", Icon: IconHeart, tone: "love", card: "bg-love-soft", num: "text-love" },
  { key: "work", label: "일", sub: "직장·공부", Icon: IconBriefcase, tone: "work", card: "bg-work-soft", num: "text-work" },
  { key: "self", label: "나", sub: "감정·컨디션", Icon: IconLeaf, tone: "mind", card: "bg-mind-soft", num: "text-mind" },
];

/** 점수대별 한 줄 — '주의 배분' 관점(높을수록 마음을 더 두는 영역) */
function bandCaption(v: number): string {
  if (v >= 70) return "마음을 더 두세요";
  if (v >= 50) return "평소대로 괜찮아요";
  return "가볍게 지나가요";
}

function topArea(scores: TodayFlow["scores"]): (typeof AREAS)[number] {
  let best = AREAS[0];
  for (const a of AREAS) if (scores[a.key] > scores[best.key]) best = a;
  return best;
}

const SCORE_NOTE = "점수는 예측이 아니라 오늘 어디에 주의를 더 둘지 알려 주는 '주의 배분 지표'예요.";

function TodayView({ s, today }: { s: ReadyChart; today: TodayFlow }) {
  const [view, setView] = useState<"today" | "week">("today");
  const name = s.profile.nickname.trim();

  return (
    <>
      <AppHeader
        title={
          <>
            {name ? `${name}님,` : "안녕하세요,"}
            <span className="mt-0.5 flex items-center gap-1.5 text-lg font-semibold">
              오늘도 좋은 결이 흐르길 바라요
              <IconSparkle size={18} className="shrink-0 text-gold" />
            </span>
          </>
        }
      >
        <SegmentedTabs
          ariaLabel="홈 보기 전환"
          value={view}
          onSelect={(k) => setView(k === "week" ? "week" : "today")}
          items={[
            { key: "today", label: "오늘의 결" },
            { key: "week", label: "주간" },
            { key: "ask", label: "AI 상담", href: "/ask" },
          ]}
        />
      </AppHeader>

      <Overlap>
        {view === "today" ? <TodayCards s={s} today={today} /> : <WeekView s={s} today={today} />}

        <p className="px-1 pb-2 text-sm text-ink-mute">
          오늘의 흐름은 규칙 기반으로 계산했고, 문장은 AI 가 생성·보조할 수 있어요. 전통 명리 관점의 해석이며 확정적 예측이
          아닙니다.
        </p>
      </Overlap>
    </>
  );
}

function TodayCards({ s, today }: { s: ReadyChart; today: TodayFlow }) {
  const { record, setActionDone, setFeedback } = useToday(today.date);
  const facts = [...today.facts, ...s.chart.facts];
  const luck = today.currentLuck;
  const top = topArea(today.scores);
  const topValue = Math.round(clamp(today.scores[top.key], 0, 100));

  return (
    <>
      {/* 오늘의 결 + 점수 링 */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <IconBubble tone="gold">
                <IconToday size={20} />
              </IconBubble>
              <div>
                <h2 className="text-lg font-bold text-ink">오늘의 결</h2>
                <p className="text-sm text-ink-mute">
                  {formatDateKo(today.date)}
                  <br />
                  일진{" "}
                  <b className="font-semibold text-ink-soft" lang="zh-Hant">
                    {today.dayGanzhi.name}
                  </b>
                  ({today.dayGanzhi.nameKo}) · {today.dayTenGod}의 날
                </p>
              </div>
            </div>
            <p className="mt-4 text-xl font-bold leading-snug text-ink">{today.headline}</p>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <ScoreRing value={topValue} label={`${top.label} 주의 배분 ${topValue} (가장 높은 영역)`} />
            <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", top.card, top.num)}>초점 · {top.label}</span>
          </div>
        </div>
        <WhyChain
          pill
          label="자세히 보기"
          leading={SCORE_NOTE}
          why={{ structure: today.why.structure, rule: today.why.rule, caveat: today.why.caveat, factIds: today.why.factIds }}
          facts={facts}
        />
      </Card>

      {/* AI 코치의 오늘 한마디 (규칙 기반 행동 한 가지) */}
      <Card className="border-accent-soft bg-accent-soft/70">
        <div className="flex gap-3">
          <IconBubble tone="accent" className="h-11 w-11 bg-white text-accent-deep shadow-sm">
            <IconMoon size={22} />
          </IconBubble>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="text-base font-bold text-ink">AI 코치의 오늘 한마디</h2>
              <Badge tone="accent">규칙 기반 · AI 보조</Badge>
            </div>
            <p className="mt-1.5 text-base leading-relaxed text-ink">
              오늘 딱 한 가지, <b>{today.action.text}</b>. 10분이면 충분해요.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={record.actionDone}
                onClick={() => setActionDone(!record.actionDone, today.action.id)}
                className={cx(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
                  record.actionDone ? "bg-accent text-white" : "bg-white text-accent-deep shadow-sm hover:bg-accent/10",
                )}
              >
                <IconCheck size={16} />
                {record.actionDone ? "했어요" : "했으면 체크"}
              </button>
              <ButtonLink
                variant="ghost"
                className="min-h-10 px-3 text-sm"
                href={`/ask?q=${encodeURIComponent(`오늘 '${today.headline}'라는 흐름을 어떻게 활용하면 좋을까요?`)}`}
              >
                AI 에게 더 묻기 →
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>

      {/* 관계 / 일 / 나 3분할 */}
      <section aria-label="오늘의 주의 배분">
        <ul className="grid grid-cols-3 gap-2.5">
          {AREAS.map((a) => {
            const v = Math.round(clamp(today.scores[a.key], 0, 100));
            return (
              <li
                key={a.key}
                className={cx("flex flex-col items-center rounded-3xl px-2 pb-4 pt-4 text-center shadow-card", a.card)}
              >
                <IconBubble tone={a.tone}>
                  <a.Icon size={20} />
                </IconBubble>
                <p className="mt-2 text-sm font-bold text-ink">{a.label}</p>
                <p className="text-[0.65rem] text-ink-mute">{a.sub}</p>
                <p
                  className={cx("mt-1 text-2xl font-bold tabular-nums", a.num)}
                  role="meter"
                  aria-label={`${a.label} 주의 배분 ${v}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={v}
                >
                  {v}
                </p>
                <p className="mt-1 text-xs leading-snug text-ink-soft">{bandCaption(v)}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 px-1 text-xs text-ink-mute">{SCORE_NOTE}</p>
      </section>

      {/* 30초 피드백 */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-ink">30초 피드백</h2>
            <p className="text-sm text-ink-mute">오늘의 한 문장이 내 하루와 맞았나요?</p>
          </div>
          <div className="flex shrink-0 gap-1.5" role="group" aria-label="오늘의 흐름 피드백">
            <Button
              variant={record.feedback === "yes" ? "night" : "secondary"}
              className="min-h-10 px-4 text-sm"
              aria-pressed={record.feedback === "yes"}
              onClick={() => setFeedback(record.feedback === "yes" ? null : "yes")}
            >
              맞아요
            </Button>
            <Button
              variant={record.feedback === "meh" ? "night" : "secondary"}
              className="min-h-10 px-4 text-sm"
              aria-pressed={record.feedback === "meh"}
              onClick={() => setFeedback(record.feedback === "meh" ? null : "meh")}
            >
              글쎄요
            </Button>
          </div>
        </div>
        {record.feedback && (
          <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-accent-deep" aria-live="polite">
            <IconCheck size={18} /> 기록했어요. 이 브라우저에만 저장돼요.
          </p>
        )}
      </Card>

      {luck && (
        <Card>
          <p className="text-sm font-semibold text-ink-soft">지금의 10년 흐름</p>
          <p className="mt-1 text-xl font-bold">
            <span lang="zh-Hant">{luck.ganzhi.name}</span>
            <span className="ml-1 text-base font-normal text-ink-soft">({luck.ganzhi.nameKo})</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {luck.startAge}~{luck.endAge}세 ({luck.startYear}년~) · 천간 {luck.stemTenGod} · 지지 {luck.branchTenGod}
          </p>
        </Card>
      )}
    </>
  );
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

/** 오늘부터 7일 — 같은 규칙 엔진으로 날짜만 바꿔 계산(결정적) */
function WeekView({ s, today }: { s: ReadyChart; today: TodayFlow }) {
  const days = useMemo(() => {
    const out: Array<{ flow: TodayFlow | null; date: string; error?: string }> = [];
    const base = new Date(`${today.date}T12:00:00+09:00`);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getTime() + i * 86_400_000);
      const date = new Date(d.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
      try {
        out.push({ flow: deriveToday(s.chart, d), date });
      } catch (e) {
        out.push({ flow: null, date, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return out;
  }, [s.chart, today.date]);

  return (
    <Card>
      <div className="flex items-center gap-2">
        <IconBubble tone="gold">
          <IconToday size={20} />
        </IconBubble>
        <div>
          <h2 className="text-lg font-bold text-ink">이번 주 흐름</h2>
          <p className="text-sm text-ink-mute">오늘부터 7일 · 같은 규칙으로 계산한 주의 배분</p>
        </div>
      </div>
      <ol className="mt-4 divide-y divide-line">
        {days.map(({ flow, date, error }, i) => {
          const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
          const wd = m ? WEEKDAY[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()] : "";
          const isToday = i === 0;
          return (
            <li key={date} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div
                className={cx(
                  "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl text-xs font-semibold",
                  isToday ? "bg-night text-white" : "bg-paper-deep text-ink-soft",
                )}
              >
                <span>{wd}</span>
                <span className="text-base font-bold tabular-nums">{m ? Number(m[3]) : ""}</span>
              </div>
              <div className="min-w-0 flex-1">
                {flow ? (
                  <>
                    <p className="text-sm text-ink-mute">
                      {isToday && <span className="mr-1 font-semibold text-accent-deep">오늘</span>}
                      일진 <span lang="zh-Hant">{flow.dayGanzhi.name}</span> · {flow.dayTenGod}
                    </p>
                    <p className="mt-0.5 text-base font-semibold leading-snug text-ink">{flow.headline}</p>
                    <ul className="mt-1.5 flex gap-1.5" aria-label="주의 배분">
                      {AREAS.map((a) => {
                        const v = Math.round(clamp(flow.scores[a.key], 0, 100));
                        return (
                          <li
                            key={a.key}
                            className={cx("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", a.card, a.num)}
                          >
                            {a.label} {v}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-caution">계산하지 못했어요. {error}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs text-ink-mute">{SCORE_NOTE} 주간 흐름도 오늘과 같은 규칙으로 날짜만 바꿔 계산해요.</p>
    </Card>
  );
}
