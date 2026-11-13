export function parseApiBaseUrl(value: string | undefined): string {
  const message =
    'NEXT_PUBLIC_API_BASE_URL must be an absolute HTTPS URL ending in /api/v1 (HTTP is allowed for loopback development).';

  if (!value || value !== value.trim()) throw new Error(message);

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(message);
  }

  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const pathname = url.pathname.replace(/\/$/, '');
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback)) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    pathname !== '/api/v1'
  ) {
    throw new Error(message);
  }

  return `${url.origin}${pathname}`;
}

export function getApiBaseUrl(): string {
  // Keep the direct property access so Next.js can inline this public value.
  return parseApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
}
