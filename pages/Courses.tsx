
import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Spinner } from '../components/UI';
import { TUNISIAN_PENAL_CODE, Article } from '../data/tunisianPenalCode';

export const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showBookNavigation, setShowBookNavigation] = useState(true);

  const handleExplain = async (article: Article) => {
    setSelectedArticle(article);
    setLoadingExplanation(true);
    setExplanation('');

    try {
        if (!process.env.API_KEY) throw new Error("API Key missing");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const chapterTitle = TUNISIAN_PENAL_CODE.find(c => 
          c.articles.some(a => a.num === article.num)
        )?.title || '';
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `اشرح الفصل ${article.num}${article.bis ? window.__t(" (مكرر)") : ''} من المجلة الجزائية التونسية - ${chapterTitle} - الذي ينص على: "${article.text}". 
            
            قدم شرحاً قانونياً شاملاً يتضمن:
            1. شرح مفصل للنص القانوني
            2. العناصر المكونة للجريمة
            3. العقوبة المقررة والظروف المشددة أو المخففة
            4. مثال عملي واقعي
            5. أي فقه قضاء تونسي ذو صلة
            6. العلاقة مع الفصول الأخرى إن وجدت
            
            استخدم لغة قانونية واضحة ومبسطة في نفس الوقت.`
        });
        setExplanation(response.text || window.__t("لم يتمكن المساعد من الشرح."));
    } catch (e) {
        setExplanation(window.__t("حدث خطأ أثناء الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى."));
    } finally {
        setLoadingExplanation(false);
    }
  };

  const filteredCode = useMemo(() => {
    if (!searchTerm.trim()) {
      return selectedChapter 
        ? TUNISIAN_PENAL_CODE.filter(c => c.chapter === selectedChapter)
        : TUNISIAN_PENAL_CODE;
    }
    
    return TUNISIAN_PENAL_CODE.map(chapter => ({
      ...chapter,
      articles: chapter.articles.filter(a => 
        a.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.num.toString().includes(searchTerm) ||
        chapter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.chapter.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(c => c.articles.length > 0);
  }, [searchTerm, selectedChapter]);

  const totalArticles = TUNISIAN_PENAL_CODE.reduce((sum, chapter) => sum + chapter.articles.length, 0);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">{window.__t("المكتبة القانونية")}</h2>
           <p className="text-gray-500 text-sm">
             {window.__t("المجلة الجزائية التونسية (نسخة رقمية ذكية) -")} {totalArticles} {window.__t("فصلاً قانونياً")}
           </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-white border border-gray-200 rounded-lg flex items-center px-3 py-2 flex-1 md:w-64">
             <span className="text-gray-400 ms-2">🔍</span>
             <input 
               type="text" 
               placeholder={window.__t("بحث برقم الفصل أو الكلمات...")} 
               className="w-full outline-none text-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button
            onClick={() => setShowBookNavigation(!showBookNavigation)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700"
          >
            {showBookNavigation ? window.__t("إخفاء") : window.__t("إظهار")} {window.__t("الكتب")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Book Navigation Sidebar */}
        {showBookNavigation && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-y-auto p-4 hidden md:block">
            <h3 className="font-bold text-slate-800 mb-4 sticky top-0 bg-white pb-2">{window.__t("الكتب القانونية")}</h3>
            <div className="space-y-2">
              {TUNISIAN_PENAL_CODE.map((chapter, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedChapter(selectedChapter === chapter.chapter ? null : chapter.chapter);
                    setSearchTerm('');
                  }}
                  className={`w-full text-end p-3 rounded-lg transition text-sm ${
                    selectedChapter === chapter.chapter
                      ? 'bg-gold-100 border-2 border-gold-500 text-gold-900 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold">{chapter.chapter}</div>
                  <div className="text-xs mt-1 opacity-75">{chapter.title}</div>
                  <div className="text-xs mt-1 text-slate-500">
                    {chapter.articles.length} {window.__t("فصلاً")}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setSelectedChapter(null);
                setSearchTerm('');
              }}
              className="w-full mt-4 p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium text-slate-700"
            >
              {window.__t("عرض الكل")}
            </button>
          </div>
        )}

        {/* Book Navigation */}
        <div className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-y-auto ${showBookNavigation ? 'md:col-span-1' : 'md:col-span-2'} p-6`}>
           {filteredCode.length === 0 ? (
             <div className="text-center text-gray-400 py-10">{window.__t("لا توجد نتائج للبحث")}</div>
           ) : (
             filteredCode.map((chapter, idx) => (
               <div key={idx} className="mb-8">
                 <h3 className="font-bold text-lg text-primary-700 mb-4 bg-primary-50 p-2 rounded">{chapter.chapter}: {chapter.title}</h3>
                 <div className="space-y-4">
                   {chapter.articles.map((article, artIdx) => (
                     <div 
                       key={`${article.num}-${artIdx}`} 
                       className={`border-e-4 ${selectedArticle?.num === article.num && selectedArticle?.bis === article.bis ? 'border-gold-600 bg-gold-50' : 'border-gold-500'} pe-4 py-3 hover:bg-slate-50 transition rounded-l group cursor-pointer`}
                       onClick={() => handleExplain(article)}
                     >
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-slate-800 mb-1">
                             {window.__t("فصل")} {article.num}
                             {article.bis && <span className="text-xs text-slate-500"> {window.__t("(مكرر)")}</span>}
                           </h4>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleExplain(article);
                             }}
                             className="text-xs bg-slate-800 text-white px-3 py-1 rounded-full hover:bg-gold-500 transition opacity-0 group-hover:opacity-100"
                           >
                             {window.__t("شرح ذكي ✨")}
                           </button>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-sm">{article.text}</p>
                     </div>
                   ))}
                 </div>
               </div>
             ))
           )}
        </div>

        {/* AI Explainer Sidebar */}
        <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white flex flex-col min-h-0 h-full">
           <h3 className="text-gold-500 font-bold mb-4 flex items-center flex-shrink-0">
             <span className="text-2xl ms-2">🎓</span> {window.__t("الشرح الذكي والمحاضرات")}
           </h3>
           
           {!selectedArticle ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center min-h-0 p-4">
               <div className="text-6xl mb-4">📚</div>
               <p className="text-lg mb-2">{window.__t("المجلة الجزائية التونسية")}</p>
               <p className="text-sm mb-4">{window.__t("نسخة رقمية ذكية شاملة")}</p>
               <div className="bg-slate-800 rounded-lg p-4 text-end w-full">
                 <p className="text-xs text-slate-400 mb-2">{window.__t("إحصائيات:")}</p>
                 <p className="text-sm">• {TUNISIAN_PENAL_CODE.length} {window.__t("كتاب قانوني")}</p>
                 <p className="text-sm">• {totalArticles} {window.__t("فصلاً قانونياً")}</p>
                 <p className="text-sm">{window.__t("• شرح ذكي بمساعدة الذكاء الاصطناعي")}</p>
               </div>
               <p className="text-sm mt-4 text-slate-400">
                 {window.__t("اختر فصلاً قانونياً من القائمة لعرض الشرح المفصل والأمثلة التطبيقية")}
               </p>
             </div>
           ) : (
             <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
               <div className="mb-4 pb-4 border-b border-slate-700 flex-shrink-0">
                  <span className="text-xs text-gold-400 uppercase">{window.__t("الفصل المختار")}</span>
                  <h4 className="font-bold text-lg">
                    {window.__t("فصل")} {selectedArticle.num}
                    {selectedArticle.bis && <span className="text-sm text-slate-400"> {window.__t("(مكرر)")}</span>}
                  </h4>
                  <p className="text-sm text-slate-300 mt-2 opacity-90 bg-slate-800 p-3 rounded-lg">
                    {selectedArticle.text}
                  </p>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="mt-3 text-xs text-slate-400 hover:text-white transition"
                  >
                    {window.__t("✕ إغلاق الشرح")}
                  </button>
               </div>
               
               {loadingExplanation ? (
                 <div className="flex flex-col items-center justify-center py-10">
                   <Spinner />
                   <span className="me-3 mt-4 text-slate-400">{window.__t("جاري استحضار الشرح القانوني الشامل...")}</span>
                 </div>
               ) : explanation ? (
                 <div className="prose prose-invert prose-sm max-w-none">
                   <div 
                     className="text-slate-200 leading-relaxed whitespace-pre-wrap"
                     dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br/>') }} 
                   />
                 </div>
               ) : (
                 <div className="text-center text-slate-500 py-10">
                   {window.__t("اضغط على \"شرح ذكي\" لبدء الشرح")}
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
