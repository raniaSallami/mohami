from fastapi import Request
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User

def get_user_lang(request: Optional[Request] = None, user: Optional["User"] = None) -> str:
    """
    Extract language from user preferences or request headers (Accept-Language).
    Defaults to 'ar'.
    """
    # First priority: user's stored language preference
    if user and hasattr(user, 'language'):
        return user.language

    # Fallback: extract from request headers
    if request:
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
