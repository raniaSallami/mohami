/**
 * GUIDE: Utilisation du Refresh Token dans le Frontend
 * 
 * Le système de refresh token est maintenant complet!
 * Voici comment l'utiliser dans votre application:
 */

// ═══════════════════════════════════════════════════════════
// 1. UTILISER L'INTERCEPTOR AUTOMATIQUE (Recommandé)
// ═══════════════════════════════════════════════════════════

/*
Import l'interceptor dans vos services:

import { fetchWithTokenRefresh, apiCall } from '../services/apiInterceptor';

// Remplacez vos fetch() par fetchWithTokenRefresh()
const response = await fetchWithTokenRefresh('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});

// OU utilisez apiCall() qui gère tout:
const data = await apiCall<UserData>('/auth/me', 'GET');
*/

// ═══════════════════════════════════════════════════════════
// 2. REFRESH TOKEN MANUEL
// ═══════════════════════════════════════════════════════════

/*
import { storageService } from '../services/storageService';

// Rafraîchir le token manuellement:
const success = await storageService.refreshAccessToken();
if (success) {
  console.log('Token rafraîchi');
} else {
  // Token expiré, utilisateur doit se reconnecter
  window.location.href = '/login';
}
*/

// ═══════════════════════════════════════════════════════════
// 3. LOGOUT AVEC RÉVOCATION SERVEUR
// ═══════════════════════════════════════════════════════════

/*
import { storageService } from '../services/storageService';

// Logout simple (appareil actuel seulement)
await storageService.logoutAsync(false);

// Logout de TOUS les appareils
await storageService.logoutAsync(true);
*/

// ═══════════════════════════════════════════════════════════
// ENDPOINTS BACKEND DISPONIBLES
// ═══════════════════════════════════════════════════════════

/*
1. POST /api/auth/refresh
   - Body: { refresh_token: "..." }
   - Response: { access_token, token_type, expires_in }
   - Usage: Renouveller l'access token
   
2. POST /api/auth/logout
   - Body: { logout_all_devices: boolean }
   - Response: { message }
   - Requires: Authorization Bearer token
   - Usage: Révoquer le(s) token(s)

3. GET /api/auth/me
   - Requires: Authorization Bearer token
   - Response: User data
   - Usage: Vérifier si l'utilisateur est authentifié
*/

export const TOKEN_REFRESH_CONFIG = {
  // Access token expire après 15 minutes
  accessTokenExpiry: 15 * 60 * 1000,
  
  // Refresh token expire après 7 jours
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000,
  
  // Essayer de rafraîchir 2 minutes avant l'expiration
  refreshThreshold: 2 * 60 * 1000,
};
