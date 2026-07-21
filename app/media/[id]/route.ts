import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { s3PublicUrl, s3SignedGetUrl } from '@/lib/s3';

/** Redirects an internal /media/<blobId> URL to the S3 object (admin previews). */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let blob;
  try {
    blob = await prisma.active_storage_blobs.findUnique({ where: { id: BigInt(id) } });
  } catch {
    return NextResponse.json({ error: 'invalid id' }, { status: 404 });
  }
  if (!blob) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let url: string;
  try {
    url = process.env.S3_PUBLIC === 'true' ? s3PublicUrl(blob.key) : await s3SignedGetUrl(blob.key);
  } catch {
    url = s3PublicUrl(blob.key);
  }
  return NextResponse.redirect(url, 302);
}
