"""
Token Manager - Gestion des refresh tokens en base de données.
Nouveau fichier : backend/app/utils/token_manager.py
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.config import settings
from app.utils.device_security import get_client_ip


# ─────────────────────────────────────────────
# SAUVEGARDER UN REFRESH TOKEN EN DB
# ─────────────────────────────────────────────

async def save_refresh_token(
    user_id: str,
    token: str,
    request: Request,
    db: AsyncSession,
) -> None:
    """
    Enregistre un nouveau refresh token en base.
    """
    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    ip = get_client_ip(request)
    device_name = _parse_device(request.headers.get("User-Agent", ""))

    await db.execute(
        text("""
            INSERT INTO refresh_tokens (user_id, token, expires_at, device_name, ip_address)
            VALUES (:user_id, :token, :expires_at, :device_name, :ip_address)
        """),
        {
            "user_id": user_id,
            "token": token,
            "expires_at": expires_at,
            "device_name": device_name,
            "ip_address": ip,
        }
    )
    await db.commit()


# ─────────────────────────────────────────────
# VÉRIFIER UN REFRESH TOKEN
# ─────────────────────────────────────────────

async def verify_refresh_token(token: str, db: AsyncSession) -> Optional[str]:
    """
    Vérifie que le refresh token existe, n'est pas révoqué et n'est pas expiré.
    Retourne le user_id si valide, None sinon.
    """
    result = await db.execute(
        text("""
            SELECT user_id FROM refresh_tokens
            WHERE token = :token
              AND is_revoked = FALSE
              AND expires_at > :now
        """),
        {"token": token, "now": datetime.utcnow()}
    )
    row = result.fetchone()
    return str(row[0]) if row else None


# ─────────────────────────────────────────────
# ROTATION : invalider l'ancien, créer un nouveau
# ─────────────────────────────────────────────

async def rotate_refresh_token(
    old_token: str,
    new_token: str,
    user_id: str,
    request: Request,
    db: AsyncSession,
) -> bool:
    """
    Révoque l'ancien refresh token et enregistre le nouveau.
    Retourne False si l'ancien token est invalide (possible vol).
    """
    # Vérifier que l'ancien token est valide
    user_id_from_db = await verify_refresh_token(old_token, db)

    if not user_id_from_db:
        # Token invalide ou déjà utilisé → possible vol → révoquer TOUS les tokens
        await revoke_all_user_tokens(user_id, db)
        return False

    # Révoquer l'ancien token
    await db.execute(
        text("""
            UPDATE refresh_tokens
            SET is_revoked = TRUE
            WHERE token = :token
        """),
        {"token": old_token}
    )

    # Sauvegarder le nouveau token
    await save_refresh_token(user_id, new_token, request, db)
    return True


# ─────────────────────────────────────────────
# RÉVOQUER UN TOKEN (logout)
# ─────────────────────────────────────────────

async def revoke_refresh_token(token: str, db: AsyncSession) -> None:
    """
    Révoque un refresh token spécifique (logout).
    """
    await db.execute(
        text("""
            UPDATE refresh_tokens
            SET is_revoked = TRUE
            WHERE token = :token
        """),
        {"token": token}
    )
    await db.commit()


# ─────────────────────────────────────────────
# RÉVOQUER TOUS LES TOKENS D'UN UTILISATEUR
# ─────────────────────────────────────────────

async def revoke_all_user_tokens(user_id: str, db: AsyncSession) -> None:
    """
    Révoque tous les refresh tokens d'un utilisateur.
    Utilisé en cas de changement de mot de passe ou vol détecté.
    """
    await db.execute(
        text("""
            UPDATE refresh_tokens
            SET is_revoked = TRUE
            WHERE user_id = :user_id
        """),
        {"user_id": user_id}
    )
    await db.commit()


# ─────────────────────────────────────────────
# LISTER LES SESSIONS ACTIVES
# ─────────────────────────────────────────────

async def get_active_sessions(user_id: str, db: AsyncSession) -> list:
    """
    Retourne toutes les sessions actives d'un utilisateur.
    """
    result = await db.execute(
        text("""
            SELECT id, device_name, ip_address, created_at, expires_at
            FROM refresh_tokens
            WHERE user_id = :user_id
              AND is_revoked = FALSE
              AND expires_at > :now
            ORDER BY created_at DESC
        """),
        {"user_id": user_id, "now": datetime.utcnow()}
    )
    rows = result.fetchall()
    return [
        {
            "id": str(row[0]),
            "device_name": row[1],
            "ip_address": row[2],
            "created_at": row[3].isoformat(),
            "expires_at": row[4].isoformat(),
        }
        for row in rows
    ]


# ─────────────────────────────────────────────
# NETTOYAGE : supprimer les tokens expirés
# ─────────────────────────────────────────────

async def cleanup_expired_tokens(db: AsyncSession) -> None:
    """
    Supprime les tokens expirés de la base.
    À appeler périodiquement (ex: toutes les 24h).
    """
    await db.execute(
        text("""
            DELETE FROM refresh_tokens
            WHERE expires_at < :now OR is_revoked = TRUE
        """),
        {"now": datetime.utcnow()}
    )
    await db.commit()


# ─────────────────────────────────────────────
# HELPER : parse User-Agent
# ─────────────────────────────────────────────

def _parse_device(user_agent: str) -> str:
    ua = user_agent.lower()
    if "windows" in ua:
        os_name = "Windows"
    elif "macintosh" in ua:
        os_name = "macOS"
    elif "iphone" in ua:
        os_name = "iPhone"
    elif "android" in ua:
        os_name = "Android"
    elif "linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Unknown"

    if "edg/" in ua:
        browser = "Edge"
    elif "chrome" in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua:
        browser = "Safari"
    else:
        browser = "Unknown"

    return f"{browser} on {os_name}"
