const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.cakto.com.br",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "frame-src https://player.vimeo.com https://cal.com https://*.cal.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://cal.com https://api.cal.com",
  "object-src 'none'",
  "base-uri 'self'",
  "report-uri /api/csp-report",
].join("; ");

const PRIVATE_PREFIXES = ["/dashboard", "/admin", "/api/"];
const NON_OVERRIDE_HEADERS = new Set(["Cache-Control", "Vary"]);

export function getSecurityHeaders(url: URL): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "0",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy-Report-Only": CSP_REPORT_ONLY,
  };

  if (url.protocol === "https:") {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
  }

  const isPrivate = PRIVATE_PREFIXES.some((p) => url.pathname.startsWith(p));
  if (isPrivate) {
    headers["Cache-Control"] = "private, no-store, max-age=0";
    headers.Vary = "Cookie";
  }

  return headers;
}

export function applySecurityHeaders(response: Response, url: URL): Response {
  const headers = new Headers(response.headers);

  for (const [key, value] of Object.entries(getSecurityHeaders(url))) {
    if (NON_OVERRIDE_HEADERS.has(key) && headers.has(key)) continue;
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
