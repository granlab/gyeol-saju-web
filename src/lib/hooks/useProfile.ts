"use client";

import { useCallback } from "react";
import {
  DEFAULT_SETTINGS,
  KEYS,
  isProfile,
  isSettings,
  readJSON,
  writeJSON,
  type StoredProfile,
  type StoredSettings,
} from "@/lib/storage";
import { useHydrated, useStoredJSON } from "./useStore";

export interface UseProfile {
  /** false 면 아직 localStorage 를 읽기 전(로딩) */
  hydrated: boolean;
  profile: StoredProfile | null;
  settings: StoredSettings;
  saveProfile: (p: StoredProfile) => boolean;
  updateProfile: (patch: Partial<Omit<StoredProfile, "birth" | "consent">>) => boolean;
  updateSettings: (patch: Partial<StoredSettings>) => boolean;
}

export function useProfile(): UseProfile {
  const hydrated = useHydrated();
  const profile = useStoredJSON(KEYS.profile, isProfile);
  const settings = useStoredJSON(KEYS.settings, isSettings) ?? DEFAULT_SETTINGS;

  const saveProfile = useCallback((p: StoredProfile) => writeJSON(KEYS.profile, p), []);

  const updateProfile = useCallback((patch: Partial<Omit<StoredProfile, "birth" | "consent">>) => {
    const cur = readJSON(KEYS.profile, isProfile);
    if (!cur) return false;
    return writeJSON(KEYS.profile, { ...cur, ...patch });
  }, []);

  const updateSettings = useCallback((patch: Partial<StoredSettings>) => {
    const cur = readJSON(KEYS.settings, isSettings) ?? DEFAULT_SETTINGS;
    return writeJSON(KEYS.settings, { ...cur, ...patch });
  }, []);

  return { hydrated, profile, settings, saveProfile, updateProfile, updateSettings };
}
