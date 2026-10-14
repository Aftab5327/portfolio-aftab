import { buildResume } from "@/lib/resume";
import { renderResumePdf } from "@/lib/resume-pdf";

// Generated once at build time, so every deploy ships a resume that matches the site.
export const dynamic = "force-static";

export async function GET() {
  const resume = buildResume();
  const pdf = await renderResumePdf(resume);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${resume.meta.fileName}"`,
      "Content-Length": String(pdf.length)
    }
  });
}
