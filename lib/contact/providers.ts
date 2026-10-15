/**
 * Delivery channels for a contact submission. Each returns a result instead of
 * throwing, so one failing provider never affects the others, and provider error
 * details are only logged on the server.
 */
import { RESUME_PAGE_PATH, STATS_PATH, siteUrl } from "@/lib/config";
import { escapeHtml, escapeTelegram, oneLine } from "@/lib/contact/escape";
import { storeLead, type Lead } from "@/lib/contact/leads";
import { getRedis } from "@/lib/redis";

export type ProviderResult = { ok: boolean; skipped?: boolean };

const TIMEOUT_MS = 10_000;
const skipped: ProviderResult = { ok: false, skipped: true };

async function attempt(label: string, run: () => Promise<Response | void>): Promise<ProviderResult> {
  try {
    const response = await run();
    if (response && !response.ok) {
      console.error(`Contact ${label} failed: HTTP ${response.status} ${(await response.text().catch(() => "")).slice(0, 200)}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.error(`Contact ${label} failed:`, error instanceof Error ? error.message : error);
    return { ok: false };
  }
}

const resendConfigured = () => Boolean(process.env.RESEND_API_KEY?.trim() && process.env.CONTACT_FROM_EMAIL?.trim());

function sendEmail(payload: { to: string; reply_to?: string; subject: string; text: string; html: string }) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.CONTACT_FROM_EMAIL!.trim(), ...payload })
  });
}

/** Absolute links only when a public site URL is configured. */
const publicUrl = (path: string) => (/\/\/(localhost|127\.0\.0\.1)/.test(siteUrl) ? "" : `${siteUrl}${path}`);

const paragraphs = (text: string) =>
  escapeHtml(text)
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 12px">${block.replace(/\n/g, "<br>")}</p>`)
    .join("");

/** a) The submission, to the site owner, with Reply-To set to the sender. */
export async function emailOwner(lead: Lead, ownerName: string): Promise<ProviderResult> {
  const to = process.env.CONTACT_TO_EMAIL?.trim();
  if (!resendConfigured() || !to) return skipped;

  const subject = oneLine(`Portfolio contact: ${lead.subject || "New message"} — ${lead.name}`, 150);
  const text = [`From: ${lead.name} <${lead.email}>`, `Subject: ${lead.subject || "(none)"}`, "", lead.message, "", `Lead id: ${lead.id}`].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#0e1512">
<p style="margin:0 0 12px"><strong>From:</strong> ${escapeHtml(lead.name)} &lt;${escapeHtml(lead.email)}&gt;<br>
<strong>Subject:</strong> ${escapeHtml(lead.subject || "(none)")}</p>
${paragraphs(lead.message)}
<p style="margin:16px 0 0;color:#4a5a52;font-size:12px">Sent from ${escapeHtml(ownerName)}'s portfolio contact form · lead ${escapeHtml(lead.id)}</p>
</div>`;

  return attempt("owner email", () => sendEmail({ to, reply_to: lead.email, subject, text, html }));
}

/** b) A short confirmation to the sender. */
export async function emailAutoReply(lead: Lead, ownerName: string, ownerFirstName: string): Promise<ProviderResult> {
  if (!resendConfigured()) return skipped;

  const resume = publicUrl(RESUME_PAGE_PATH);
  const stats = publicUrl(STATS_PATH);
  const firstName = oneLine(lead.name, 80).split(" ")[0];
  const text = [
    `Hi ${firstName},`,
    "",
    `Thanks for getting in touch. Your message reached ${ownerFirstName}, who usually replies within a couple of days.`,
    ...(resume ? ["", `In the meantime, here's the resume: ${resume}`] : []),
    ...(stats ? [`and what's being built right now: ${stats}`] : []),
    "",
    `— ${ownerName}`,
    "",
    "(This is an automatic confirmation. You can reply to it directly.)"
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#0e1512">
<p style="margin:0 0 12px">Hi ${escapeHtml(firstName)},</p>
<p style="margin:0 0 12px">Thanks for getting in touch. Your message reached ${escapeHtml(ownerFirstName)}, who usually replies within a couple of days.</p>
${resume ? `<p style="margin:0 0 12px">In the meantime: <a href="${escapeHtml(resume)}">resume</a>${stats ? ` · <a href="${escapeHtml(stats)}">what's being built right now</a>` : ""}.</p>` : ""}
<p style="margin:0 0 12px">— ${escapeHtml(ownerName)}</p>
<p style="margin:16px 0 0;color:#4a5a52;font-size:12px">This is an automatic confirmation. You can reply to it directly.</p>
</div>`;

  const ownerEmail = process.env.CONTACT_TO_EMAIL?.trim();
  return attempt("auto-reply", () =>
    sendEmail({ to: lead.email, ...(ownerEmail ? { reply_to: ownerEmail } : {}), subject: `Thanks for reaching out, ${oneLine(firstName, 40)}`, text, html })
  );
}

/** c) Telegram notification (MarkdownV2, everything escaped). */
export async function notifyTelegram(lead: Lead): Promise<ProviderResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return skipped;

  const preview = lead.message.length > 300 ? `${lead.message.slice(0, 300)}…` : lead.message;
  const text = [
    "*New portfolio message*",
    `*From:* ${escapeTelegram(oneLine(lead.name))}`,
    `*Email:* ${escapeTelegram(lead.email)}`,
    `*Subject:* ${escapeTelegram(oneLine(lead.subject) || "(none)")}`,
    "",
    escapeTelegram(preview)
  ].join("\n");

  return attempt("Telegram", () =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "MarkdownV2", disable_web_page_preview: true })
    })
  );
}

/** d) Store the lead (90 days). */
export async function saveLead(lead: Lead): Promise<ProviderResult> {
  const kv = getRedis();
  if (!kv) return skipped;
  return attempt("lead storage", () => storeLead(kv, lead));
}

/** Cloudflare Turnstile check; passes when Turnstile isn't configured. */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, ...(ip !== "unknown" ? { remoteip: ip } : {}) });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body
    });
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification failed:", error instanceof Error ? error.message : error);
    return false;
  }
}
