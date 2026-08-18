const SESSION_KEY = 'session_authenticated';
const METHOD_KEY = 'session_auth_method';

export type AuthMethod = 'local' | 'oidc';

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'ok';
}

export function markAuthenticated(method: AuthMethod): void {
  sessionStorage.setItem(SESSION_KEY, 'ok');
  sessionStorage.setItem(METHOD_KEY, method);
}

export function clearAuthentication(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(METHOD_KEY);
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('oidc_authenticated');
}
