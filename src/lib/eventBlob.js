import { del } from '@vercel/blob';

const isBlobUrl = (u) => typeof u === 'string' && /\.blob\.vercel-storage\.com\//.test(u);

// Remove uploaded files from Vercel Blob. Files bundled in /public are left alone.
export async function deleteBlobs(urls) {
  const targets = urls.filter(isBlobUrl);
  if (!targets.length || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(targets);
  } catch (e) {
    console.error('Blob delete failed:', e);
  }
}
