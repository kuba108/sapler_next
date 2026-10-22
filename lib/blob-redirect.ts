import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';
import { s3PublicUrl, s3SignedGetUrl } from './s3';

// Presigned URLs live this long; the CDN keeps the redirect a bit shorter so it never serves an expired one.
const SIGNED_URL_TTL = 60 * 60;
const SIGNED_REDIRECT_CDN_TTL = 50 * 60;
const PUBLIC_REDIRECT_CDN_TTL = 60 * 60 * 24 * 30;

/**
 * A blob's S3 key never changes (a new upload creates a new blob), so the lookup is cached for good.
 * A missing blob throws instead of returning null, so that result is never cached for an id that
 * may be created later.
 */
const cachedBlobKey = unstable_cache(
  async (blobId: string) => {
    const blob = await prisma.active_storage_blobs.findUnique({ where: { id: BigInt(blobId) } });
    if (!blob) throw new Error(`blob ${blobId} not found`);
    return blob.key;
  },
  ['blob-key'],
);

/**
 * 302 to the S3 object behind a blob, cacheable by the CDN so repeated image requests
 * reach neither the function nor the DB. Returns null when the blob doesn't exist.
 */
export async function blobRedirect(blobId: string | number): Promise<NextResponse | null> {
  let key: string;
  try {
    key = await cachedBlobKey(String(blobId));
  } catch {
    return null;
  }

  // Prefer a presigned URL when the bucket is private; fall back to public URL.
  let url: string;
  let cdnTtl = PUBLIC_REDIRECT_CDN_TTL;
  if (process.env.S3_PUBLIC === 'true') {
    url = s3PublicUrl(key);
  } else {
    try {
      url = await s3SignedGetUrl(key, SIGNED_URL_TTL);
      cdnTtl = SIGNED_REDIRECT_CDN_TTL;
    } catch {
      url = s3PublicUrl(key);
    }
  }

  const res = NextResponse.redirect(url, 302);
  res.headers.set('Cache-Control', `public, max-age=0, s-maxage=${cdnTtl}`);
  return res;
}
