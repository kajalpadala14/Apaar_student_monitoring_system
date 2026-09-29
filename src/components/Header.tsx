import React from 'react';
import { useStudents } from '../context/StudentContext';
import { ShieldCheck, School, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    stats,
    currentUser,
    logout,
  } = useStudents();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top National/State Bar */}
      <div className="bg-slate-900 text-slate-200 text-[10px] sm:text-xs py-1 px-2.5 sm:px-4 md:px-6 lg:px-8 border-b border-slate-950">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
            <span className="font-semibold text-white tracking-wide truncate">स्कूल शिक्षा विभाग, छत्तीसगढ़ शासन</span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden md:inline truncate">School Education Department, Govt. of Chhattisgarh</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-slate-300 shrink-0 font-medium text-[10px] sm:text-xs">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>District Dantewada</span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-3">
          
          {/* Top Brand Identity */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shrink-0">
              <img src="/emblem.svg" alt="Dantewada Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
                <h1 className="text-sm sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-snug">
                  Dantewada APAAR Survey
                </h1>
                <span className="bg-slate-100 text-slate-700 text-[8px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded border border-slate-200 uppercase tracking-wider shrink-0">
                  Official
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-normal">
                जिला दंतेवाड़ा, छत्तीसगढ़ &bull; APAAR ID Pending Student Survey
              </p>
            </div>
          </div>

          {/* Right: Quick Stats, User Profile & Logout */}
          <div className="flex items-center justify-between md:justify-end flex-wrap gap-1.5 sm:gap-2.5 w-full md:w-auto">
            
            {/* Quick KPI Badges - Responsive (Compact on mobile, expanded on desktop) */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-2.5 py-1 divide-x divide-slate-200 text-xs shrink-0">
              <div className="pr-1.5 sm:pr-3 text-left">
                <span className="text-[8px] sm:text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  {isAdmin ? 'Total Students' : 'School Students'}
                </span>
                <span className="font-bold text-slate-900 tabular-nums text-xs sm:text-sm">
                  {stats.totalStudents.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="px-1.5 sm:px-3 text-left">
                <span className="text-[8px] sm:text-[10px] font-medium text-emerald-700 uppercase tracking-wider block">Done</span>
                <span className="font-bold text-emerald-700 tabular-nums text-xs sm:text-sm">
                  {stats.surveyCompleted.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pl-1.5 sm:pl-3 text-left">
                <span className="text-[8px] sm:text-[10px] font-medium text-amber-700 uppercase tracking-wider block">Pending</span>
                <span className="font-bold text-amber-700 tabular-nums text-xs sm:text-sm">
                  {stats.surveyPending.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Authenticated User Badge */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-2.5 py-1 text-left max-w-[170px] xs:max-w-[240px] sm:max-w-none">
              {isAdmin ? (
                <>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 border border-blue-100">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-900 leading-tight">
                      District Administrator
                    </div>
                    <div className="text-[8px] sm:text-[10px] font-medium text-blue-700">
                      Full District Access
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
                    <School className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="max-w-[120px] xs:max-w-[170px] sm:max-w-[210px]">
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-900 leading-tight truncate" title={currentUser.schoolName}>
                      {currentUser.schoolName}
                    </div>
                    <div className="text-[8px] sm:text-[10px] font-medium text-slate-500 truncate">
                      UDISE: {currentUser.udiseCode} &bull; {currentUser.blockName}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/80 rounded-lg px-2 sm:px-2.5 py-1.5 transition-colors cursor-pointer shrink-0"
              title="लॉगआउट करें (Sign Out)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>लॉगआउट</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
