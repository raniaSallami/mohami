"""
Professional French Email Templates for Device Security Alerts
NO EMOJIS - Clean, formal, enterprise-grade
"""

from datetime import datetime


def new_device_login_alert_fr(
    user_name: str,
    user_email: str,
    device_name: str,
    os_name: str,
    ip_address: str,
    city: str,
    country: str,
    login_time: str,
    otp_code: str = None,
) -> tuple[str, str]:
    """
    Generate professional French email for new device login Detection.
    Returns: (subject, html_content)
    """
    
    subject = "Alerte de sécurité : Connexion depuis un nouvel appareil"
    
    html_content = f"""
<!DOCTYPE html>
<html dir="ltr" lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%); color: white; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
        .content {{ padding: 30px 20px; }}
        .alert-box {{ background-color: #e3f2fd; border-left: 4px solid #42a5f5; padding: 20px; margin-bottom: 20px; border-radius: 4px; }}
        .alert-box p {{ margin: 0; color: #0d47a1; font-size: 14px; line-height: 1.6; }}
        .details-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        .details-table td {{ padding: 12px; border-bottom: 1px solid #eeeeee; font-size: 14px; }}
        .details-table .label {{ width: 35%; color: #666666; font-weight: 500; background-color: #f9f9f9; }}
        .details-table .value {{ color: #333333; }}
        .buttons {{ text-align: center; margin: 30px 0; }}
        .btn {{ padding: 14px 30px; font-size: 15px; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-block; font-weight: 700; min-width: 160px; text-align: center; margin: 0 5px; }}
        .btn-confirm {{ background-color: #0d6efd; color: white; }}
        .btn-deny {{ background-color: #d32f2f; color: white; }}
        .otp-box {{ background-color: #f0f4ff; border: 2px dashed #0d6efd; padding: 20px; text-align: center; margin: 20px 0; border-radius: 4px; }}
        .otp-code {{ font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0d6efd; font-family: 'Courier New', monospace; margin: 10px 0; }}
        .otp-note {{ color: #666666; font-size: 12px; margin-top: 10px; }}
        .footer {{ background-color: #f5f5f5; border-top: 1px solid #eeeeee; padding: 20px; text-align: center; font-size: 12px; color: #999999; }}
        .security-note {{ background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .security-note p {{ margin: 0; color: #1565c0; font-size: 13px; line-height: 1.5; }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Alerte de Sécurité</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Tentative de connexion depuis un nouvel appareil</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p style="color: #555555; font-size: 14px; line-height: 1.8;">
                Bonjour {user_name},<br>
                Une tentative de connexion à votre compte a été détectée depuis un nouvel appareil. Nous prenons les précautions nécessaires pour protéger votre compte.
            </p>
            
            <!-- Alert Box -->
            <div class="alert-box">
                <p>
                    Si c'est bien vous, veuillez confirmer à l'aide du bouton ci-dessous.<br>
                    Sinon, veuillez prendre des mesures immédiates pour sécuriser votre compte.
                </p>
            </div>
            
            <!-- Details Table -->
            <table class="details-table">
                <tr>
                    <td class="label">Date et Heure :</td>
                    <td class="value">{login_time}</td>
                </tr>
                <tr>
                    <td class="label">Appareil :</td>
                    <td class="value">{device_name}</td>
                </tr>
                <tr>
                    <td class="label">Système :</td>
                    <td class="value">{os_name}</td>
                </tr>
                <tr>
                    <td class="label">Adresse IP :</td>
                    <td class="value"><code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">{ip_address}</code></td>
                </tr>
                <tr>
                    <td class="label">Localisation :</td>
                    <td class="value">{city}, {country}</td>
                </tr>
            </table>
            
            <!-- OTP Display if provided -->
            {f'''
            <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #666666; font-size: 13px;">Votre code de vérification :</p>
                <div class="otp-code">{otp_code}</div>
                <p class="otp-note">Ce code est valide pendant 5 minutes. Ne le partagez avec personne.</p>
            </div>
            ''' if otp_code else ''}
            
            <!-- Action Buttons -->
            <div class="buttons" style="text-align:center; margin: 30px 0;">
                <a href="https://mouhami-ai.tn/#security-alert/confirm/{user_email}" class="btn btn-confirm" style="background-color: #0d6efd; color: white; padding: 14px 30px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 700; min-width: 160px; margin: 0 5px; text-align: center;">C'est moi</a>
                <a href="https://mouhami-ai.tn/#security-alert/not-me/{user_email}" class="btn btn-deny" style="background-color: #d32f2f; color: white; padding: 14px 30px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 700; min-width: 160px; margin: 0 5px; text-align: center;">Ce n'est pas moi</a>
            </div>
            
            <!-- Security Note -->
            <div class="security-note">
                <p>
                    <strong>Conseil de sécurité :</strong> Assurez-vous toujours que l'adresse e-mail et la localisation correspondent à votre activité.
                    Si vous suspectez une activité inhabituelle, changez votre mot de passe immédiatement.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0;">Plateforme Mouhami AI - Tous droits réservés © 2026</p>
            <p style="margin: 8px 0 0 0;">Ceci est une notification automatique de sécurité. Veuillez ne pas répondre à cet e-mail.</p>
        </div>
    </div>
</body>
</html>
"""
    
    return subject, html_content


