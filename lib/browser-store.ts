"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_SETTINGS, isAmbienceChoice, isPaceChoice, isVoiceChoice, type BriefSettings } from "@/lib/brief-options";
import type { DigestSession } from "@/types/digest";

const HISTORY_KEY = "gentlebrief_user_history";
const SETTINGS_KEY = "gentlebrief_user_settings";
const HISTORY_LIMIT = 24;

const EMPTY_HISTORY: DigestSession[] = [];
let historyCache: DigestSession[] = EMPTY_HISTORY;
let settingsCache: BriefSettings = DEFAULT_SETTINGS;
let historyReady = false;
let settingsReady = false;
const historyListeners = new Set<() => void>();
const settingsListeners = new Set<() => void>();

function readHistory(): DigestSession[] {
  if (typeof window === "undefined") return EMPTY_HISTORY;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return EMPTY_HISTORY;
    const sessions = parsed.filter(isSession).slice(0, HISTORY_LIMIT);
    return sessions.length === 0 ? EMPTY_HISTORY : sessions;
  } catch {
    return EMPTY_HISTORY;
  }
}

function readSettings(): BriefSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? "{}") as Record<string, unknown>;
    return {
      voice: isVoiceChoice(parsed.voice) ? parsed.voice : DEFAULT_SETTINGS.voice,
      pace: isPaceChoice(parsed.pace) ? parsed.pace : DEFAULT_SETTINGS.pace,
      ambience: isAmbienceChoice(parsed.ambience) ? parsed.ambience : DEFAULT_SETTINGS.ambience,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function historySnapshot(): DigestSession[] {
  if (!historyReady) {
    historyCache = readHistory();
    historyReady = true;
  }
  return historyCache;
}

function settingsSnapshot(): BriefSettings {
  if (!settingsReady) {
    settingsCache = readSettings();
    settingsReady = true;
  }
  return settingsCache;
}

export function useUserHistory(): DigestSession[] {
  return useSyncExternalStore(
    (listener) => {
      historyListeners.add(listener);
      return () => historyListeners.delete(listener);
    },
    historySnapshot,
    () => EMPTY_HISTORY,
  );
}

export function useUserSettings(): BriefSettings {
  return useSyncExternalStore(
    (listener) => {
      settingsListeners.add(listener);
      return () => settingsListeners.delete(listener);
    },
    settingsSnapshot,
    () => DEFAULT_SETTINGS,
  );
}

export function saveUserHistory(sessions: DigestSession[]) {
  const next = sessions.slice(0, HISTORY_LIMIT);
  historyCache = next;
  historyReady = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }
  historyListeners.forEach((listener) => listener());
}

export function saveUserSettings(patch: Partial<BriefSettings>) {
  const next = { ...settingsSnapshot(), ...patch };
  settingsCache = next;
  settingsReady = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }
  settingsListeners.forEach((listener) => listener());
}

function isSession(value: unknown): value is DigestSession {
  if (!value || typeof value !== "object") return false;
  const record = value as DigestSession;
  return typeof record.id === "string" && typeof record.title === "string" && Array.isArray(record.items);
}
