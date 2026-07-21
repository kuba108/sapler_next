/**
 * Active Storage compatibility layer.
 *
 * The Rails app stored image references inside page/widget HTML as absolute URLs
 * of the form:
 *
 *   https://www.sapler.cz/rails/active_storage/blobs/redirect/<signed_id>/<filename>
 *
 * The <signed_id> is a Rails MessageVerifier envelope that wraps the numeric
 * `active_storage_blobs.id` (Marshal-encoded). We decode the blob id WITHOUT
 * verifying the signature (the data comes from our own trusted DB), look up the
 * blob's `key`, and build the S3 object URL. This keeps the existing DB content
 * working unchanged — no image migration required.
 */

/** Decodes a Ruby Marshal-encoded small Integer (as used by Active Storage signed ids). */
function decodeMarshalInteger(buf: Buffer): number | null {
  // Marshal stream: 0x04 0x08 <type> <payload>
  if (buf.length < 3 || buf[0] !== 0x04 || buf[1] !== 0x08) return null;
  if (buf[2] !== 0x69) return null; // 'i' => Integer
  const c = buf.readInt8(3);
  if (c === 0) return 0;
  if (c > 4) return c - 5; // small positive int (5..127 => 0..122)
  if (c < -4) return c + 5; // small negative int
  // Multi-byte little-endian encoding
  const n = Math.abs(c);
  let value = 0;
  for (let i = 0; i < n; i++) {
    value |= buf[4 + i] << (8 * i);
  }
  return c < 0 ? value - (1 << (8 * n)) : value;
}

/**
 * Extracts the numeric blob id from an Active Storage signed id.
 * Returns null if the value cannot be decoded.
 */
export function blobIdFromSignedId(signedId: string): number | null {
  try {
    const [payloadPart] = signedId.split('--');
    const json = Buffer.from(payloadPart, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as { _rails?: { message?: string } };
    const message = parsed?._rails?.message;
    if (!message) return null;
    const marshal = Buffer.from(message, 'base64');
    return decodeMarshalInteger(marshal);
  } catch {
    return null;
  }
}
