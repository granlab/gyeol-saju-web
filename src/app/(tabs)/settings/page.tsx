"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LoadingView } from "@/components/ChartGate";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button, ButtonLink, Card, Collapsible, PageHeader, SectionTitle, Switch, cx } from "@/components/ui";
import { useProfile } from "@/lib/hooks/useProfile";
import { AI_DISCLOSURE, KOREA_HOTLINES } from "@/lib/ai/types";
import { clearAll, dumpAll, storageSignature, subscribe } from "@/lib/storage";
import { GENDER_KO } from "@/lib/format";
import type { EngineOptions } from "@/lib/saju/types";

const BOUNDARY_OPTIONS: Array<{ value: EngineOptions["dayBoundary"]; label: string; desc: string }> = [
  { value: "zi-23", label: "정자시 (23시 기준)", desc: "보정 후 밤 11시부터 다음 날 일주로 봐요. 기본값." },
  { value: "midnight", label: "자정 (0시 기준)", desc: "달력 날짜가 바뀌는 자정을 기준으로 봐요." },
];

function DataDump() {
  // 저장소가 바뀔 때마다 서명이 바뀌어 다시 그린다
  const sig = useSyncExternalStore(subscribe, storageSignature, () => "");
  const json = sig ? JSON.stringify(dumpAll(), null, 2) : "";
  return (
    <pre className="max-h-80 overflow-auto rounded-2xl bg-ink p-4 text-xs leading-relaxed text-paper">
      {json && json !== "{}" ? json : "저장된 데이터가 없어요."}
    </pre>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { hydrated, profile, settings, updateProfile, updateSettings } = useProfile();
  const [dialog, setDialog] = useState<null | "reset" | "delete">(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!hydrated) return <LoadingView />;

  function wipeAndGoHome() {
    clearAll();
    setDialog(null);
    router.replace("/");
  }

  const b = profile?.birth;

  return (
    <>
      <PageHeader title="설정 · 데이터" sub="내 데이터는 이 브라우저에만 있어요." />
      <div className="space-y-5 px-5">
        <Card>
          <SectionTitle>프로필</SectionTitle>
          {profile && b ? (
            <>
              <dl className="grid grid-cols-[5rem_1fr] gap-y-1.5 text-base">
                <dt className="text-ink-mute">별칭</dt>
                <dd>{profile.nickname || "(없음)"}</dd>
                <dt className="text-ink-mute">생년월일</dt>
                <dd>{b.date} (양력)</dd>
                <dt className="text-ink-mute">시간</dt>
                <dd>{b.time ?? "모름 (시주 없이 계산)"}</dd>
                <dt className="text-ink-mute">출생지</dt>
                <dd>{b.placeName ?? "서울"}</dd>
                <dt className="text-ink-mute">성별</dt>
                <dd>{b.gender ? GENDER_KO[b.gender] : "선택 안 함"}</dd>
              </dl>
              <div className="mt-4">
                <Button variant="secondary" block onClick={() => setDialog("reset")}>
                  다시 입력하기
                </Button>
              </div>
            </>
          ) : (
            <div>
              <p className="text-ink-soft">아직 입력된 정보가 없어요.</p>
              <div className="mt-3">
                <ButtonLink href="/">시작하기</ButtonLink>
              </div>
            </div>
          )}
        </Card>

        {profile && (
          <Card>
            <SectionTitle>AI 사용</SectionTitle>
            <Switch
              checked={profile.aiEnabled}
              onChange={(v) => {
                if (!updateProfile({ aiEnabled: v })) setNotice("저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.");
              }}
              label="AI 질문 기능"
              description="켜면 질문할 때 출생 입력(생년월일시·출생지)과 계산 결과, 질문이 이 앱의 서버로 전송돼요(서버는 저장하지 않고 다시 계산만 해요). API 키가 있으면 설명 요청이 Anthropic API 로 나가요. 끄면 묻기 화면이 비활성화돼요."
            />
          </Card>
        )}

        <Card>
          <SectionTitle sub="바꾸면 바로 다시 계산해요.">계산 옵션 · 일주 경계</SectionTitle>
          <fieldset>
            <legend className="sr-only">일주 경계 규칙</legend>
            <div className="space-y-2">
              {BOUNDARY_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={cx(
                    "flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3",
                    settings.dayBoundary === o.value ? "border-accent bg-accent-soft" : "border-line bg-white",
                  )}
                >
                  <input
                    type="radio"
                    name="dayBoundary"
                    value={o.value}
                    checked={settings.dayBoundary === o.value}
                    onChange={() => {
                      if (!updateSettings({ dayBoundary: o.value })) setNotice("저장하지 못했어요.");
                    }}
                    className="mt-1 h-5 w-5 shrink-0 accent-accent"
                  />
                  <span>
                    <span className="block text-base font-semibold">{o.label}</span>
                    <span className="block text-sm text-ink-mute">{o.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-2 text-sm text-ink-mute">밤 11시~자정 사이에 태어난 경우에만 결과가 달라질 수 있어요.</p>
        </Card>

        {notice && (
          <p className="rounded-2xl bg-caution-soft px-4 py-3 text-sm text-caution" role="alert">
            {notice}
          </p>
        )}

        <Card>
          <SectionTitle sub="모든 데이터는 이 브라우저의 localStorage 에만 있어요. 서버에 저장하지 않아요.">
            내 데이터
          </SectionTitle>
          <Collapsible label="내 데이터 보기 (JSON)">
            <DataDump />
          </Collapsible>
          <div className="mt-3">
            <Button variant="danger" block onClick={() => setDialog("delete")}>
              모든 데이터 삭제
            </Button>
          </div>
        </Card>

        <Card>
          <SectionTitle>고지 · 원칙</SectionTitle>
          <div className="space-y-3 text-sm leading-relaxed text-ink-soft">
            <p>
              <b className="text-ink">AI 생성 고지.</b> {AI_DISCLOSURE}
            </p>
            <p>
              <b className="text-ink">계산과 설명의 분리.</b> 사주 계산(만세력·절기·시간 보정)은 정해진 규칙의 코드가 하고, AI 는
              그 결과를 설명만 해요. AI 가 사주를 계산하거나 바꾸지 않아요.
            </p>
            <p>
              <b className="text-ink">예측이 아닙니다.</b> 모든 해석은 전통 명리 관점의 설명이며 미래를 확정하지 않아요. 점수는
              주의를 어디에 둘지 돕는 지표예요.
            </p>
            <p>
              <b className="text-ink">다루지 않는 주제.</b> 질병·건강, 사망·수명, 임신·출산, 범죄, 법률·소송, 투자·도박, 채용·인사
              결정은 사주를 근거로 판단하지 않아요. 해당 분야 전문가와 상의해 주세요.
            </p>
            <p>
              <b className="text-ink">위기 상황이라면.</b> 혼자 견디기 어려운 마음이 들면 지금 바로 연락해 주세요.
            </p>
            <ul className="space-y-1">
              {KOREA_HOTLINES.map((h) => (
                <li key={h.number}>
                  <a
                    href={`tel:${h.number.replace(/[^0-9]/g, "")}`}
                    className="inline-flex min-h-11 items-center font-semibold text-safety underline underline-offset-2"
                  >
                    {h.name} {h.number}
                  </a>
                  {h.note && <span className="ml-1 text-ink-mute">({h.note})</span>}
                </li>
              ))}
            </ul>
            <p className="rounded-2xl bg-paper-deep px-4 py-3 text-ink">
              목업 프로토타입 · 서버 저장 없음 · 광고·결제 없음
            </p>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={dialog === "reset"}
        title="처음부터 다시 입력할까요?"
        confirmLabel="삭제하고 다시 입력"
        danger
        onClose={() => setDialog(null)}
        onConfirm={wipeAndGoHome}
      >
        기존 프로필, 계산 결과, 대화, 오늘의 기록이 모두 삭제돼요. 되돌릴 수 없어요.
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "delete"}
        title="모든 데이터를 삭제할까요?"
        confirmLabel="모두 삭제"
        danger
        onClose={() => setDialog(null)}
        onConfirm={wipeAndGoHome}
      >
        이 브라우저에 저장된 결(結)의 모든 데이터(프로필·계산 캐시·대화·기록·설정)가 삭제되고 첫 화면으로 돌아가요.
      </ConfirmDialog>
    </>
  );
}
