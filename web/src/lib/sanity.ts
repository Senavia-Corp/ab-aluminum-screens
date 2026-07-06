import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

// Public, read-only at build time. The write token is server-only (api/lead + scripts).
export const sanity = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID || 'zsdw057t',
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2024-10-01',
  useCdn: true,
});

const builder = imageUrlBuilder(sanity);

/** Build a transformed Sanity image URL. Returns '' for missing sources. */
export function urlFor(src: SanityImageSource | undefined | null) {
  if (!src) return null;
  return builder.image(src);
}

// Videos live as plain R2 URL strings (service.engineered.videoUrl, projectVideo.videoUrl).
// Render them directly in <video> — never run them through urlFor.
