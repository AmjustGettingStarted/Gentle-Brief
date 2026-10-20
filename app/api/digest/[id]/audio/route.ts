import { readFile } from "node:fs/promises";
import { connection } from "next/server";
import { audioPath, isSessionId } from "@/lib/store/digests";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  const { id } = await context.params;
  if (!isSessionId(id)) {
    return Response.json({ error: "Unknown brief." }, { status: 404 });
  }

  try {
    const bytes = await readFile(audioPath(id));
    return new Response(bytes, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "This brief has no recording." }, { status: 404 });
  }
}
