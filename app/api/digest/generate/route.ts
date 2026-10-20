import { generateDigest } from "@/lib/services/pipeline";

export async function POST(request: Request) {
  const sourceIds = await readSourceIds(request);
  if (!sourceIds) {
    return Response.json({ error: "Choose at least one source." }, { status: 400 });
  }

  try {
    const result = await generateDigest(sourceIds);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The brief did not finish.";
    console.error(`[gentlebrief] generate failed: ${message}`);
    const status = message === "Choose at least one source." ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}

async function readSourceIds(request: Request): Promise<string[] | null> {
  try {
    const body = (await request.json()) as { sourceIds?: unknown };
    if (!Array.isArray(body.sourceIds) || body.sourceIds.length === 0) return null;
    if (!body.sourceIds.every((item) => typeof item === "string" && item.trim())) return null;
    return body.sourceIds;
  } catch {
    return null;
  }
}
