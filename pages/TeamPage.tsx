import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { storageService } from '../services/storageService';
import { User, CaseFile } from '../types';
import { Modal, Spinner, Toast } from '../components/UI';
import { ConfirmModal } from '../components/ConfirmModal';

type ChatMode = 'team' | 'direct';
type TabId = 'accounts' | 'assign' | 'chat';
type GroupMessage = { id: string; fromUserId: string; fromUserName: string; text: string; createdAt: string };
export const TeamPage = ({ user, onNavigate, onRefreshUser }: { user: User; onNavigate?: (page: string, caseId?: string) => void; onRefreshUser?: (u: User) => void }) => {
  const [activeTab, setActiveTab] = useState<TabId>('accounts');
  const [members, setMembers] = useState<User[]>([]);
  const [pendingInvites, setPendingInvites] = useState<{ id: string; email: string; createdAt: string }[]>([]);
  const [orgCases, setOrgCases] = useState<CaseFile[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [assigningCaseId, setAssigningCaseId] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [revokeModal, setRevokeModal] = useState<{ caseId: string; caseTitle: string } | null>(null);
  const [removeMemberModal, setRemoveMemberModal] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('team');
  const [directMessages, setDirectMessages] = useState<{ from: string; to: string; text: string; createdAt: string }[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [mentionDropdownPos, setMentionDropdownPos] = useState<{ left: number; bottom: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [unreadTeamChat, setUnreadTeamChat] = useState(false);
  const [unreadByMemberId, setUnreadByMemberId] = useState<Record<string, boolean>>({});
  const prevGroupCountRef = useRef<number | null>(null);
  const prevDirectCountRef = useRef<Record<string, number>>({});
  const isFirstLoadRef = useRef(true);

  const plan = (user.subscriptionPlan || '').toLowerCase();
  const isOwner = !user.organizationOwnerId && plan === 'enterprise';
  const ownerId = user.organizationOwnerId || user.id;

  const loadMembers = async () => {
    if (plan !== 'enterprise') return;
    try {
      let data = await storageService.getTeamMembers(ownerId);
      if (data.length === 0 && isOwner) {
        data = [user];
      }
      setMembers(data);
      if (isOwner) {
        const invites = await storageService.getPendingInvites(ownerId);
        setPendingInvites(invites);
      }
    } catch (e) {
      console.error(e);
      if (isOwner) setMembers([user]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgCases = async () => {
    if (!isOwner) return;
    setCasesLoading(true);
    try {
      const cases = await storageService.getOrgCasesForOwner(ownerId);
      setOrgCases(cases);
    } catch (e) {
      console.error(e);
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const fresh = await storageService.getCurrentUserFresh();
      if (mounted && fresh && onRefreshUser) onRefreshUser(fresh);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    loadMembers();
  }, [user.id, user.subscriptionPlan]);

  useEffect(() => {
    if (activeTab === 'chat' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [activeTab]);

  useEffect(() => {
    if (isOwner) loadOrgCases();
  }, [isOwner, ownerId]);

  const showMessageNotification = React.useCallback((fromName: string, text: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`المحامي - رسالة من ${fromName}`, {
          body: text.length > 50 ? text.slice(0, 50) + '...' : text,
          icon: '/favicon.ico'
        });
      } catch (_) {}
    }
    setNotification({ msg: `رسالة جديدة من ${fromName}`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    if (activeTab !== 'chat') return;

    const viewingTeam = chatMode === 'team';
    const viewingMemberId = chatMode === 'direct' ? selectedMember?.id : null;

    const loadAll = async () => {
      const teamMsgs = await storageService.getTeamGroupMessages(ownerId);
      const others = members.filter(m => m.id !== user.id);
      const allDirect = await Promise.all(
        others.map(m => storageService.getInternalMessages(user.id, m.id))
      );

      const skipNotify = isFirstLoadRef.current;
      if (isFirstLoadRef.current) isFirstLoadRef.current = false;

      let notified = false;
      const notify = (fromName: string, text: string) => {
        if (!notified && !skipNotify) {
          notified = true;
          showMessageNotification(fromName, text);
        }
      };

      const prevTeam = prevGroupCountRef.current ?? teamMsgs.length;
      const latestTeam = teamMsgs[teamMsgs.length - 1];
      if (latestTeam && latestTeam.fromUserId !== user.id && teamMsgs.length > prevTeam) {
        if (!viewingTeam) {
          setUnreadTeamChat(true);
          notify(latestTeam.fromUserName, latestTeam.text);
        }
      }
      prevGroupCountRef.current = teamMsgs.length;

      others.forEach((m, i) => {
        const dm = allDirect[i];
        const fromOther = dm.filter((msg: { from: string }) => msg.from !== user.id);
        const prevCount = prevDirectCountRef.current[m.id] ?? fromOther.length;
        if (fromOther.length > prevCount && viewingMemberId !== m.id) {
          setUnreadByMemberId(prev => ({ ...prev, [m.id]: true }));
          const latestFrom = fromOther[fromOther.length - 1];
          notify(m.name, latestFrom.text);
        }
        prevDirectCountRef.current = { ...prevDirectCountRef.current, [m.id]: fromOther.length };
      });

      if (viewingTeam) setGroupMessages(teamMsgs);
      else if (selectedMember) {
        const idx = others.findIndex(m => m.id === selectedMember.id);
        setDirectMessages(idx >= 0 ? allDirect[idx] : []);
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 3000);
    return () => clearInterval(interval);
  }, [chatMode, selectedMember?.id, user.id, ownerId, activeTab, members, showMessageNotification]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://mouhami-ai.tn';
      await storageService.inviteTeamMember(ownerId, inviteEmail, baseUrl);
      setNotification({ msg: window.__t("تم إرسال الدعوة بنجاح. سيتلقى المدعو بريداً برابط لإنشاء حسابه."), type: 'success' });
      setShowInviteModal(false);
      setInviteEmail('');
      loadMembers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : window.__t("حدث خطأ"));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    await storageService.cancelInvite(inviteId, ownerId);
    loadMembers();
  };

  const handleAssignCase = async (caseId: string, assignToUserId: string) => {
    setAssignLoading(true);
    try {
      await storageService.assignCaseToUser(caseId, assignToUserId, user.id);
      setNotification({ msg: window.__t("تم إسناد القضية بنجاح. تم إرسال إشعار وبريد للمحامي."), type: 'success' });
      setAssigningCaseId(null);
      loadOrgCases();
    } catch (err) {
      setNotification({ msg: err instanceof Error ? err.message : window.__t("فشل الإسناد"), type: 'error' });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRevokeAssignment = async () => {
    if (!revokeModal) return;
    setAssignLoading(true);
    try {
      await storageService.revokeCaseAssignment(revokeModal.caseId, ownerId);
      setNotification({ msg: window.__t("تم إلغاء إسناد القضية."), type: 'success' });
      setRevokeModal(null);
      loadOrgCases();
    } catch (err) {
      setNotification({ msg: err instanceof Error ? err.message : window.__t("فشل إلغاء الإسناد"), type: 'error' });
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberModal) return;
    try {
      await storageService.removeTeamMember(removeMemberModal.id, ownerId);
      setNotification({ msg: `تم إزالة ${removeMemberModal.name} من الفريق.`, type: 'success' });
      setRemoveMemberModal(null);
      loadMembers();
    } catch (err) {
      setNotification({ msg: err instanceof Error ? err.message : window.__t("فشل الإزالة"), type: 'error' });
    }
  };

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;
    setMsgLoading(true);
    try {
      if (chatMode === 'team') {
        await storageService.sendTeamGroupMessage(ownerId, user.id, text);
        const msgs = await storageService.getTeamGroupMessages(ownerId);
        setGroupMessages(msgs);
      } else if (selectedMember) {
        await storageService.sendInternalMessage(user.id, selectedMember.id, text);
        const msgs = await storageService.getInternalMessages(user.id, selectedMember.id);
        setDirectMessages(msgs);
      }
      setNewMessage('');
    } catch (e) {
      setNotification({ msg: window.__t("فشل إرسال الرسالة"), type: 'error' });
    } finally {
      setMsgLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setNewMessage(v);
    const atIdx = v.lastIndexOf('@');
    if (atIdx >= 0) {
      const after = v.slice(atIdx + 1);
      if (!after.includes(' ')) {
        setShowMentionDropdown(true);
        setMentionSearch(after);
        requestAnimationFrame(() => {
          const el = inputRef.current;
          if (el) {
            const r = el.getBoundingClientRect();
            setMentionDropdownPos({ left: r.left, bottom: window.innerHeight - r.top + 8 });
          }
        });
        return;
      }
    }
    setShowMentionDropdown(false);
    setMentionDropdownPos(null);
  };

  const insertMention = (m: User) => {
    const atIdx = newMessage.lastIndexOf('@');
    const before = newMessage.slice(0, atIdx);
    const after = newMessage.includes(' ') ? '' : newMessage.slice(newMessage.length);
    setNewMessage(before + `@${m.name} ` + after);
    setShowMentionDropdown(false);
    setMentionDropdownPos(null);
    inputRef.current?.focus();
  };

  const filteredMentionMembers = members.filter(
    m => m.id !== user.id && m.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const renderMessageText = (text: string) => {
    const parts = text.split(/(@[^\s]+)/g);
    return parts.map((p, i) =>
      p.startsWith('@') ? (
        <span key={i} className="bg-gold-100 text-gold-800 px-1 rounded">@{p.slice(1)}</span>
      ) : (
        p
      )
    );
  };

  if (plan !== 'enterprise') {
    return (
      <div className="p-8 text-center text-gray-500">
        {window.__t("هذه الميزة متوفرة فقط لمستخدمي باقة المكتب.")}
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'accounts', label: window.__t("حسابات الفريق") },
    { id: 'assign', label: window.__t("توزيع القضايا") },
    { id: 'chat', label: window.__t("دردشة الفريق") }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{window.__t("فريق العمل")}</h2>
          <p className="text-sm text-gray-500 mt-1">{window.__t("إدارة الحسابات، توزيع القضايا، والدردشة الداخلية")}</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-gold-500 text-slate-900 rounded-lg font-bold hover:bg-gold-400 transition self-start"
          >
            {window.__t("+ دعوة محامي")}
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-t-lg font-medium transition ${
              activeTab === t.id ? 'bg-gold-100 text-slate-900 border-b-2 border-gold-500 -mb-px' : 'text-gray-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'accounts' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">{window.__t("حسابات الفريق (")}{members.length})</h3>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">{m.name}</p>
                    <p className="text-sm text-gray-500">{m.email}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${m.id === ownerId ? 'bg-gold-100 text-gold-800' : 'bg-slate-200 text-slate-700'}`}>
                      {m.id === ownerId ? window.__t("مدير المكتب") : window.__t("عضو الفريق")}
                    </span>
                  </div>
                  {isOwner && m.id !== ownerId && (
                    <button
                      onClick={() => setRemoveMemberModal(m)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      title={window.__t("إزالة من الفريق")}
                    >
                      {window.__t("إزالة")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {isOwner && pendingInvites.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-bold text-slate-600 mb-2">{window.__t("دعوات معلقة")}</h4>
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex justify-between items-center py-2">
                  <span className="text-sm">{inv.email}</span>
                  <button onClick={() => handleCancelInvite(inv.id)} className="text-xs text-red-600 hover:underline">{window.__t("إلغاء")}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">{window.__t("توزيع القضايا")}</h3>
          <p className="text-sm text-gray-600 mb-4">{window.__t("أسند قضية لأحد أعضاء الفريق. سيتلقى إشعاراً وبريداً إلكترونياً.")}</p>
          {!isOwner ? (
            <p className="text-gray-500">{window.__t("هذه الصفحة متاحة لمدير المكتب فقط.")}</p>
          ) : casesLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : orgCases.length === 0 ? (
            <p className="text-gray-500">{window.__t("لا توجد قضايا. أضف قضايا من صفحة القضايا أولاً.")}</p>
          ) : (
            <div className="space-y-3">
              {orgCases.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg gap-4">
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => onNavigate?.('case-detail', c.id)}
                      className="font-medium text-slate-800 truncate block text-end hover:text-gold-600 transition"
                    >
                      {c.title}
                    </button>
                    <p className="text-sm text-gray-500">{window.__t("الموكل:")} {c.clientName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {assigningCaseId === c.id ? (
                      <>
                        <select
                          className="px-3 py-2 border rounded-lg text-sm"
                          onChange={(e) => {
                            const uid = e.target.value;
                            if (uid) handleAssignCase(c.id, uid);
                          }}
                          disabled={assignLoading}
                        >
                          <option value="">{window.__t("اختر محامياً...")}</option>
                          {members.filter((m) => m.id !== ownerId).map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setAssigningCaseId(null)}
                          className="text-sm text-gray-500 hover:underline"
                        >
                          {window.__t("إلغاء")}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setAssigningCaseId(c.id)}
                        className="px-3 py-2 bg-gold-500 text-slate-900 rounded-lg text-sm font-medium hover:bg-gold-400"
                      >
                        {window.__t("إسناد")}
                      </button>
                    )}
                    {c.assignedToUserId && (
                      <>
                        <span className="text-xs text-green-600">
                          → {members.find((m) => m.id === c.assignedToUserId)?.name || window.__t("مُعيَّن")}
                        </span>
                        <button
                          onClick={() => setRevokeModal({ caseId: c.id, caseTitle: c.title })}
                          className="text-xs text-red-600 hover:underline px-1"
                          disabled={assignLoading}
                          title={window.__t("إلغاء الإسناد")}
                        >
                          {window.__t("إلغاء الإسناد")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 mb-4">{window.__t("الفريق (")}{members.length})</h3>
            <div className="space-y-2 mb-4">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMember(m.id === selectedMember?.id ? null : m);
                    setChatMode('direct');
                    setUnreadByMemberId(prev => ({ ...prev, [m.id]: false }));
                  }}
                  className={`w-full text-end p-3 rounded-lg transition relative ${
                    chatMode === 'direct' && selectedMember?.id === m.id
                      ? 'bg-gold-100 border border-gold-300'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-medium text-slate-800">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.email}</p>
                  {unreadByMemberId[m.id] && (
                    <span className="absolute top-3 end-3 w-2.5 h-2.5 bg-red-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setChatMode('team');
                setSelectedMember(null);
                setUnreadTeamChat(false);
              }}
              className={`w-full text-end p-3 rounded-lg transition relative ${
                chatMode === 'team' ? 'bg-gold-100 border border-gold-300' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <span className="font-medium">{window.__t("📢 دردشة الفريق (الكل)")}</span>
              {unreadTeamChat && (
                <span className="absolute top-3 end-3 w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
            </button>

            {isOwner && pendingInvites.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-bold text-slate-600 mb-2">{window.__t("دعوات معلقة")}</h4>
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex justify-between items-center py-2">
                    <span className="text-sm">{inv.email}</span>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      {window.__t("إلغاء")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="p-4 border-b flex items-center gap-2">
              <span className="text-2xl">{chatMode === 'team' ? '📢' : '💬'}</span>
              <div>
                <p className="font-bold text-slate-800">
                  {chatMode === 'team' ? window.__t("دردشة الفريق — الكل") : selectedMember?.name || ''}
                </p>
                <p className="text-xs text-gray-500">
                  {chatMode === 'team' ? window.__t("مراسلة جماعية — استخدم @للمناداة") : selectedMember?.email || ''}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
              {chatMode === 'team'
                ? groupMessages.map((msg) => (
                    <div key={msg.id} className="flex flex-col">
                      <div className={`max-w-[85%] p-3 rounded-lg ${msg.fromUserId === user.id ? 'bg-gold-100 me-0 me-auto' : 'bg-slate-100 ms-auto'}`}>
                        <p className="text-xs text-gray-500 mb-1">{msg.fromUserName}</p>
                        <p className="text-sm">{renderMessageText(msg.text)}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR'))}</p>
                      </div>
                    </div>
                  ))
                : directMessages.map((msg) => (
                    <div key={msg.createdAt} className={`flex ${msg.from === user.id ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${msg.from === user.id ? 'bg-gold-100 text-slate-900' : 'bg-slate-100 text-slate-800'}`}>
                        <p className="text-sm">{renderMessageText(msg.text)}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(msg.createdAt).toLocaleString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR'))}</p>
                      </div>
                    </div>
                  ))}
            </div>
            <div className="p-4 border-t relative">
              {showMentionDropdown && filteredMentionMembers.length > 0 && mentionDropdownPos && createPortal(
                <div
                  className="fixed bg-white border border-slate-200 rounded-lg shadow-xl py-2 max-h-40 overflow-y-auto z-[9999] min-w-[200px]"
                  style={{ left: mentionDropdownPos.left, bottom: mentionDropdownPos.bottom }}
                >
                  {filteredMentionMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => insertMention(m)}
                      className="w-full text-end px-4 py-2 hover:bg-slate-50"
                    >
                      @{m.name}
                    </button>
                  ))}
                </div>,
                document.body
              )}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={chatMode === 'team' ? window.__t("اكتب رسالتك... استخدم @للمناداة") : window.__t("اكتب رسالتك...")}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  disabled={msgLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={msgLoading || !newMessage.trim()}
                  className="px-4 py-2 bg-gold-500 text-slate-900 rounded-lg font-bold hover:bg-gold-400 disabled:opacity-50"
                >
                  {window.__t("إرسال")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title={window.__t("دعوة محامي للفريق")}>
        <form onSubmit={handleInvite} className="space-y-4">
          <p className="text-sm text-gray-600">
            {window.__t("سيستلم المدعو بريداً إلكترونياً يحتوي على رابط. عليه النقر على الرابط لإنشاء كلمة المرور وتفعيل حسابه.")}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{window.__t("البريد الإلكتروني")}</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="email@example.com"
            />
          </div>
          {inviteError && <p className="text-red-500 text-sm">{inviteError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={inviteLoading} className="flex-1 py-2 bg-gold-500 text-slate-900 rounded-lg font-bold disabled:opacity-50">
              {inviteLoading ? <Spinner /> : window.__t("إرسال الدعوة")}
            </button>
            <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-2 border rounded-lg">
              {window.__t("إلغاء")}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!revokeModal}
        onClose={() => setRevokeModal(null)}
        onConfirm={handleRevokeAssignment}
        title={window.__t("إلغاء إسناد القضية")}
        message={revokeModal ? `هل تريد إلغاء إسناد القضية "${revokeModal.caseTitle}"؟ لن يتمكن المحامي المعين من رؤيتها بعد ذلك.` : ''}
        confirmText={window.__t("إلغاء الإسناد")}
        cancelText={window.__t("تراجع")}
        type="warning"
      />

      <ConfirmModal
        isOpen={!!removeMemberModal}
        onClose={() => setRemoveMemberModal(null)}
        onConfirm={handleRemoveMember}
        title={window.__t("إزالة عضو من الفريق")}
        message={removeMemberModal ? `هل تريد إزالة ${removeMemberModal.name} (${removeMemberModal.email}) من الفريق؟ سيفقد الوصول إلى القضايا المسندة إليه.` : ''}
        confirmText={window.__t("إزالة")}
        cancelText={window.__t("تراجع")}
        type="danger"
      />

      {notification && (
        <Toast message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />
      )}
    </div>
  );
};
