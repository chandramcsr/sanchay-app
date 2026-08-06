/**
 * Client for sanchay-api's new (server-authoritative) endpoints --
 * accounts, transactions, budgets. Every request carries a Clerk session
 * token as the Bearer token; sanchay-api's new routes verify that token
 * directly (RS256, Clerk's public key) rather than issuing their own
 * app-specific JWT the way the existing auth/sync/shared-expense/health/
 * legal routes still do. Two parallel auth mechanisms on the same
 * backend, deliberately -- this is additive, not a replacement of what
 * ledger-app already depends on.
 */

import { env } from "~/env";

// .replace() guards against a trailing slash in NEXT_PUBLIC_API_URL --
// easy to paste one in by accident copying a URL, and the naive
// concatenation below would then produce a double slash
// (".../onrender.com//api/v1/accounts"), which FastAPI/Starlette
// treats as a genuinely different, non-existent path rather than
// normalizing it away -- a real 404, not a cosmetic issue.
const API_BASE = env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "") + "/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(body || res.statusText, res.status);
  }

  // 204 No Content has no body to parse
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
