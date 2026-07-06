import { createClient } from '@sanity/client';

// Server-only client with write token. NEVER import this into a prerendered page.
export const sanityWrite = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID || 'zsdw057t',
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2024-10-01',
  token: import.meta.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});
