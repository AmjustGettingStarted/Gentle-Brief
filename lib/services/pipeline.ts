import { readEnv } from "@/lib/env";
import { buildScript } from "@/lib/script";
import { scrapeSources } from "@/lib/services/browserbase";
import { synthesizeSpeech } from "@/lib/services/elevenlabs";
import { summarizeDocuments } from "@/lib/services/open-model";
import { VOICES, type PaceChoice, type VoiceChoice } from "@/lib/brief-options";
import type { DigestSession, PipelineMode, TopicSource } from "@/types/digest";

export async function generateDigest(
  sourceIds: string[],
  customSources: TopicSource[] = [],
  options: { voice?: VoiceChoice; pace?: PaceChoice } = {},
): Promise<{
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

  const scraped = await scrapeSources(sourceIds, customSources);
  if (scraped.documents.length === 0) {
    throw new Error("Choose at least one source.");
  }

  const pace = options.pace === "deep" ? "deep" : "quick";
  const voice = options.voice === "adam" ? "adam" : "charlotte";
  // #region agent log
  fetch("http://127.0.0.1:7779/ingest/41dc1293-3851-4b10-979f-d27ffb3a16ff",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"6ca59f"},body:JSON.stringify({sessionId:"6ca59f",runId:"pre-fix",hypothesisId:"A,D",location:"lib/services/pipeline.ts:voice",message:"pipeline voice choice",data:{requested:options.voice??null,resolved:voice,pace},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const summary = await summarizeDocuments(scraped.documents, pace);
  const id = crypto.randomUUID();
  const script = buildScript(summary.title, summary.items);
  const audio = await synthesizeSpeech(script, id, VOICES[voice].id);

  const headlinesFiltered = scraped.documents.reduce(
    (total, document) => total + document.filtered,
    0,
  );
  const session: DigestSession = {
    id,
    createdAt: new Date().toISOString(),
    title: summary.title,
    calmScore: summary.calmScore,
    audioUrl: audio.audioUrl,
    duration: audio.duration,
    items: summary.items,
    noise: {
      headlinesFiltered,
      adsRendered: 0,
      minutesSaved: Math.max(8, Math.round(headlinesFiltered * 1.4)),
    },
  };

  const mode: PipelineMode =
    scraped.mode === "live" && summary.mode === "live" ? "live" : "fixture";

  return { session, mode, voice: audio.fallback ? "browser" : "elevenlabs" };
}
