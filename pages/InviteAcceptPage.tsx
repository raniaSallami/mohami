import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';
import { Spinner } from '../components/UI';

export const InviteAcceptPage = ({
  token,
  onAccept,
  onNavigate
}: {
  token: string;
  onAccept: (user: User) => void;
  onNavigate: (page: string) => void;
}) => {
  const [inviteInfo, setInviteInfo] = useState<{ email: string; inviterName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const info = await storageService.getInviteByToken(token);
        if (info) {
          setInviteInfo({ email: info.email, inviterName: info.inviterName });
        } else {
          setError(window.__t("الدعوة غير صالحة أو منتهية الصلاحية"));
        }
      } catch (e) {
        setError(window.__t("حدث خطأ"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(window.__t("كلمة المرور غير متطابقة"));
      return;
    }
    if (password.length < 6) {
      setError(window.__t("كلمة المرور يجب أن تكون 6 أحرف على الأقل"));
      return;
    }
    setSubmitting(true);
    try {
      const user = await storageService.acceptTeamInvite(token, name, password);
      onAccept(user);
      onNavigate('team');
    } catch (err) {
      setError(err instanceof Error ? err.message : window.__t("حدث خطأ"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{window.__t("دعوة غير صالحة")}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => onNavigate('landing')}
            className="px-6 py-3 bg-gold-500 text-slate-900 rounded-lg font-bold hover:bg-gold-400"
          >
            {window.__t("العودة للرئيسية")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">{window.__t("قبول الدعوة")}</h1>
          <p className="text-gray-600 mt-2">
            {window.__t("تمت دعوتك من قبل")} <strong>{inviteInfo?.inviterName}</strong> {window.__t("للانضمام لفريق المكتب")}
          </p>
          <p className="text-sm text-gray-500 mt-1">{inviteInfo?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{window.__t("الاسم الكامل أو اسم المكتب")}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={window.__t("الاسم الكامل أو اسم المكتب")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{window.__t("كلمة المرور")}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={window.__t("6 أحرف على الأقل")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{window.__t("تأكيد كلمة المرور")}</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gold-500 text-slate-900 rounded-lg font-bold hover:bg-gold-400 disabled:opacity-50"
          >
            {submitting ? <Spinner /> : window.__t("إنشاء الحساب والدخول")}
          </button>
        </form>
      </div>
    </div>
  );
};
