from fastapi import Request
from typing import Optional

def get_user_lang(request: Optional[Request]) -> str:
    """
    Extract language from request headers (Accept-Language).
    Defaults to 'ar'.
    """
    if not request:
        return "ar"
    
    accept_lang = request.headers.get("Accept-Language", "ar")
    if "fr" in accept_lang.lower():
        return "fr"
    return "ar"

def get_email_template(template_name: str, lang: str = "ar"):
    """
    Returns the appropriate template function based on language.
    """
    if lang == "fr":
        from app.templates import email_templates_fr
        return getattr(email_templates_fr, f"{template_name}_fr", None)
    else:
        from app.templates import email_templates_ar
        return getattr(email_templates_ar, template_name, None)
