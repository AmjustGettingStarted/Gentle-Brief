import { fixtureDocument } from "@/lib/fixtures/digest";
import { errorText, readEnv } from "@/lib/env";
import { resolveSources } from "@/lib/sources";
import { ARTICLE_EXTRACT_EXPRESSION, cleanPageText } from "@/lib/text";
import type { ScrapeDocument, ScrapeResult, TopicSource } from "@/types/digest";

export async function scrapeSources(
  sourceIds: string[],
  customSources: TopicSource[] = [],
): Promise<ScrapeResult> {
  const sources = resolveSources(sourceIds, customSources);
  if (sources.length === 0) {
    return { mode: "fixture", documents: [] };
  }

  const apiKey = readEnv("BROWSERBASE_API_KEY");
  const projectId = readEnv("BROWSERBASE_PROJECT_ID");
  if (!apiKey || !projectId) {
    console.warn("[gentlebrief] Browserbase credentials missing. Using sample pages.");
    return { mode: "fixture", documents: sources.map(fixtureDocument) };
  }

  const documents: ScrapeDocument[] = [];
  const failures: string[] = [];

  for (const source of sources) {
    try {
      const document = await readLiveSource(source, apiKey, projectId);
      console.info(
        `[gentlebrief] scraped ${source.label} (${document.text.length} chars) from ${source.url}`,
      );
      documents.push(document);
    } catch (error) {
      const message = errorText(error, [apiKey, projectId]);
      console.error(`[gentlebrief] scrape failed for ${source.label} ${source.url}: ${message}`);
      failures.push(`${source.label}: ${message}`);
    }
  }

  if (documents.length === 0) {
    throw new Error(failures.join(" ") || "Browserbase returned no articles.");
  }

  return { mode: "live", documents };
}

async function readLiveSource(
  source: TopicSource,
  apiKey: string,
  projectId: string,
): Promise<ScrapeDocument> {
  try {
    return await fetchMarkdown(source, apiKey);
  } catch (error) {
    console.error(
      `[gentlebrief] Browserbase fetch failed for ${source.url}: ${errorText(error, [apiKey])}. Opening a browser session.`,
    );
  }

  return readWithSession(source, apiKey, projectId);
}

async function fetchMarkdown(source: TopicSource, apiKey: string): Promise<ScrapeDocument> {
  const { browserbase } = await import("@browserbasehq/stagehand");
  const result = await browserbase.fetch({
    apiKey,
    url: source.url,
    format: "markdown",
    proxies: true,
  });

  if (result.statusCode >= 400) {
    throw new Error(`Browserbase fetch returned HTTP ${result.statusCode} for ${source.url}`);
  }

  const raw = typeof result.content === "string" ? result.content : JSON.stringify(result.content);
  const document = toDocument(source, source.label, raw);
  if (!document) {
    throw new Error(`Browserbase fetch for ${source.url} had no article text.`);
  }
  return document;
}

async function readWithSession(
  source: TopicSource,
  apiKey: string,
  projectId: string,
): Promise<ScrapeDocument> {
  const { Stagehand, browserbase } = await import("@browserbasehq/stagehand");
  const browser = await browserbase.launch({ apiKey, projectId });

  try {
    await Stagehand.create({ browser });
    const page = await browser.context.newPage();
    try {
      await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 25000 });
      const title = (await page.title()) || source.label;
      const extracted = await page.evaluate(ARTICLE_EXTRACT_EXPRESSION);
      const raw = typeof extracted === "string" && extracted.trim().length >= 80
        ? extracted
        : await page.evaluate("document.body ? document.body.innerText : ''");
      const document = toDocument(source, title, typeof raw === "string" ? raw : "");
      if (!document) {
        throw new Error(`The live page at ${source.url} had no readable article text.`);
      }
      return document;
    } finally {
      await page.close().catch(() => undefined);
    }
  } finally {
    await browser.close().catch(() => undefined);
  }
}

function toDocument(source: TopicSource, title: string, raw: string): ScrapeDocument | null {
  const cleaned = cleanPageText(raw);
  const stories = cleaned.text.split("\n").filter(Boolean);
  if (stories.length < 3 || cleaned.text.length < 80 || isFixtureCopy(cleaned.text)) return null;
  return {
    sourceId: source.id,
    sourceName: source.label,
    url: source.url,
    title: title.trim() || source.label,
    text: cleaned.text,
    filtered: cleaned.filtered,
  };
}

function isFixtureCopy(text: string): boolean {
  return (
    text.includes("The tools got a little quieter") ||
    text.includes("A compiler release shipped with fewer warnings") ||
    text.includes("Prices moved, the week did not")
  );
}
