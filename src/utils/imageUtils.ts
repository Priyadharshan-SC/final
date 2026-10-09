/**
 * Utility to format, sanitize, and normalize image sources for optical inspection views.
 * Handles data URLs, raw base64 strings, duplicate prefixes, Vite proxy URLs, and remote URLs.
 */
export function formatImageSrc(src?: string | null): string {
  if (!src) return '';
  let s = src.trim();
  if (!s) return '';

  // Fix accidental duplicate data-URL prefixes (e.g. data:image/jpeg;base64,data:image/jpeg;base64,...)
  while (
    s.startsWith('data:image/jpeg;base64,data:image/') ||
    s.startsWith('data:image/png;base64,data:image/') ||
    s.startsWith('data:image/jpeg;base64,http')
  ) {
    s = s.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
  }

  // If it's already a valid data URL
  if (s.startsWith('data:image/')) {
    return s;
  }

  // Convert hardcoded localhost:8000/api or 127.0.0.1:8000/api to relative /api to use Vite proxy reliably
  if (s.startsWith('http://localhost:8000/api')) {
    return s.replace('http://localhost:8000', '');
  }
  if (s.startsWith('http://127.0.0.1:8000/api')) {
    return s.replace('http://127.0.0.1:8000', '');
  }

  // Relative API routes (Vite proxy)
  if (s.startsWith('/api') || s.startsWith('/static')) {
    return s;
  }

  // Remote or fully qualified URLs
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('blob:')) {
    return s;
  }

  // Fallback: Assume raw base64 string
  return `data:image/jpeg;base64,${s}`;
}
