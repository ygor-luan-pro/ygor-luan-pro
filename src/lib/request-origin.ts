export function isSameOrigin(request: Request): boolean {
  if (import.meta.env.DEV === true && import.meta.env.MODE !== 'test') return true;
  const siteUrl = import.meta.env.PUBLIC_SITE_URL;
  if (!siteUrl) return false;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}
