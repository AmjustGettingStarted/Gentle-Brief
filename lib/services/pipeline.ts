import { readEnv } from "@/lib/env";
import { buildScript } from "@/lib/script";
import { scrapeSources } from "@/lib/services/browserbase";
import { synthesizeSpeech } from "@/lib/services/elevenlabs";
import { summarizeDocuments } from "@/lib/services/open-model";
import { saveDigest } from "@/lib/store/digests";
import type { DigestSession, PipelineMode } from "@/types/digest";

export async function generateDigest(sourceIds: string[]): Promise<{
  session: DigestSession;
  mode: PipelineMode;
  voice: "elevenlabs" | "browser";
}> {
  console.info("[gentlebrief] brew started", {
    sourceIds,
    browserbase: Boolean(readEnv("BROWSERBASE_API_KEY")),
    groq: Boolean(readEnv("OPEN_AI_OR_GROQ_API_KEY")),
    elevenlabs: Boolean(readEnv("ELEVENLABS_API_KEY")),
  });

  const scraped = await scrapeSources(sourceIds);
  if (scraped.documents.length === 0) {
    throw new Error("Choose at least one source.");
  }

  const summary = await summarizeDocuments(scraped.documents);
  const id = crypto.randomUUID();
  const script = buildScript(summary.title, summary.items);
  const audio = await synthesizeSpeech(script, id);

  const session: DigestSession = {
    id,
    createdAt: new Date().toISOString(),
    title: summary.title,
    calmScore: summary.calmScore,
    audioUrl: audio.audioUrl,
    duration: audio.duration,
    items: summary.items,
  };

  await saveDigest(session);

  const mode: PipelineMode =
    scraped.mode === "live" && summary.mode === "live" ? "live" : "fixture";

  return { session, mode, voice: audio.fallback ? "browser" : "elevenlabs" };
}
