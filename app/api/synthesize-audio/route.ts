import { synthesizeSpeech } from "@/lib/services/elevenlabs";

export async function POST(request: Request) {
  const body = await readBody(request);
  const script = body?.script?.trim() ?? "";
  if (!script) {
    return Response.json({ error: "Nothing to read aloud." }, { status: 400 });
  }

  const sessionId =
    typeof body?.sessionId === "string" && body.sessionId ? body.sessionId : crypto.randomUUID();
  const result = await synthesizeSpeech(script, sessionId);
  return Response.json(result);
}

async function readBody(
  request: Request,
): Promise<{ script?: string; sessionId?: string } | null> {
  try {
    return (await request.json()) as { script?: string; sessionId?: string };
  } catch {
    return null;
  }
}
