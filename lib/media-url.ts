/** Client-safe URL builder for an internal /media/<blobId> link. */
export function mediaUrl(blobId: bigint | number | string): string {
  return `/media/${blobId}`;
}