def suspicious_activity_alert_fr(
    user_name: str,
    device_name: str,
    ip_address: str,
    city: str,
    country: str,
    detection_time: str,
    immediate_actions_link: str,
) -> tuple[str, str]:
    """
    Email when user marks login as 'not me' - urges immediate action
    """
    
    subject = "Alerte de sécurité immédiate : Activité suspecte sur votre compte"
    
    html_content = f"""
<!DOCTYPE html>
<html dir="ltr" lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%); color: white; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
        .critical-alert {{ background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 20px; border-radius: 4px; }}
        .critical-alert h2 {{ color: #0d47a1; margin-top: 0; }}
        .critical-alert p {{ color: #0d47a1; margin: 10px 0; }}
        .action-box {{ background-color: #f0f4ff; border-left: 4px solid #0d6efd; padding: 20px; margin: 20px; border-radius: 4px; }}
        .action-box h3 {{ color: #0d47a1; margin-top: 0; }}
        .action-list {{ color: #1565c0; padding-left: 20px; }}
        .action-list li {{ margin: 8px 0; }}
        .btn-reset {{ background-color: #0d6efd; color: white; padding: 12px 24px; font-size: 14px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; font-weight: 700; margin: 20px auto; }}
        .details {{ background-color: #f5f5f5; padding: 15px; margin: 20px; border-radius: 4px; }}
        .details p {{ margin: 8px 0; font-size: 13px; color: #666666; }}
        .footer {{ background-color: #f5f5f5; border-top: 1px solid #eeeeee; padding: 20px; text-align: center; font-size: 12px; color: #999999; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Alerte de Sécurité Immédiate</h1>
        </div>
        
        <div class="critical-alert">
            <h2>Activité suspecte détectée</h2>
            <p>
                Nos systèmes de sécurité ont signalé une tentative d'accès non autorisée à votre compte. Nous avons immédiatement restreint cette activité.
            </p>
        </div>
        
        <div class="details">
            <p><strong>Détails de l'activité suspecte :</strong></p>
            <p>Appareil : {device_name}</p>
            <p>Localisation : {city}, {country}</p>
            <p>Adresse IP : <code>{ip_address}</code></p>
            <p>Heure : {detection_time}</p>
        </div>
        
        <div class="action-box">
            <h3>Actions immédiates recommandées :</h3>
            <ol class="action-list">
                <li><strong>Changez votre mot de passe :</strong> Utilisez un mot de passe fort et unique.</li>
                <li><strong>Vérifiez votre activité :</strong> Consultez l'historique de sécurité complet.</li>
                <li><strong>Vérifiez les appareils connus :</strong> Assurez-vous qu'aucun appareil inconnu n'est listé.</li>
                <li><strong>Activez l'authentification à deux facteurs :</strong> Si ce n'est pas déjà fait.</li>
            </ol>
        </div>
        
        <center>
            <a href="{immediate_actions_link}" class="btn-reset" style="background-color: #0d6efd; color: white; padding: 12px 24px; font-size: 14px; border-radius: 4px; text-decoration: none; display: inline-block; font-weight: 700;">Accéder aux mesures de sécurité</a>
        </center>
        
        <div class="footer">
            <p style="margin: 0;">Plateforme Mouhami AI - Tous droits réservés © 2026</p>
            <p style="margin: 8px 0 0 0;">Si vous n'êtes pas à l'origine de cette demande, contactez le support immédiatement.</p>
        </div>
    </div>
</body>
</html>
"""
    
    return subject, html_content


