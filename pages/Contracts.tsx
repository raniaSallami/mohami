
import React, { useState, useEffect } from 'react';
import { generateContract } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Contract } from '../types';
import { Spinner, Toast } from '../components/UI';
import { ConfirmModal } from '../components/ConfirmModal';

export const Contracts = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);

  // Wizard State
  const [step, setStep] = useState(1);
  const [contractType, setContractType] = useState(window.__t("عقد كراء سكني"));
  const [parties, setParties] = useState('');
  const [details, setDetails] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; contractId: string | null }>({
    isOpen: false,
    contractId: null
  });
  
  useEffect(() => {
    if (view === 'list') {
      storageService.getContracts().then(setContracts);
    }
  }, [view]);

  const handleGenerate = async () => {
    setLoading(true);
    const hasLimit = await storageService.checkUsageLimit('contracts');
    if (!hasLimit) {
        setLoading(false);
        alert(window.__t("لقد تجاوزت حد العقود المسموح به في باقتك الحالية. يرجى الترقية."));
        return;
    }

    const content = await generateContract(contractType, parties, details);
    setGeneratedContent(content);
    setEditableContent(content);
    setIsEditing(false);
    setLoading(false);
    setStep(3);
  };

  const handleSave = async () => {
    setLoading(true);
    // Use editableContent if in edit mode, otherwise use generatedContent
    const contentToSave = isEditing ? editableContent : generatedContent;
    
    const newContract: Contract = {
      id: Date.now().toString(),
      title: `${contractType} - ${new Date().toLocaleDateString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR'))}`,
      type: contractType,
      parties: parties,
      content: contentToSave,
      dateCreated: new Date().toISOString()
    };
    
    await storageService.saveContract(newContract);
    setLoading(false);
    setView('list');
    setStep(1);
    setIsEditing(false);
    // Reset form
    setParties('');
    setDetails('');
    setGeneratedContent('');
    setEditableContent('');
  };

  // Helper function to convert HTML to readable text while preserving structure
  const htmlToText = (html: string): string => {
    if (!html) return '';
    
    // Parse HTML and convert to text with structure preservation
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    
    // Walk through nodes and add line breaks appropriately
    let text = '';
    const walkNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();
        
        // Add line breaks before block elements
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li'].includes(tagName)) {
          if (text && !text.endsWith('\n\n')) {
            text += '\n\n';
          }
        }
        
        // Process children
        Array.from(node.childNodes).forEach(walkNodes);
        
        // Add line breaks after block elements
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol'].includes(tagName)) {
          if (!text.endsWith('\n\n')) {
            text += '\n\n';
          }
        } else if (tagName === 'li') {
          text += '\n';
        } else if (tagName === 'br') {
          text += '\n';
        }
      }
    };
    
    Array.from(tmp.childNodes).forEach(walkNodes);
    
    // Clean up excessive newlines
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;
  };

  // Helper function to convert plain text back to HTML with formatting
  const textToHTML = (text: string): string => {
    if (!text) return '';
    
    // Split by double newlines to identify paragraphs/sections
    const blocks = text.split(/\n\s*\n+/).filter(b => b.trim());
    
    return blocks.map(block => {
      const trimmed = block.trim();
      const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l);
      
      // Check if it looks like a heading (short, no punctuation, or starts with "الفصل" or "عقد")
      if (lines.length === 1) {
        const line = lines[0];
        if ((line.length < 60 && !line.includes('.')) || 
            line.startsWith(window.__t("الفصل")) || 
            line.startsWith(window.__t("عقد")) ||
            line.match(/^الفصل\s+[الأولالثانيالثالثالرابعالخامس]/)) {
          return `<h3>${line}</h3>`;
        }
      }
      
      // Check if it's a list (lines starting with bullets, dashes, or numbers)
      const isList = lines.length > 1 && lines.some(l => 
        /^[-•*]\s/.test(l) || 
        /^\d+[\.\)]\s/.test(l) ||
        l.startsWith('•') ||
        l.startsWith('-')
      );
      
      if (isList) {
        const listItems = lines.map(line => {
          // Remove bullet points, dashes, or numbers
          const cleaned = line.replace(/^[-•*]\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();
          // Preserve bold text if it exists (marked with ** or already has <b>)
          if (cleaned.includes('**')) {
            return `<li>${cleaned.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</li>`;
          }
          return `<li>${cleaned}</li>`;
        });
        return `<ul>\n${listItems.join('\n')}\n</ul>`;
      }
      
      // Regular paragraph - preserve line breaks within paragraph
      const paragraphText = lines.join('<br>');
      // Preserve bold markers if they exist
      const formattedText = paragraphText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      return `<p>${formattedText}</p>`;
    }).join('\n\n');
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Convert HTML to readable text for editing
    const readableText = htmlToText(generatedContent);
    setEditableContent(readableText);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableContent(generatedContent);
  };

  const handleSaveEdit = () => {
    // Convert the edited text back to HTML to preserve formatting
    const htmlContent = textToHTML(editableContent);
    setGeneratedContent(htmlContent);
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, contractId: id });
  };

  const confirmDelete = async () => {
    if (deleteModal.contractId) {
      await storageService.deleteContract(deleteModal.contractId);
      setContracts(contracts.filter(c => c.id !== deleteModal.contractId));
      setDeleteModal({ isOpen: false, contractId: null });
    }
  };

  const printContract = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Use editableContent if in edit mode, otherwise use generatedContent
      const contentToPrint = isEditing ? editableContent : generatedContent;
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>${contractType}</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.8; color: black; }
              h1, h2, h3 { text-align: center; }
            </style>
          </head>
          <body>${contentToPrint}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (view === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">{window.__t("العقود المحفوظة")}</h2>
          <button onClick={() => setView('create')} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition">
            {window.__t("+ إنشاء عقد ذكي")}
          </button>
        </div>

        {contracts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-xl">
             <p className="text-gray-500">{window.__t("لم تقم بإنشاء أي عقود بعد.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                   <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{c.type}</span>
                   <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500">×</button>
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{c.title}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{c.parties}</p>
                <div className="border-t pt-4 flex justify-between">
                   <button onClick={() => { 
                     setGeneratedContent(c.content); 
                     setEditableContent(c.content);
                     setContractType(c.type); 
                     setParties(c.parties);
                     setStep(3); 
                     setView('create');
                     setIsEditing(false);
                   }} className="text-sm text-primary-600 font-bold hover:underline">{window.__t("عرض وطباعة")}</button>
                   <span className="text-xs text-gray-400">{new Date(c.dateCreated).toLocaleDateString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR'))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Create View (Wizard)
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden flex flex-col" style={{ minHeight: 'calc(100vh - 200px)', maxHeight: 'calc(100vh - 100px)' }}>
      {/* Wizard Header */}
      <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800">{window.__t("مولد العقود الذكي")}</h2>
         <div className="flex space-x-2 space-x-reverse">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-gold-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-gold-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 3 ? 'bg-gold-500 text-white' : 'bg-gray-200 text-gray-500'}`}>3</span>
         </div>
      </div>

      <div className="p-8 flex-1 overflow-y-auto min-h-0">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold mb-4">{window.__t("اختر نوع العقد")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[window.__t("عقد كراء سكني"), window.__t("عقد كراء تجاري"), window.__t("عقد بيع سيارة"), window.__t("عقد شغل"), window.__t("عقد شراكة"), window.__t("عقد قرض"), window.__t("توكيل عام"), window.__t("عقد صيانة")].map(type => (
                <div 
                  key={type}
                  onClick={() => setContractType(type)}
                  className={`p-4 border rounded-xl cursor-pointer transition text-center ${contractType === type ? 'border-gold-500 bg-gold-50 ring-1 ring-gold-500' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <span className="font-medium">{type}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
               <button onClick={() => setStep(2)} className="bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-800 transition">{window.__t("التالي")}</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
             <h3 className="text-lg font-bold mb-4">{window.__t("بيانات العقد (")}{contractType})</h3>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("أطراف العقد (الطرف الأول والثاني)")}</label>
               <textarea 
                 value={parties}
                 onChange={(e) => setParties(e.target.value)}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg h-24 focus:ring-gold-500 focus:border-gold-500"
                 placeholder={window.__t("مثال: السيد محمد بن صالح (ص.ب ...) بصفته المكري، والسيد علي بن عمر بصفته المكتري...")}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">{window.__t("شروط وتفاصيل خاصة")}</label>
               <textarea 
                 value={details}
                 onChange={(e) => setDetails(e.target.value)}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg h-32 focus:ring-gold-500 focus:border-gold-500"
                 placeholder={window.__t("اذكر الثمن، المدة، طريقة الدفع، وأي شروط إضافية ترغب في إدراجها...")}
               />
             </div>
             <div className="mt-8 flex justify-between">
               <button onClick={() => setStep(1)} className="text-gray-500 font-medium hover:text-gray-700">{window.__t("السابق")}</button>
               <button onClick={handleGenerate} disabled={loading} className="bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-800 transition flex items-center">
                 {loading && <Spinner />}
                 <span className="me-2">{loading ? window.__t("جاري الصياغة...") : window.__t("توليد العقد بالذكاء الاصطناعي")}</span>
               </button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn h-full flex flex-col min-h-0">
             <h3 className="text-lg font-bold mb-4 flex justify-between items-center flex-shrink-0">
               <span>{isEditing ? window.__t("تعديل نص العقد") : window.__t("معاينة العقد")}</span>
               <div className="space-x-2 space-x-reverse">
                 {!isEditing && (
                   <button onClick={printContract} className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">{window.__t("طباعة / PDF")}</button>
                 )}
               </div>
             </h3>
             
             {isEditing ? (
               // Edit Mode
               <div className="flex-1 flex flex-col min-h-0">
                 <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex-shrink-0">
                   <p className="text-sm text-blue-800">
                     {window.__t("يمكنك تعديل نص العقد مباشرة. يمكنك تعديل النص كـ HTML أو كنص عادي (سيتم تنسيقه تلقائياً عند الحفظ).")}
                   </p>
                 </div>
                 <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                   <textarea
                     value={editableContent}
                     onChange={(e) => setEditableContent(e.target.value)}
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg font-serif text-base leading-relaxed focus:ring-2 focus:ring-gold-500 focus:border-gold-500 resize-none"
                     placeholder={window.__t("نص العقد...")}
                     style={{ 
                       height: '100%',
                       minHeight: '400px',
                       flex: '1 1 auto'
                     }}
                   />
                 </div>
                 <div className="mt-4 flex justify-end space-x-3 space-x-reverse">
                   <button 
                     onClick={handleCancelEdit} 
                     className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                   >
                     {window.__t("إلغاء التعديل")}
                   </button>
                   <button 
                     onClick={handleSaveEdit} 
                     className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                   >
                     {window.__t("حفظ التعديلات")}
                   </button>
                 </div>
               </div>
             ) : (
               // Preview Mode
               <>
                 <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg flex-1 overflow-y-auto font-serif leading-relaxed text-slate-900 shadow-inner">
                   <div className="prose max-w-none text-black" dangerouslySetInnerHTML={{ __html: generatedContent }} />
                 </div>
                 <div className="mt-6 flex justify-between">
                   <div className="space-x-3 space-x-reverse">
                     <button 
                       onClick={() => setStep(2)} 
                       className="text-gray-500 font-medium hover:text-gray-700"
                     >
                       {window.__t("تعديل البيانات الأساسية")}
                     </button>
                     <button 
                       onClick={handleEdit} 
                       className="text-blue-600 font-medium hover:text-blue-800"
                     >
                       {window.__t("تعديل البيانات")}
                     </button>
                   </div>
                   <div className="space-x-3 space-x-reverse">
                     <button 
                       onClick={() => {
                         setView('list');
                         setStep(1);
                         setIsEditing(false);
                       }} 
                       className="text-gray-600 px-4 hover:text-gray-800"
                     >
                       {window.__t("إلغاء")}
                     </button>
                     <button 
                       onClick={handleSave} 
                       disabled={loading}
                       className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center space-x-2 space-x-reverse"
                     >
                       {loading && <Spinner />}
                       <span>{window.__t("حفظ في الأرشيف")}</span>
                     </button>
                   </div>
                 </div>
               </>
             )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, contractId: null })}
        onConfirm={confirmDelete}
        title={window.__t("حذف العقد")}
        message={window.__t("هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذه العملية.")}
        confirmText={window.__t("حذف")}
        cancelText={window.__t("إلغاء")}
        type="danger"
      />
    </div>
  );
};
