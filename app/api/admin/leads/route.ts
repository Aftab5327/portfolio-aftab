// Behind middleware.ts (Basic Auth). Updates a lead's status.
import { z } from "zod";
import { LEAD_STATUSES, setLeadStatus } from "@/lib/contact/leads";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ id: z.string().uuid(), status: z.enum(LEAD_STATUSES) }).strict();

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function PATCH(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json(400, { error: "Invalid request." });
  try {
    const updated = await setLeadStatus(parsed.data.id, parsed.data.status);
    return updated ? json(200, { ok: true }) : json(404, { error: "Lead not found." });
  } catch (error) {
    console.error("Lead status update failed:", error instanceof Error ? error.message : error);
    return json(500, { error: "Update failed." });
  }
}
