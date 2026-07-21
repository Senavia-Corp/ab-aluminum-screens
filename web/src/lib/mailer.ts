import nodemailer from 'nodemailer';

// Server-only. Sends FROM the admin Gmail via SMTP (App Password). NEVER import into a prerendered page.
const USER = import.meta.env.GMAIL_USER as string | undefined;
const PASS = import.meta.env.GMAIL_APP_PASSWORD as string | undefined;
const NOTIFY_TO = (import.meta.env.LEAD_NOTIFY_TO || USER || '')
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

const FROM = `AB Aluminum & Screens <${USER}>`;

// Brand + contact constants (stable; mirror src/lib/nav.ts). Logo MUST be a hosted PNG — email clients don't render SVG.
const SITE = 'https://www.abaluminumandscreens.com';
const LOGO = `${SITE}/images/email/logo.png`;
const PHONE_EN = '(786) 383-6066';
const TEL_EN = '+17863836066';
const PHONE_ES = '(786) 340-5157';
const TEL_ES = '+17863405157';
const PUBLIC_EMAIL = 'info@abaluminumandscreens.com';
const FACEBOOK = 'https://www.facebook.com/abaluminumamdscreens/';
const INSTAGRAM = 'https://www.instagram.com/ab_aluminum/';
const YOUTUBE = 'https://www.youtube.com/@abaluminumandscreens';

const RED = '#ec3c3d';
const RED_DARK = '#cf2c2d';
const BLUE = '#001994';
const INK = '#1c1c1f';
const GRAY = '#6a6566';
const LIGHT = '#f8f8f8';
const BORDER = '#e4e4e4';
const PEACH = '#ffe4dd';

// `service: 'gmail'` resolves host/port/TLS for us. App Password auths as the account → Google signs (DKIM),
// and the From is literally the admin Gmail.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: USER, pass: PASS },
});

// The lead controls these strings — escape before dropping into HTML email.
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (k: string) => k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');

type Lead = {
  name: string;
  email: string;
  phone: string;
  locale: string;
  type: string;
  sourcePage: string;
  photos?: unknown[];
  createdAt?: string;
};

// ---- shared building blocks (table-based, inline styles = renders in Gmail/Outlook/Apple Mail) ----

