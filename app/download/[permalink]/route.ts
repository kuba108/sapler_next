import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { firstAttachmentBlobId } from '@/lib/media';
import { s3SignedDownloadUrl } from '@/lib/s3';

/** Public download link for a Media/Asset file, ported from Rails' /download/:permalink. */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ permalink: string }> },
) {
  const { permalink } = await ctx.params;
  const asset = await prisma.assets.findFirst({ where: { permalink } });
  if (!asset) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const blobId = await firstAttachmentBlobId('Asset', asset.id, 'file');
  if (!blobId) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const blob = await prisma.active_storage_blobs.findUnique({
    where: { id: blobId },
    select: { key: true, filename: true },
  });
  if (!blob) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let url: string;
  try {
    url = await s3SignedDownloadUrl(blob.key, blob.filename);
  } catch {
    return NextResponse.json({ error: 'download unavailable' }, { status: 503 });
  }

  const response = NextResponse.redirect(url, 302);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
