function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyN8nBearer(authHeader: string | null): boolean {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (!expected) return false;
  if (!authHeader) return false;
  const match = /^Bearer\s+(.+)$/.exec(authHeader);
  if (!match) return false;
  return timingSafeEqual(match[1].trim(), expected);
}
