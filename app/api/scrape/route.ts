import { scrapeSources } from "@/lib/services/browserbase";

export async function POST(request: Request) {
  const body = await readBody(request);
  const sourceIds = stringList(body?.sourceIds);
  if (!sourceIds) {
    return Response.json({ error: "Choose at least one source." }, { status: 400 });
  }

  const result = await scrapeSources(sourceIds);
  if (result.documents.length === 0) {
    return Response.json({ error: "Choose at least one source." }, { status: 400 });
  }

  return Response.json(result);
}

async function readBody(request: Request): Promise<{ sourceIds?: unknown } | null> {
  try {
    return (await request.json()) as { sourceIds?: unknown };
  } catch {
    return null;
  }
}

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!value.every((item) => typeof item === "string" && item.trim())) return null;
  return value;
}
