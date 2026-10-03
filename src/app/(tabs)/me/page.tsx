"use client";

import { ChartGate, type ReadyChart } from "@/components/ChartGate";
import { ElementBars, TenGodBars } from "@/components/saju/Distribution";
import { PatternCardView } from "@/components/saju/PatternCardView";
import { PillarTable } from "@/components/saju/PillarTable";
import { ButtonLink, Card, Collapsible, Notice, PageHeader, SectionTitle } from "@/components/ui";
import { formatLocalDateTime, formatMinutes, GENDER_KO } from "@/lib/format";

export default function MePage() {
  return <ChartGate>{(s) => <MeView s={s} />}</ChartGate>;
}

function MeView({ s }: { s: ReadyChart }) {
  const { chart, patterns, patternsError, profile } = s;
  const r = chart.resolved;
  const name = profile.nickname.trim();
  const firstPattern = patterns?.[0];

  return (
    <>
      <PageHeader
        title="나의 결"
        sub={
          <>
            {name ? `${name}님은` : "당신은"} <b className="text-ink">{chart.dayMaster.nickname}</b>
          </>
        }
      />

      <div className="space-y-5 px-5">
        <Card>
          <SectionTitle sub="왼쪽부터 시·일·월·년. 일주의 위 글자(일간)가 '나'예요.">사주 원국</SectionTitle>
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

        <Card className="bg-accent-soft/60">
          <p className="text-base font-semibold text-ink">궁금한 점이 생겼나요?</p>
          <p className="mt-1 text-sm text-ink-soft">패턴을 바탕으로 AI 에게 자유롭게 물어볼 수 있어요.</p>
          <div className="mt-3">
            <ButtonLink
              block
              href={
                firstPattern
                  ? `/ask?q=${encodeURIComponent(`'${firstPattern.headline}' 패턴을 내 일과 관계에서 어떻게 활용할 수 있을까요?`)}`
                  : "/ask"
              }
            >
              이 패턴에 대해 AI 에게 묻기
            </ButtonLink>
          </div>
        </Card>

        <p className="px-1 pb-2 text-sm text-ink-mute">
          계산은 코드가 하고, 설명은 전통 명리 규칙과 AI 가 생성·보조한 문장이에요. 확정적 예측이 아닙니다.
        </p>
      </div>
    </>
  );
}
