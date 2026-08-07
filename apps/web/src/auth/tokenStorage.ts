import type { AuthTokens, AuthUser } from './types';

const STORAGE_KEY = 'testsphere.auth';

interface StoredAuth extends AuthTokens {
  user: AuthUser;
}

// No httpOnly cookies are available from the API (tokens come back in the JSON
// body), so this is the most containment we can offer in a pure SPA: tokens
// live in one storage area, never split across both, and "Remember me" is what
// decides whether that area survives a browser restart (localStorage) or not
// (sessionStorage) — not real httpOnly-cookie-level protection against XSS.
export function saveAuth(data: StoredAuth, rememberMe: boolean): void {
  const target = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;
  other.removeItem(STORAGE_KEY);
  target.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function updateTokens(tokens: AuthTokens): void {
  const store = localStorage.getItem(STORAGE_KEY) !== null ? localStorage : sessionStorage;
  const raw = store.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  const current = JSON.parse(raw) as StoredAuth;
  store.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...tokens }));
}

export function updateStoredUser(user: AuthUser): void {
  const store = localStorage.getItem(STORAGE_KEY) !== null ? localStorage : sessionStorage;
  const raw = store.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  const current = JSON.parse(raw) as StoredAuth;
  store.setItem(STORAGE_KEY, JSON.stringify({ ...current, user }));
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}
