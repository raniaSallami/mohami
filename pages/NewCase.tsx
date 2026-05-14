import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { CaseFile } from '../types';
import { Spinner, Modal } from '../components/UI';

export const NewCase = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [type, setType] = useState('criminal');
  const [loading, setLoading] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; clientName?: string }>({});

  const validateFields = () => {
    const newErrors: { title?: string; clientName?: string } = {};
    const trimmedTitle = title.trim();
    const trimmedClient = clientName.trim();

    if (!trimmedTitle) {
      newErrors.title = window.__t("يرجى إدخال عنوان القضية أو رقم الملف.");
    } else if (trimmedTitle.length < 5) {
      newErrors.title = window.__t("يجب أن يحتوي عنوان القضية على 5 أحرف على الأقل.");
    } else if (trimmedTitle.length > 120) {
      newErrors.title = window.__t("يجب أن يكون عنوان القضية أقل من 120 حرفًا.");
    } else if (!/^[\p{L}\d\s\/\-\.]+$/u.test(trimmedTitle)) {
      newErrors.title = window.__t("عنوان القضية يمكن أن يحتوي فقط على حروف وأرقام ومسافات ورموز بسيطة.");
    }

    if (!trimmedClient) {
      newErrors.clientName = window.__t("يرجى إدخال اسم العميل.");
    } else if (trimmedClient.length < 3) {
      newErrors.clientName = window.__t("يجب أن يحتوي اسم العميل على 3 أحرف على الأقل.");
    } else if (trimmedClient.length > 80) {
      newErrors.clientName = window.__t("يجب أن يكون اسم العميل أقل من 80 حرفًا.");
    } else if (!/^[\p{L}\s'\-\.]+$/u.test(trimmedClient)) {
      newErrors.clientName = window.__t("اسم العميل يمكن أن يحتوي فقط على أحرف ومسافات وفواصل بسيطة.");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      const hasLimit = await storageService.checkUsageLimit('cases');
      if (!hasLimit) {
        setLoading(false);
        alert(window.__t("عفواً، لقد تجاوزت عدد القضايا المسموح به في باقتك الحالية. يرجى الترقية لإضافة المزيد."));
        onNavigate('settings');
        return;
      }

      const newCase: CaseFile = {
        id: Date.now().toString(),
        title,
        clientName,
        type: type as any,
        status: 'active',
        dateCreated: new Date().toISOString(),
        documents: []
      };
      
      const { pendingApproval } = await storageService.addCase(newCase);
      
      if (!pendingApproval) {
        try {
          const user = storageService.getCurrentUser();
          if (user) {
            const { emailService } = await import('../services/emailService');
            await emailService.sendCaseCreatedEmail(user.email, user.name, newCase.title);
          }
        } catch (emailError) {
          console.error('Failed to send case created email:', emailError);
        }
        onNavigate('cases');
      } else {
        setShowPendingModal(true);
      }
    } catch (err: any) {
      console.error('Failed to create case:', err);
      alert(window.__t("فشل إنشاء القضية. يرجى التحقق من صحة البيانات والمحاولة مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{window.__t("إضافة قضية جديدة")}</h2>
        <button onClick={() => onNavigate('cases')} className="text-gray-500 hover:text-gray-700">{window.__t("إلغاء")}</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("عنوان القضية / رقم الملف")}</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder={window.__t("مثال: قضية رقم 124/2024")}
              />
              {errors.title ? (
                <p className="mt-2 text-sm text-red-600">{errors.title}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("اسم الموكل")}</label>
              <input 
                type="text" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${errors.clientName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                placeholder={window.__t("الاسم الكامل")}
              />
              {errors.clientName ? (
                <p className="mt-2 text-sm text-red-600">{errors.clientName}</p>
              ) : null}

            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("نوع القضية")}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'criminal', label: window.__t("جنائية") },
                { id: 'civil', label: window.__t("مدنية") },
                { id: 'commercial', label: window.__t("تجارية") },
                { id: 'course', label: window.__t("مادة تعليمية") }
              ].map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => setType(opt.id)}
                  className={`cursor-pointer rounded-lg border p-4 text-center transition ${
                    type === opt.id 
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
             <button 
               type="submit"
               disabled={loading}
               className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium flex justify-center items-center"
             >
               {loading ? <Spinner /> : window.__t("حفظ القضية")}
             </button>
          </div>
        </form>
      </div>

      <Modal isOpen={showPendingModal} onClose={() => { setShowPendingModal(false); onNavigate('cases'); }} title={window.__t("تم إرسال الطلب")}>
        <div className="space-y-4 text-center">
          <p className="text-slate-700">
            {window.__t("تم إرسال طلب إنشاء القضية إلى مدير المكتب. بانتظار موافقته.")}
          </p>
          <p className="text-sm text-gray-500">
            {window.__t("ستتلقى إشعاراً عند الموافقة أو الرفض.")}
          </p>
          <button
            onClick={() => { setShowPendingModal(false); onNavigate('cases'); }}
            className="w-full py-3 bg-gold-500 text-slate-900 rounded-lg font-bold hover:bg-gold-400"
          >
            {window.__t("حسناً")}
          </button>
        </div>
      </Modal>
    </div>
  );
};
