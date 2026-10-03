"use client";

import { AppHeader, Overlap } from "@/components/AppHeader";
import { ChartGate, type ReadyChart } from "@/components/ChartGate";
import { IconArrowRight, IconChat, IconMe, IconSparkle } from "@/components/icons";
import { ElementBars, TenGodBars } from "@/components/saju/Distribution";
import { PatternCardView } from "@/components/saju/PatternCardView";
import { PillarTable } from "@/components/saju/PillarTable";
import { Avatar, Badge, ButtonLink, Card, Collapsible, IconBubble, Notice, SectionTitle } from "@/components/ui";
import { formatLocalDateTime, formatMinutes, GENDER_KO } from "@/lib/format";
import { ELEMENT_PLAIN_KO } from "@/lib/saju/types";

export default function MePage() {
  return <ChartGate>{(s) => <MeView s={s} />}</ChartGate>;
}

const CATEGORY_KO = { self: "기질", balance: "균형", energy: "에너지", social: "관계·역할", cycle: "흐름" } as const;

function MeView({ s }: { s: ReadyChart }) {
  const { chart, patterns, patternsError, profile } = s;
  const r = chart.resolved;
  const name = profile.nickname.trim();
  const firstPattern = patterns?.[0];
  const summary = (patterns ?? []).slice(0, 3);
  const { dominant, missing } = chart.elements;

  return (
    <>
      <AppHeader
        title="나의 결"
        sub={
          <>
            {name ? `${name}님은` : "당신은"} <b className="font-semibold text-white">{chart.dayMaster.nickname}</b>
          </>
        }
        right={<Avatar name={name || chart.dayMaster.ko} />}
      />

      <Overlap>
        {/* 30초 와우 모먼트: 핵심 요약 */}
        <Card className="border-accent-soft bg-[linear-gradient(160deg,#ffffff_0%,#f3effd_100%)]">
          <div className="flex items-center gap-2">
            <IconBubble tone="accent">
              <IconSparkle size={20} />
            </IconBubble>
            <div>
              <h2 className="text-lg font-bold text-ink">내 사주 핵심 요약</h2>
              <p className="text-sm text-ink-mute">일간 {chart.dayMaster.ko} · {chart.strength.label} · 규칙 엔진이 계산</p>
            </div>
          </div>

          {summary.length > 0 ? (
            <ol className="mt-4 space-y-2.5">
              {summary.map((p, i) => (
                <li key={p.id} className="flex gap-3 rounded-2xl bg-white/80 px-3.5 py-3 shadow-sm">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white"
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-accent-deep">{CATEGORY_KO[p.category]}</span>
                    <span className="block text-base font-bold leading-snug text-ink">{p.headline}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">패턴 요약을 준비하지 못했어요. 아래 원국과 분포를 먼저 살펴 주세요.</p>
          )}

          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="원국 요약 태그">
            {dominant.length > 0 && <li><Badge tone="accent">강한 오행 · {dominant.map((e) => ELEMENT_PLAIN_KO[e]).join(", ")}</Badge></li>}
            {missing.length > 0 && <li><Badge>없는 오행 · {missing.map((e) => ELEMENT_PLAIN_KO[e]).join(", ")}</Badge></li>}
            <li>
              <Badge tone="gold">두드러진 십성 · {chart.tenGods.dominantGroup}</Badge>
            </li>
            {!chart.pillars.hour && <li><Badge>시주 생략(시간 미상)</Badge></li>}
          </ul>
          <p className="mt-3 text-xs text-ink-mute">많고 적음은 좋고 나쁨이 아니라 &lsquo;결&rsquo;의 차이예요. 자세한 이유는 아래 카드의 &lsquo;왜?&rsquo;에서 볼 수 있어요.</p>
        </Card>

        <Card>
          <SectionTitle icon={<IconMe size={16} />} sub="왼쪽부터 시·일·월·년. 일주의 위 글자(일간)가 '나'예요.">
            사주 원국
          </SectionTitle>
          <PillarTable chart={chart} />
          <Collapsible label="계산 상세" className="mt-3" buttonClassName="text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-ink-mute">입력</dt>
              <dd>
                {chart.input.date} {chart.input.time ?? "시간 미상"} · {chart.input.placeName ?? "서울"}
                {chart.input.gender ? ` · ${GENDER_KO[chart.input.gender]}` : ""}
              </dd>
              <dt className="text-ink-mute">평균태양시</dt>
              <dd>{formatLocalDateTime(r.solarLocal)}</dd>
              <dt className="text-ink-mute">총 보정</dt>
              <dd>{formatMinutes(r.totalCorrectionMinutes)}</dd>
              <dt className="text-ink-mute">경도 보정</dt>
              <dd>{formatMinutes(r.longitudeCorrectionMinutes)}</dd>
              <dt className="text-ink-mute">당시 표준시</dt>
              <dd>
                UTC+{Math.floor(r.standardOffsetMinutes / 60)}
                {r.standardOffsetMinutes % 60 ? `:${String(r.standardOffsetMinutes % 60).padStart(2, "0")}` : ""}
                {r.dstMinutes ? ` · 서머타임 ${formatMinutes(r.dstMinutes)}` : ""}
              </dd>
              <dt className="text-ink-mute">일주 경계</dt>
              <dd>
                {r.dayBoundaryRule === "zi-23" ? "정자시(23시)" : "자정(0시)"}
                {r.rolledToNextDay ? " · 다음 날 일주 적용" : ""}
              </dd>
              <dt className="text-ink-mute">월 절기</dt>
              <dd>
                {chart.solarTerms.monthTerm.name}({chart.solarTerms.monthTerm.hanja}) 이후
                {chart.solarTerms.nearBoundary ? " · 절기 경계 가까움" : ""}
              </dd>
              <dt className="text-ink-mute">기운의 세기</dt>
              <dd>
                {chart.strength.label} ({chart.strength.score})
              </dd>
            </dl>
            {chart.strength.factors.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-ink-soft">
                {chart.strength.factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
            {chart.luckCycles.note && <p className="mt-2 text-sm text-ink-soft">대운: {chart.luckCycles.note}</p>}
          </Collapsible>
          {chart.warnings.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {chart.warnings.map((w, i) => (
                <li key={i}>
                  <Notice tone="caution">{w}</Notice>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle sub="많고 적음은 좋고 나쁨이 아니라 '결'의 차이예요.">오행 분포</SectionTitle>
          <ElementBars chart={chart} />
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-2 text-base font-bold">십성 그룹</h3>
            <TenGodBars chart={chart} />
          </div>
        </Card>

        <section aria-labelledby="patterns-title" className="space-y-3">
          <h2 id="patterns-title" className="px-1 text-lg font-bold">
            나의 핵심 패턴
          </h2>
          {patternsError && (
            <Notice tone="caution">패턴 카드를 만들지 못했어요. 잠시 후 다시 열어 주세요. ({patternsError})</Notice>
          )}
          {patterns && patterns.length === 0 && <Notice>표시할 패턴이 아직 없어요.</Notice>}
          {patterns?.map((p) => (
            <PatternCardView key={p.id} card={p} facts={chart.facts} />
          ))}
        </section>

        <Card className="bg-night border-night text-white">
          <div className="flex items-center gap-3">
            <IconBubble tone="night">
              <IconChat size={20} />
            </IconBubble>
            <div>
              <p className="text-base font-semibold">궁금한 점이 생겼나요?</p>
              <p className="text-sm text-night-text">패턴을 바탕으로 AI 에게 자유롭게 물어볼 수 있어요.</p>
            </div>
          </div>
          <div className="mt-4">
            <ButtonLink
              block
              href={
                firstPattern
                  ? `/ask?q=${encodeURIComponent(`'${firstPattern.headline}' 패턴을 내 일과 관계에서 어떻게 활용할 수 있을까요?`)}`
                  : "/ask"
              }
            >
              이 패턴에 대해 AI 에게 묻기
              <IconArrowRight size={18} />
            </ButtonLink>
          </div>
        </Card>

        <p className="px-1 pb-2 text-sm text-ink-mute">
          계산은 코드가 하고, 설명은 전통 명리 규칙과 AI 가 생성·보조한 문장이에요. 확정적 예측이 아닙니다.
        </p>
      </Overlap>
    </>
  );
}
