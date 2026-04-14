
import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { storageService } from '../services/storageService';
import { CaseFile } from '../types';
import { User } from '../types';

export const Dashboard = ({ onNavigate, user }: { onNavigate: (page: string, caseId?: string) => void; user?: User }) => {
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamCases, setTeamCases] = useState<CaseFile[]>([]);
  const [contractsCount, setContractsCount] = useState(0);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await storageService.getCases();
        setCases(data);
        if (user?.subscriptionPlan === 'enterprise') {
          // TODO: implement getTeamMembers and getCasesByUserId properly inside storageService
          const teamCasesMock: any[] = [];
          setTeamCases([...data, ...teamCasesMock]);
        }
        
        // TODO: implement getContracts
        const contractsCountMock = 0;
        setContractsCount(contractsCountMock);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id, user?.subscriptionPlan]);

  const displayCases = user?.subscriptionPlan === 'enterprise' && teamCases.length > 0 ? teamCases : cases;
  const totalCases = displayCases.length;
  const activeCases = displayCases.filter(c => c.status === 'active').length;
  const pendingCases = displayCases.filter(c => c.status === 'pending').length;
  const closedCases = displayCases.filter(c => c.status === 'closed').length;

  // Generate chart data from real cases - last 6 months
  const generateChartData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const data = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      // Count cases created in this month
      const casesInMonth = displayCases.filter(c => {
        try {
          const caseDate = new Date(c.dateCreated);
          return caseDate.getMonth() === month && caseDate.getFullYear() === year;
        } catch (e) {
          return false;
        }
      }).length;

      data.push({
        name: monthNames[month],
        cases: casesInMonth
      });
    }

    return data;
  };

  const chartData = generateChartData();

  const StatCard = ({ title, value, icon, gradient, trend, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-lg transition duration-300 relative overflow-hidden group ${onClick ? 'cursor-pointer active:scale-95 hover:border-slate-300' : ''}`}
    >
      <div className={`absolute -end-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="flex justify-between items-start z-10">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white shadow-md bg-gradient-to-br ${gradient}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs font-medium text-green-600">
          <span className="bg-green-100 px-1.5 py-0.5 rounded flex items-center">
             <svg className="w-3 h-3 ms-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
             {trend}
          </span>
          <span className="me-2 text-gray-400">{window.__t("مقارنة بالشهر الماضي")}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl">
        <div>
          <h2 className="text-3xl font-bold mb-2">{window.__t("لوحة القيادة")}</h2>
          <p className="text-slate-300">{window.__t("مرحباً بك، إليك ملخص نشاط مكتبك اليوم.")}</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3 space-x-reverse bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
          <span 
            onClick={() => onNavigate('calendar')}
            className="text-2xl cursor-pointer hover:scale-110 transition-transform p-1 rounded-lg hover:bg-white/10"
            title={window.__t("التقويم")}
          >
            📅
          </span>
          <div className="text-end">
             <p className="text-xs text-slate-300">{window.__t("اليوم")}</p>
             <p className="font-bold text-sm tracking-tight text-white">
               {new Date().toLocaleDateString((document.documentElement.lang === 'ar' ? 'ar-TN' : 'fr-FR'), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title={window.__t("إجمالي القضايا")} value={totalCases} icon="📁" gradient="from-blue-500 to-blue-600" onClick={() => onNavigate('cases')} />
        <StatCard title={window.__t("قضايا جارية")} value={activeCases} icon="⚡" gradient="from-emerald-500 to-emerald-600" onClick={() => onNavigate('cases', 'active')} />
        <StatCard title={window.__t("بانتظار الإجراء")} value={pendingCases} icon="⏳" gradient="from-amber-400 to-amber-500" onClick={() => onNavigate('cases', 'pending')} />
        <StatCard title={window.__t("قضايا منتهية")} value={closedCases} icon="✅" gradient="from-purple-500 to-purple-600" onClick={() => onNavigate('cases', 'closed')} />
        <StatCard title={window.__t("إجمالي العقود")} value={contractsCount} icon="📝" gradient="from-indigo-500 to-indigo-600" onClick={() => onNavigate('contracts')} />
        <StatCard title={window.__t("نسبة الإنجاز")} value={totalCases > 0 ? `${Math.round((closedCases / totalCases) * 100)}%` : '0%'} icon="📊" gradient="from-rose-500 to-rose-600" onClick={() => onNavigate('cases', 'closed')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
             <div>
               <h3 className="text-xl font-bold text-slate-800">{window.__t("تحليل القضايا")}</h3>
               <p className="text-sm text-gray-400">{window.__t("معدل القضايا الجديدة شهرياً")}</p>
             </div>
             <select className="text-sm bg-gray-50 border-gray-200 rounded-lg text-gray-500 focus:ring-primary-500 focus:border-primary-500 cursor-pointer">
               <option>{window.__t("آخر 6 أشهر")}</option>
               <option>{window.__t("هذه السنة")}</option>
             </select>
          </div>
          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#fbbf24' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area type="monotone" dataKey="cases" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorCases)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Recent */}
        <div className="flex flex-col space-y-6">
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-8 rounded-2xl shadow-lg text-white relative overflow-hidden">
             <div className="absolute top-0 end-0 w-32 h-32 bg-gold-500 rounded-full blur-3xl opacity-10 -me-10 -mt-10"></div>
             <h3 className="text-lg font-bold mb-6 relative z-10">{window.__t("إجراءات سريعة")}</h3>
             <div className="space-y-4 relative z-10">
               <button 
                  onClick={() => onNavigate('new-case')}
                  className="w-full py-3.5 px-4 bg-gold-500 text-slate-900 rounded-xl hover:bg-gold-400 transition flex items-center justify-center space-x-2 space-x-reverse font-bold shadow-lg shadow-gold-500/20 transform hover:-translate-y-0.5"
               >
                  <span className="text-xl">➕</span>
                  <span>{window.__t("إضافة قضية جديدة")}</span>
               </button>
               <button 
                  onClick={() => onNavigate('calendar')}
                  className="w-full py-3.5 px-4 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition flex items-center justify-center space-x-2 space-x-reverse backdrop-blur-sm"
               >
                  <span className="text-xl">📅</span>
                  <span>{window.__t("جدولة جلسة")}</span>
               </button>
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">{window.__t("أحدث الملفات")}</h3>
                <button onClick={() => onNavigate('cases')} className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full hover:bg-primary-100 transition">{window.__t("عرض الكل")}</button>
             </div>
             <div className="space-y-4 overflow-y-auto flex-1 pe-1">
               {displayCases.slice(0, 4).map(c => (
                 <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer group border border-transparent hover:border-slate-100" onClick={() => onNavigate('case-detail', c.id)}>
                   <div className="flex items-center space-x-4 space-x-reverse">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        c.type === 'criminal' ? 'bg-red-50 text-red-500 group-hover:bg-red-100' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'
                      }`}>
                       <span className="text-2xl">{c.type === 'criminal' ? '⚖️' : '📄'}</span>
                     </div>
                     <div>
                       <p className="font-bold text-sm text-slate-800 group-hover:text-primary-700">{c.title}</p>
                       <p className="text-xs text-gray-400 mt-1">{c.clientName}</p>
                     </div>
                   </div>
                   <div className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></div>
                 </div>
               ))}
               {cases.length === 0 && (
                 <div className="text-center py-8">
                   <p className="text-gray-400 text-sm">{window.__t("لا توجد قضايا حديثة")}</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
