// Sent with every response (pages, API, robots.txt).
const securityHeaders = [
  // Browsers stick to HTTPS for a year. No includeSubDomains or preload while the
  // site lives on a railway.app subdomain: revisit both once it has its own domain.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()" },
  // Only directives that can't break a page. No script-src or style-src yet: Next's
  // streamed inline scripts would need nonces.
  { key: "Content-Security-Policy", value: ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'", "form-action 'self'"].join("; ") },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

module.exports = nextConfig
