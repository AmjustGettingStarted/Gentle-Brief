import { errorText, readEnv } from "@/lib/env";
import { fixtureItem, fixtureSummary } from "@/lib/fixtures/digest";
import { sourcesByIds } from "@/lib/sources";
import type { DigestItem, ScrapeDocument, SummaryResult } from "@/types/digest";

const PREFERRED_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "openai/gpt-oss-120b";
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are the calm, stoic morning anchor of GentleBrief. Eliminate hype, panic, point tallies (no upvote or point counts), and sensationalism. Synthesize the extracted news into tranquil, objective sentences written to be spoken naturally aloud.
Use only facts present in the source text. Do not invent events, names, or numbers.
Return JSON only with this shape:
{"title": string, "calmScore": number, "items": [{"sourceName": string, "originalUrl": string, "title": string, "summary": string}]}
calmScore is an integer from 0 to 100.
Each summary is exactly 3 spoken sentences separated by newlines, with no numbers and no point counts.
Write one item per source document. Keep the provided sourceName and originalUrl.
The brief title and each item title must name the actual stories, not the source label.`;

type ModelPayload = {
  title?: unknown;
  calmScore?: unknown;
  items?: unknown;
};

export async function summarizeDocuments(documents: ScrapeDocument[]): Promise<SummaryResult> {
  if (documents.length === 0) {
    return { mode: "fixture", title: "A calm brief", calmScore: 80, items: [] };
  }

  const apiKey = readEnv("OPEN_AI_OR_GROQ_API_KEY");
  const liveText = documents.some((document) => !isFixtureCopy(document.text));
  if (!apiKey) {
    console.warn("[gentlebrief] Groq key missing. Using sample summaries.");
    return { mode: "fixture", ...summaryFromFixtures(documents) };
  }

  try {
    const live = await summarizeLive(documents, apiKey, PREFERRED_MODEL).catch(async (error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("model_not_found") && !message.includes("does not exist")) throw error;
      console.error(
        `[gentlebrief] ${PREFERRED_MODEL} is not available on this Groq account. Retrying with ${FALLBACK_MODEL}.`,
      );
      return summarizeLive(documents, apiKey, FALLBACK_MODEL);
    });
    console.info(`[gentlebrief] Groq summarized ${documents.length} source(s) as "${live.title}"`);
    return { mode: "live", ...live };
  } catch (error) {
    const message = errorText(error, [apiKey]);
    console.error(`[gentlebrief] Groq failed: ${message}`);
    if (!liveText) {
      return { mode: "fixture", ...summaryFromFixtures(documents) };
    }
    throw new Error(`Groq failed: ${message}`);
  }
}

function summaryFromFixtures(documents: ScrapeDocument[]) {
  const sources = sourcesByIds(documents.map((document) => document.sourceId));
  if (sources.length === documents.length) {
    return fixtureSummary(sources);
  }

  const timestamp = new Date().toISOString();
  const items = documents.map((document) => {
    const known = sources.find((source) => source.id === document.sourceId);
    if (known) return fixtureItem(known, timestamp);
    return extractiveItem(document, timestamp);
  });
  return {
    title: documents.length === 1 ? items[0]?.title ?? "A calm brief" : "A calm brief",
    calmScore: 84,
    items,
  };
}

function extractiveItem(document: ScrapeDocument, timestamp: string): DigestItem {
  const sentences = document.text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 40)
    .slice(0, 3);

  const summary =
    sentences.length > 0
      ? sentences.map((sentence, index) => `${index + 1}. ${sentence}`).join("\n")
      : "1. The page had little that was worth repeating.\n2. Nothing urgent stood out.\n3. The brief stops there.";

  return {
    id: crypto.randomUUID(),
    title: document.title || document.sourceName,
    summary,
    originalUrl: document.url,
    sourceName: document.sourceName,
    timestamp,
  };
}

async function summarizeLive(documents: ScrapeDocument[], apiKey: string, model: string) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify(
            documents.map((document) => ({
              sourceName: document.sourceName,
              url: document.url,
              title: document.title,
              text: document.text.slice(0, 4000),
            })),
          ),
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400);
    throw new Error(`Groq HTTP ${response.status}: ${detail}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("The model returned an empty brief.");
  return parseSummary(content, documents);
}

function parseSummary(content: string, documents: ScrapeDocument[]) {
  const parsed = JSON.parse(extractJson(content)) as ModelPayload;
  const timestamp = new Date().toISOString();
  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  const items = documents.map((document, index) => {
    const match = rawItems.find((item) => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return record.originalUrl === document.url || record.sourceName === document.sourceName;
    }) as Record<string, unknown> | undefined;
    const fallback = rawItems[index] as Record<string, unknown> | undefined;
    const record = match ?? fallback;
    const title = stringField(record?.title) || document.title || document.sourceName;
    const summary = stringField(record?.summary);
    if (!summary) return extractiveItem(document, timestamp);
    return {
      id: crypto.randomUUID(),
      title,
      summary,
      originalUrl: document.url,
      sourceName: document.sourceName,
      timestamp,
    } satisfies DigestItem;
  });

  const title =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : items.length === 1
        ? items[0].title
        : "A calm brief";

  const calmScore = clampScore(parsed.calmScore);
  return { title, calmScore, items };
}

function extractJson(content: string): string {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The model did not return JSON.");
  }
  return content.slice(start, end + 1);
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isFixtureCopy(text: string): boolean {
  return text.includes("The tools got a little quieter") || text.includes("A compiler release shipped with fewer warnings");
}

function clampScore(value: unknown): number {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return 80;
  return Math.max(0, Math.min(100, Math.round(score)));
}
