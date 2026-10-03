"use client";

import { useId } from "react";
import { ChartGate, ErrorView, type ReadyChart } from "@/components/ChartGate";
import { IconCheck } from "@/components/icons";
import { WhyChain } from "@/components/saju/WhyChain";
import { Bar, Button, ButtonLink, Card, PageHeader, cx } from "@/components/ui";
import { useToday } from "@/lib/hooks/useToday";
import { clamp, formatDateKo } from "@/lib/format";
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

const SCORE_ROWS: Array<{ key: keyof TodayFlow["scores"]; label: string }> = [
  { key: "relation", label: "관계" },
  { key: "work", label: "일" },
  { key: "self", label: "나" },
];

function TodayView({ s, today }: { s: ReadyChart; today: TodayFlow }) {
  const { record, setActionDone, setFeedback } = useToday(today.date);
  const checkId = useId();
  const facts = [...today.facts, ...s.chart.facts];
  const luck = today.currentLuck;

  return (
    <>
      <PageHeader
        title="오늘의 결"
        sub={
          <>
            {formatDateKo(today.date)} · 일진{" "}
            <b className="text-ink" lang="zh-Hant">
              {today.dayGanzhi.name}
            </b>
            ({today.dayGanzhi.nameKo})
          </>
        }
      />

      <div className="space-y-5 px-5">
        <Card>
          <p className="text-sm font-semibold text-ink-soft">
            오늘의 한 문장 <span className="ml-1 font-normal text-ink-mute">· {today.dayTenGod}의 날</span>
          </p>
          <h2 className="mt-1 text-2xl font-bold leading-snug text-ink">{today.headline}</h2>

          <ul className="mt-5 space-y-3">
            {SCORE_ROWS.map(({ key, label }) => {
              const v = Math.round(clamp(today.scores[key], 0, 100));
              return (
                <li key={key} className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3">
                  <span className="text-base font-semibold">{label}</span>
                  <Bar value={v} colorClass="bg-accent" label={`${label} 주의 배분 ${v}`} />
                  <span className="text-right text-base font-semibold tabular-nums">{v}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm text-ink-mute">
            점수는 예측이 아니라 오늘 어디에 주의를 더 둘지 알려 주는 &lsquo;주의 배분 지표&rsquo;예요.
          </p>

          <WhyChain
            label="왜 이런 흐름인가요?"
            why={{ structure: today.why.structure, rule: today.why.rule, caveat: today.why.caveat, factIds: today.why.factIds }}
            facts={facts}
          />
        </Card>

        <Card>
          <h2 className="text-lg font-bold">오늘의 행동</h2>
          <label
            htmlFor={checkId}
            className={cx(
              "mt-3 flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3",
              record.actionDone ? "border-accent bg-accent-soft" : "border-line bg-white",
            )}
          >
            <input
              id={checkId}
              type="checkbox"
              className="h-6 w-6 shrink-0 accent-accent"
              checked={record.actionDone}
              onChange={(e) => setActionDone(e.target.checked, today.action.id)}
            />
            <span className={cx("text-base", record.actionDone ? "text-ink-soft line-through" : "text-ink")}>
              {today.action.text}
            </span>
          </label>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-base font-semibold">30초 피드백</p>
            <p className="text-sm text-ink-mute">오늘의 한 문장이 내 하루와 맞았나요?</p>
            <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="오늘의 흐름 피드백">
              <Button
                variant={record.feedback === "yes" ? "primary" : "secondary"}
                aria-pressed={record.feedback === "yes"}
                onClick={() => setFeedback(record.feedback === "yes" ? null : "yes")}
              >
                맞아요
              </Button>
              <Button
                variant={record.feedback === "meh" ? "primary" : "secondary"}
                aria-pressed={record.feedback === "meh"}
                onClick={() => setFeedback(record.feedback === "meh" ? null : "meh")}
              >
                글쎄요
              </Button>
            </div>
            {record.feedback && (
              <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-accent-deep" aria-live="polite">
                <IconCheck size={18} /> 기록했어요. 이 브라우저에만 저장돼요.
              </p>
            )}
          </div>
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

        <ButtonLink
          href={`/ask?q=${encodeURIComponent(`오늘 '${today.headline}'라는 흐름을 어떻게 활용하면 좋을까요?`)}`}
          variant="secondary"
          block
        >
          오늘 흐름에 대해 AI 에게 묻기
        </ButtonLink>

        <p className="px-1 pb-2 text-sm text-ink-mute">
          오늘의 흐름은 규칙 기반으로 계산했고, 문장은 AI 가 생성·보조할 수 있어요. 전통 명리 관점의 해석이며 확정적 예측이
          아닙니다.
        </p>
      </div>
    </>
  );
}
