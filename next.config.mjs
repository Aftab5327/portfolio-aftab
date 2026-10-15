const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Shown on /stats as "last build".
    BUILD_TIME: new Date().toISOString()
  },
  experimental: {
    // Load these from node_modules at runtime instead of bundling them: react-pdf relies on Node APIs and its
    // own React reconciler; gray-matter (build-log frontmatter) pulls in optional parser engines.
    serverComponentsExternalPackages: ["@react-pdf/renderer", "gray-matter"]
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

export default nextConfig;
