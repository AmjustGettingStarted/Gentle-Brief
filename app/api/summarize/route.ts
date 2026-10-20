import { summarizeDocuments } from "@/lib/services/open-model";
import type { ScrapeDocument } from "@/types/digest";

export async function POST(request: Request) {
  const documents = await readDocuments(request);
  if (!documents) {
    return Response.json({ error: "Nothing to distill." }, { status: 400 });
  }

  const result = await summarizeDocuments(documents);
  return Response.json(result);
}

async function readDocuments(request: Request): Promise<ScrapeDocument[] | null> {
  try {
    const body = (await request.json()) as { documents?: unknown };
    if (!Array.isArray(body.documents) || body.documents.length === 0) return null;
    const documents: ScrapeDocument[] = [];
    for (const item of body.documents) {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      if (
        typeof record.sourceId !== "string" ||
        typeof record.sourceName !== "string" ||
        typeof record.url !== "string" ||
        typeof record.title !== "string" ||
        typeof record.text !== "string"
      ) {
        return null;
      }
      documents.push({
        sourceId: record.sourceId,
        sourceName: record.sourceName,
        url: record.url,
        title: record.title,
        text: record.text.slice(0, 5000),
      });
    }
    return documents;
  } catch {
    return null;
  }
}
