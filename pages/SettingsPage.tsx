
import React, { useState, useEffect } from 'react';
import { User, Invoice, PLAN_LIMITS } from '../types';
import { storageService } from '../services/storageService';
import { Modal, Spinner, Toast } from '../components/UI';
import { validatePassword, type PasswordValidation } from '../utils/passwordValidator';

export const SettingsPage = ({ user, onUpdateUser }: { user: User, onUpdateUser: (u: User) => void }) => {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise' | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [pricing, setPricing] = useState({ pro: 59, enterprise: 199 });
  const [planLimits, setPlanLimits] = useState(PLAN_LIMITS);
  
  // Profile state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    isValid: false,
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasDigit: false,
    errors: [],
  });
  const [phone, setPhone] = useState(user.phone || '');
  const [barNumber, setBarNumber] = useState(user.bar_number || '');
  const [cabinetName, setCabinetName] = useState(user.cabinet_name || '');
  const [university, setUniversity] = useState(user.university || '');

  useEffect(() => {
    setPasswordValidation(validatePassword(newPassword));
  }, [newPassword]);

  useEffect(() => {
    const loadData = async () => {
      const [invoicesData, pricingData, limitsData, freshUser] = await Promise.all([
        storageService.getInvoices(),
        storageService.getPlanPricing(),
        storageService.getPlanLimits(),
        storageService.getCurrentUserFresh()
      ]);
      setInvoices(invoicesData);
      setPricing(pricingData);
      setPlanLimits(limitsData);
      if (freshUser && (freshUser.subscriptionPlan !== user.subscriptionPlan || freshUser.subscriptionStatus !== user.subscriptionStatus)) {
        onUpdateUser(freshUser);
      }
    };
    loadData();
  }, []); // Sync user from DB on mount (e.g. after admin approves payment)

  const handleUpdateProfile = async () => {
    setLoading(true);
    const updatedUser = { 
      ...user, 
      name, 
      email, 
      phone, 
      bar_number: barNumber, 
      cabinet_name: cabinetName, 
      university: university 
    };
    await storageService.updateUser(updatedUser);
    onUpdateUser(updatedUser);
    setLoading(false);
    setNotification({ msg: window.__t("تم تحديث البيانات بنجاح"), type: 'success' });
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword || !passwordValidation.isValid) {
      setPasswordError(window.__t("يرجى التحقق من المدخلات"));
      return;
    }
    setLoading(true);
    setPasswordError('');
    const result = await storageService.changePassword(currentPassword, newPassword);
    setLoading(false);
    
    if (result.ok) {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotification({ msg: window.__t("تم تغيير كلمة المرور بنجاح"), type: 'success' });
    } else {
      setPasswordError(result.message || window.__t("فشل تغيير كلمة المرور"));
    }
  };

  const handleSelectPlan = (plan: 'pro' | 'enterprise') => {
      setSelectedPlan(plan);
      setShowPlanModal(false);
      setShowPaymentModal(true);
  };

  const handleSubmitPayment = async () => {
      if (!selectedPlan || !receiptFile) {
          setNotification({ msg: window.__t("يرجى تحميل صورة الوصل"), type: 'error' });
          return;
      }

      setLoading(true);
      
      const reader = new FileReader();
      reader.readAsDataURL(receiptFile);
      reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await storageService.submitPayment(selectedPlan, base64);
          
          const fresh = await storageService.getCurrentUserFresh();
          if (fresh) onUpdateUser(fresh);
          
          setLoading(false);
          setShowPaymentModal(false);
          setNotification({ msg: window.__t("تم إرسال طلبك. سيتم تفعيل الباقة بعد مراجعة الإدارة."), type: 'success' });
          
          storageService.getInvoices().then(setInvoices);
      };
  };

  const planDetails = PLAN_LIMITS[user.subscriptionPlan || 'basic'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {notification && <Toast message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}
      <h2 className="text-2xl font-bold text-slate-800">{window.__t("إعدادات الحساب")}</h2>

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{window.__t("المعلومات الشخصية")}</h3>
              <button 
                onClick={handleUpdateProfile}
                disabled={loading || (name === user.name && email === user.email)}
                className="text-primary-600 font-bold text-sm hover:underline disabled:text-gray-400"
              >
                {loading ? window.__t("جاري الحفظ...") : window.__t("حفظ التغييرات")}
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("الاسم الكامل أو اسم المكتب")}</label>
               <input 
                 type="text" 
                 value={name} 
                 onChange={(e) => setName(e.target.value)}
                 placeholder={window.__t("الاسم الكامل أو اسم المكتب")}
                 className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("البريد الإلكتروني")}</label>
               <input 
                 type="email" 
                 value={email} 
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("رقم الهاتف")}</label>
               <input 
                 type="tel" 
                 value={phone} 
                 onChange={(e) => setPhone(e.target.value)}
                 className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
               />
             </div>

             {user.account_type === 'lawyer' && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("رقم بطاقة المحاماة")}</label>
                 <input 
                   type="text" 
                   value={barNumber} 
                   onChange={(e) => setBarNumber(e.target.value)}
                   className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                 />
               </div>
             )}

             {user.account_type === 'cabinet' && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("اسم المكتب")}</label>
                 <input 
                   type="text" 
                   value={cabinetName} 
                   onChange={(e) => setCabinetName(e.target.value)}
                   className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                 />
               </div>
             )}

             {user.account_type === 'student' && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("الجامعة")}</label>
                 <input 
                   type="text" 
                   value={university} 
                   onChange={(e) => setUniversity(e.target.value)}
                   className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
                 />
               </div>
             )}
           </div>
        </div>
        <div className="p-6 bg-gray-50 flex justify-between items-center">
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="text-primary-600 text-sm font-medium hover:underline"
          >
            {window.__t("تغيير كلمة المرور")}
          </button>
        </div>
      </div>

      {/* Subscription & Usage Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{window.__t("الاشتراك والاستخدام")}</h3>
            <div className={`flex items-center justify-between p-4 border rounded-lg mb-6 ${user.subscriptionStatus === 'pending_approval' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'}`}>
               <div>
                 <p className="font-bold text-slate-900 text-lg">
                   {window.__t("الباقة الحالية:")} {user.subscriptionPlan === 'basic' ? window.__t("أساسية") : user.subscriptionPlan === 'pro' ? window.__t("احترافية") : window.__t("المكتب")}
                 </p>
                 <p className={`text-sm ${user.subscriptionStatus === 'pending_approval' ? 'text-orange-700 font-bold' : 'text-blue-700'}`}>
                   {window.__t("الحالة:")} {user.subscriptionStatus === 'pending_approval' ? window.__t("بانتظار الموافقة على الدفع ⏳") : window.__t("نشط")}
                 </p>
               </div>
               {user.subscriptionPlan === 'basic' && user.subscriptionStatus !== 'pending_approval' && (
                 <button 
                   onClick={() => setShowPlanModal(true)}
                   className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-md transition"
                 >
                   {window.__t("ترقية الباقة 🚀")}
                 </button>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                 <h4 className="text-sm font-bold text-gray-500 mb-2">{window.__t("حد القضايا")}</h4>
                 <div className="flex items-end space-x-2 space-x-reverse">
                   <span className="text-2xl font-bold text-slate-800">{planDetails.cases > 1000 ? '∞' : planDetails.cases}</span>
                   <span className="text-sm text-gray-500 mb-1">{window.__t("قضية")}</span>
                 </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                 <h4 className="text-sm font-bold text-gray-500 mb-2">{window.__t("حد العقود")}</h4>
                 <div className="flex items-end space-x-2 space-x-reverse">
                   <span className="text-2xl font-bold text-slate-800">{planDetails.contracts > 1000 ? '∞' : planDetails.contracts}</span>
                   <span className="text-sm text-gray-500 mb-1">{window.__t("عقد")}</span>
                 </div>
              </div>
            </div>
         </div>
      </div>

      {/* Invoices History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{window.__t("سجل الفواتير والطلبات")}</h3>
            {invoices.length === 0 ? (
              <p className="text-gray-500 text-sm">{window.__t("لا توجد فواتير سابقة.")}</p>
            ) : (
              <table className="w-full text-sm text-end">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-2">{window.__t("التاريخ")}</th>
                    <th className="px-4 py-2">{window.__t("الباقة")}</th>
                    <th className="px-4 py-2">{window.__t("المبلغ")}</th>
                    <th className="px-4 py-2">{window.__t("الحالة")}</th>
                    <th className="px-4 py-2">{window.__t("الوصل")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3">{new Date(inv.date).toLocaleDateString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR'))}</td>
                      <td className="px-4 py-3 font-medium">{inv.planName}</td>
                      <td className="px-4 py-3">{inv.amount} TND</td>
                      <td className="px-4 py-3">
                          {inv.status === 'paid' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">{window.__t("مدفوع")}</span>}
                          {inv.status === 'pending' && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs">{window.__t("قيد المراجعة")}</span>}
                          {inv.status === 'rejected' && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">{window.__t("مرفوض")}</span>}
                      </td>
                      <td className="px-4 py-3">
                         {inv.receiptData && <span className="text-xs text-blue-600 cursor-pointer hover:underline">{window.__t("عرض")}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
         </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showPasswordModal} onClose={() => {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
      }} title={window.__t("تغيير كلمة المرور")}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{window.__t("كلمة المرور الحالية")}</label>
            <input 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" 
              placeholder={window.__t("أدخل كلمة المرور الحالية")} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{window.__t("كلمة المرور الجديدة")}</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              className={`w-full px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                newPassword && !passwordValidation.isValid ? 'border-red-500' : 'border-gray-300'
              }`} 
              placeholder={window.__t("كلمة المرور الجديدة")} 
            />
            
            {newPassword && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-2">{window.__t("متطلبات كلمة المرور:")}</p>
                <div className="space-y-1 text-xs text-end">
                  <div className={`flex items-center ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="me-2">{passwordValidation.minLength ? '✓' : '✗'}</span>
                    <span>{window.__t("8 أحرف على الأقل")}</span>
                  </div>
                  <div className={`flex items-center ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="me-2">{passwordValidation.hasUppercase ? '✓' : '✗'}</span>
                    <span>{window.__t("حرف كبير (A-Z)")}</span>
                  </div>
                  <div className={`flex items-center ${passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="me-2">{passwordValidation.hasLowercase ? '✓' : '✗'}</span>
                    <span>{window.__t("حرف صغير (a-z)")}</span>
                  </div>
                  <div className={`flex items-center ${passwordValidation.hasDigit ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="me-2">{passwordValidation.hasDigit ? '✓' : '✗'}</span>
                    <span>{window.__t("رقم (0-9)")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{window.__t("تأكيد كلمة المرور الجديدة")}</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className={`w-full px-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                confirmPassword && newPassword !== confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`} 
              placeholder={window.__t("أعد كتابة كلمة المرور الجديدة")} 
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{window.__t("كلمات المرور غير متطابقة")}</p>
            )}
          </div>

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {passwordError}
            </div>
          )}

          <button 
            onClick={handleChangePassword} 
            disabled={loading || !currentPassword || !passwordValidation.isValid || newPassword !== confirmPassword} 
            className="w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? <Spinner /> : window.__t("تحديث كلمة المرور")}
          </button>
        </div>
      </Modal>

      <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title={window.__t("اختر خطة الترقية")}>
        <div className="space-y-4">
          <div className="border p-4 rounded-lg cursor-pointer hover:border-gold-500 hover:bg-gold-50 transition group" onClick={() => handleSelectPlan('pro')}>
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800">{window.__t("باقة المحترف")}</h4>
              <span className="text-gold-600 font-bold group-hover:scale-110 transition">{pricing.pro} {window.__t("د.ت")}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{window.__t("ذكاء اصطناعي غير محدود +")} {planLimits.pro.cases} {window.__t("قضية")}</p>
          </div>
          
          <div className="border p-4 rounded-lg cursor-pointer hover:border-gold-500 hover:bg-gold-50 transition group" onClick={() => handleSelectPlan('enterprise')}>
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800">{window.__t("باقة المكتب")}</h4>
              <span className="text-gold-600 font-bold group-hover:scale-110 transition">{pricing.enterprise} {window.__t("د.ت")}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{window.__t("كل شيء غير محدود + 3 مستخدمين")}</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={window.__t("تفاصيل الدفع (تحويل بنكي)")}>
         <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm space-y-2">
                <p className="font-bold text-slate-800 border-b border-gray-200 pb-2 mb-2">{window.__t("بيانات التحويل البنكي:")}</p>
                <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">{window.__t("الشركة:")}</span>
                    <span className="col-span-2 font-medium">STE NOVALABS WEB DESIGN</span>
                    
                    <span className="text-gray-500">RIB:</span>
                    <span className="col-span-2 font-mono bg-white px-2 py-0.5 rounded border">TN 59 03 122 118 0115 004676 17</span>
                    
                    <span className="text-gray-500">SWIFT:</span>
                    <span className="col-span-2 font-mono">BNTETNTT</span>
                    
                    <span className="text-gray-500">Email:</span>
                    <span className="col-span-2">contact@novalabs.tn</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">{window.__t("ارفع صورة وصل التحويل")}</label>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:me-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-xs text-gray-400">{window.__t("يرجى التأكد من أن المبلغ مطابق لسعر الباقة (")}{selectedPlan === 'pro' ? pricing.pro : pricing.enterprise} {window.__t("د.ت)")}</p>
            </div>

            <button 
                onClick={handleSubmitPayment}
                disabled={loading || !receiptFile}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:bg-gray-400 flex justify-center items-center"
            >
                {loading ? <Spinner /> : window.__t("إرسال طلب التفعيل")}
            </button>
         </div>
      </Modal>
    </div>
  );
};
