/**
 * uuid.ts — thin wrapper around crypto.randomUUID.
 * Centralised so we can swap crypto.randomUUID for a polyfill if needed.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
