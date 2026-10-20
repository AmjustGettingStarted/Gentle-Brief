import { listDigests } from "@/lib/store/digests";

export async function GET() {
  const sessions = await listDigests();
  return Response.json({ sessions });
}
