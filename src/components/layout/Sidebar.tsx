import React from 'react';
import {
  LayoutDashboard,
  Layers,
  School,
  Users,
  AlertCircle,
  FileBarChart2,
  ShieldCheck,
  X
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'block-wise'
  | 'school-wise'
  | 'students'
  | 'pending-apaar'
  | 'reports';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingCount?: number;
  districtName?: string;
  districtCode?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingCount = 0,
  districtName = 'Dantewada',
  districtCode = '2216'
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'block-wise' as NavTab,
      label: 'Block-wise Status',
      icon: Layers
    },
    {
      id: 'school-wise' as NavTab,
      label: 'School-wise Status',
      icon: School
    },
    {
      id: 'students' as NavTab,
      label: 'Student Details',
      icon: Users
    },
    {
      id: 'pending-apaar' as NavTab,
      label: 'Pending APAAR',
      icon: AlertCircle,
      badge: pendingCount > 0 ? pendingCount.toLocaleString() : undefined
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports',
      icon: FileBarChart2
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header in sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <img src="/emblem.svg" alt="Emblem" className="w-8 h-8" />
            <span className="font-bold text-white text-sm">APAAR {districtName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section title */}
        <div className="px-4 pt-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation Modules
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-800 text-white font-semibold shadow-inner'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Govt. Verification Engine</span>
          </div>
          <p className="text-[11px] text-slate-400">
            UDISE+ & APAAR Unified Student Identity System
          </p>
          <div className="mt-2 text-[10px] text-slate-400 font-mono">
            {districtCode ? `District Code: ${districtCode} (${districtName})` : districtName}
          </div>
        </div>
      </aside>
    </>
  );
};
