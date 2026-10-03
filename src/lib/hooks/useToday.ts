"use client";

import { useCallback } from "react";
import { EMPTY_TODAY, KEYS, isTodayRecord, readJSON, writeJSON, type TodayRecord } from "@/lib/storage";
import { useStoredJSON } from "./useStore";

/** 날짜별 '오늘의 행동' 체크와 30초 피드백 (gyeol:today:YYYY-MM-DD) */
export function useToday(date: string) {
  const key = KEYS.today(date || "unknown");
  const record = useStoredJSON(key, isTodayRecord) ?? EMPTY_TODAY;

  const update = useCallback(
    (patch: Partial<TodayRecord>) => {
      if (!date) return false;
      const cur = readJSON(key, isTodayRecord) ?? EMPTY_TODAY;
      return writeJSON(key, { ...cur, ...patch, updatedAt: new Date().toISOString() });
    },
    [date, key],
  );

  const setActionDone = useCallback(
    (done: boolean, actionId?: string) => update({ actionDone: done, actionId }),
    [update],
  );
  const setFeedback = useCallback((feedback: TodayRecord["feedback"]) => update({ feedback }), [update]);

  return { record, setActionDone, setFeedback };
}
