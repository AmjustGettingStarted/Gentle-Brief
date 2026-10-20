import { isPaceChoice, isVoiceChoice, type PaceChoice, type VoiceChoice } from "@/lib/brief-options";
import { generateDigest } from "@/lib/services/pipeline";
import { isPublicHttpUrl } from "@/lib/sources";
import type { TopicSource } from "@/types/digest";

export async function POST(request: Request) {
  const body = await readBody(request);
  if (!body) {
    return Response.json({ error: "Choose at least one source." }, { status: 400 });
  }

  try {
    const result = await generateDigest(body.sourceIds, body.customSources, {
      voice: body.voice,
      pace: body.pace,
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The brief did not finish.";
    console.error(`[gentlebrief] generate failed: ${message}`);
    const status = message === "Choose at least one source." ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

async function readBody(
  request: Request,
): Promise<{
  sourceIds: string[];
  customSources: TopicSource[];
  voice: VoiceChoice;
  pace: PaceChoice;
} | null> {
  try {
    const body = (await request.json()) as {
      sourceIds?: unknown;
      customSources?: unknown;
      voice?: unknown;
      pace?: unknown;
    };
    if (!Array.isArray(body.sourceIds) || body.sourceIds.length === 0) return null;
    if (!body.sourceIds.every((item) => typeof item === "string" && item.trim())) return null;
    return {
      sourceIds: body.sourceIds,
      customSources: sanitizeCustom(body.customSources),
      voice: isVoiceChoice(body.voice) ? body.voice : "charlotte",
      pace: isPaceChoice(body.pace) ? body.pace : "quick",
    };
  } catch {
    return null;
  }
}

function sanitizeCustom(value: unknown): TopicSource[] {
  if (!Array.isArray(value)) return [];
  const sources: TopicSource[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || !record.id.startsWith("custom-")) continue;
    if (typeof record.url !== "string" || !isPublicHttpUrl(record.url)) continue;
    const label = typeof record.label === "string" ? record.label.trim() : "";
    sources.push({
      id: record.id.slice(0, 80),
      label: (label || "Custom").slice(0, 80),
      url: record.url.trim(),
      icon: "link",
      enabled: true,
    });
    if (sources.length >= 5) break;
  }
  return sources;
}
