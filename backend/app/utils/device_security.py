"""
Service de sécurité : détection d'appareil, géolocalisation, notification email.
Nouveau fichier à créer : backend/app/utils/device_security.py
"""
from datetime import datetime
from typing import Optional, Dict
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import httpx


# ─────────────────────────────────────────────
# 1. PARSE DU USER-AGENT → nom lisible
# ─────────────────────────────────────────────

def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling various proxies"""
    if not request:
        return "unknown"
    
    # Try Cloudflare
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()
        
    # Try Nginx / standard proxy header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
        
    # Standard Forwarded for (returns first IP in list)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
        
    # Fallback
    return request.client.host if request.client else "unknown"

def parse_device_name(user_agent: str) -> str:
    """
    Retourne un nom lisible depuis le User-Agent.
    Ex: "Chrome on Windows", "Safari on iPhone"
    """
    ua = user_agent.lower()

    # Système d'exploitation
    if "windows" in ua:
        os_name = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "iphone" in ua:
        os_name = "iPhone"
    elif "ipad" in ua:
        os_name = "iPad"
    elif "android" in ua:
        os_name = "Android"
    elif "linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Unknown OS"

    # Navigateur
    if "edg/" in ua:
        browser = "Edge"
    elif "chrome" in ua and "safari" in ua:
        browser = "Chrome"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "safari" in ua:
        browser = "Safari"
    elif "opera" in ua or "opr/" in ua:
        browser = "Opera"
    else:
        browser = "Unknown Browser"

    return f"{browser} on {os_name}"


# ─────────────────────────────────────────────
# 2. GÉOLOCALISATION via IP (API gratuite)
# ─────────────────────────────────────────────

async def get_location_from_ip(ip: str) -> Dict[str, str]:
    """
    Retourne country + city depuis l'IP.
    Utilise ip-api.com (gratuit, 45 req/min sans clé).
    AVEC TIMEOUT SHORT: 1.5 sec pour ne pas bloquer les emails.
    """
    # IPs locales → pas de géolocalisation
    if ip in ("127.0.0.1", "::1", "localhost") or ip.startswith("192.168.") or ip.startswith("10."):
        return {"country": "Local", "city": "Local"}

    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(
                f"http://ip-api.com/json/{ip}?fields=country,city,status",
                follow_redirects=False
            )
            data = resp.json()
            if data.get("status") == "success":
                return {
                    "country": data.get("country", "Unknown"),
                    "city": data.get("city", "Unknown"),
                }
    except Exception as e:
        # Silent fail - don't block email sending
        print(f"⚠️  Geolocation lookup failed for {ip}: {type(e).__name__}")
        pass

    return {"country": "Unknown", "city": "Unknown"}


# ─────────────────────────────────────────────
# 3. VÉRIFICATION APPAREIL CONNU
# ─────────────────────────────────────────────

async def check_known_device(
    user_id: str,
    fingerprint: str,
    ip_address: str,
    db: AsyncSession
) -> bool:
    """
    Retourne True si l'appareil (fingerprint + IP) est déjà connu, False sinon.
    - Si IP change pour même fingerprint → OTP trigger (return False)
    - Si fingerprint est nouvelle → OTP trigger (return False)
    - Si les deux matchent → mise à jour last_seen (return True)
    """
    from app.models.user import KnownDevice

    result = await db.execute(
        select(KnownDevice).where(
            KnownDevice.user_id == user_id,
            KnownDevice.fingerprint == fingerprint,
            KnownDevice.ip_address == ip_address
        )
    )
    device = result.scalar_one_or_none()

    if device:
        device.last_seen = datetime.utcnow()
        db.add(device)
        await db.commit()
        return True

    return False


async def check_ip_known(
    user_id: str,
    ip_address: str,
    db: AsyncSession
) -> bool:
    """
    Vérifie si l'IP est déjà enregistrée pour cet utilisateur.
    Si oui → retourne True (login simple sans OTP)
    Si non → retourne False (OTP requis)
    """
    from app.models.user import KnownDevice

    result = await db.execute(
        select(KnownDevice).where(
            KnownDevice.user_id == user_id,
            KnownDevice.ip_address == ip_address
        )
    )
    device = result.scalars().first()

    if device:
        # Mise à jour du dernier accès
        device.last_seen = datetime.utcnow()
        db.add(device)
        await db.commit()
        return True

    return False


async def save_known_device(
    user_id: str,
    fingerprint: str,
    request: Request,
    db: AsyncSession
) -> None:
    """
    Enregistre un nouvel appareil dans known_devices.
    """
    from app.models.user import KnownDevice

    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent", "")
    location = await get_location_from_ip(ip)

    device = KnownDevice(
        user_id=user_id,
        fingerprint=fingerprint,
        device_name=parse_device_name(ua),
        ip_address=ip,
        country=location["country"],
        city=location["city"],
    )
    db.add(device)
    await db.commit()


# ─────────────────────────────────────────────
# 4. SAUVEGARDE HISTORIQUE LOGIN
# ─────────────────────────────────────────────

async def save_login_history(
    user_id: str,
    request: Request,
    db: AsyncSession,
    status: str = "success",
    fingerprint: Optional[str] = None,
    is_new_device: bool = False,
) -> None:
    """
    Enregistre chaque tentative de connexion dans login_history.
    """
    from app.models.user import LoginHistory

    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent", "")
    location = await get_location_from_ip(ip)

    history = LoginHistory(
        user_id=user_id,
        ip_address=ip,
        country=location["country"],
        city=location["city"],
        device_name=parse_device_name(ua),
        fingerprint=fingerprint,
        status=status,
        is_new_device=is_new_device,
    )
    db.add(history)
    await db.commit()


# ─────────────────────────────────────────────
# 5. ENVOI EMAIL NOUVEL APPAREIL
# ─────────────────────────────────────────────

async def send_new_device_email(
    user_email: str,
    user_name: str,
    request: Request,
    db: AsyncSession,
) -> None:
    """
    Envoie un email d'alerte quand un nouvel appareil se connecte.
    Utilise la table email_queue existante (comme dans auth.py).
    """
    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent", "")
    device_name = parse_device_name(ua)
    location = await get_location_from_ip(ip)
    now = datetime.utcnow().strftime("%d/%m/%Y à %H:%M UTC")

    html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#ef4444,#b91c1c);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">⚠️ تسجيل دخول من جهاز جديد</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 30px;">
            <p style="color:#334155;font-size:16px;line-height:1.8;">
              مرحباً <strong>{user_name}</strong>,
            </p>
            <p style="color:#334155;font-size:16px;line-height:1.8;">
              تم تسجيل الدخول إلى حسابك من جهاز جديد لم يُعرَّف من قبل.
            </p>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:20px 0;">
              <table width="100%" cellpadding="8">
                <tr>
                  <td style="color:#64748b;font-size:14px;">📅 التاريخ</td>
                  <td style="color:#1e293b;font-size:14px;font-weight:bold;">{now}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-size:14px;">🖥️ الجهاز</td>
                  <td style="color:#1e293b;font-size:14px;font-weight:bold;">{device_name}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-size:14px;">🌍 البلد</td>
                  <td style="color:#1e293b;font-size:14px;font-weight:bold;">{location['country']}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-size:14px;">🏙️ المدينة</td>
                  <td style="color:#1e293b;font-size:14px;font-weight:bold;">{location['city']}</td>
                </tr>
                <tr>
                  <td style="color:#64748b;font-size:14px;">🔌 IP</td>
                  <td style="color:#1e293b;font-size:14px;font-weight:bold;">{ip}</td>
                </tr>
              </table>
            </div>
            <p style="color:#64748b;font-size:14px;line-height:1.6;">
              إذا كنت أنت من قام بتسجيل الدخول، يمكنك تجاهل هذا البريد.<br>
              <strong style="color:#ef4444;">إذا لم تكن أنت، قم بتغيير كلمة المرور فوراً.</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#1e293b;padding:20px;text-align:center;">
            <p style="color:#94a3b8;font-size:13px;margin:0;">منصة المحامي - Mouhami AI</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    """

    text_content = f"""
تسجيل دخول من جهاز جديد - Mouhami AI

مرحباً {user_name},

تم تسجيل الدخول إلى حسابك من جهاز جديد:
- التاريخ: {now}
- الجهاز: {device_name}
- البلد: {location['country']} / {location['city']}
- IP: {ip}

إذا لم تكن أنت، غيّر كلمة المرور فوراً.
    """

    email_id = f"newdevice_{datetime.utcnow().timestamp()}"
    await db.execute(
        text("""
            INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
            VALUES (:id, :to_email, :subject, :html_content, :text_content, :status, :created_at)
        """),
        {
            "id": email_id,
            "to_email": user_email,
            "subject": "⚠️ تسجيل دخول من جهاز جديد | Mouhami AI",
            "html_content": html_content,
            "text_content": text_content,
            "status": "pending",
            "created_at": datetime.utcnow(),
        },
    )
    await db.commit()