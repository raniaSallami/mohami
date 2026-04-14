import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { CaseFile } from '../types';
import { User } from '../types';
import { Spinner } from '../components/UI';
import { ConfirmModal } from '../components/ConfirmModal';

interface PendingCasesPageProps {
  user: User;
  onNavigate: (page: string) => void;
  onNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const PendingCasesPage = ({ user, onNavigate, onNotification }: PendingCasesPageProps) => {
  const [pendingCases, setPendingCases] = useState<CaseFile[]>([]);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ caseId: string; caseTitle: string } | null>(null);

  const ownerId = user.organizationOwnerId || user.id;
  const isDirector = user.subscriptionPlan === 'enterprise' && !user.organizationOwnerId;

  useEffect(() => {
    if (!isDirector) {
      onNavigate('dashboard');
      return;
    }
    loadData();
  }, [isDirector]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cases, team] = await Promise.all([
        storageService.getPendingCaseRequests(ownerId),
        storageService.getTeamMembers(ownerId)
      ]);
      setPendingCases(cases);
      const names: Record<string, string> = {};
      team.forEach(m => { names[m.id] = m.name; });
      setCreatorNames(names);
    } catch (err) {
      console.error(err);
      onNotification(window.__t("فشل تحميل طلبات القضايا"), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (caseId: string) => {
    setActionLoading(caseId);
    try {
      await storageService.approveCaseRequest(caseId, ownerId);
      setPendingCases(prev => prev.filter(c => c.id !== caseId));
      onNotification(window.__t("تمت الموافقة على القضية"), 'success');
    } catch (err) {
      onNotification(err instanceof Error ? err.message : window.__t("فشلت الموافقة"), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    const { caseId } = rejectModal;
    setActionLoading(caseId);
    try {
      await storageService.rejectCaseRequest(caseId, ownerId);
      setPendingCases(prev => prev.filter(c => c.id !== caseId));
      setRejectModal(null);
      onNotification(window.__t("تم رفض طلب القضية"), 'success');
    } catch (err) {
      onNotification(err instanceof Error ? err.message : window.__t("فشل الرفض"), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isDirector) return null;
  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="min-h-0">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800">{window.__t("طلبات القضايا المعلقة")}</h2>
        <button onClick={() => onNavigate('cases')} className="text-gray-500 hover:text-gray-700">
          {window.__t("رجوع إلى القضايا")}
        </button>
      </div>

      {pendingCases.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg mb-4">{window.__t("لا توجد طلبات قضايا معلقة")}</p>
          <p className="text-sm text-gray-400">{window.__t("ستظهر هنا الطلبات التي يرسلها أعضاء فريقك لإنشاء قضايا جديدة.")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingCases.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  {window.__t("بانتظار الموافقة")}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">{c.title}</h3>
              <p className="text-sm text-gray-500 mb-1">{window.__t("الموكل:")} {c.clientName}</p>
              <p className="text-sm text-gray-500 mb-4">
                {window.__t("الطالب:")} {c.createdByUserId ? (creatorNames[c.createdByUserId] || c.createdByUserId) : '—'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(c.id)}
                  disabled={!!actionLoading}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
                >
                  {actionLoading === c.id ? window.__t("جاري...") : window.__t("قبول")}
                </button>
                <button
                  onClick={() => setRejectModal({ caseId: c.id, caseTitle: c.title })}
                  disabled={!!actionLoading}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
                >
                  {window.__t("رفض")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        onConfirm={handleReject}
        title={window.__t("رفض طلب القضية")}
        message={rejectModal ? `هل تريد رفض طلب إنشاء القضية "${rejectModal.caseTitle}"؟` : ''}
        confirmText={window.__t("رفض")}
        cancelText={window.__t("إلغاء")}
        type="danger"
      />
    </div>
  );
};
