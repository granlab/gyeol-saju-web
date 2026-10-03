"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseJSON, readRaw, subscribe } from "@/lib/storage";
import { kstDateKey } from "@/lib/format";

const noopSubscribe = () => () => {};

/** 클라이언트 하이드레이션 완료 여부. 서버/첫 렌더는 false → 로딩 상태를 그린다 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** localStorage 키 원문 구독 (문자열이라 스냅샷이 안정적) */
export function useStoredRaw(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
}

/** localStorage JSON 구독 + 형태 검증. 실패 시 null */
export function useStoredJSON<T>(key: string, guard: (v: unknown) => v is T): T | null {
  const raw = useStoredRaw(key);
  return useMemo(() => parseJSON(raw, guard), [raw, guard]);
}

function subscribeMinute(cb: () => void) {
  const id = window.setInterval(cb, 60_000);
  const onVis = () => cb();
  document.addEventListener("visibilitychange", onVis);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVis);
  };
}

/** 오늘 날짜 키(KST, 'YYYY-MM-DD'). 자정이 지나면 갱신. 서버에서는 '' */
export function useTodayKey(): string {
  return useSyncExternalStore(
    subscribeMinute,
    () => kstDateKey(Date.now()),
    () => "",
  );
}
