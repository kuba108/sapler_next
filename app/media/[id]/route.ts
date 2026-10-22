import { NextRequest, NextResponse } from 'next/server';
import { blobRedirect } from '@/lib/blob-redirect';

/** Redirects an internal /media/<blobId> URL to the S3 object (admin previews). */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const res = await blobRedirect(id);
  return res ?? NextResponse.json({ error: 'not found' }, { status: 404 });
}