def device_confirmed_alert_fr(
    user_name: str,
    device_name: str,
    confirmation_time: str,
) -> tuple[str, str]:
    """
    Email confirming successful device trust/confirmation
    """
    
    subject = "Nouvel appareil confirmé avec succès"
    
    html_content = f"""
<!DOCTYPE html>
<html dir="ltr" lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #388e3c 0%, #1b5e20 100%); color: white; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
        .success-box {{ background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px; border-radius: 4px; }}
        .success-box p {{ color: #2e7d32; margin: 0; }}
        .details {{ background-color: #f5f5f5; padding: 15px; margin: 20px; border-radius: 4px; }}
        .details p {{ margin: 8px 0; font-size: 13px; color: #666666; }}
        .footer {{ background-color: #f5f5f5; border-top: 1px solid #eeeeee; padding: 20px; text-align: center; font-size: 12px; color: #999999; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Confirmation réussie</h1>
        </div>
        
        <div class="success-box">
            <p>Votre identité a été vérifiée et le nouvel appareil a été confirmé avec succès. Vous pouvez désormais accéder à votre compte depuis cet appareil.</p>
        </div>
        
        <div class="details">
            <p><strong>Détails de l'appareil confirmé :</strong></p>
            <p>Appareil : {device_name}</p>
            <p>Date et Heure : {confirmation_time}</p>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">Plateforme Mouhami AI - Tous droits réservés © 2026</p>
            <p style="margin: 8px 0 0 0;">Ceci est une notification automatique. Veuillez ne pas répondre à cet e-mail.</p>
        </div>
    </div>
</body>
</html>
"""
    
    return subject, html_content


def security_alert_response_fr(
    user_name: str,
    reset_time: str,
    ip_address: str,
    logout_all: bool = True,
) -> tuple[str, str]:
    """
    Generate confirmation email when user performs emergency reset
    """
    
    subject = "Votre compte a été sécurisé avec succès ✓"
    
    html_content = f"""
<!DOCTYPE html>
<html dir="ltr" lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%); color: white; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
        .content {{ padding: 30px 20px; }}
        .success-box {{ background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin-bottom: 20px; border-radius: 4px; }}
        .success-box p {{ margin: 0; color: #2e7d32; font-size: 14px; line-height: 1.6; }}
        .action_taken {{ background-color: #f1f8e9; border-left: 4px solid #9ccc65; padding: 15px; margin: 15px 0; border-radius: 4px; }}
        .action_taken p {{ margin: 5px 0; font-size: 13px; color: #558b2f; }}
        .details {{ background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .details p {{ margin: 8px 0; font-size: 13px; color: #666666; }}
        .warning-box {{ background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .warning-box p {{ margin: 5px 0; font-size: 12px; color: #e65100; }}
        .footer {{ background-color: #f5f5f5; border-top: 1px solid #eeeeee; padding: 20px; text-align: center; font-size: 12px; color: #999999; }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Compte sécurisé avec succès</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p style="color: #1b5e20; font-size: 14px; line-height: 1.8;">
                Bonjour {user_name},
            </p>
            
            <p style="color: #555555; font-size: 14px; line-height: 1.8;">
                Votre demande de sécurisation de compte a été traitée avec succès. Nous avons pris les mesures suivantes :
            </p>
            
            <!-- Success Alert -->
            <div class="success-box">
                <p>
                    Votre mot de passe a été modifié avec succès et votre compte est désormais protégé contre toute activité suspecte.
                </p>
            </div>
            
            <!-- Actions Taken -->
            <div class="action_taken">
                <p><strong>Mesures prises :</strong></p>
                <p>✓ Changement du mot de passe</p>
                {f'<p>✓ Déconnexion de tous les autres appareils</p>' if logout_all else '<p>• Les autres appareils sont restés connectés</p>'}
                <p>✓ Enregistrement de l\'événement de sécurité</p>
            </div>
            
            <!-- Details -->
            <div class="details">
                <p><strong>Détails :</strong></p>
                <p>Heure de sécurisation : {reset_time}</p>
                <p>Adresse IP : {ip_address}</p>
            </div>
            
            <!-- Warning -->
            <div class="warning-box">
                <p><strong>Conseil de sécurité :</strong></p>
                <p>Utilisez toujours un mot de passe fort et unique. Ne partagez jamais vos identifiants.</p>
                <p>Si vous suspectez une autre activité inhabituelle, contactez-nous immédiatement.</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0;">Plateforme Mouhami AI - Tous droits réservés © 2026</p>
            <p style="margin: 8px 0 0 0;">Ceci est une notification automatique de sécurité. Veuillez ne pas répondre à cet e-mail.</p>
        </div>
    </div>
</body>
</html>
"""
    
    return subject, html_content


