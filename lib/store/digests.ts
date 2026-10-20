import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { seedSession } from "@/lib/fixtures/digest";
import type { DigestSession } from "@/types/digest";

const dataDir = path.join(process.cwd(), "data");
const digestFile = path.join(dataDir, "digests.json");
const audioDir = path.join(dataDir, "audio");

const ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function isSessionId(id: string): boolean {
  return ID_PATTERN.test(id);
}

async function ensureFile(): Promise<DigestSession[]> {
  await connection();
  try {
    const raw = await readFile(digestFile, "utf8");
    const parsed = JSON.parse(raw) as DigestSession[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Missing or unreadable store falls through to the seed brief.
  }

  const seed = [seedSession()];
  await mkdir(dataDir, { recursive: true });
  await writeFile(digestFile, JSON.stringify(seed, null, 2));
  return seed;
}

export function listDigests(): Promise<DigestSession[]> {
  return enqueue(() => ensureFile());
}

export function saveDigest(session: DigestSession): Promise<DigestSession[]> {
  return enqueue(async () => {
    const current = await ensureFile();
    const next = [session, ...current.filter((item) => item.id !== session.id)];
    await writeFile(digestFile, JSON.stringify(next, null, 2));
    return next;
  });
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
