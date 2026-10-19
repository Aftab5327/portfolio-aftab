import { getBuildLogPosts, plainText } from "@/lib/build-log";
import { siteUrl } from "@/lib/config";
import { getProfile } from "@/lib/data";
import { internalPath } from "@/lib/safe-url";

// RSS 2.0 feed of the weekly build log, generated at build time.
export const dynamic = "force-static";

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function GET() {
  const { name } = getProfile();
  const posts = getBuildLogPosts().slice(0, 50);

  const items = posts
    .map((post) => {
      const url = `${siteUrl}${internalPath("log", post.slug)}`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${new Date(`${post.date}T09:00:00Z`).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(plainText(post.body))}</description>`,
        "    </item>"
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${name} · Build log`)}</title>
    <link>${escapeXml(`${siteUrl}/log`)}</link>
    <atom:link href="${escapeXml(`${siteUrl}/log/rss.xml`)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(`Weekly AI summaries of ${name}'s real commits.`)}</description>
    <language>en</language>
${posts[0] ? `    <lastBuildDate>${new Date(`${posts[0].date}T09:00:00Z`).toUTCString()}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
