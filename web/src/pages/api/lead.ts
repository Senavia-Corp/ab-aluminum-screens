import type { APIRoute } from 'astro';
import { sanityWrite } from '../../lib/sanityServer';
import { sendLeadEmails } from '../../lib/mailer';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const isEmail = (s: unknown) => typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

const TURNSTILE_SECRET = import.meta.env.TURNSTILE_SECRET as string | undefined;

// Verify the Cloudflare Turnstile token server-side. No token → reject. Cloudflare unreachable → allow
// (don't lose real leads during an outage; honeypot + time-trap + rate-limit still apply).
async function humanVerified(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // not configured (e.g. local dev) → skip rather than block everything
  if (!token) return false;
  const body = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token });
  if (ip && ip !== 'unknown') body.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const d = (await r.json()) as { success?: boolean };
    return !!d.success;
  } catch {
    console.warn('turnstile verify network error — allowing');
    return true;
  }
}

// ponytail: per-instance in-memory throttle — best-effort on Fluid Compute (instances are reused but
// not shared across the fleet). Stops trivial floods; upgrade to Vercel KV/Upstash if abuse warrants.
// {{PENDIENTE: durable cross-instance rate-limit if spam persists}}
const RL_WINDOW_MS = 8000;
const lastHit = new Map<string, number>();

export const POST: APIRoute = async ({ request }) => {
  try {
    // Flood guard (before any parsing / photo upload).
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const now = Date.now();
    const prev = lastHit.get(ip);
    if (prev && now - prev < RL_WINDOW_MS) {
      return json({ ok: false, error: 'Too many requests. Please wait a moment.' }, 429);
    }
    lastHit.set(ip, now);
    const ctype = request.headers.get('content-type') || '';
    let locale = 'en';
    let type = 'inline';
    let sourcePage = '';
    let payload: Record<string, any> = {};
    let turnstileToken = '';
    let elapsedMs = 0;
    const photoRefs: { _type: 'image'; _key: string; asset: { _type: 'reference'; _ref: string } }[] = [];

    if (ctype.includes('multipart/form-data')) {
      const fd = await request.formData();
      locale = String(fd.get('locale') || 'en');
      type = String(fd.get('type') || 'request-estimate');
      sourcePage = String(fd.get('sourcePage') || '');
      const raw = fd.get('payload');
      payload = raw ? JSON.parse(String(raw)) : {};
      turnstileToken = String(fd.get('turnstileToken') || '');
      elapsedMs = Number(fd.get('elapsedMs')) || 0;
      const files = fd.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
      // ponytail: cap at 8 photos / 8MB each — enough for a lead, bounds the function.
      for (const file of files.slice(0, 8)) {
        if (file.size > 8 * 1024 * 1024) continue;
        const buf = Buffer.from(await file.arrayBuffer());
        const asset = await sanityWrite.assets.upload('image', buf, {
          filename: file.name || 'photo.jpg',
        });
        photoRefs.push({
          _type: 'image',
          _key: asset._id.slice(-12),
          asset: { _type: 'reference', _ref: asset._id },
        });
      }
    } else {
      const body = await request.json();
      locale = body.locale || 'en';
      type = body.type || 'inline';
      sourcePage = body.sourcePage || '';
      payload = body.payload || body || {};
      turnstileToken = String(body.turnstileToken || '');
      elapsedMs = Number(body.elapsedMs) || 0;
    }

    // Honeypot: a real user never fills this hidden field. Pretend success, write nothing.
    if (payload.company_url) {
      return json({ ok: true });
    }

    // Time-trap: humans take more than a couple seconds to fill a form; instant submits are bots.
    // Silent no-op like the honeypot (don't tip off the bot). Only applies when the client sent timing.
    if (elapsedMs && elapsedMs < 2500) {
      return json({ ok: true });
    }

    const name = payload.name || payload.fullName;
    const email = payload.email;
    const phone = payload.phone;

    if (!name || !isEmail(email) || !phone) {
      return json({ ok: false, error: 'Missing or invalid required fields.' }, 400);
    }

    // Human check (Cloudflare Turnstile) — bots can't mint a valid token. Reject before saving or emailing.
    if (!(await humanVerified(turnstileToken, ip))) {
      return json({ ok: false, error: 'Verification failed. Please refresh and try again.' }, 403);
    }

    const doc = {
      _type: 'lead',
      name: String(name),
      email: String(email),
      phone: String(phone),
      locale,
      type,
      sourcePage,
      payload: JSON.stringify(payload),
      photos: photoRefs.length ? photoRefs : undefined,
      createdAt: new Date().toISOString(),
    };

    const created = await sanityWrite.create(doc);

    // Notify team + confirm to prospect. Lead is already saved — never fail the request on a mail error.
    try {
      await sendLeadEmails(doc, payload);
    } catch (mailErr) {
      console.error('lead email error', mailErr);
    }

    return json({ ok: true, id: created._id });
  } catch (err) {
    console.error('lead error', err);
    return json({ ok: false, error: 'Server error' }, 500);
  }
};
