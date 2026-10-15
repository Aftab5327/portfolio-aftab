import { mintFormToken } from "@/lib/contact/token";

// A fresh signed timestamp per request: the contact form fetches it when it loads.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(JSON.stringify({ token: mintFormToken() }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
