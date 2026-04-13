import React, { useState, useEffect } from 'react';
import { Modal } from './UI';
import { OtpInput } from './OtpInput';

interface IpVerificationModalProps {
  isOpen: boolean;
  userName: string;
  onVerify: (otp: string) => Promise<boolean>;
  onCancel: () => void;
}

export const IpVerificationModal: React.FC<IpVerificationModalProps> = ({
  isOpen,
  userName,
  onVerify,
  onCancel
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setOtp('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true);
    setError('');
    try {
      const success = await onVerify(otp.trim());
      if (!success) setError('الرمز غير صحيح أو منتهي الصلاحية');
    } catch {
      setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="التحقق من تسجيل الدخول" preventClose={true}>
      <div className="space-y-6" dir="rtl">
        <div className="bg-blue-50 border-r-4 border-blue-400 p-4 rounded">
          <p className="text-blue-900 font-bold mb-2">تسجيل دخول من موقع جديد</p>
          <p className="text-blue-800 text-sm">
            مرحباً {userName}، تم اكتشاف محاولة دخول من عنوان IP مختلف. تم إرسال رمز تحقق لبريدك الإلكتروني. أدخل الرمز أدناه للمتابعة.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-right">رمز التحقق (6 أرقام)</label>
            <OtpInput
              value={otp}
              onChange={setOtp}
              length={6}
              disabled={loading}
              error={error ? 'الرمز غير صحيح أو منتهي الصلاحية' : undefined}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التحقق...' : 'تأكيد'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              إلغاء وتسجيل الخروج
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 text-center">
          الرمز صالح لمدة 10 دقائق. لم تستلم الرمز؟ تحقق من مجلد البريد العشوائي.
        </p>
      </div>
    </Modal>
  );
};
