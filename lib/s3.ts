import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'node:crypto';

const region = process.env.S3_REGION || 'eu-central-1';
const bucket = process.env.S3_BUCKET_NAME || '';

let client: S3Client | null = null;

export function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region,
      credentials:
        process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }
  return client;
}

export function s3Bucket() {
  return bucket;
}

/**
 * Public/virtual-hosted URL of an object. Works when the bucket (or object)
 * is publicly readable — matches how Active Storage `redirect` serves images.
 */
export function s3PublicUrl(key: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
}

/** Presigned GET URL, used when the bucket is private. */
export function s3SignedGetUrl(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn,
  });
}

/**
 * Generates an Active Storage compatible object key: 28 base58-ish chars.
 * Rails uses `SecureRandom.base58(28)`; we approximate with a URL-safe alphabet.
 */
export function generateStorageKey(): string {
  const alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = randomBytes(28);
  let out = '';
  for (let i = 0; i < 28; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

export async function s3Upload(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function s3Delete(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
