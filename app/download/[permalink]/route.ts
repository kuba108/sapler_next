import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { firstAttachmentBlobId, mediaUrl } from '@/lib/media';

/** Public download link for a Media/Asset file, ported from Rails' /download/:permalink. */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ permalink: string }> },
) {
  const { permalink } = await ctx.params;
  const asset = await prisma.assets.findFirst({ where: { permalink } });
  if (!asset) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const blobId = await firstAttachmentBlobId('Asset', asset.id, 'file');
  if (!blobId) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.redirect(new URL(mediaUrl(blobId), req.url));
}
