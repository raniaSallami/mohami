import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { CaseFile } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

export const CaseList = ({ onNavigate, initialFilter }: { onNavigate: (page: string, caseId?: string) => void; initialFilter?: string }) => {
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter || 'all');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; caseId: string | null }>({
    isOpen: false,
    caseId: null
  });

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    if (initialFilter) setStatusFilter(initialFilter);
  }, [initialFilter]);

  const loadCases = async () => {
    const data = await storageService.getCases();
    setCases(data);
    setLoading(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, caseId: id });
  };

  const handleStatusChange = async (caseId: string, newStatus: 'active' | 'closed' | 'pending', e: React.MouseEvent) => {
    e.stopPropagation();
    const c = cases.find(x => x.id === caseId);
    if (!c) return;
    const updated = { ...c, status: newStatus };
    await storageService.updateCase(updated);
    setCases(prev => prev.map(x => x.id === caseId ? updated : x));
  };

  const confirmDelete = async () => {
    if (deleteModal.caseId) {
      await storageService.deleteCase(deleteModal.caseId);
      setCases(cases.filter(c => c.id !== deleteModal.caseId));
      setDeleteModal({ isOpen: false, caseId: null });
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStats = () => ({
    all: cases.length,
    active: cases.filter(c => c.status === 'active').length,
    pending: cases.filter(c => c.status === 'pending').length,
    closed: cases.filter(c => c.status === 'closed').length
  });

  const stats = getStats();

  return (
    <div className="min-h-0 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">ملفات القضايا</h2>
        <div className="flex space-x-4 space-x-reverse w-full md:w-auto">
          <input 
            type="text" 
            placeholder="بحث عن قضية أو موكل..." 
            className="flex-1 md:w-64 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={() => onNavigate('new-case')}
            className="bg-slate-900 text-white px-6 py-2 rounded-xl hover:bg-slate-800 transition whitespace-nowrap shadow-md font-bold"
          >
            + قضية جديدة
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          الكل ({stats.all})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${statusFilter === 'active' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
        >
          نشطة ({stats.active})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${statusFilter === 'pending' ? 'bg-amber-400 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
        >
          بانتظار الإجراء ({stats.pending})
        </button>
        <button
          onClick={() => setStatusFilter('closed')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${statusFilter === 'closed' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
        >
          منتهية ({stats.closed})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">جاري تحميل القضايا...</div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg mb-4">لا توجد قضايا مضافة</p>
          <button onClick={() => onNavigate('new-case')} className="text-primary-600 font-medium hover:underline">أضف قضيتك الأولى</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((c) => (
            <div 
              key={c.id} 
              onClick={() => onNavigate('case-detail', c.id)}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  c.type === 'criminal' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {c.type === 'criminal' ? '⚖️' : '📄'}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <select
                    value={c.status}
                    onChange={(e) => handleStatusChange(c.id, e.target.value as 'active' | 'closed' | 'pending', e)}
                    onClick={(e) => e.stopPropagation()}
                    className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 ${
                      c.status === 'active' ? 'bg-green-100 text-green-700' :
                      c.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <option value="active">نشطة</option>
                    <option value="pending">بانتظار الإجراء</option>
                    <option value="closed">منتهية</option>
                  </select>
                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    className="text-gray-300 hover:text-red-500 p-1 transition"
                    title="حذف القضية"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-primary-600 transition">{c.title}</h3>
              <p className="text-sm text-gray-500 mb-4">الموكل: {c.clientName}</p>
              
              <div className="border-t pt-4 flex justify-between text-sm text-gray-400">
                <span>{new Date(c.dateCreated).toLocaleDateString('ar-TN')}</span>
                <span>{c.documents.length} ملفات</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, caseId: null })}
        onConfirm={confirmDelete}
        title="حذف القضية"
        message="هل أنت متأكد من حذف هذا الملف نهائياً؟ لا يمكن التراجع عن هذه العملية."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  );
};