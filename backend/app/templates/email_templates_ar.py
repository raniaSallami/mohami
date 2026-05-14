"""
Professional Arabic Email Templates for Device Security Alerts
NO EMOJIS - Clean, formal, enterprise-grade
"""

from datetime import datetime


def new_device_login_alert(
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
    Generate professional Arabic email for new device login Detection.
    Returns: (subject, html_content)
    """
    
    subject = "تنبيه أمني: محاولة دخول من جهاز جديد"
    
    html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%); color: white; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
        .content {{ padding: 30px 20px; }}
        .alert-box {{ background-color: #e3f2fd; border-right: 4px solid #2196f3; padding: 20px; margin-bottom: 20px; border-radius: 4px; }}
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
        .security-note {{ background-color: #e3f2fd; border-right: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .security-note p {{ margin: 0; color: #1565c0; font-size: 13px; line-height: 1.5; }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>تنبيه أمني</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">محاولة دخول من جهاز جديد</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p style="color: #555555; font-size: 14px; line-height: 1.8;">
                تم اكتشاف محاولة دخول إلى حسابك من جهاز جديد. نحن نتخذ الاحتياطات الأمنية اللازمة لحماية حسابك.
            </p>
            
            <!-- Alert Box -->
            <div class="alert-box">
                <p>
                    إذا كنت أنت من قام بهذا النشاط، يرجى تأكيد ذلك من خلال زر التأكيد أدناه.
                    إذا لم تكن أنت، نرجو منك اتخاذ الإجراء الفوري لتأمين حسابك.
                </p>
            </div>
            
            <!-- Details Table -->
            <table class="details-table">
                <tr>
                    <td class="label">التاريخ والوقت:</td>
                    <td class="value">{login_time}</td>
                </tr>
                <tr>
                    <td class="label">الجهاز:</td>
                    <td class="value">{device_name}</td>
                </tr>
                <tr>
                    <td class="label">نظام التشغيل:</td>
                    <td class="value">{os_name}</td>
                </tr>
                <tr>
                    <td class="label">عنوان الـ IP:</td>
                    <td class="value"><code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">{ip_address}</code></td>
                </tr>
                <tr>
                    <td class="label">الموقع الجغرافي:</td>
                    <td class="value">{city}, {country}</td>
                </tr>
            </table>
            
            <!-- OTP Display if provided -->
            {f'''
            <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #666666; font-size: 13px;">رمز التحقق الخاص بك:</p>
                <div class="otp-code">{otp_code}</div>
                <p class="otp-note">هذا الرمز صالح لمدة 5 دقائق فقط. لا تشاركه مع أحد.</p>
            </div>
            ''' if otp_code else ''}
            
            <!-- Action Buttons -->
            <div class="buttons" style="text-align:center; margin: 30px 0;">
                <a href="https://mouhami-ai.tn/#security-alert/not-me/{user_email}" class="btn btn-deny" style="background-color: #d32f2f; color: white; padding: 14px 30px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 700; min-width: 160px; margin: 0 5px; text-align: center;">هذا ليس أنا</a>
                <a href="https://mouhami-ai.tn/#security-alert/confirm/{user_email}" class="btn btn-confirm" style="background-color: #0d6efd; color: white; padding: 14px 30px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 700; min-width: 160px; margin: 0 5px; text-align: center;">هذا أنا</a>
            </div>
            
            <!-- Security Note -->
            <div class="security-note">
                <p>
                    <strong>نصيحة أمنية:</strong> تأكد دائماً من أن عنوان البريد الإلكتروني والموقع الجغرافي يطابقان نشاطك. 
                    إذا اشتبهت في نشاط مريب، غيّر كلمة المرور فوراً.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0;">منصة المحامي الذكية - جميع الحقوق محفوظة © 2026</p>
            <p style="margin: 8px 0 0 0;">هذا إشعار أمني تلقائي. يرجى عدم الرد على هذا البريد الإلكتروني.</p>
        </div>
    </div>
</body>
</html>
"""
    
    return subject, html_content


def suspicious_activity_alert(
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
    
    subject = "تنبيه أمني فوري: نشاط مريب على حسابك"
    
    html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%); color: white; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
        .critical-alert {{ background-color: #e3f2fd; border-right: 4px solid #2196f3; padding: 20px; margin: 20px; border-radius: 4px; }}
        .critical-alert h2 {{ color: #0d47a1; margin-top: 0; }}
        .critical-alert p {{ color: #0d47a1; margin: 10px 0; }}
        .action-box {{ background-color: #f0f4ff; border-right: 4px solid #0d6efd; padding: 20px; margin: 20px; border-radius: 4px; }}
        .action-box h3 {{ color: #0d47a1; margin-top: 0; }}
        .action-list {{ color: #1565c0; padding-right: 20px; }}
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
            <h1>تنبيه أمني فوري</h1>
        </div>
        
        <div class="critical-alert">
            <h2>تم اكتشاف نشاط مريب</h2>
            <p>
                أفادت الأنظمة الأمنية بمحاولة دخول غير مصرح بها إلى حسابك. لقد قمنا بحجب هذا النشاط فوراً.
            </p>
        </div>
        
        <div class="details">
            <p><strong>تفاصيل النشاط المريب:</strong></p>
            <p>الجهاز: {device_name}</p>
            <p>الموقع: {city}, {country}</p>
            <p>عنوان الـ IP: <code>{ip_address}</code></p>
            <p>الوقت: {detection_time}</p>
        </div>
        
        <div class="action-box">
            <h3>إجراءات فورية موصى بها:</h3>
            <ol class="action-list">
                <li><strong>غير كلمة المرور فوراً:</strong> استخدم كلمة مرور قوية وفريدة.</li>
                <li><strong>تحقق من النشاط:</strong> استعرض السجل الأمني الكامل لحسابك.</li>
                <li><strong>راجع الأجهزة المعروفة:</strong> تأكد من عدم وجود أجهزة غريبة.</li>
                <li><strong>فعّل المصادقة الثنائية:</strong> إذا لم تكن مفعّلة بعد، فعّلها الآن.</li>
            </ol>
        </div>
        
        <center>
            <a href="{immediate_actions_link}" class="btn-reset" style="background-color: #0d6efd; color: white; padding: 12px 24px; font-size: 14px; border-radius: 4px; text-decoration: none; display: inline-block; font-weight: 700;">الانتقال إلى إجراءات الأمان</a>
        </center>
        
        <div class="footer">
            <p style="margin: 0;">منصة المحامي الذكية - جميع الحقوق محفوظة © 2026</p>
            <p style="margin: 8px 0 0 0;">إذا لم تتلق هذا البريد من قبلك، اتصل بالدعم الفني فوراً.</p>
        </div>
    </div>
</body>
</html>
"""
    
    return subject, html_content


def device_confirmed_alert(
    user_name: str,
    device_name: str,
    confirmation_time: str,
) -> tuple[str, str]:
    """
    Email confirming successful device trust/confirmation
    """
    
    subject = "تم تأكيد الجهاز الجديد بنجاح"
    
    html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #388e3c 0%, #1b5e20 100%); color: white; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
        .success-box {{ background-color: #e8f5e9; border-right: 4px solid #4caf50; padding: 20px; margin: 20px; border-radius: 4px; }}
        .success-box p {{ color: #2e7d32; margin: 0; }}
        .details {{ background-color: #f5f5f5; padding: 15px; margin: 20px; border-radius: 4px; }}
        .details p {{ margin: 8px 0; font-size: 13px; color: #666666; }}
        .footer {{ background-color: #f5f5f5; border-top: 1px solid #eeeeee; padding: 20px; text-align: center; font-size: 12px; color: #999999; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>تم التأكيد بنجاح</h1>
        </div>
        
        <div class="success-box">
            <p>تم التحقق من هويتك وتأكيد الجهاز الجديد بنجاح. يمكنك الآن الوصول إلى حسابك من هذا الجهاز.</p>
        </div>
        
        <div class="details">
            <p><strong>تفاصيل الجهاز المؤكد:</strong></p>
            <p>الجهاز: {device_name}</p>
            <p>التاريخ والوقت: {confirmation_time}</p>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">منصة المحامي الذكية - جميع الحقوق محفوظة © 2026</p>
            <p style="margin: 8px 0 0 0;">هذا إشعار تلقائي. يرجى عدم الرد على هذا البريد الإلكتروني.</p>
        </div>
    </div>
</body>
</html>
"""
    
    return subject, html_content


def security_alert_response(
    user_name: str,
    reset_time: str,
    ip_address: str,
    logout_all: bool = True,
) -> tuple[str, str]:
    """
    Generate confirmation email when user performs emergency reset
    """
    
    subject = "تم تأمين حسابك بنجاح ✓"
    
    html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%); color: white; padding: 30px 20px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
        .content {{ padding: 30px 20px; }}
        .success-box {{ background-color: #e8f5e9; border-right: 4px solid #4caf50; padding: 20px; margin-bottom: 20px; border-radius: 4px; }}
        .success-box p {{ margin: 0; color: #2e7d32; font-size: 14px; line-height: 1.6; }}
        .action-taken {{ background-color: #f1f8e9; border-right: 4px solid #9ccc65; padding: 15px; margin: 15px 0; border-radius: 4px; }}
        .action-taken p {{ margin: 5px 0; font-size: 13px; color: #558b2f; }}
        .details {{ background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .details p {{ margin: 8px 0; font-size: 13px; color: #666666; }}
        .warning-box {{ background-color: #fff3e0; border-right: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }}
        .warning-box p {{ margin: 5px 0; font-size: 12px; color: #e65100; }}
        .footer {{ background-color: #f5f5f5; border-top: 1px solid #eeeeee; padding: 20px; text-align: center; font-size: 12px; color: #999999; }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>تم تأمين حسابك بنجاح</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p style="color: #1b5e20; font-size: 14px; line-height: 1.8;">
                مرحباً {user_name}،
            </p>
            
            <p style="color: #555555; font-size: 14px; line-height: 1.8;">
                تم تنفيذ طلب تأمين حسابك بنجاح. لقد اتخذنا الخطوات الأمنية التالية:
            </p>
            
            <!-- Success Alert -->
            <div class="success-box">
                <p>
                    تم تغيير كلمة المرور الخاصة بك بنجاح وتأمين حسابك من النشاط المريب.
                </p>
            </div>
            
            <!-- Actions Taken -->
            <div class="action-taken">
                <p><strong>الإجراءات المتخذة:</strong></p>
                <p>✓ تغيير كلمة المرور</p>
                {f'<p>✓ تسجيل الخروج من جميع الأجهزة الأخرى</p>' if logout_all else '<p>• الأجهزة الأخرى بقيت متصلة</p>'}
                <p>✓ تسجيل حدث أمني</p>
            </div>
            
            <!-- Details -->
            <div class="details">
                <p><strong>التفاصيل:</strong></p>
                <p>وقت التأمين: {reset_time}</p>
                <p>عنوان IP: {ip_address}</p>
            </div>
            
            <!-- Warning -->
            <div class="warning-box">
                <p><strong>تنبيه أمني:</strong></p>
                <p>استخدم دائماً كلمة مرور قوية وفريدة. لا تشارك بيانات دخولك مع أحد.</p>
                <p>إذا كنت تشك في نشاط آخر مريب، تواصل معنا فوراً.</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0;">منصة المحامي الذكية - جميع الحقوق محفوظة © 2026</p>
            <p style="margin: 8px 0 0 0;">هذا إشعار أمني تلقائي. يرجى عدم الرد على هذا البريد الإلكتروني.</p>
        </div>
    </div>
</body>
</html>
"""
    
    return subject, html_content


def subscription_success_email(
    user_name: str,
    plan_name: str,
    invoice_id: str,
) -> tuple[str, str]:
    """
    Generate professional Arabic email for successful subscription upgrade.
    """
    subject = f"تأكيد الاشتراك في باقة {plan_name.capitalize()} — Mouhami AI"
    
    html_content = f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; }}
        .header {{ background-color: #1e293b; color: #f8fafc; padding: 40px 20px; text-align: center; border-bottom: 4px solid #d97706; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 700; }}
        .header p {{ margin: 10px 0 0 0; font-size: 14px; opacity: 0.8; text-transform: uppercase; letter-spacing: 2px; }}
        .content {{ padding: 40px 30px; line-height: 1.7; }}
        .greeting {{ font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #0f172a; }}
        .success-card {{ background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; border-radius: 8px; margin-bottom: 30px; text-align: center; }}
        .success-card h2 {{ color: #16a34a; margin: 0 0 10px 0; font-size: 20px; }}
        .plan-badge {{ display: inline-block; background-color: #d97706; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-top: 10px; }}
        .details-box {{ background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }}
        .details-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }}
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
            <h1>تأكيد الاشتراك</h1>
        </div>
        
        <div class="content">
            <p class="greeting">مرحباً {user_name}،</p>
            
            <p>
                يسعدنا تأكيد إتمام عملية الدفع بنجاح وتحديث اشتراككم في المنصة.
            </p>
            
            <div class="success-card">
                <h2>تم الدفع بنجاح</h2>
                <p style="margin: 0; color: #15803d;">حسابكم الآن مفعل بالباقة الجديدة.</p>
                <div class="plan-badge">{plan_name}</div>
            </div>
            
            <div class="details-box">
                <div class="details-row">
                    <span class="details-label">العميل:</span>
                    <span class="details-value">{user_name}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">الباقة:</span>
                    <span class="details-value">{plan_name.capitalize()}</span>
                </div>
                <div class="details-row">
                    <span class="details-label">رقم الفاتورة:</span>
                    <span class="details-value">{invoice_id}</span>
                </div>
            </div>
            
            <p>
                يمكنكم الاطلاع على فاتورتكم وتحميلها في أي وقت من خلال الإعدادات في قسم "الفواتير".
            </p>
            
            <a href="https://mouhami-ai.tn/#settings/invoices" class="btn">الاطلاع على الفاتورة</a>
        </div>
        
        <div class="footer">
            <p>جميع الحقوق محفوظة © 2026 Mouhami AI</p>
            <p>منصة الذكاء الاصطناعي القانوني للمحترفين.</p>
        </div>
    </div>
</body>
</html>
"""
    return subject, html_content
