import React from 'react';
import { useStudents } from '../context/StudentContext';
import { LayoutDashboard, Users, FileSpreadsheet } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = useStudents();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', hindi: 'डैशबोर्ड', icon: LayoutDashboard },
    { id: 'students', label: 'Students', hindi: 'विद्यार्थी सूची', icon: Users },
    { id: 'reports', label: 'Reports', hindi: 'रिपोर्ट्स व आंकड़े', icon: FileSpreadsheet },
  ] as const;

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-[1600px] mx-auto px-1.5 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-3 sm:flex sm:space-x-6 md:space-x-8 py-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 py-2.5 sm:py-3 px-1 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors cursor-pointer select-none active:bg-slate-50 ${
                  isActive
                    ? 'border-blue-700 text-blue-700 font-semibold bg-blue-50/30 sm:bg-transparent'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                <span className="text-[9px] sm:text-[11px] opacity-75 font-normal truncate">({item.hindi})</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
