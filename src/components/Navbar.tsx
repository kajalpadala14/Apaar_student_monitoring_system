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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-8 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 py-3 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-blue-700 text-blue-700 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                <span className="text-[11px] opacity-75 font-normal">({item.hindi})</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
