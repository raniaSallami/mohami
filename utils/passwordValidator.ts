/**
 * Password validation utility
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 */

export const passwordRequirements = {
  minLength: 8,
  hasUppercase: false,
  hasLowercase: false,
  hasDigit: false,
};

export interface PasswordValidation {
  isValid: boolean;
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  
  const minLength = password.length >= 8;
  if (!minLength) errors.push('Minimum 8 caractères');

  const hasUppercase = /[A-Z]/.test(password);
  if (!hasUppercase) errors.push('Au moins 1 lettre majuscule');

  const hasLowercase = /[a-z]/.test(password);
  if (!hasLowercase) errors.push('Au moins 1 lettre minuscule');

  const hasDigit = /\d/.test(password);
  if (!hasDigit) errors.push('Au moins 1 chiffre');

  return {
    isValid: minLength && hasUppercase && hasLowercase && hasDigit,
    minLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    errors,
  };
};

export const getPasswordStrength = (validation: PasswordValidation): 'faible' | 'moyen' | 'fort' => {
  if (!validation.isValid) return 'faible';
  if (validation.hasUppercase && validation.hasLowercase && validation.hasDigit) return 'fort';
  return 'moyen';
};
