// ============================================================
// Auth utilities — password hashing, cookie verification, CSRF
// ============================================================

const COOKIE_NAME = 'mc-auth';
const COOKIE_MAX_AGE = 604800; // 7 days

// ── Rate limiting (in-memory, resets on cold start) ─────────
interface RateEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateEntry>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count++;
  return { allowed: true };
}

// ── Hashing ─────────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateCookieValue(): Promise<string> {
  const password = process.env.SITE_PASSWORD || '';
  const secret = process.env.COOKIE_SECRET || '';
  return sha256(password + secret);
}

export async function verifyPassword(input: string): Promise<boolean> {
  const password = process.env.SITE_PASSWORD || '';
  if (!password) return false;
  return input === password;
}

export async function verifyCookie(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await generateCookieValue();
  return cookieValue === expected;
}

// ── Cookie helpers ──────────────────────────────────────────

export function getAuthCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
}

export { COOKIE_NAME };

// ── CSRF ────────────────────────────────────────────────────

export function verifyOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;

  const allowed: string[] = [];
  if (process.env.VERCEL_URL) {
    allowed.push(`https://${process.env.VERCEL_URL}`);
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    allowed.push(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (allowed.length === 0) {
    allowed.push('http://localhost:3000');
  }

  return allowed.includes(origin);
}

// ── IP extraction ───────────────────────────────────────────

export function getClientIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
