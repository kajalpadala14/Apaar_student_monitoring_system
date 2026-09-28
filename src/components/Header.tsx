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

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top National/State Bar */}
      <div className="bg-blue-900 text-slate-100 text-xs py-1 px-4 flex justify-between items-center border-b border-blue-950">
        <div className="flex items-center space-x-2">
          <span className="font-medium tracking-wide">स्कूल शिक्षा विभाग, छत्तीसगढ़ शासन</span>
          <span className="text-blue-300">|</span>
          <span className="text-blue-200">School Education Department, Govt. of Chhattisgarh</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-300 text-xs">
          <span>District Dantewada</span>
        </div>
      </div>

      {/* Main District Portal Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center p-1.5 shadow-xs shrink-0">
              <img src="/emblem.svg" alt="Dantewada Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  Dantewada APAAR Survey
                </h1>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  Official
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600">
                जिला दंतेवाड़ा, छत्तीसगढ़ &bull; <span className="text-slate-500 font-normal">APAAR ID Pending Student Survey</span>
              </p>
            </div>
          </div>

          {/* Right Side Stats, User Profile & Logout */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-4 self-end md:self-auto">
            
            {/* Quick KPI Badges */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1.5 shadow-2xs divide-x divide-slate-200">
              <div className="px-3 py-0.5 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {currentUser.role === 'ADMIN' ? 'Total Students' : 'School Students'}
                </span>
                <span className="text-sm font-bold text-slate-900">{stats.totalStudents.toLocaleString('en-IN')}</span>
              </div>
              <div className="px-3 py-0.5 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Done</span>
                <span className="text-sm font-bold text-emerald-700">{stats.surveyCompleted.toLocaleString('en-IN')}</span>
              </div>
              <div className="px-3 py-0.5 text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending</span>
                <span className="text-sm font-bold text-amber-700">{stats.surveyPending.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Authenticated User Badge */}
            <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-left">
              {currentUser.role === 'ADMIN' ? (
                <>
                  <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 leading-none">
                      District Administrator
                    </div>
                    <div className="text-[10px] font-medium text-blue-700 mt-0.5">
                      Full District Access
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <School className="w-4 h-4" />
                  </div>
                  <div className="max-w-[180px] sm:max-w-[220px]">
                    <div className="text-xs font-bold text-slate-900 leading-tight truncate" title={currentUser.schoolName}>
                      {currentUser.schoolName}
                    </div>
                    <div className="text-[10px] font-medium text-emerald-800 mt-0.5 flex items-center space-x-1.5">
                      <span>UDISE: {currentUser.udiseCode}</span>
                      <span>&bull;</span>
                      <span>{currentUser.blockName}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 text-xs font-semibold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg px-3 py-2 transition-all cursor-pointer shadow-2xs"
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
