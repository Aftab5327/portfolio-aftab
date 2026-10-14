import { buildResume } from "@/lib/resume";

// JSON Resume (https://jsonresume.org/schema), generated at build time.
export const dynamic = "force-static";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "2024-01", "2024", "Jan 2024" or "January 2024" → ISO 8601 ("2024-01"); anything else → undefined. */
function isoDate(value: string): string | undefined {
  const text = value.trim();
  if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(text)) return text;
  const match = text.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/);
  const month = match ? MONTHS.indexOf(match[1].slice(0, 3).toLowerCase()) : -1;
  return match && month >= 0 ? `${match[2]}-${String(month + 1).padStart(2, "0")}` : undefined;
}

/**
 * Splits "B.E. Electronics & Telecommunication" into studyType "B.E." + area
 * "Electronics & Telecommunication" (likewise "PG Diploma in …", "Bachelor of …").
 * Falls back to the whole degree as studyType.
 */
function splitDegree(degree: string, detail: string): { studyType: string; area?: string } {
  const match = degree.match(
    /^((?:[A-Z][A-Za-z]{0,3}\.){1,4}|(?:PG |Post ?Graduate )?Diploma|(?:Bachelor|Master)(?:'s)?(?: of [A-Z][a-z]+)?|Ph\.?D\.?)\s+(?:in\s+|of\s+)?(.+)$/
  );
  const extra = detail.replace(/^with\s+/i, "").trim();
  if (!match) return { studyType: degree, area: extra || undefined };
  return { studyType: match[1].trim(), area: extra ? `${match[2]} (${extra})` : match[2] };
}

/** A trailing 4-digit year in a free-text range ("2019 – 2023" → "2023"). */
const lastYear = (value: string) => value.match(/(\d{4})(?!.*\d{4})/)?.[1];

const COUNTRY_CODES: Record<string, string> = { india: "IN", "united states": "US", usa: "US", "united kingdom": "GB", uk: "GB", germany: "DE", canada: "CA" };

/** Omits undefined/empty values so the JSON only contains real data. */
function compact<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== "" && !(Array.isArray(item) && item.length === 0))
  ) as Partial<T>;
}

export async function GET() {
  const resume = buildResume();
  const [city, ...rest] = resume.contact.location.split(",").map((part) => part.trim());
  const country = rest[rest.length - 1] ?? "";

  const network = (url: string) =>
    url.includes("github.com") ? "GitHub" : url.includes("linkedin.com") ? "LinkedIn" : /(twitter|x)\.com/.test(url) ? "X" : "";

  const body = compact({
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: compact({
      name: resume.name,
      label: resume.title,
      email: resume.contact.email,
      phone: resume.contact.phone,
      url: resume.meta.siteUrl,
      summary: resume.summary,
      location: compact({ city, region: rest.length > 1 ? rest[0] : undefined, countryCode: COUNTRY_CODES[country.toLowerCase()] }),
      profiles: resume.contact.links
        .filter((item) => network(item.url))
        .map((item) => ({
          network: network(item.url),
          username: item.url.replace(/\/+$/, "").split("/").pop(),
          url: item.url
        }))
    }),
    work: resume.experience.map((item) =>
      compact({
        name: item.company,
        position: item.role,
        location: item.location,
        startDate: isoDate(item.start),
        endDate: isoDate(item.end),
        summary: item.summary,
        highlights: item.highlights
      })
    ),
    education: resume.education.map((item) =>
      compact({
        institution: item.institution || undefined,
        ...splitDegree(item.degree, item.detail),
        endDate: lastYear(item.year)
      })
    ),
    skills: resume.skills.map((group) => ({ name: group.category, keywords: group.items })),
    projects: resume.projects.map((project) =>
      compact({
        name: project.title,
        description: project.tagline,
        highlights: project.bullet ? [project.bullet] : [],
        keywords: project.stack,
        url: project.link.url
      })
    ),
    certificates: resume.certifications.map((cert) =>
      compact({ name: cert.name, issuer: cert.issuer, date: isoDate(cert.year), url: cert.url })
    ),
    // Not part of the JSON Resume schema (which allows extra keys); kept so no resume content is lost.
    extraSections: resume.extraSections,
    meta: compact({
      canonical: resume.meta.siteUrl ? `${resume.meta.siteUrl}/resume.json` : undefined,
      version: "v1.0.0",
      lastModified: resume.meta.generatedAt
    })
  });

  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
