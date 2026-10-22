import { NextRequest, NextResponse } from 'next/server';
import { blobIdFromSignedId } from '@/lib/active-storage';
import { blobRedirect } from '@/lib/blob-redirect';

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

  const res = await blobRedirect(blobId);
  return res ?? NextResponse.json({ error: 'blob not found' }, { status: 404 });
}
