/**
 * API Interceptor - Gère le refresh automatique du access token
 * Intercepte toutes les requêtes et retry avec token refresh si 401
 */
import { storageService } from './storageService';

const API_BASE = 'http://localhost:3001/api';

/**
 * Wrapper autour de fetch qui gère automatiquement le refresh du token
 * Retry 1 fois si 401 (token expiré)
 */
export async function fetchWithTokenRefresh(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // S'assurer que les headers existent
  if (!options.headers) {
    options.headers = new Headers();
  } else if (!(options.headers instanceof Headers)) {
    options.headers = new Headers(options.headers);
  }

  const headers = options.headers as Headers;

  // Ajouter le token d'accès s'il existe
  const accessToken = storageService.getAccessToken();
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Première tentative
  let response = await fetch(url, options);

  // Si 401 Unauthorized et qu'on a un refresh token, essayer de rafraîchir
  if (response.status === 401) {
    const token = storageService.getToken();
    if (token?.refresh_token) {
      console.log('Token expiré, tentative de refresh...');
      // Essayer de rafraîchir le access token
      const refreshed = await storageService.refreshAccessToken();

      if (refreshed) {
        console.log('Refresh réussi, retry de la requête');
        // Recommencer la requête avec le nouveau token
        const newAccessToken = storageService.getAccessToken();
        const headers = options.headers as Headers;
        if (newAccessToken) {
          headers.set('Authorization', `Bearer ${newAccessToken}`);
        }
        response = await fetch(url, options);
      } else {
        console.warn('Le refresh a échoué');
        return response;
      }
    }
  }

  return response;
}

/**
 * Crée un objet d'options fetch avec le token approprié
 */
export function getAuthHeaders(): HeadersInit {
  const token = storageService.getAccessToken();
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
      // Token invalide même après refresh
      storageService.logout();
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
