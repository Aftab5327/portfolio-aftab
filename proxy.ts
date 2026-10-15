/**
 * Protects /admin/* and /api/admin/* with HTTP Basic Auth (ADMIN_USER / ADMIN_PASSWORD).
 * - Credentials not configured → 404, as if the admin area didn't exist.
 * - Missing or wrong credentials → 401 with a Basic challenge.
 * - Every admin response carries X-Robots-Tag: noindex.
 * Next 16 "proxy" (formerly middleware); runs on the Node.js runtime. The comparison
 * uses Web Crypto, which is available in both Node and Edge.
 */
import { NextResponse, type NextRequest } from "next/server";

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };

const NOINDEX = { "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "no-store" };

const encoder = new TextEncoder();

/** Compares SHA-256 digests byte by byte without short-circuiting (length-independent, constant time). */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([crypto.subtle.digest("SHA-256", encoder.encode(a)), crypto.subtle.digest("SHA-256", encoder.encode(b))]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i += 1) diff |= x[i] ^ y[i];
  return diff === 0;
}

function parseBasic(header: string | null): { user: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6).trim());
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return { user: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USER?.trim();
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!expectedUser || !expectedPassword) {
    return new NextResponse("Not Found", { status: 404, headers: { ...NOINDEX, "Content-Type": "text/plain" } });
  }

  const credentials = parseBasic(request.headers.get("authorization"));
  // Always compare both fields so timing doesn't reveal which one was wrong.
  const [userOk, passwordOk] = await Promise.all([
    safeEqual(credentials?.user ?? "", expectedUser),
    safeEqual(credentials?.password ?? "", expectedPassword)
  ]);

  if (!credentials || !userOk || !passwordOk) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { ...NOINDEX, "Content-Type": "text/plain", "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' }
    });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(NOINDEX)) response.headers.set(key, value);
  return response;
}
