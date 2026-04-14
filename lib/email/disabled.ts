/**
 * Global kill-switch for outbound Resend calls. Set DISABLE_OUTBOUND_EMAIL=1
 * in any env where you don't want real sends — notably `pnpm test:e2e`, which
 * otherwise spams the admin inbox with every run.
 */
export function outboundEmailDisabled(): boolean {
  const v = process.env.DISABLE_OUTBOUND_EMAIL;
  return v === '1' || v === 'true';
}
