/**
 * Pipeline heartbeat in Redis: the portfolio sync records when it last ran.
 * Kept out of the repo so a sync with no data changes doesn't create a commit.
 *   pipeline:lastSync  JSON { t, projects, chunks }
 */
import { getRedis, safeRead } from "@/lib/redis";

const LAST_SYNC_KEY = "pipeline:lastSync";

export type SyncHeartbeat = { t: string; projects: number; chunks: number };

/** Returns false when Redis isn't configured (or the write failed). */
export async function markSync(info: Omit<SyncHeartbeat, "t">): Promise<boolean> {
  const kv = getRedis();
  if (!kv) return false;
  try {
    await kv.set(LAST_SYNC_KEY, JSON.stringify({ t: new Date().toISOString(), ...info }));
    return true;
  } catch (error) {
    console.error("Recording sync heartbeat failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

export async function getLastSync(): Promise<SyncHeartbeat | null> {
  return safeRead(
    "pipeline",
    async (kv) => {
      const raw = await kv.get(LAST_SYNC_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<SyncHeartbeat>;
      return typeof parsed.t === "string" ? { t: parsed.t, projects: Number(parsed.projects) || 0, chunks: Number(parsed.chunks) || 0 } : null;
    },
    { cached: true }
  );
}
