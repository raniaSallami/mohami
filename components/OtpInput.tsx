import React, { useRef, useEffect, useState } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  error,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isFilled, setIsFilled] = useState(false);

  // Pad value with empty strings
  const otp = value.padEnd(length, '');

  useEffect(() => {
    setIsFilled(value.length === length);
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, val: string) => {
    if (disabled) return;

    // Only allow digits
    const digit = val.replace(/[^0-9]/g, '');

    if (digit.length > 1) {
      // Handle paste: if multiple digits pasted, distribute them
      const newOtp = (value + digit).slice(0, length);
      onChange(newOtp);
      // Focus on next empty field or last field
      const nextIndex = Math.min(newOtp.length, length - 1);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 0);
    } else {
      // Single digit
      const newOtp = otp.substring(0, index) + digit + otp.substring(index + 1);
      onChange(newOtp.trimEnd());

      // Auto focus next input
      if (digit && index < length - 1) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 0);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (otp[index]) {
        // Clear current digit
        const newOtp = otp.substring(0, index) + otp.substring(index + 1);
        onChange(newOtp.trimEnd());
      } else if (index > 0) {
        // Move to previous and clear it
        const newOtp = otp.substring(0, index - 1) + otp.substring(index);
        onChange(newOtp.trimEnd());
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, length);
    if (digits) {
      onChange(digits);
      // Focus on last input or next empty field
      const nextIndex = Math.min(digits.length, length - 1);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 0);
    }
  };

  return (
    <div className="w-full">
      {/* OTP Input Container - Force LTR direction */}
      <div className="flex justify-center gap-2 sm:gap-3" dir="ltr" style={{ direction: 'ltr' }}>
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={otp[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            dir="ltr"
            style={{ direction: 'ltr' }}
            className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : otp[index]
                ? 'border-primary-500 focus:ring-primary-500 bg-primary-50'
                : 'border-gray-300 focus:ring-primary-400'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white hover:border-gray-400'}`}
            aria-label={`رقم التحقق ${index + 1}`}
          />
        ))}
      </div>

      {error && (
        <div className="mt-3 text-red-600 text-sm text-center font-medium flex items-center justify-center gap-1">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gray-500">
        {isFilled ? (
          <span className="text-green-600 font-medium flex items-center justify-center gap-1">
            <span>✓</span> {window.__t("تم إدخال الرمز بنجاح")}
          </span>
        ) : (
          <span>{window.__t("أدخل")} {length} {window.__t("أرقام - يمكنك أيضاً لصق الرمز كاملاً")}</span>
        )}
      </div>
    </div>
  );
};
