import { zip } from 'fflate';

const isBlobUrl = (u) => /\.blob\.vercel-storage\.com\//.test(u);

export function fileName(url, index) {
  const base = decodeURIComponent(new URL(url, 'http://x').pathname.split('/').pop() || 'file');
  return index == null ? base : `${String(index + 1).padStart(2, '0')}_${base}`;
}

// Link that makes the browser save the file instead of opening it.
// Vercel Blob is cross-origin, so the `download` attribute alone is ignored there;
// `?download=1` makes Blob send Content-Disposition: attachment.
export function downloadHref(url) {
  return isBlobUrl(url) ? `${url}${url.includes('?') ? '&' : '?'}download=1` : url;
}

function saveBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

// Fetch every file and save them as one ZIP (stored, no recompression).
export async function downloadZip(items, zipName, onProgress) {
  const files = {};
  for (let i = 0; i < items.length; i++) {
    onProgress?.(i, items.length);
    const res = await fetch(items[i].url);
    if (!res.ok) throw new Error(`取得に失敗しました: ${fileName(items[i].url)}`);
    files[fileName(items[i].url, i)] = [new Uint8Array(await res.arrayBuffer()), { level: 0 }];
  }
  onProgress?.(items.length, items.length);
  const data = await new Promise((resolve, reject) =>
    zip(files, (err, out) => (err ? reject(err) : resolve(out)))
  );
  saveBlob(new Blob([data], { type: 'application/zip' }), zipName);
}
