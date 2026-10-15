/**
 * shields.io "endpoint" badges: https://img.shields.io/endpoint?url=<site>/api/badge/<metric>
 * Metrics: uptime (7-day %), lighthouse (latest performance), projects (count).
 * Regenerated at most every 10 minutes; missing data shows "no data" instead of failing.
 */
import { getProjects } from "@/lib/data";
import { getLighthouseHistory } from "@/lib/lighthouse";
import { getUptimeSummary } from "@/lib/uptime";

const METRICS = ["uptime", "lighthouse", "projects"] as const;
type Metric = (typeof METRICS)[number];

export const revalidate = 600;
export const dynamicParams = false;

export function generateStaticParams() {
  return METRICS.map((metric) => ({ metric }));
}

type Badge = { schemaVersion: 1; label: string; message: string; color: string; cacheSeconds: number };

const badge = (label: string, message: string, color: string): Badge => ({ schemaVersion: 1, label, message, color, cacheSeconds: 600 });
const scoreColor = (score: number) => (score >= 90 ? "brightgreen" : score >= 50 ? "orange" : "red");
const uptimeColor = (percent: number) => (percent >= 99.5 ? "brightgreen" : percent >= 98 ? "green" : percent >= 95 ? "yellow" : "red");

async function build(metric: Metric): Promise<Badge> {
  switch (metric) {
    case "uptime": {
      const summary = await getUptimeSummary();
      const site = summary?.sites.find((item) => item.id === "portfolio") ?? summary?.sites[0];
      return site ? badge("uptime (7d)", `${site.uptimePercent}%`, uptimeColor(site.uptimePercent)) : badge("uptime (7d)", "no data", "lightgrey");
    }
    case "lighthouse": {
      const latest = (await getLighthouseHistory())?.[0];
      return latest ? badge("lighthouse perf", String(latest.average.performance), scoreColor(latest.average.performance)) : badge("lighthouse perf", "no data", "lightgrey");
    }
    case "projects":
      return badge("projects", String(getProjects().length), "0a7166");
  }
}

export async function GET(_request: Request, { params }: { params: { metric: string } }) {
  if (!METRICS.includes(params.metric as Metric)) {
    return new Response(JSON.stringify({ error: "Unknown metric" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify(await build(params.metric as Metric)), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=600" }
  });
}
