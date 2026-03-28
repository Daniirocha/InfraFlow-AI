export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

const ACCESS = 'infraflow_access';
const REFRESH = 'infraflow_refresh';

export type AuthUser = { id: string; email: string; role: string; name?: string };

export function getStoredAccess(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS);
}

export function getStoredRefresh(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS, access);
  localStorage.setItem(REFRESH, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem('infraflow_user');
}

export function setUser(user: AuthUser) {
  localStorage.setItem('infraflow_user', JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('infraflow_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

async function refreshSession(): Promise<string | null> {
  const rt = getStoredRefresh();
  if (!rt) return null;
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
  setTokens(data.accessToken, data.refreshToken);
  setUser(data.user);
  return data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!init.skipAuth) {
    let token = getStoredAccess();
    if (!token) {
      token = await refreshSession();
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401 && !init.skipAuth) {
    const newToken = await refreshSession();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    }
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** POST multipart (ex.: anexo de chamado). Não define Content-Type — o browser envia boundary. */
export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: formData });
}
