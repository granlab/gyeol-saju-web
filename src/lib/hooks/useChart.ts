"use client";

import { useEffect, useMemo } from "react";
import { computeChart, derivePatterns, deriveToday } from "@/lib/saju";
import type { PatternCard, SajuChart, TodayFlow } from "@/lib/saju/types";
import {
  KEYS,
  chartInputKey,
  isChartCache,
  readJSON,
  toEngineInput,
  writeJSON,
  type ChartCache,
  type StoredProfile,
  type StoredSettings,
} from "@/lib/storage";
import { errorMessage } from "@/lib/format";
import { useProfile } from "./useProfile";
import { useTodayKey } from "./useStore";

export type ChartState =
  | { status: "loading" }
  | { status: "no-profile" }
  | { status: "error"; profile: StoredProfile; settings: StoredSettings; error: string }
  | {
      status: "ready";
      profile: StoredProfile;
      settings: StoredSettings;
      chart: SajuChart;
      /** derivePatterns 실패 시 null + patternsError */
      patterns: PatternCard[] | null;
      patternsError: string | null;
      /** deriveToday 실패 시 null + todayError */
      today: TodayFlow | null;
      todayError: string | null;
      todayKey: string;
    };

/**
 * 프로필 → computeChart / derivePatterns / deriveToday 메모.
 * 엔진은 결정적이고 가벼우므로 매번 계산하고, 결과는 gyeol:chart 에 캐시(데이터 보기·AI 컨텍스트 확인용).
 * engineVersion 또는 입력 지문이 다르면 캐시를 덮어쓴다.
 */
export function useChart(): ChartState {
  const { hydrated, profile, settings } = useProfile();
  const todayKey = useTodayKey();

  const computed = useMemo(() => {
    if (!profile) return null;
    const input = toEngineInput(profile, settings);
    let chart: SajuChart;
    try {
      chart = computeChart(input);
    } catch (e) {
      return { ok: false as const, error: errorMessage(e) };
    }
    let patterns: PatternCard[] | null = null;
    let patternsError: string | null = null;
    try {
      patterns = derivePatterns(chart);
    } catch (e) {
      patternsError = errorMessage(e);
    }
    let today: TodayFlow | null = null;
    let todayError: string | null = null;
    if (todayKey) {
      try {
        // 정오(KST)로 고정해 날짜 경계 흔들림 방지
        today = deriveToday(chart, new Date(`${todayKey}T12:00:00+09:00`));
      } catch (e) {
        todayError = errorMessage(e);
      }
    }
    return { ok: true as const, chart, inputKey: chartInputKey(input), patterns, patternsError, today, todayError };
  }, [profile, settings, todayKey]);

  // 캐시 갱신 (부수효과는 effect 에서)
  useEffect(() => {
    if (!computed || !computed.ok) return;
    const cached = readJSON(KEYS.chart, isChartCache);
    if (
      cached &&
      cached.engineVersion === computed.chart.engineVersion &&
      cached.inputKey === computed.inputKey
    ) {
      return;
    }
    const next: ChartCache = {
      inputKey: computed.inputKey,
      engineVersion: computed.chart.engineVersion,
      savedAt: new Date().toISOString(),
      chart: computed.chart,
    };
    writeJSON(KEYS.chart, next);
  }, [computed]);

  if (!hydrated) return { status: "loading" };
  if (!profile) return { status: "no-profile" };
  if (!computed || !computed.ok) {
    return { status: "error", profile, settings, error: computed?.error ?? "알 수 없는 오류" };
  }
  return {
    status: "ready",
    profile,
    settings,
    chart: computed.chart,
    patterns: computed.patterns,
    patternsError: computed.patternsError,
    today: computed.today,
    todayError: computed.todayError,
    todayKey,
  };
}
