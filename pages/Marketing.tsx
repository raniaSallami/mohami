import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, UserRole } from '../types';
import { emailService } from '../services/emailService';
import { Modal } from '../components/UI';

export const Marketing: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const allUsers = await storageService.getAllUsers();
    setUsers(allUsers.filter(u => u.role === UserRole.LAWYER));
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !htmlContent.trim() || selectedUsers.length === 0) {
      alert(window.__t("يرجى ملء جميع الحقول واختيار مستخدم واحد على الأقل"));
      return;
    }

    if (!confirm(`${window.__t("هل أنت متأكد من إرسال البريد الإلكتروني إلى")} ${selectedUsers.length} ${window.__t("مستخدم؟")}`)) {
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const result = await emailService.sendBulkMarketingEmails(selectedUsers, subject, htmlContent);
      setSendResult(result);
      alert(`${window.__t("تم الإرسال:")} ${result.success} ${window.__t("نجح،")} ${result.failed} ${window.__t("فشل")}`);
      
      // Reset form
      setSubject('');
      setHtmlContent('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error sending marketing emails:', error);
      alert(window.__t("حدث خطأ أثناء إرسال البريد الإلكتروني"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{window.__t("البريد التسويقي")}</h2>
        <button
          onClick={() => setShowPreview(true)}
          disabled={!htmlContent.trim()}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition disabled:opacity-50"
        >
          {window.__t("معاينة")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("عنوان البريد الإلكتروني")}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={window.__t("مثال: عروض خاصة على باقات المحترف")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("محتوى البريد الإلكتروني (HTML)")}</label>
            <div className="mb-2 flex space-x-2 space-x-reverse">
              <button
                type="button"
                onClick={() => {
                  const text = htmlContent;
                  const start = (document.querySelector('#html-editor') as HTMLTextAreaElement)?.selectionStart || 0;
                  const end = (document.querySelector('#html-editor') as HTMLTextAreaElement)?.selectionEnd || 0;
                  const selected = text.substring(start, end);
                  const newText = text.substring(0, start) + `<strong>${selected}</strong>` + text.substring(end);
                  setHtmlContent(newText);
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm"
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = htmlContent;
                  const start = (document.querySelector('#html-editor') as HTMLTextAreaElement)?.selectionStart || 0;
                  const end = (document.querySelector('#html-editor') as HTMLTextAreaElement)?.selectionEnd || 0;
                  const selected = text.substring(start, end);
                  const newText = text.substring(0, start) + `<em>${selected}</em>` + text.substring(end);
                  setHtmlContent(newText);
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm"
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = htmlContent;
                  const start = (document.querySelector('#html-editor') as HTMLTextAreaElement)?.selectionStart || 0;
                  const end = (document.querySelector('#html-editor') as HTMLTextAreaElement)?.selectionEnd || 0;
                  const selected = text.substring(start, end);
                  const newText = text.substring(0, start) + `<a href="#">${selected}</a>` + text.substring(end);
                  setHtmlContent(newText);
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm"
                title="Link"
              >
                🔗
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = htmlContent;
                  const start = (document.querySelector('#html-editor') as HTMLTextAreaElement)?.selectionStart || 0;
                  const newText = text.substring(0, start) + `<div style="background-color: #f59e0b; color: #1e293b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;"><h2 style="margin: 0;">عنوان</h2><p style="margin: 10px 0 0 0;">نص المحتوى هنا</p></div>` + text.substring(start);
                  setHtmlContent(newText);
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm"
                title="Add Box"
              >
                📦
              </button>
            </div>
            <textarea
              id="html-editor"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder={window.__t("اكتب محتوى البريد الإلكتروني هنا... يمكنك استخدام HTML")}
              className="w-full h-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              {window.__t("💡 نصيحة: يمكنك استخدام HTML لتصميم البريد الإلكتروني. استخدم &lt;strong&gt; للنص العريض، &lt;em&gt; للمائل، &lt;a&gt; للروابط، إلخ.")}
            </p>
          </div>

          {sendResult && (
            <div className={`p-4 rounded-lg ${
              sendResult.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            } border`}>
              <p className="font-bold">
                {sendResult.failed === 0 
                  ? `✅ تم الإرسال بنجاح إلى ${sendResult.success} مستخدم`
                  : `⚠️ تم الإرسال: ${sendResult.success} نجح، ${sendResult.failed} فشل`
                }
              </p>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !htmlContent.trim() || selectedUsers.length === 0}
            className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-lg transition"
          >
            {sending ? window.__t("جاري الإرسال...") : `${window.__t("إرسال إلى")} ${selectedUsers.length} ${window.__t("مستخدم")}`}
          </button>
        </div>

        {/* User Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">{window.__t("اختر المستخدمين")}</h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedUsers.length === users.length ? window.__t("إلغاء الكل") : window.__t("تحديد الكل")}
            </button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {users.map(user => (
              <label key={user.id} className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers([...selectedUsers, user.id]);
                    } else {
                      setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                    }
                  }}
                  className="rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t text-sm text-slate-600">
            <p>{window.__t("المحدد:")} <strong>{selectedUsers.length}</strong> {window.__t("من")} <strong>{users.length}</strong></p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title={window.__t("معاينة البريد الإلكتروني")}>
        <div className="max-w-2xl mx-auto">
          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-gray-500">{window.__t("إلى:")}</p>
              <p className="font-bold">{selectedUsers.length > 0 ? `${selectedUsers.length} مستخدم` : window.__t("مستخدمين محددين")}</p>
              <p className="text-sm text-gray-500 mt-2">{window.__t("الموضوع:")}</p>
              <p className="font-bold">{subject || window.__t("(بدون موضوع)")}</p>
            </div>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent || window.__t("<p class=\"text-gray-400\">لا يوجد محتوى</p>") }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
