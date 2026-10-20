import type { DigestItem } from "@/types/digest";

const WORDS_PER_MINUTE = 150;
const BASE_RATE = 0.9;

export function buildScript(title: string, items: DigestItem[]): string {
  const parts = [`${title}.`];
  for (const item of items) {
    const spoken = item.summary.replace(/\s*\n+\s*/g, " ").replace(/\s+/g, " ").trim();
    parts.push(`${item.sourceName}. ${item.title}. ${spoken}`);
  }
  return parts.join(" ");
}

export function estimateDuration(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerSecond = (WORDS_PER_MINUTE / 60) * BASE_RATE;
  return Math.max(12, Math.round(words / wordsPerSecond));
}

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
