// Lead-source attribution. Captured in the browser at submit time and stored on the lead so each
// notification email can say WHERE the lead came from (Google Ads vs organic/direct/referral).
//
// The decisive "came from a Google Ads click" signal is the `_gcl_aw` first-party cookie: the GTM
// Conversion Linker writes it on the ad-click landing (auto-tagging is on) and it persists ~90 days,
// so it survives even when the user browses to another page before submitting. Presence of a gclid
// ⇒ this lead is attributable to a paid Google click; absence ⇒ organic/direct/referral.
//
// Everything here is best-effort and MUST never throw — a failure to read attribution must not block
// or alter a real lead submission. It also does not touch the conversion flow (ab_lead / redirect).

export type Attribution = {
  gclid: string; // Google Ads click id (URL or _gcl_aw cookie)
  wbraid: string; // iOS web-to-app click id
  gbraid: string; // iOS app-to-web click id
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referrer: string; // document.referrer at submit (hint only; internal page on multi-page sessions)
  landingPath: string; // path+query of the page the form was submitted from
};

const EMPTY: Attribution = {
  gclid: '', wbraid: '', gbraid: '', utm_source: '', utm_medium: '', utm_campaign: '', referrer: '', landingPath: '',
};

// `_gcl_aw` is "GCL.<timestamp>.<gclid>" (gclid itself is dot-free, but slice+join is dot-safe).
// Anything without the 3-part shape is not a valid gcl cookie → return '' (avoid false positives).
export function parseGclAw(raw: string): string {
  const parts = (raw || '').split('.');
  return parts.length >= 3 ? parts.slice(2).join('.') : '';
}

function cookie(name: string): string {
  try {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = document.cookie.match(new RegExp('(?:^|; )' + esc + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  } catch {
    return '';
  }
}

// Browser-only. Never throws — returns a fully-populated object with '' for anything unavailable.
export function getAttribution(): Attribution {
  try {
    const p = new URLSearchParams(location.search);
    return {
      gclid: p.get('gclid') || parseGclAw(cookie('_gcl_aw')) || '',
      wbraid: p.get('wbraid') || '',
      gbraid: p.get('gbraid') || '',
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      referrer: document.referrer || '',
      landingPath: location.pathname + location.search,
    };
  } catch {
    return { ...EMPTY };
  }
}

// Pure classifier used server-side (mailer). Priority: paid Google click → UTM → referrer host → direct.
export function classifySource(a?: Partial<Attribution> | null): { label: string; detail: string; isPaidGoogle: boolean } {
  if (!a) return { label: 'Direct / unknown', detail: '', isPaidGoogle: false };

  const gclid = a.gclid || a.wbraid || a.gbraid || '';
  if (gclid) return { label: 'Google Ads', detail: `gclid ${gclid.slice(0, 16)}${gclid.length > 16 ? '…' : ''}`, isPaidGoogle: true };

  if (a.utm_source) {
    const src = a.utm_medium ? `${a.utm_source} / ${a.utm_medium}` : a.utm_source;
    return { label: src, detail: a.utm_campaign || '', isPaidGoogle: false };
  }

  const ref = a.referrer || '';
  if (!ref) return { label: 'Direct / unknown', detail: '', isPaidGoogle: false };
  let host = '';
  try {
    host = new URL(ref).hostname.replace(/^www\./, '');
  } catch {
    return { label: 'Direct / unknown', detail: '', isPaidGoogle: false };
  }
  if (/(^|\.)(google|bing|yahoo|duckduckgo|ecosia|brave)\./.test(host)) return { label: 'Organic search', detail: host, isPaidGoogle: false };
  if (/(^|\.)(chatgpt|openai|perplexity|gemini|bard|claude|copilot)\./.test(host)) return { label: 'AI assistant', detail: host, isPaidGoogle: false };
  if (/(^|\.)(facebook|instagram|t\.co|twitter|x|linkedin|youtube|tiktok|pinterest)\./.test(host)) return { label: 'Social', detail: host, isPaidGoogle: false };
  if (host.includes('abaluminumandscreens')) return { label: 'Direct (internal nav)', detail: '', isPaidGoogle: false };
  return { label: 'Referral', detail: host, isPaidGoogle: false };
}
