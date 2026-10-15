/**
 * Contact form endpoint (POST only). See docs/automation.md → Contact pipeline.
 *
 * Spam protection: honeypot field, signed minimum-time-on-form token,
 * 3/hour per hashed IP, optional Cloudflare Turnstile.
 * Delivery (in parallel, isolated): email to owner, auto-reply, Telegram, Redis lead.
 * Success = the owner email OR Telegram went through. Provider errors are never returned.
 */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { oneLine } from "@/lib/contact/escape";
import { emailAutoReply, emailOwner, notifyTelegram, saveLead, verifyTurnstile } from "@/lib/contact/providers";
import { CONTACT_LIMITS, HONEYPOT_FIELD, type ContactFieldErrors } from "@/lib/contact/shared";
import { verifyFormToken } from "@/lib/contact/token";
import type { Lead } from "@/lib/contact/leads";
import { getProfile } from "@/lib/data";
import { checkContactRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Sorry, your message couldn't be sent right now. Please email me directly instead.";

const bodySchema = z
  .object({
    name: z.string().trim().min(CONTACT_LIMITS.name.min, "Please enter your name (at least 2 characters).").max(CONTACT_LIMITS.name.max, `Name must be ${CONTACT_LIMITS.name.max} characters or fewer.`),
    email: z.string().trim().max(CONTACT_LIMITS.email.max).email("Please enter a valid email address."),
    subject: z.string().trim().max(CONTACT_LIMITS.subject.max, `Subject must be ${CONTACT_LIMITS.subject.max} characters or fewer.`).optional(),
    message: z.string().trim().min(CONTACT_LIMITS.message.min, `Message must be at least ${CONTACT_LIMITS.message.min} characters.`).max(CONTACT_LIMITS.message.max, `Message must be ${CONTACT_LIMITS.message.max} characters or fewer.`),
    [HONEYPOT_FIELD]: z.string().max(500).optional(),
    token: z.string().max(200),
    turnstileToken: z.string().max(4096).optional()
  })
  .strict();

const json = (status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: ContactFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if ((field === "name" || field === "email" || field === "subject" || field === "message") && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return json(400, { error: Object.keys(fieldErrors).length ? "Please fix the highlighted fields." : "Invalid request.", fieldErrors });
  }
  const data = parsed.data;

  // Honeypot: pretend it worked so bots learn nothing; deliver nothing.
  if (data[HONEYPOT_FIELD]?.trim()) return json(200, { ok: true });

  const token = verifyFormToken(data.token);
  if (!token.ok) {
    const error =
      token.reason === "too-fast"
        ? "That was quick! Please wait a few seconds and send again."
        : "Your form session expired. Please reload the page and try again.";
    return json(400, { error });
  }

  const limit = await checkContactRateLimit(ip);
  if (!limit.ok) {
    return json(429, { error: "You've sent several messages recently. Please try again later or email me directly." }, { "Retry-After": String(limit.retryAfterSeconds) });
  }

  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return json(403, { error: "Please complete the verification and try again." });
  }

  const lead: Lead = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    name: oneLine(data.name, CONTACT_LIMITS.name.max),
    email: data.email.toLowerCase(),
    subject: oneLine(data.subject ?? "", CONTACT_LIMITS.subject.max),
    message: data.message,
    status: "new"
  };

  const profile = getProfile();
  const [owner, autoReply, telegram, stored] = await Promise.all([
    emailOwner(lead, profile.name),
    emailAutoReply(lead, profile.name, profile.firstName),
    notifyTelegram(lead),
    saveLead(lead)
  ]);

  console.log(
    `Contact ${lead.id}: owner=${owner.skipped ? "skipped" : owner.ok} autoReply=${autoReply.skipped ? "skipped" : autoReply.ok} telegram=${telegram.skipped ? "skipped" : telegram.ok} stored=${stored.skipped ? "skipped" : stored.ok}`
  );

  if (!owner.ok && !telegram.ok) return json(502, { error: GENERIC_ERROR });
  return json(200, { ok: true });
}

export function GET() {
  return json(405, { error: "Method not allowed" }, { Allow: "POST" });
}
