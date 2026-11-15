/**
 * Password-recovery deep-link helpers.
 * Never log tokens, codes, or full sensitive URLs.
 */

export type RecoveryParts = {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  type?: string;
  tokenHash?: string;
  error?: string;
  errorDescription?: string;
  /** Safe debug: which fields were present (names only) */
  presentKeys: string[];
};

const first = (value: string | string[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value || undefined;

/** Parse recovery params from a deep-link or bridge URL. */
export function parseRecoveryUrl(rawUrl: string): RecoveryParts {
  const presentKeys: string[] = [];
  try {
    const parsed = new URL(rawUrl);
    const query = parsed.searchParams;
    const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));

    const pick = (key: string) => {
      const v = query.get(key) || hash.get(key);
      if (v) presentKeys.push(key);
      return v || undefined;
    };

    return {
      code: pick("code"),
      accessToken: pick("access_token"),
      refreshToken: pick("refresh_token"),
      type: pick("type"),
      tokenHash: pick("token_hash"),
      error: pick("error"),
      errorDescription: pick("error_description"),
      presentKeys,
    };
  } catch {
    return { presentKeys: [] };
  }
}

export function parseRecoveryParams(
  params: Record<string, string | string[] | undefined>
): RecoveryParts {
  const presentKeys: string[] = [];
  const get = (key: string) => {
    const v = first(params[key]);
    if (v) presentKeys.push(key);
    return v;
  };
  return {
    code: get("code"),
    accessToken: get("access_token"),
    refreshToken: get("refresh_token"),
    type: get("type"),
    tokenHash: get("token_hash"),
    error: get("error"),
    errorDescription: get("error_description"),
    presentKeys,
  };
}

export function hasRecoverablePayload(parts: RecoveryParts): boolean {
  if (parts.error) return true;
  if (parts.code) return true;
  if (parts.tokenHash && (parts.type === "recovery" || !parts.type)) return true;
  if (parts.accessToken && parts.refreshToken) return true;
  return false;
}

// Module-level pending URL so cold-start links survive navigation races
let pendingRecoveryUrl: string | null = null;

export function setPendingRecoveryUrl(url: string | null) {
  pendingRecoveryUrl = url;
}

export function consumePendingRecoveryUrl(): string | null {
  const v = pendingRecoveryUrl;
  pendingRecoveryUrl = null;
  return v;
}

export function peekPendingRecoveryUrl(): string | null {
  return pendingRecoveryUrl;
}
