import { fixtureDocument } from "@/lib/fixtures/digest";
import { sourcesByIds } from "@/lib/sources";
import { cleanPageText } from "@/lib/text";
import type { ScrapeDocument, ScrapeResult, TopicSource } from "@/types/digest";

function keys() {
  const apiKey = process.env.BROWSERBASE_API_KEY?.trim() ?? "";
  const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim() ?? "";
  return { apiKey, projectId };
}

export async function scrapeSources(sourceIds: string[]): Promise<ScrapeResult> {
  const sources = sourcesByIds(sourceIds);
  if (sources.length === 0) {
    return { mode: "fixture", documents: [] };
  }

  const { apiKey, projectId } = keys();
  if (!apiKey || !projectId) {
    return { mode: "fixture", documents: sources.map(fixtureDocument) };
  }

  try {
    const documents = await scrapeLive(sources, apiKey, projectId);
    const live = documents.every((document) => document.text.length > 0);
    return { mode: live ? "live" : "fixture", documents };
  } catch {
    return { mode: "fixture", documents: sources.map(fixtureDocument) };
  }
}

async function scrapeLive(
  sources: TopicSource[],
  apiKey: string,
  projectId: string,
): Promise<ScrapeDocument[]> {
  const { Stagehand, browserbase } = await import("@browserbasehq/stagehand");
  const browser = await browserbase.launch({ apiKey, projectId });

  try {
    await Stagehand.create({ browser });
    const documents: ScrapeDocument[] = [];

    for (const source of sources) {
      documents.push(await readSource(browser, source));
    }

    return documents;
  } finally {
    await browser.close();
  }
}

async function readSource(
  browser: {
    context: {
      newPage: (url?: string) => Promise<{
        goto: (
          url: string,
          options?: { waitUntil?: "domcontentloaded"; timeout?: number },
        ) => Promise<unknown>;
        title: () => Promise<string>;
        evaluate: (expression: string) => Promise<unknown>;
        close: () => Promise<void>;
      }>;
    };
  },
  source: TopicSource,
): Promise<ScrapeDocument> {
  const fallback = fixtureDocument(source);
  const page = await browser.context.newPage();

  try {
    await page.goto(source.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const title = (await page.title()) || fallback.title;
    const raw = await page.evaluate("document.body ? document.body.innerText : ''");
    const text = cleanPageText(typeof raw === "string" ? raw : "");
    if (text.length < 80) return fallback;
    return {
      sourceId: source.id,
      sourceName: source.label,
      url: source.url,
      title,
      text,
    };
  } catch {
    return fallback;
  } finally {
    await page.close().catch(() => undefined);
  }
}
