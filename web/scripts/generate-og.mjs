// Regenerates the default Open Graph image: public/images/og-default.jpg (1200×630 JPG).
// Branded composite = real project photo + legibility scrim + white logo + tagline.
// Run from web/:  node scripts/generate-og.mjs
// ponytail: a one-shot asset builder, not a pipeline. Re-run if the source photo or brand changes.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const W = 1200, H = 630, PAD = 72;
const src = 'public/images/about-outdoor-kitchen-pergola-miami-fl.jpg';
const out = 'public/images/og-default.jpg';

const base = await sharp(src).resize(W, H, { fit: 'cover', position: 'attention' }).toBuffer();

const logoW = 430;
const logoH = Math.round((logoW * 36.3) / 100); // logo viewBox is 100 × 36.3
const logoX = PAD;
const logoY = H - PAD - logoH - 96; // room for the tagline below the logo

const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="1" x2="0.9" y2="0">
      <stop offset="0" stop-color="#05082a" stop-opacity="0.86"/>
      <stop offset="0.55" stop-color="#05082a" stop-opacity="0.46"/>
      <stop offset="1" stop-color="#05082a" stop-opacity="0.12"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="${PAD}" y="${logoY + logoH + 30}" width="64" height="5" rx="2.5" fill="#ec3c3d"/>
  <text x="${PAD}" y="${logoY + logoH + 74}" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">Aluminum Pergolas · Pool Enclosures · Screen Rooms</text>
  <text x="${PAD}" y="${logoY + logoH + 112}" font-family="Helvetica, Arial, sans-serif" font-size="23" font-weight="400" fill="#ffd2cd">Licensed &amp; Insured · Miami-Dade · Broward · Palm Beach</text>
</svg>`);

const logo = await sharp(readFileSync('public/images/Logo-White.svg'), { density: 300 })
  .resize(logoW, logoH)
  .png()
  .toBuffer();

await sharp(base)
  .composite([
    { input: overlay, top: 0, left: 0 },
    { input: logo, top: logoY, left: logoX },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(out);

const m = await sharp(out).metadata();
const st = await sharp(out).stats();
const mean = (st.channels.reduce((s, c) => s + c.mean, 0) / st.channels.length).toFixed(1);
console.log(`WROTE ${out} ${m.width}x${m.height} ${m.format} mean-brightness=${mean} (>15 = not black)`);
