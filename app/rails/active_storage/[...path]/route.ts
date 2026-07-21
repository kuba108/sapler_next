import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { blobIdFromSignedId } from '@/lib/active-storage';
import { s3PublicUrl, s3SignedGetUrl } from '@/lib/s3';

/**
 * Active Storage compatible blob serving.
 *
 * Mirrors the Rails route
 *   /rails/active_storage/blobs/redirect/:signed_id/:filename
 * (and representations/redirect/...). We decode the blob id from the signed id,
 * look up the S3 object key and 302-redirect to the object. This lets the
 * existing DB content render images straight from S3 without migration.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;

  const redirectIdx = path.indexOf('redirect');
  const signedId = redirectIdx !== -1 ? path[redirectIdx + 1] : undefined;
  if (!signedId) {
    return NextResponse.json({ error: 'invalid signed id' }, { status: 404 });
  }

  const blobId = blobIdFromSignedId(signedId);
  if (blobId == null) {
    return NextResponse.json({ error: 'cannot decode blob id' }, { status: 404 });
  }

  const blob = await prisma.active_storage_blobs.findUnique({
    where: { id: BigInt(blobId) },
  });
  if (!blob) {
    return NextResponse.json({ error: 'blob not found' }, { status: 404 });
  }

  // Prefer a presigned URL when the bucket is private; fall back to public URL.
  let url: string;
  try {
    url = process.env.S3_PUBLIC === 'true'
      ? s3PublicUrl(blob.key)
      : await s3SignedGetUrl(blob.key);
  } catch {
    url = s3PublicUrl(blob.key);
  }

  return NextResponse.redirect(url, 302);
}
