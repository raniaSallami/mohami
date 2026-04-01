#!/bin/bash
# 🧪 Script de Vérification - Testez que RIEN n'est cassé

echo "🔍 Vérification des changements de sécurité..."
echo "=============================================="

# 1. Vérifier les logs masqués
echo ""
echo "✅ Test 1: Vérifier console.log() sont masqués"
echo "------"
if grep -q '\[REDACTED\]' scripts/check-users.js; then
  echo "✅ PASS: check-users.js masque les passwords"
else
  echo "❌ FAIL: check-users.js affiche encore les passwords"
fi

if grep -q '\[REDACTED\]' scripts/check-user.js; then
  echo "✅ PASS: check-user.js masque les passwords"
else
  echo "❌ FAIL: check-user.js affiche encore les passwords"
fi

# 2. Vérifier que env variables sont utilisées
echo ""
echo "✅ Test 2: Vérifier env variables pour passwords"
echo "------"
if grep -q 'process.env.ADMIN_PASSWORD' scripts/migrate-simple.js; then
  echo "✅ PASS: migrate-simple.js utilise ADMIN_PASSWORD"
else
  echo "❌ FAIL: migrate-simple.js n'utilise pas env"
fi

if grep -q 'process.env.TEST_PASSWORD' scripts/update-password.js; then
  echo "✅ PASS: update-password.js utilise TEST_PASSWORD"
else
  echo "❌ FAIL: update-password.js n'utilise pas env"
fi

# 3. Vérifier que db.ts bloque les queries
echo ""
echo "✅ Test 3: Vérifier que direct DB queries sont bloquées"
echo "------"
if grep -q "Direct database queries not supported" services/db.ts; then
  echo "✅ PASS: services/db.ts bloque les queries"
else
  echo "❌ FAIL: services/db.ts n'a pas la protection"
fi

# 4. Vérifier compilation TypeScript
echo ""
echo "✅ Test 4: Vérifier compilation TypeScript"
echo "------"
if npm run build > /dev/null 2>&1; then
  echo "✅ PASS: npm run build réussit"
else
  echo "❌ FAIL: npm run build échoue"
  npm run build
fi

# 5. Vérifier que le backend a les endpoints
echo ""
echo "✅ Test 5: Vérifier endpoints Backend"
echo "------"
if grep -q '@router.post("/login"' backend/app/routers/auth.py; then
  echo "✅ PASS: Backend a POST /auth/login"
else
  echo "❌ FAIL: Endpoint /auth/login manquant"
fi

if grep -q '@router.post("/register"' backend/app/routers/auth.py; then
  echo "✅ PASS: Backend a POST /auth/register"
else
  echo "❌ FAIL: Endpoint /auth/register manquant"
fi

echo ""
echo "=============================================="
echo "🎉 Vérification complétée!"
echo ""
echo "Prochaines étapes:"
echo "1. Définir ADMIN_PASSWORD: export ADMIN_PASSWORD='SecurePass123!@#'"
echo "2. Démarrer le serveur: npm run dev"
echo "3. Tester login un utilisateur"
echo "4. Vérifier qu'aucun password n'est affiché"
echo ""
