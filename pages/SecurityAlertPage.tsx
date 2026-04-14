import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Spinner } from '../components/UI';
import { validatePassword, type PasswordValidation } from '../utils/passwordValidator';

interface SecurityAlertPageProps {
  onNavigate: (page: string) => void;
  alertType: 'confirm' | 'not-me';
}

export const SecurityAlertPage: React.FC<SecurityAlertPageProps> = ({ onNavigate, alertType }) => {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    isValid: false,
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasDigit: false,
    errors: [],
  });
  const [logoutAllDevices, setLogoutAllDevices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info');

  useEffect(() => {
    // Get email from URL hash parameters
    const hash = window.location.hash;
    const parts = hash.split('/');
    const emailFromHash = parts[2] || '';
    
    if (emailFromHash) {
      setEmail(emailFromHash);
    }

    // Get user_id from localStorage (set when OTP_REQUIRED)
    const storedUserId = localStorage.getItem('pending_device_verification_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
    }

    // Set initial message based on action
    if (alertType === 'confirm') {
      setMessage(window.__t("تم تسجيل الدخول من جهاز جديد. يرجى إدخال الرمز المرسل إلى بريدك الإلكتروني."));
      setMessageType('info');
    } else if (alertType === 'not-me') {
      setMessage(window.__t("تم اكتشاف نشاط مريب. يرجى تغيير كلمة المرور الخاصة بك فوراً."));
      setMessageType('error');
    }
  }, [alertType]);

  // Validate password in real-time
  useEffect(() => {
    if (newPassword) {
      const validation = validatePassword(newPassword);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({
        isValid: false,
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasDigit: false,
        errors: [],
      });
    }
  }, [newPassword]);

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setMessage(window.__t("يرجى إدخال الرمز"));
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { apiService } = await import('../services/apiService');
      const fingerprint = navigator.userAgent;
      const response = await apiService.loginEmailStep2(userId, otp, fingerprint);

      if (response.ok && response.user && response.token) {
        setMessage(window.__t("✅ تم التحقق بنجاح! جاري تسجيل الدخول..."));
        setMessageType('success');
        
        storageService.setCurrentUser(response.user);
        localStorage.setItem('almohami_access_token', response.token);
        
        localStorage.removeItem('pending_device_verification_user_id');
        localStorage.removeItem('pending_device_verification_email');
        
        setTimeout(() => onNavigate('dashboard'), 1500);
      } else {
        setMessage(response.message || window.__t("رمز غير صحيح أو انتهت صلاحيته"));
        setMessageType('error');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : window.__t("حدث خطأ"));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setMessage(validation.errors.join(' | '));
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage(window.__t("كلمات المرور غير متطابقة"));
      setMessageType('error');
      return;
    }

    if (!email) {
      setMessage(window.__t("البريد الإلكتروني غير موجود"));
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { apiService } = await import('../services/apiService');
      const response = await apiService.emergencyResetPassword(email, newPassword, logoutAllDevices);

      if (response.ok) {
        setMessage(window.__t("✅ تم تغيير كلمة المرور بنجاح! يرجى تسجيل الدخول مجدداً."));
        setMessageType('success');
        
        localStorage.removeItem('pending_device_verification_user_id');
        localStorage.removeItem('pending_device_verification_email');
        
        setTimeout(() => onNavigate('login'), 2000);
      } else {
        setMessage(response.message || window.__t("حدث خطأ أثناء تغيير كلمة المرور"));
        setMessageType('error');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : window.__t("حدث خطأ"));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className={`p-3 rounded-full ${
            alertType === 'not-me' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <span className="text-4xl">
              {alertType === 'not-me' ? '⚠️' : '🔐'}
            </span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {alertType === 'confirm' ? window.__t("التحقق من الجهاز الجديد") : window.__t("تأمين حسابك")}
          </h2>
        </div>

        {/* Alert Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${
            messageType === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
            messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
            'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            <p className="text-end">{message}</p>
          </div>
        )}

        {/* OTP Verification Form */}
        {alertType === 'confirm' && (
          <form onSubmit={handleConfirmOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                {window.__t("رمز التحقق (6 أرقام)")}
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                disabled={loading}
              />
              <p className="mt-2 text-sm text-gray-500">
                {window.__t("تم إرسال الرمز إلى:")} <strong>{email}</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !otp}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner /> : window.__t("تحقق من الرمز")}
            </button>
          </form>
        )}

        {/* Password Change Form */}
        {alertType === 'not-me' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                {window.__t("كلمة المرور الجديدة")}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={window.__t("أدخل كلمة مرور جديدة قوية")}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                  newPassword && !passwordValidation.isValid
                    ? 'border-red-300 bg-red-50'
                    : newPassword && passwordValidation.isValid
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
                disabled={loading}
              />
              
              {/* Password Requirements Checklist */}
              {newPassword && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-700' : 'text-red-700'}`}>
                    <span>{passwordValidation.minLength ? '✓' : '✗'}</span>
                    <span>Minimum 8 caractères</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasUppercase ? 'text-green-700' : 'text-red-700'}`}>
                    <span>{passwordValidation.hasUppercase ? '✓' : '✗'}</span>
                    <span>Au moins 1 lettre majuscule (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasLowercase ? 'text-green-700' : 'text-red-700'}`}>
                    <span>{passwordValidation.hasLowercase ? '✓' : '✗'}</span>
                    <span>Au moins 1 lettre minuscule (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasDigit ? 'text-green-700' : 'text-red-700'}`}>
                    <span>{passwordValidation.hasDigit ? '✓' : '✗'}</span>
                    <span>Au moins 1 chiffre (0-9)</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {window.__t("تأكيد كلمة المرور")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={window.__t("أعد إدخال كلمة المرور")}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-300 bg-red-50'
                    : confirmPassword && newPassword === confirmPassword
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
                disabled={loading}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-700">{window.__t("كلمات المرور غير متطابقة")}</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="mt-1 text-xs text-green-700">{window.__t("كلمات المرور متطابقة ✓")}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="logoutAll"
                type="checkbox"
                checked={logoutAllDevices}
                onChange={(e) => setLogoutAllDevices(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="logoutAll" className="me-2 block text-sm text-gray-700">
                {window.__t("تسجيل الخروج من جميع الأجهزة الأخرى")} <span className="text-xs text-gray-500">{window.__t("(اختياري)")}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValidation.isValid || newPassword !== confirmPassword}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner /> : window.__t("تغيير كلمة المرور")}
            </button>
          </form>
        )}

        {/* No Action */}
        {!alertType && (
          <div className="text-center">
            <p className="text-gray-600">{window.__t("جاري التحميل...")}</p>
            <Spinner />
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('login')}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            {window.__t("العودة إلى تسجيل الدخول")}
          </button>
        </div>
      </div>
    </div>
  );
};
