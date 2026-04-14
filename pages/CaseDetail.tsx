import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../services/storageService';
import { analyzeDocument, chatWithCaseDocument } from '../services/geminiService';
import { CaseFile, CaseDocument } from '../types';
import { Toast, Spinner } from '../components/UI';

export const CaseDetail = ({ caseId, onBack }: { caseId: string, onBack: () => void }) => {
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(100);
  const [caseData, setCaseData] = useState<CaseFile | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    const loadCase = async () => {
      const found = await storageService.getCaseById(caseId);
      if (found) {
        setCaseData(found);
        if (found.analysis) setAnalysisResult(found.analysis);
        if (found.chatHistory) setChatMessages(found.chatHistory);
      }
    };
    loadCase();
  }, [caseId]);

  useEffect(() => {
    const loadLimit = async () => {
      const limits = await storageService.getPlanLimits();
      const user = storageService.getCurrentUser();
      const plan = (user?.subscriptionPlan || 'basic').toLowerCase();
      const mb = limits[plan as keyof typeof limits]?.maxFileSizeMB ?? 100;
      setMaxFileSizeMB(mb);
    };
    loadLimit();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeTab]);

  const showNotification = (msg: string, type: 'success' | 'error' | 'info') => {
    setNotification({ msg, type });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!caseData) return;

    const file = e.target.files[0];
    const maxBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      showNotification(`الملف كبير جداً. الحد الأقصى ${maxFileSizeMB} MB`, 'error');
      e.target.value = '';
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Content = (reader.result as string).split(',')[1];
      
      const newDoc: CaseDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        content: base64Content,
        uploadDate: new Date().toISOString()
      };

      const updatedCase = {
        ...caseData,
        documents: [...caseData.documents, newDoc]
      };
      
      await storageService.updateCase(updatedCase);
      setCaseData(updatedCase);
      setUploading(false);
      showNotification(window.__t("تم رفع المستند بنجاح"), 'success');
      e.target.value = '';
    };
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!caseData) return;
    const docs = caseData.documents.filter((d) => d.id !== docId);
    const updatedCase = { ...caseData, documents: docs };
    if (docs.length === 0) {
      updatedCase.analysis = '';
      updatedCase.chatHistory = [];
    } else if (caseData.documents[caseData.documents.length - 1]?.id === docId && caseData.analysis) {
      updatedCase.analysis = '';
      updatedCase.chatHistory = [];
    }
    await storageService.updateCase(updatedCase);
    setCaseData(updatedCase);
    if (docs.length === 0) setAnalysisResult('');
    if (docs.length === 0) setChatMessages([]);
    showNotification(window.__t("تم حذف المستند"), 'success');
  };

  const runAnalysis = async () => {
    if (!caseData || caseData.documents.length === 0) return;
    setIsAnalyzing(true);
    
    const lastDoc = caseData.documents[caseData.documents.length - 1];
    
    const result = await analyzeDocument(
      lastDoc.content, 
      lastDoc.type,
      window.__t("أنت خبير قانوني تونسي. قم بتحليل هذا المستند واستخرج الثغرات القانونية الممكنة، نقاط الضعف في ادعاء الخصم، والمواد القانونية ذات الصلة من المجلة الجزائية أو المدنية.")
    );

    setAnalysisResult(result);
    
    const updatedCase = { ...caseData, analysis: result };
    await storageService.updateCase(updatedCase);
    setCaseData(updatedCase);
    setIsAnalyzing(false);
    showNotification(window.__t("تم اكتمال التحليل بنجاح"), 'success');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !caseData || caseData.documents.length === 0) return;

    const userMsg = chatInput;
    setChatInput('');
    
    const newHistoryUser = [...chatMessages, { role: 'user', text: userMsg } as const];
    setChatMessages(newHistoryUser);
    setIsChatting(true);

    const lastDoc = caseData.documents[caseData.documents.length - 1];

    const response = await chatWithCaseDocument(
      lastDoc.content,
      lastDoc.type,
      newHistoryUser,
      userMsg
    );

    const newHistoryModel = [...newHistoryUser, { role: 'model', text: response } as const];
    setChatMessages(newHistoryModel);
    
    // Save chat history to DB
    const updatedCase = { ...caseData, chatHistory: newHistoryModel };
    await storageService.updateCase(updatedCase);
    setCaseData(updatedCase);

    setIsChatting(false);
  };

  if (!caseData) return <div className="flex h-full items-center justify-center"><Spinner /></div>;

  return (
    <div className="flex flex-col min-h-0">
      {notification && <Toast message={notification.msg} type={notification.type} onClose={() => setNotification(null)} />}

      {/* Header */}
      <div className="flex items-center space-x-4 space-x-reverse mb-6 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">{caseData.title}</h2>
          <p className="text-sm text-gray-500">{window.__t("الموكل:")} {caseData.clientName} | {caseData.type === 'criminal' ? window.__t("جنائي") : caseData.type === 'civil' ? window.__t("مدني") : window.__t("تجاري")}</p>
          <select
            value={caseData.status}
            onChange={async (e) => {
              const s = e.target.value as 'active' | 'closed' | 'pending';
              const updated = { ...caseData, status: s };
              await storageService.updateCase(updated);
              setCaseData(updated);
              showNotification(window.__t("تم تحديث حالة القضية"), 'success');
            }}
            className={`mt-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${
              caseData.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
              caseData.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}
          >
            <option value="active">{window.__t("نشطة")}</option>
            <option value="pending">{window.__t("بانتظار الإجراء")}</option>
            <option value="closed">{window.__t("منتهية")}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column: Documents List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col min-h-0 lg:min-h-[600px]">
          <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center shrink-0">
            <span>{window.__t("المستندات")}</span>
            <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded text-gray-600">{caseData.documents.length}</span>
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pe-1 min-h-0">
             {caseData.documents.length === 0 ? (
               <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">{window.__t("لا توجد مستندات.")}<br/>{window.__t("قم برفع ملف لبدء التحليل.")}</div>
             ) : (
               caseData.documents.map(doc => (
                 <div key={doc.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between group hover:border-gold-500 transition bg-slate-50 hover:bg-white">
                    <div className="flex items-center space-x-3 space-x-reverse truncate min-w-0">
                      <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div className="text-end min-w-0">
                         <div className="text-sm font-medium text-slate-700 truncate max-w-[120px]">{doc.name}</div>
                         <div className="text-xs text-gray-400">{new Date(doc.uploadDate).toLocaleDateString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR'))}</div>
                      </div>
                    </div>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handleDeleteDocument(doc.id); }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0"
                      title={window.__t("حذف المستند")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                 </div>
               ))
             )}
          </div>

          <label className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition ${uploading ? 'bg-gray-50 border-gray-300' : 'border-primary-200 hover:border-primary-500 hover:bg-primary-50'}`}>
            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" disabled={uploading} />
            {uploading ? (
               <Spinner />
            ) : (
               <>
                 <svg className="w-8 h-8 text-primary-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                 <span className="text-sm font-bold text-primary-700">{window.__t("اضغط لرفع ملف")}</span>
                 <span className="text-xs text-primary-400 mt-1">PDF, JPG, PNG (Max {maxFileSizeMB} MB)</span>
               </>
            )}
          </label>
        </div>

        {/* Right Column: AI Analysis & Chat */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden min-h-0 lg:min-h-[600px]">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 shrink-0">
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 py-4 text-sm font-bold text-center transition ${activeTab === 'analysis' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {window.__t("📊 تقرير التحليل")}
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-4 text-sm font-bold text-center transition ${activeTab === 'chat' ? 'text-gold-600 border-b-2 border-gold-600 bg-gold-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {window.__t("💬 المساعد الذكي")}
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
             {/* Analysis View */}
             {activeTab === 'analysis' && (
                <div className="flex-1 flex flex-col p-6 min-h-0 overflow-hidden">
                   <div className="flex justify-between items-center mb-4 shrink-0 flex-wrap gap-2">
                      <h3 className="font-bold text-slate-700">{window.__t("الثغرات المستخرجة")}</h3>
                      <button 
                        onClick={runAnalysis}
                        disabled={isAnalyzing || caseData.documents.length === 0}
                        className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition shadow-lg ${
                          isAnalyzing || caseData.documents.length === 0 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:shadow-primary-500/30'
                        }`}
                      >
                        {isAnalyzing ? (
                          <span className="flex items-center space-x-2 space-x-reverse"><Spinner /> <span>{window.__t("جاري المعالجة...")}</span></span>
                        ) : window.__t("بدء تحليل جديد")}
                      </button>
                   </div>
                   
                   <div className="flex-1 bg-slate-50 rounded-xl p-6 overflow-y-auto border border-slate-100 custom-scrollbar min-h-0">
                      {analysisResult ? (
                        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {analysisResult}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                             <span className="text-4xl">📄</span>
                          </div>
                          <p className="font-medium">{window.__t("لم يتم تحليل الملف بعد")}</p>
                          <p className="text-sm mt-2 max-w-xs text-center">{window.__t("اضغط على زر \"بدء تحليل جديد\" ليقوم الذكاء الاصطناعي بقراءة الملف واستخراج الثغرات.")}</p>
                        </div>
                      )}
                   </div>
                </div>
             )}

             {/* Chat View */}
             {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-hidden">
                   <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-10">
                          <div className="inline-block p-4 bg-white rounded-full shadow-sm mb-4">
                            <span className="text-4xl">🤖</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-700">{window.__t("مرحباً بك أيها الأستاذ")}</h3>
                          <p className="text-gray-500 text-sm mt-2">{window.__t("أنا مساعدك القانوني الذكي. لقد اطلعت على الملف، اسألني أي شيء عنه.")}</p>
                          <div className="mt-6 flex flex-wrap justify-center gap-2">
                             {[window.__t("لخص لي وقائع القضية"), window.__t("ما هي الثغرات الشكلية؟"), window.__t("هل هناك تناقض في التواريخ؟")].map(q => (
                               <button key={q} onClick={() => setChatInput(q)} className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs text-gray-600 hover:border-gold-500 hover:text-gold-600 transition">
                                 {q}
                               </button>
                             ))}
                          </div>
                        </div>
                      )}
                      
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                           <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                             msg.role === 'user' 
                               ? 'bg-slate-800 text-white rounded-br-none' 
                               : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                           }`}>
                             <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                           </div>
                        </div>
                      ))}
                      {isChatting && (
                        <div className="flex justify-end">
                           <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none p-4 shadow-sm">
                             <div className="flex space-x-1 space-x-reverse">
                               <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce"></div>
                               <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce delay-75"></div>
                               <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce delay-150"></div>
                             </div>
                           </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                   </div>

                   <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={window.__t("اكتب سؤالك هنا...")}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500 transition"
                        disabled={isChatting || caseData.documents.length === 0}
                      />
                      <button 
                        type="submit" 
                        disabled={isChatting || !chatInput.trim() || caseData.documents.length === 0}
                        className={`p-3 rounded-xl transition ${
                          isChatting || !chatInput.trim() 
                            ? 'bg-gray-100 text-gray-400' 
                            : 'bg-gold-500 text-white hover:bg-gold-600 shadow-lg shadow-gold-500/30'
                        }`}
                      >
                        <svg className="w-6 h-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                   </form>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
