"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useChart, type ChartState } from "@/lib/hooks/useChart";
import { ButtonLink, Card } from "./ui";

export type ReadyChart = Extract<ChartState, { status: "ready" }>;

export function LoadingView({ label = "불러오는 중이에요" }: { label?: string }) {
  return (
    <div className="space-y-4 px-5 py-6" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-7 w-40 animate-pulse rounded-lg bg-paper-deep" />
      <div className="h-36 animate-pulse rounded-3xl bg-paper-deep" />
      <div className="h-24 animate-pulse rounded-3xl bg-paper-deep" />
    </div>
  );
}

export function ErrorView({ title, message, children }: { title: string; message?: string; children?: ReactNode }) {
  return (
    <div className="px-5 py-6">
      <Card className="border-caution/30 bg-caution-soft/60" role="alert">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 text-base text-ink-soft">
          입력하신 정보는 그대로 저장되어 있어요. 잠시 후 다시 시도하거나 설정에서 입력값을 확인해 주세요.
        </p>
        {message && (
          <details className="mt-3 text-sm text-ink-mute">
            <summary className="min-h-11 cursor-pointer py-2">오류 상세</summary>
            <code className="block whitespace-pre-wrap break-all rounded-xl bg-white/70 p-3">{message}</code>
          </details>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {children ?? <ButtonLink href="/settings" variant="secondary">설정으로 가기</ButtonLink>}
        </div>
      </Card>
    </div>
  );
}

/** 프로필 없음 → 온보딩으로 replace. 로딩/계산 오류 상태를 일관되게 처리한다. */
export function ChartGate({ children }: { children: (s: ReadyChart) => ReactNode }) {
  const state = useChart();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "no-profile") router.replace("/");
  }, [state.status, router]);

  if (state.status === "loading") return <LoadingView />;
  if (state.status === "no-profile") {
    return (
      <div className="px-5 py-6">
        <Card>
          <h2 className="text-lg font-bold">아직 입력된 정보가 없어요</h2>
          <p className="mt-2 text-ink-soft">처음 화면으로 이동하고 있어요. 2분이면 시작할 수 있어요.</p>
          <div className="mt-4">
            <ButtonLink href="/">시작하기</ButtonLink>
          </div>
        </Card>
      </div>
    );
  }
  if (state.status === "error") {
    return <ErrorView title="사주를 계산하지 못했어요" message={state.error} />;
  }
  return <>{children(state)}</>;
}
