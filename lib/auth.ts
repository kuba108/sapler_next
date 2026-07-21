import 'server-only';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const COOKIE_NAME = 'sapler_admin_session';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(s);
}

export type SessionPayload = { adminUserId: string; email: string };

/**
 * Verifies a plaintext password against a Devise/bcrypt digest ($2a$...).
 * bcryptjs transparently handles the $2a/$2b prefixes Devise emits.
 */
export function verifyPassword(password: string, digest: string): boolean {
  if (!digest) return false;
  try {
    return bcrypt.compareSync(password, digest);
  } catch {
    return false;
  }
}

export function hashPassword(password: string): string {
  // Devise default cost is 11.
  return bcrypt.hashSync(password, 11);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { adminUserId: String(payload.adminUserId), email: String(payload.email) };
  } catch {
    return null;
  }
}

/** Returns the currently logged-in admin user (fresh from DB) or null. */
export async function currentAdminUser() {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.admin_users.findUnique({
    where: { id: BigInt(session.adminUserId) },
  });
  if (!user || user.deleted_at) return null;
  return user;
}
