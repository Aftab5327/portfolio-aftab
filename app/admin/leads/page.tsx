import type { Metadata } from "next";
import LeadStatusSelect from "@/components/admin/LeadStatusSelect";
import { listLeads, type LeadStatus } from "@/lib/contact/leads";

// Behind middleware.ts (Basic Auth). Always fresh, never cached or indexed.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leads",
  robots: { index: false, follow: false, nocache: true }
};

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "border-teal/50 bg-teal/10 text-teal",
  replied: "border-line bg-panel text-txtdim",
  archived: "border-line bg-panel text-txtfaint"
};

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string } }) {
  let leads: Awaited<ReturnType<typeof listLeads>> = null;
  let failed = false;
  try {
    leads = await listLeads();
  } catch (error) {
    failed = true;
    console.error("Listing leads failed:", error instanceof Error ? error.message : error);
  }

  const filter = ["new", "replied", "archived"].includes(searchParams.status ?? "") ? (searchParams.status as LeadStatus) : null;
  const visible = (leads ?? []).filter((lead) => !filter || lead.status === filter);
  const counts = (leads ?? []).reduce<Record<string, number>>((acc, lead) => ({ ...acc, [lead.status]: (acc[lead.status] ?? 0) + 1 }), {});

  return (
    <section className="rounded-card border border-line bg-panel px-6 py-10 shadow-soft sm:px-10">
      <p className="font-mono text-sm text-teal">{"// admin"}</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-txt">Contact leads</h1>
      <p className="mt-2 text-sm text-txtdim">Messages from the contact form, newest first. Kept for 90 days.</p>

      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2 font-mono text-xs">
        {[null, "new", "replied", "archived"].map((status) => (
          <a
            key={status ?? "all"}
            href={status ? `?status=${status}` : "?"}
            aria-current={filter === status ? "page" : undefined}
            className={`rounded-md border px-3 py-1.5 ${filter === status ? "border-teal text-teal" : "border-line text-txtdim hover:text-teal"}`}
          >
            {status ?? "all"} ({status ? counts[status] ?? 0 : leads?.length ?? 0})
          </a>
        ))}
      </nav>

      {failed ? (
        <p role="alert" className="mt-8 text-sm text-danger">Couldn&apos;t load leads from Redis.</p>
      ) : leads === null ? (
        <p className="mt-8 text-sm text-txtdim">Redis isn&apos;t configured, so leads aren&apos;t stored (email and Telegram still work).</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-sm text-txtdim">No messages{filter ? ` with status “${filter}”` : ""}.</p>
      ) : (
        <ol className="mt-8 space-y-4">
          {visible.map((lead) => (
            <li key={lead.id} className="rounded-xl border border-line bg-panel2 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-txt">
                    {lead.name}{" "}
                    <a href={`mailto:${lead.email}?subject=${encodeURIComponent(`Re: ${lead.subject || "your message"}`)}`} className="font-mono text-xs font-normal text-teal hover:underline">
                      {lead.email}
                    </a>
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-txtdim">
                    <time dateTime={lead.createdAt}>{dateTime.format(new Date(lead.createdAt))} UTC</time>
                    {lead.subject ? ` · ${lead.subject}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-md border px-2 py-0.5 font-mono text-[11px] ${STATUS_STYLES[lead.status]}`}>{lead.status}</span>
                  <LeadStatusSelect id={lead.id} status={lead.status} label={lead.name} />
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-txtdim">{lead.message}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
