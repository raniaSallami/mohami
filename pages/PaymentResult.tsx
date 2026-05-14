import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';

type PaymentResultProps = {
  status: 'success' | 'fail';
  onNavigate: (page: string) => void;
  onRefreshUser: (user: any) => void;
};

export const PaymentResult: React.FC<PaymentResultProps> = ({ status, onNavigate, onRefreshUser }) => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (status !== 'success') {
        setMessage(window.__t('فشل الدفع. يرجى المحاولة مرة أخرى.'));
        setLoading(false);
        return;
      }

      try {
        const hash = window.location.hash;
        const hashQueryIndex = hash.indexOf('?');
        const hashQueryString = hashQueryIndex >= 0 ? hash.slice(hashQueryIndex + 1) : '';
        const hashParams = new URLSearchParams(hashQueryString);
        const searchParams = new URLSearchParams(window.location.search);

        const orderId = hashParams.get('orderId') || searchParams.get('orderId') || hashParams.get('mdOrder') || searchParams.get('mdOrder');
        const invoiceIdFromUrl = hashParams.get('invoiceId') || searchParams.get('invoiceId');

        if (!orderId && !invoiceIdFromUrl) {
          setMessage(window.__t('تعذر العثور على معرف الدفع.'));
          setLoading(false);
          return;
        }

        const result = await storageService.verifySubscription(orderId || undefined, invoiceIdFromUrl || undefined);
        if (result?.success === 'true' || result?.status === 'paid') {
          setInvoiceId(result.invoiceId || null);
          setMessage(window.__t('تم الدفع بنجاح وتم تفعيل الترقية تلقائياً.'));
          // Get fresh user data to reflect new plan
          const freshUser = await storageService.getCurrentUserFresh();
          if (freshUser) {
            onRefreshUser(freshUser);
            // Optional: trigger a small delay before showing success to ensure backend sync
            setTimeout(() => {
              setLoading(false);
            }, 500);
          }
        } else {
          setMessage(window.__t('لم يتم تأكيد الدفع بعد. يرجى المحاولة لاحقاً.'));
        }
      } catch (error: any) {
        setMessage(error?.message || window.__t('حدث خطأ أثناء التحقق من عملية الدفع.'));
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [status, onRefreshUser]);

  const openInvoicePdf = async () => {
    if (!invoiceId) return;
    try {
      await storageService.downloadInvoicePdf(invoiceId);
    } catch (error: any) {
      alert(window.__t('Failed to download invoice') + ': ' + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">
        {loading ? window.__t('جاري معالجة الدفع...') : window.__t('نتيجة عملية الدفع')}
      </h2>
      <p className={`mb-6 ${status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message}</p>

      {!loading && status === 'success' && invoiceId && (
        <button
          onClick={openInvoicePdf}
          className="mb-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {window.__t('تحميل الفاتورة PDF')}
        </button>
      )}

      <div className="flex justify-center gap-3">
        <button
          onClick={() => onNavigate('settings')}
          className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          {window.__t('العودة إلى الإعدادات')}
        </button>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-5 py-2 bg-gray-100 text-slate-700 rounded-lg hover:bg-gray-200"
        >
          {window.__t('العودة إلى لوحة التحكم')}
        </button>
      </div>
    </div>
  );
};
