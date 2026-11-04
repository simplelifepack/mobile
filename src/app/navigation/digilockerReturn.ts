const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const digiLockerErrors = [
  'consent_denied',
  'session_expired',
  'cancelled',
  'authorization_failed',
] as const;
/** App links are navigation hints; authenticated API state remains authoritative. */
export function digiLockerReturn(
  url: string,
): { session?: string; error?: string } | null {
  const match = /^readiness:\/\/digilocker\?([^#]+)$/.exec(url);
  if (!match) return null;
  try {
    const pairs = match[1]
      .split('&')
      .map(pair => pair.split('=').map(decodeURIComponent));
    if (
      pairs.some(pair => pair.length !== 2) ||
      new Set(pairs.map(pair => pair[0])).size !== pairs.length
    )
      return null;
    const params = Object.fromEntries(pairs);
    if (pairs.length === 1) {
      if (uuid.test(params.session ?? '')) return { session: params.session };
      if (digiLockerErrors.some(code => code === params.error))
        return { error: params.error };
    }
    // Retain support for returns from sessions created before the server upgrade.
    if (
      pairs.length === 2 &&
      uuid.test(params.digilocker ?? '') &&
      [
        'AUTHENTICATED',
        'CONSENT_DENIED',
        'FAILED',
        'EXPIRED',
        'CANCELLED',
      ].includes(params.result)
    )
      return { session: params.digilocker };
    return null;
  } catch {
    return null;
  }
}
export function digiLockerReturnSession(url: string): string | null {
  return digiLockerReturn(url)?.session ?? null;
}
