/**
 * Contact-form leads in Redis (kept 90 days, never committed).
 *   lead:<id>  JSON lead (expires after 90 days)
 *   leads      list of ids, newest first (capped)
 */
import { getRedis, type KV } from "@/lib/redis";

export const LEAD_TTL_SECONDS = 90 * 24 * 60 * 60;
const INDEX_KEY = "leads";
const MAX_INDEX = 1_000;
const leadKey = (id: string) => `lead:${id}`;

export const LEAD_STATUSES = ["new", "replied", "archived"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Lead = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: LeadStatus;
};

const isLead = (value: unknown): value is Lead =>
  Boolean(value) &&
  typeof (value as Lead).id === "string" &&
  typeof (value as Lead).createdAt === "string" &&
  typeof (value as Lead).email === "string" &&
  LEAD_STATUSES.includes((value as Lead).status);

export async function storeLead(kv: KV, lead: Lead): Promise<void> {
  await kv.set(leadKey(lead.id), JSON.stringify(lead), { exSeconds: LEAD_TTL_SECONDS });
  await kv.lpush(INDEX_KEY, lead.id);
  await kv.ltrim(INDEX_KEY, 0, MAX_INDEX - 1);
}

/** Newest first; expired leads are skipped. Null when Redis isn't configured. */
export async function listLeads(limit = 200): Promise<Lead[] | null> {
  const kv = getRedis();
  if (!kv) return null;
  const ids = await kv.lrange(INDEX_KEY, 0, Math.min(limit, MAX_INDEX) - 1);
  const leads = await Promise.all(
    ids.map(async (id) => {
      const raw = await kv.get(leadKey(id));
      if (!raw) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        return isLead(parsed) ? parsed : null;
      } catch {
        return null;
      }
    })
  );
  return leads.filter((lead): lead is Lead => lead !== null);
}

/** Returns false if the lead doesn't exist (or expired). Keeps the 90-day expiry. */
export async function setLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  const kv = getRedis();
  if (!kv || !/^[0-9a-f-]{36}$/.test(id)) return false;
  const raw = await kv.get(leadKey(id));
  if (!raw) return false;
  const lead: unknown = JSON.parse(raw);
  if (!isLead(lead)) return false;
  await kv.set(leadKey(id), JSON.stringify({ ...lead, status }), { keepTtl: true });
  return true;
}
