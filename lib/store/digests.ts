import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";

const audioDir = path.join(process.cwd(), "data", "audio");

const ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSessionId(id: string): boolean {
  return ID_PATTERN.test(id);
}

export function audioPath(id: string): string {
  if (!isSessionId(id)) {
    throw new Error("Unknown brief.");
  }
  return path.join(audioDir, `${id}.mp3`);
}

export async function saveAudio(id: string, bytes: Uint8Array): Promise<string> {
  await connection();
  const filePath = audioPath(id);
  await mkdir(audioDir, { recursive: true });
  await writeFile(filePath, bytes);
  return `/api/digest/${id}/audio`;
}
