export const VOICES = {
  charlotte: { label: "Charlotte (Calm)", id: "XB0fDUnXU5powFXDhCwa" },
  adam: { label: "Adam (Deep)", id: "pNInz6obpgDQGcFmaJgB" },
} as const;

export type VoiceChoice = keyof typeof VOICES;
export type PaceChoice = "quick" | "deep";
export type AmbienceChoice = "silent" | "rain" | "hiss";

export type BriefSettings = {
  voice: VoiceChoice;
  pace: PaceChoice;
  ambience: AmbienceChoice;
};

export const DEFAULT_SETTINGS: BriefSettings = {
  voice: "charlotte",
  pace: "quick",
  ambience: "silent",
};

export function isVoiceChoice(value: unknown): value is VoiceChoice {
  return value === "charlotte" || value === "adam";
}

export function isPaceChoice(value: unknown): value is PaceChoice {
  return value === "quick" || value === "deep";
}

export function isAmbienceChoice(value: unknown): value is AmbienceChoice {
  return value === "silent" || value === "rain" || value === "hiss";
}

export function paceInstruction(pace: PaceChoice): string {
  if (pace === "deep") {
    return "Let the whole brief take about three minutes when spoken aloud. Each summary is six to eight unhurried sentences separated by newlines, with no numbers and no point counts.";
  }
  return "Keep the whole brief to about one minute when spoken aloud. Each summary is two or three short sentences separated by newlines, with no numbers and no point counts.";
}
