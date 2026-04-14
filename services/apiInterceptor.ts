/**
 * API Interceptor - Gère le refresh automatique du access token
 * Intercepte toutes les requêtes et retry avec token refresh si 401
 */
const API_BASE = 'http://localhost:3001/api';

function getStoredToken() {
  const token = localStorage.getItem('mouhami_token');
  return token ? JSON.parse(token) : null;
}

function getStoredAccessToken(): string | null {
  const token = getStoredToken();
  return token?.access_token || localStorage.getItem('almohami_access_token') || null;
}

function setStoredToken(token: any): void {
  if (token?.expires_in) {
    token.expiresAt = Date.now() + token.expires_in * 1000;
  }
  localStorage.setItem('mouhami_token', JSON.stringify(token));
}

function clearStoredToken(): void {
  localStorage.removeItem('mouhami_token');
  localStorage.removeItem('almohami_access_token');
}

async function refreshAccessTokenFromStorage(): Promise<boolean> {
  const token = getStoredToken();
  if (!token?.refresh_token) {
    clearStoredToken();
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token.refresh_token }),
    });

    if (!response.ok) {
      clearStoredToken();
      return false;
    }

    const data = await response.json();
    const updatedToken = {
      ...token,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? token.refresh_token,
      expires_in: data.expires_in,
    };
    setStoredToken(updatedToken);
    return true;
  } catch {
    clearStoredToken();
    return false;
  }
}

/**
 * Wrapper autour de fetch qui gère automatiquement le refresh du token
 * Retry 1 fois si 401 (token expiré)
 */
export async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!options.headers) {
    options.headers = new Headers();
  } else if (!(options.headers instanceof Headers)) {
    options.headers = new Headers(options.headers);
  }

  const headers = options.headers as Headers;
  const accessToken = getStoredAccessToken();
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response = await fetch(url, options);

  if (response.status === 401) {
    if (await refreshAccessTokenFromStorage()) {
      const newAccessToken = getStoredAccessToken();
      if (newAccessToken) {
        headers.set('Authorization', `Bearer ${newAccessToken}`);
      }
      response = await fetch(url, options);
    }
  }

  return response;
}

/**
 * Crée un objet d'options fetch avec le token approprié
 */
export function getAuthHeaders(): HeadersInit {
  const token = getStoredAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Middleware pour intercepter les réponses 401 et rafraîchir le token
 */
export async function apiCall<T>(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: getAuthHeaders(),
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetchWithTokenRefresh(url, options);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
