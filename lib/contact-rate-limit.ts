import 'server-only';
import { createHash } from 'crypto';
import { prisma } from './prisma';

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS_PER_WINDOW = 5;

/**
 * Simple fixed-window rate limit keyed by a hash of the client IP (never
 * store the raw IP). Returns false once an IP exceeds MAX_ATTEMPTS_PER_WINDOW
 * submissions within WINDOW_MS.
 */
export async function checkContactRateLimit(ip: string): Promise<boolean> {
  const keyHash = createHash('sha256').update(ip).digest('hex');
  const now = new Date();

  const existing = await prisma.contact_rate_limits.findUnique({ where: { key_hash: keyHash } });

  if (!existing || now.getTime() - existing.window_started_at.getTime() > WINDOW_MS) {
    await prisma.contact_rate_limits.upsert({
      where: { key_hash: keyHash },
      create: { key_hash: keyHash, window_started_at: now, attempt_count: 1, created_at: now, updated_at: now },
      update: { window_started_at: now, attempt_count: 1, updated_at: now },
    });
    return true;
  }

  if (existing.attempt_count >= MAX_ATTEMPTS_PER_WINDOW) return false;

  await prisma.contact_rate_limits.update({
    where: { key_hash: keyHash },
    data: { attempt_count: { increment: 1 }, updated_at: now },
  });
  return true;
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}
