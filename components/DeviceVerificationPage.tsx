/**
 * Device Verification - OTP Entry Page
 * Secure 6-digit OTP input for device verification
 * Full RTL Arabic support, professional design
 */

import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import './DeviceVerificationPage.scss';

interface DeviceVerificationPageProps {
  onSuccess?: () => void;
  onNavigate?: (page: string) => void;
  userId?: string;
}

export const DeviceVerificationPage: React.FC<DeviceVerificationPageProps> = ({ onSuccess, onNavigate, userId = '' }) => {
  // Extract userId from localStorage if not provided as prop
  const finalUserId = userId || localStorage.getItem('pending_device_verification_user_id') || '';
  const verificationEmail = localStorage.getItem('pending_device_verification_email') || '';
  
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timer, setTimer] = useState(300); // 5 minutes
  const [resendDisabled, setResendDisabled] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // Timer countdown effect
  useEffect(() => {
    if (timer <= 0) {
      setResendDisabled(false);
      return;
    }

    const interval = setInterval(() => {
      setTimer(t => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only one digit per box
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const digits = paste.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);

      // Focus last filled input or next empty
      const focusIndex = Math.min(digits.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // Submit OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!finalUserId) {
      setError(window.__t("خطأ: معرف المستخدم مفقود. يرجى العودة وتسجيل الدخول مجددا"));
      return;
    }
    
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError(window.__t("يرجى إدخال رمز التحقق من 6 أرقام"));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/device-security/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: finalUserId,
          otp: otpCode,
          fingerprint: localStorage.getItem('device_fingerprint') || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || window.__t("فشل التحقق من الرمز"));
        setOtp(Array(6).fill('')); // Clear OTP on error
        inputRefs.current[0]?.focus();
        return;
      }

        if (data.tokens) {
        const tokenData = {
          access_token: data.tokens.access_token,
          refresh_token: data.tokens.refresh_token,
          token_type: data.tokens.token_type || 'bearer',
        };
        storageService.setToken(tokenData);
        
        // Fetch user data with new tokens to populate getCurrentUser
        try {
          const userRes = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${data.tokens.access_token}`
            }
          });
          
          if (userRes.ok) {
            const userData = await userRes.json();
            storageService.setUser(userData);
          }
        } catch (e) {
          console.error('Failed to fetch user data after OTP verification:', e);
        }
        
        // Clean up temporary device verification data
        localStorage.removeItem('pending_device_verification_user_id');
        localStorage.removeItem('pending_device_verification_email');
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to dashboard
          if (onNavigate) {
            onNavigate('dashboard');
          }
        }
      }
    } catch (err) {
      setError(window.__t("خطأ في الاتصال. يرجى المحاولة مجددا"));
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setResendDisabled(true);
    setTimer(300); // Reset 5-minute timer
    setOtp(Array(6).fill(''));
    setError('');
    
    try {
      // Call resend endpoint
      await fetch('/api/device-security/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: finalUserId }),
      });
      
      // Show success message
      setError(window.__t("تم إرسال رمز التحقق الجديد إلى بريدك الإلكتروني"));
    } catch (err) {
      setError(window.__t("فشل إرسال الرمز. يرجى المحاولة مجددا"));
    }
  };

  return (
    <div className="device-verification-container" dir="rtl">
      <div className="verification-card">
        {/* Header */}
        <div className="verification-header">
          <div className="header-icon">🔒</div>
          <h1>{window.__t("التحقق من الجهاز")}</h1>
          <p>{window.__t("تم إرسال رمز تحقق إلى بريدك الإلكتروني")}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="verification-form">
          {/* OTP Input Boxes */}
          <div className="otp-input-group">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                placeholder="•"
                className={`otp-box ${error ? 'error' : ''}`}
                disabled={loading}
                aria-label={`رمز التحقق ${index + 1} من 6`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className={`message ${error.includes(window.__t("فشل")) || error.includes(window.__t("خطأ")) ? 'error' : 'info'}`}>
              {error}
            </div>
          )}

          {/* Timer */}
          <div className={`timer ${timer < 60 ? 'warning' : ''}`}>
            {window.__t("الرمز صالح لمدة:")} {formatTime(timer)}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || otp.some(digit => !digit)}
            className="submit-button"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {window.__t("جاري التحقق...")}
              </>
            ) : (
              window.__t("تأكيد الجهاز")
            )}
          </button>
        </form>

        {/* Resend Link */}
        <div className="resend-section">
          <p>{window.__t("لم تستقبل الرمز؟")}</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            className="resend-button"
          >
            {resendDisabled
              ? `إعادة الإرسال بعد ${formatTime(timer)}`
              : window.__t("إعادة إرسال الرمز")}
          </button>
        </div>

        {/* Help Text */}
        <div className="help-text">
          <p>
            {window.__t(`إذا واجهت مشاكل في استقبال الرمز، تحقق من مجلد الرسائل غير المرغوبة
\n            أو اتصل بفريق الدعم`)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeviceVerificationPage;
