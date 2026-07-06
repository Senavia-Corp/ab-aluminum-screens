// One-off: resize + recompress oversized raster images, reading ORIGINALS from
// _media-backup/ and writing optimized versions to public/ (same format/path, so
// no component markup changes). Re-runnable: always derives from the backup, so
// repeated runs never compound quality loss. Run: node scripts/optimize-public-images.mjs
import sharp from 'sharp';
import { readdir, stat, rename, unlink, copyFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const PAIRS = [
  ['_media-backup/images', 'public/images'],
  ['_media-backup/lead', 'public/lead'],
];
const RASTER = new Set(['.avif', '.webp', '.jpg', '.jpeg', '.png']);

// Cap width by usage. Carousel box is 1200px; about collage is small; the rest
// are content/background images that never display wider than ~1600 CSS px.
function maxWidth(path) {
  if (path.includes('/lead/')) return 1280;
  if (path.includes('/about-')) return 1120;
  return 1600;
}

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

function encode(ext, pipeline) {
  if (ext === '.avif') return pipeline.avif({ quality: 50, effort: 4 });
  if (ext === '.webp') return pipeline.webp({ quality: 62, effort: 4 });
  return pipeline.jpeg({ quality: 62, mozjpeg: true });
}

let before = 0, after = 0, changed = 0, skipped = 0;
for (const [src, dst] of PAIRS) {
  for await (const srcFile of walk(src)) {
    const ext = extname(srcFile).toLowerCase();
    const dstFile = srcFile.replace(src, dst);
    if (!RASTER.has(ext)) { await copyFile(srcFile, dstFile); continue; }
    const orig = (await stat(srcFile)).size;
    before += orig;
    try {
      const meta = await sharp(srcFile).metadata();
      const cap = maxWidth(srcFile);
      let pipe = sharp(srcFile).rotate();
      if (meta.width > cap) pipe = pipe.resize({ width: cap });
      const outExt = ext === '.png' && meta.hasAlpha ? '.png' : ext;
      const tmp = dstFile + '.tmp';
      if (outExt === '.png') await sharp(srcFile).png({ compressionLevel: 9 }).toFile(tmp);
      else await encode(outExt, pipe).toFile(tmp);
      const newSize = (await stat(tmp)).size;
      if (newSize < orig) {
        await rename(tmp, dstFile);
        after += newSize; changed++;
        if (orig - newSize > 50_000)
          console.log(`${(orig / 1024 | 0)}KB -> ${(newSize / 1024 | 0)}KB  ${dstFile}`);
      } else {
        await unlink(tmp);
        await copyFile(srcFile, dstFile);
        after += orig;
      }
    } catch {
      // sharp can't decode some AVIFs; fall back to ffmpeg (dav1d) -> PNG -> sharp.
      try {
        const png = dstFile + '.dec.png';
        execFileSync('ffmpeg', ['-y', '-i', srcFile, '-frames:v', '1', png], { stdio: 'ignore' });
        const cap = maxWidth(srcFile);
        const tmp = dstFile + '.tmp';
        let pipe = sharp(png);
        const m = await sharp(png).metadata();
        if (m.width > cap) pipe = pipe.resize({ width: cap });
        await encode(ext, pipe).toFile(tmp);
        await unlink(png);
        const newSize = (await stat(tmp)).size;
        if (newSize < orig) {
          await rename(tmp, dstFile); after += newSize; changed++;
          console.log(`${(orig / 1024 | 0)}KB -> ${(newSize / 1024 | 0)}KB  ${dstFile} (ffmpeg)`);
        } else { await unlink(tmp); await copyFile(srcFile, dstFile); after += orig; }
      } catch (err2) {
        await copyFile(srcFile, dstFile); after += orig; skipped++;
        console.log(`SKIP (${err2.message.split('\n')[0]}): ${srcFile}`);
      }
    }
  }
}
console.log(`\nChanged ${changed}, skipped ${skipped}. Total ${(before / 1048576).toFixed(1)}MB -> ${(after / 1048576).toFixed(1)}MB`);
