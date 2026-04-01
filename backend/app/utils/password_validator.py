"""
Password validation utility for backend.
Ensures all passwords meet security requirements:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 digit (0-9)
"""

from pydantic import BaseModel
import re


class PasswordValidation(BaseModel):
    is_valid: bool
    min_length: bool
    has_uppercase: bool
    has_lowercase: bool
    has_digit: bool
    errors: list[str] = []


def validate_password(password: str) -> PasswordValidation:
    """
    Validate password meets all security requirements.
    
    Args:
        password: Password to validate
        
    Returns:
        PasswordValidation object with validation results
    """
    errors = []
    
    # Check minimum length
    min_length = len(password) >= 8
    if not min_length:
        errors.append("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    
    # Check for uppercase letters
    has_uppercase = bool(re.search(r'[A-Z]', password))
    if not has_uppercase:
        errors.append("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
    
    # Check for lowercase letters
    has_lowercase = bool(re.search(r'[a-z]', password))
    if not has_lowercase:
        errors.append("كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل")
    
    # Check for digits
    has_digit = bool(re.search(r'\d', password))
    if not has_digit:
        errors.append("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل")
    
    is_valid = all([min_length, has_uppercase, has_lowercase, has_digit])
    
    return PasswordValidation(
        is_valid=is_valid,
        min_length=min_length,
        has_uppercase=has_uppercase,
        has_lowercase=has_lowercase,
        has_digit=has_digit,
        errors=errors
    )
