import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  generateCookieValue,
  getAuthCookieOptions,
  checkRateLimit,
  getClientIP,
  COOKIE_NAME,
} from '@/lib/auth';

// Startup check
if (process.env.SITE_PASSWORD && process.env.SITE_PASSWORD.length < 16) {
  console.error('[SECURITY] SITE_PASSWORD is shorter than 16 characters. Use a stronger password.');
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // Rate limiting
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    console.error(`[AUDIT] auth_rate_limited | IP: ${ip}`);
    return NextResponse.json(
      { error: 'Too many attempts' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateCheck.retryAfterSec || 900) },
      }
    );
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const valid = await verifyPassword(password);

    if (!valid) {
      console.error(`[AUDIT] auth_failure | IP: ${ip}`);
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    console.log(`[AUDIT] auth_success | IP: ${ip}`);

    const cookieValue = await generateCookieValue();
    const cookieOpts = getAuthCookieOptions();

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      ...cookieOpts,
      value: cookieValue,
    });

    return response;
  } catch (err) {
    console.error('[auth] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
