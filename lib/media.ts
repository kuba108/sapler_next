import 'server-only';
import { createHash } from 'node:crypto';
import { prisma } from './prisma';
import { s3Upload, s3Delete, generateStorageKey } from './s3';

/**
 * Active Storage write-side helpers. Files are stored in the same S3 bucket and
 * recorded in active_storage_blobs / active_storage_attachments so both the
 * Next.js app and (if ever needed) a Rails app read them identically.
 */

export async function uploadBlob(
  file: File,
): Promise<{ id: bigint; key: string; filename: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateStorageKey();
  const checksum = createHash('md5').update(buffer).digest('base64');
  const contentType = file.type || 'application/octet-stream';

  await s3Upload(key, buffer, contentType);

  const blob = await prisma.active_storage_blobs.create({
    data: {
      key,
      filename: file.name,
      content_type: contentType,
      byte_size: BigInt(buffer.length),
      checksum,
      service_name: 'amazon',
      created_at: new Date(),
    },
  });
  return { id: blob.id, key, filename: file.name };
}

/** Replaces a has_one_attached style attachment (purges previous blobs). */
export async function attachOne(
  recordType: string,
  recordId: bigint,
  name: string,
  file: File,
): Promise<void> {
  const blob = await uploadBlob(file);

  const previous = await prisma.active_storage_attachments.findMany({
    where: { record_type: recordType, record_id: recordId, name },
  });

  await prisma.active_storage_attachments.create({
    data: {
      name,
      record_type: recordType,
      record_id: recordId,
      blob_id: blob.id,
      created_at: new Date(),
    },
  });

  // Purge old attachments + blobs (best effort — keep DB tidy like Active Storage).
  for (const att of previous) {
    const oldBlob = await prisma.active_storage_blobs.findUnique({ where: { id: att.blob_id } });
    await prisma.active_storage_attachments.delete({ where: { id: att.id } });
    if (oldBlob) {
      await prisma.active_storage_blobs.delete({ where: { id: oldBlob.id } }).catch(() => {});
      await s3Delete(oldBlob.key).catch(() => {});
    }
  }
}

/** Appends a has_many_attached style attachment (keeps previous). */
export async function attachMany(
  recordType: string,
  recordId: bigint,
  name: string,
  file: File,
): Promise<bigint> {
  const blob = await uploadBlob(file);
  await prisma.active_storage_attachments.create({
    data: {
      name,
      record_type: recordType,
      record_id: recordId,
      blob_id: blob.id,
      created_at: new Date(),
    },
  });
  return blob.id;
}

export async function firstAttachmentBlobId(
  recordType: string,
  recordId: bigint,
  name: string,
): Promise<bigint | null> {
  const att = await prisma.active_storage_attachments.findFirst({
    where: { record_type: recordType, record_id: recordId, name },
    orderBy: { id: 'asc' },
  });
  return att?.blob_id ?? null;
}

export { mediaUrl } from './media-url';