function button(href: string, text: string, bg: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td align="center" bgcolor="${bg}" style="border-radius:6px;"><a href="${href}" style="display:inline-block;padding:13px 30px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">${esc(text)}</a></td></tr></table>`;
}

function sharedFooter(): string {
  const soc = (href: string, name: string) =>
    `<a href="${href}" style="color:#aeaeb6;text-decoration:none;font-size:12px;">${name}</a>`;
  return `<tr><td style="background:${INK};padding:26px 28px;text-align:center;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;margin:0 0 6px;">AB Aluminum &amp; Screens</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#aeaeb6;line-height:1.7;margin:0 0 12px;">
      <a href="tel:${TEL_EN}" style="color:#aeaeb6;text-decoration:none;">${PHONE_EN}</a> &middot; <a href="tel:${TEL_ES}" style="color:#aeaeb6;text-decoration:none;">${PHONE_ES} (ES)</a><br>
      <a href="mailto:${PUBLIC_EMAIL}" style="color:#aeaeb6;text-decoration:none;">${PUBLIC_EMAIL}</a> &middot; Miami, FL
    </div>
    <div style="margin:0 0 12px;">${soc(FACEBOOK, 'Facebook')} &nbsp;&middot;&nbsp; ${soc(INSTAGRAM, 'Instagram')} &nbsp;&middot;&nbsp; ${soc(YOUTUBE, 'YouTube')}</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6a6566;">&copy; 2026 AB Aluminum &amp; Screens &middot; Site by Senavia Corp</div>
  </td></tr>`;
}

function shell(preheader: string, header: string, body: string): string {
  return `<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>AB Aluminum &amp; Screens</title></head>
<body style="margin:0;padding:0;background:${LIGHT};">
<span style="display:none!important;opacity:0;color:${LIGHT};visibility:hidden;height:0;width:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid ${BORDER};border-radius:8px;overflow:hidden;">
${header}${body}${sharedFooter()}
</table>
</td></tr></table></body></html>`;
}

// ---- 1. Internal notification (admin + client) ----

function internalEmail(lead: Lead, payload: Record<string, unknown>): { subject: string; html: string; text: string } {
  const when = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(lead.createdAt || new Date().toISOString()));

  const rows: string[] = [];
  const addRow = (k: string, valueHtml: string, last = false) => {
    const br = last ? '' : 'border-bottom:1px solid #eeeeee;';
    rows.push(`<tr><td style="padding:10px 0;${br}font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${GRAY};width:130px;vertical-align:top;">${esc(k)}</td><td style="padding:10px 0;${br}font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${INK};vertical-align:top;line-height:1.5;">${valueHtml}</td></tr>`);
  };

  addRow('Name', esc(lead.name));
  addRow('Email', `<a href="mailto:${esc(lead.email)}" style="color:#185fa5;text-decoration:none;">${esc(lead.email)}</a>`);
  addRow('Phone', `<a href="tel:${esc(lead.phone)}" style="color:#185fa5;text-decoration:none;">${esc(lead.phone)}</a>`);
  const cityZip = [payload.city, payload.zip].filter(Boolean).map((v) => esc(String(v))).join(' · ');
  if (cityZip) addRow('City / Zip', cityZip);
  if (payload.interest) addRow('Interest', esc(String(payload.interest)));
  if (payload.timeline) addRow('Timeline', esc(String(payload.timeline)));
  if (lead.photos?.length) addRow('Photos', `${lead.photos.length} attached — view in Sanity`);

  // Estimator leads carry a structured estimate — render it as a readable summary,
  // never as raw JSON/arrays. These keys are consumed here, not by the generic dump.
  const usd = (n: unknown) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
  const isEstimate = payload.estimateLow != null && payload.breakdown && typeof payload.breakdown === 'object';
  let estimateBlock = '';
  let estimateText = '';
  if (isEstimate) {
    const bd = payload.breakdown as Record<string, number>;
    const LINE_NAMES: [string, string][] = [
      ['engineering', 'Design, 3D & Engineering'],
      ['permits', 'Permits & Inspections'],
      ['materials', 'Materials & Hardware'],
      ['construction', 'Construction & Installation'],
    ];
    const summary = Array.isArray(payload.summary) ? (payload.summary as { l: string; v: string }[]) : [];
    const addonLabels = Array.isArray(payload.addonLabels) ? (payload.addonLabels as string[]).map(String) : [];
    const range = `${usd(payload.estimateLow)} – ${usd(payload.estimateHigh)}`;
    const subtotal = LINE_NAMES.reduce((s, [k]) => s + (Number(bd[k]) || 0), 0);

    const optRows: string[] = [];
    const optRow = (k: string, v: string, bold = false) =>
      optRows.push(`<tr><td style="padding:7px 12px;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${GRAY};width:150px;">${esc(k)}</td><td style="padding:7px 12px;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${INK};${bold ? 'font-weight:bold;' : ''}">${esc(v)}</td></tr>`);
    if (payload.interest) optRow('Project', String(payload.interest), true);
    if (payload.dimensions) optRow('Size', String(payload.dimensions));
    for (const s of summary) if (s && s.l != null && s.v != null) optRow(String(s.l), String(s.v));
    optRow('Add-ons', addonLabels.length ? addonLabels.join(', ') : 'None');

    const moneyRows = LINE_NAMES.map(
      ([k, label]) =>
        `<tr><td style="padding:7px 12px;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${INK};">${esc(label)}</td><td align="right" style="padding:7px 12px;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${INK};white-space:nowrap;">${usd(bd[k])}</td></tr>`,
    );
    moneyRows.push(
      `<tr><td style="padding:7px 12px;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${INK};">Subtotal</td><td align="right" style="padding:7px 12px;border-bottom:1px solid #eeeeee;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${INK};white-space:nowrap;">${usd(subtotal)}</td></tr>`,
      `<tr><td style="padding:9px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:${RED_DARK};">Estimate range</td><td align="right" style="padding:9px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:${RED_DARK};white-space:nowrap;">${esc(range)}</td></tr>`,
    );

    estimateBlock = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;color:${GRAY};letter-spacing:.5px;margin:4px 0 8px;">INSTANT ESTIMATE (from the website calculator)</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:6px;margin:0 0 12px;">${optRows.join('')}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:6px;margin:0 0 22px;background:${LIGHT};">${moneyRows.join('')}</table>`;

    estimateText = `\nInstant estimate:\n${payload.interest ? `Project: ${payload.interest}\n` : ''}${payload.dimensions ? `Size: ${payload.dimensions}\n` : ''}${summary.map((s) => `${s.l}: ${s.v}`).join('\n')}\nAdd-ons: ${addonLabels.length ? addonLabels.join(', ') : 'None'}\n${LINE_NAMES.map(([k, label]) => `${label}: ${usd(bd[k])}`).join('\n')}\nSubtotal: ${usd(subtotal)}\nEstimate range: ${range}\n`;
  }

  // Any other non-empty scalar fields we don't render explicitly (arrays join; objects never dump raw).
  const known = new Set([
    'ref_id', 'name', 'fullName', 'email', 'phone', 'city', 'zip', 'interest', 'timeline', 'message',
    'structure', 'sqft', 'dimensions', 'material', 'attachment', 'roofType', 'operation', 'cageStyle',
    'height', 'subtype', 'mesh', 'addons', 'addonLabels', 'summary', 'breakdown', 'estimateLow', 'estimateHigh',
  ]);
  for (const [k, v] of Object.entries(payload)) {
    if (known.has(k) || v == null) continue;
    const s = Array.isArray(v) ? v.filter((x) => typeof x !== 'object').map(String).join(', ') : typeof v === 'object' ? '' : String(v);
    if (!s.trim()) continue;
    addRow(cap(k), esc(s));
  }
  if (payload.message) addRow('Message', esc(String(payload.message)), true);

  const header = `<tr><td style="background:${BLUE};padding:18px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;">New lead from the website</td></tr>`;
  const body = `<tr><td style="padding:20px 28px 26px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${GRAY};margin:0 0 4px;">${esc(lead.type)} &middot; ${esc(lead.sourcePage || '—')} &middot; ${esc(when)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">${rows.join('')}</table>
    ${estimateBlock}
    ${button(`mailto:${esc(lead.email)}`, `Reply to ${String(lead.name).split(' ')[0] || 'customer'}`, BLUE)}
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${GRAY};text-align:center;margin:14px 0 0;">Replying goes straight to the customer (Reply-To is set to their email).</div>
  </td></tr>`;

  const text = `New lead — ${lead.name}
Type: ${lead.type} | Page: ${lead.sourcePage || '—'} | ${when}

Name: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone}
${cityZip ? `City/Zip: ${[payload.city, payload.zip].filter(Boolean).join(' / ')}\n` : ''}${payload.interest ? `Interest: ${payload.interest}\n` : ''}${payload.timeline ? `Timeline: ${payload.timeline}\n` : ''}${lead.photos?.length ? `Photos: ${lead.photos.length} (view in Sanity)\n` : ''}${estimateText}${payload.message ? `Message: ${payload.message}\n` : ''}`;

  const subjectProject = payload.interest ? ` — ${payload.interest}` : '';
  return { subject: `New lead — ${lead.name}${subjectProject} (${lead.type})`, html: shell(`New lead: ${lead.name} · ${payload.interest || lead.type} · ${lead.phone}`, header, body), text };
}