def subscription_success_email_fr(
    user_name: str,
    plan_name: str,
    invoice_id: str,
) -> tuple[str, str]:
    """
    Generate professional French email for successful subscription upgrade.
    """
    subject = f"Confirmation de votre abonnement {plan_name.capitalize()} — Mouhami AI"
    
    html_content = f"""
<!DOCTYPE html>
<html dir="ltr" lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; }}
        .header {{ background-color: #1e293b; color: #f8fafc; padding: 40px 20px; text-align: center; border-bottom: 4px solid #d97706; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }}
        .header p {{ margin: 10px 0 0 0; font-size: 14px; opacity: 0.8; text-transform: uppercase; letter-spacing: 2px; }}
        .content {{ padding: 40px 30px; line-height: 1.7; }}
        .greeting {{ font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #0f172a; }}
        .success-card {{ background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; border-radius: 8px; margin-bottom: 30px; text-align: center; }}
        .success-card h2 {{ color: #16a34a; margin: 0 0 10px 0; font-size: 20px; }}
        .plan-badge {{ display: inline-block; background-color: #d97706; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-top: 10px; }}
        .details-box {{ background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }}
        .details-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }}
        .details-row:last-child {{ border-bottom: none; }}
        .details-label {{ color: #64748b; font-size: 14px; }}
        .details-value {{ font-weight: 600; font-size: 14px; }}
        .btn {{ display: block; background-color: #1e293b; color: #f8fafc !important; text-decoration: none; padding: 16px 24px; border-radius: 8px; text-align: center; font-weight: 600; margin-top: 20px; transition: background-color 0.3s; }}
        .btn:hover {{ background-color: #334155; }}
        .footer {{ background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 30px 20px; text-align: center; font-size: 12px; color: #94a3b8; }}
        .footer p {{ margin: 5px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <p>Mouhami AI</p>
            <h1>Confirmation d'Abonnement</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Bonjour {user_name},</p>
            
            <p>
                Nous avons le plaisir de vous confirmer que votre paiement a été effectué avec succès et que votre abonnement a été mis à jour.
            </p>
            
            <div class="success-card">
                <h2>Paiement Réussi</h2>
                <p style="margin: 0; color: #15803d;">Votre compte est désormais actif avec le nouveau plan.</p>
                <div class="plan-badge">{plan_name}</div>
            </div>
            
            <div class="details-box">
                <div class="details-row">
                    <span class="details-label">Client :</span>
                    <span class="details-value">{user_name}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Plan :</span>
                    <span class="details-value">{plan_name.capitalize()}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">Facture № :</span>
                    <span class="details-value">{invoice_id}</span>
                </div>
            </div>
            
            <p>
                Vous pouvez consulter et télécharger votre facture à tout moment depuis vos paramètres dans la section "Factures".
            </p>
            
            <a href="https://mouhami-ai.tn/#settings/invoices" class="btn">Consulter ma facture</a>
        </div>
        
        <div class="footer">
            <p>© 2026 Mouhami AI. Tous droits réservés.</p>
            <p>Plateforme d'intelligence artificielle juridique pour les professionnels.</p>
        </div>
    </div>
</body>
</html>
"""
    return subject, html_content