// ---- 2. Confirmation to the prospect (bilingual) ----

function confirmationEmail(lead: Lead, payload: Record<string, unknown>): { subject: string; html: string; text: string } {
  const es = lead.locale === 'es';
  const first = esc(String(lead.name).split(' ')[0] || lead.name);
  const svc = payload.interest ? esc(String(payload.interest)) : '';
  const msg = payload.message ? esc(String(payload.message)) : '';
  const phoneDisplay = es ? PHONE_ES : PHONE_EN;
  const tel = es ? TEL_ES : TEL_EN;

  const t = es
    ? {
        eyebrow: 'Solicitud recibida',
        greeting: `¡Gracias, ${first}!`,
        intro: `Recibimos tu solicitud${svc ? ` de proyecto — <strong style="color:${INK};">${svc}</strong>` : ''}. Uno de nuestros especialistas te contactará muy pronto para ayudarte con tu proyecto.`,
        reqLabel: 'Tu solicitud',
        nextLabel: 'Qué sigue',
        steps: ['Revisamos tus datos y preparamos un estimado a tu medida.', 'Un especialista te llama en 1 día hábil.', 'Agendamos una medición gratuita en sitio.'],
        cta: `Llámanos: ${phoneDisplay}`,
        reply: '¿Lo necesitas antes? Responde a este correo cuando quieras.',
      }
    : {
        eyebrow: 'Request received',
        greeting: `Thank you, ${first}!`,
        intro: `We've received your project request${svc ? ` — <strong style="color:${INK};">${svc}</strong>` : ''}. One of our specialists will reach out shortly to help bring your project to life.`,
        reqLabel: 'Your request',
        nextLabel: 'What happens next',
        steps: ['We review your details and prepare a tailored estimate.', 'A specialist calls you within 1 business day.', 'We schedule a free on-site measurement.'],
        cta: `Call us: ${phoneDisplay}`,
        reply: 'Need it sooner? Reply to this email anytime.',
      };

  const step = (n: number, txt: string) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 10px;"><tr><td width="28" valign="top"><div style="width:24px;height:24px;background:${PEACH};border-radius:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${RED_DARK};text-align:center;line-height:24px;">${n}</div></td><td style="padding-left:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#303030;line-height:1.5;">${esc(txt)}</td></tr></table>`;

  const header = `<tr><td align="center" style="background:#ffffff;padding:24px 28px 20px;border-bottom:3px solid ${RED};"><img src="${LOGO}" width="220" height="80" alt="AB Aluminum &amp; Screens" style="display:block;border:0;outline:none;width:220px;height:80px;"></td></tr>`;

  const body = `<tr><td style="padding:30px 28px 8px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${RED_DARK};letter-spacing:.4px;margin:0 0 6px;">${t.eyebrow}</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:23px;font-weight:bold;color:${INK};line-height:1.25;margin:0 0 14px;">${t.greeting}</div>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#444441;line-height:1.6;margin:0 0 20px;">${t.intro}</p>
    ${msg ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td style="background:${LIGHT};border:1px solid #eeeeee;border-radius:6px;padding:14px 16px;"><div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${GRAY};margin:0 0 6px;letter-spacing:.5px;">${t.reqLabel}</div><div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#303030;line-height:1.6;">${msg}</div></td></tr></table>` : ''}
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${GRAY};letter-spacing:.4px;margin:0 0 12px;">${t.nextLabel}</div>
    ${step(1, t.steps[0])}${step(2, t.steps[1])}${step(3, t.steps[2])}
    <div style="margin:22px 0 8px;">${button(`tel:${tel}`, t.cta, RED)}</div>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${GRAY};text-align:center;margin:14px 0 4px;">${t.reply}</p>
  </td></tr>`;

  const text = `${t.greeting}\n\n${t.intro.replace(/<[^>]+>/g, '')}\n\n${t.nextLabel}:\n1. ${t.steps[0]}\n2. ${t.steps[1]}\n3. ${t.steps[2]}\n\n${t.cta}\n\nAB Aluminum & Screens · ${PUBLIC_EMAIL}`;

  return {
    subject: es ? '¡Gracias por contactarnos! — AB Aluminum & Screens' : 'Thanks for reaching out! — AB Aluminum & Screens',
    html: shell(es ? `Recibimos tu solicitud, ${first}. Te contactamos en 1 día hábil.` : `We got your request, ${first}. We'll reach out within 1 business day.`, header, body),
    text,
  };
}

// Sends the internal notification + a confirmation to the prospect.
// Throws on SMTP failure — callers wrap in try/catch so a mail error never loses the lead.
export async function sendLeadEmails(lead: Lead, payload: Record<string, unknown>): Promise<void> {
  const internal = internalEmail(lead, payload);
  await transporter.sendMail({
    from: FROM,
    to: NOTIFY_TO,
    replyTo: lead.email,
    subject: internal.subject,
    html: internal.html,
    text: internal.text,
  });

  const conf = confirmationEmail(lead, payload);
  await transporter.sendMail({
    from: FROM,
    to: lead.email,
    subject: conf.subject,
    html: conf.html,
    text: conf.text,
  });
}
