import React from 'react';
import { Clock, Database, Menu, CheckCircle2, RefreshCw } from 'lucide-react';

interface HeaderProps {
  lastUpdated: string;
  totalRecordsCount: number;
  districtName?: string;
  districtCode?: string;
  stateName?: string;
  onToggleSidebar?: () => void;
  drillDownBlock?: string;
  drillDownSchool?: string;
  onClearDrillDown?: (level: 'district' | 'block') => void;
  isSheetConfigured?: boolean;
  isSyncing?: boolean;
  onSyncSheet?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  totalRecordsCount,
  districtName = 'Dantewada',
  districtCode = '2216',
  stateName = 'Chhattisgarh',
  onToggleSidebar,
  drillDownBlock,
  drillDownSchool,
  onClearDrillDown,
  isSheetConfigured,
  isSyncing,
  onSyncSheet
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-40">
      {/* Tricolor top border accent */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-amber-500"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-emerald-600"></div>
      </div>

      <div className="px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Emblem + Official Titles */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 text-slate-300 hover:text-white rounded-md hover:bg-slate-800"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <img
              src="/emblem.svg"
              alt="Government Emblem"
              className="w-10 h-10 object-contain drop-shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  APAAR Student Monitoring Dashboard
                  <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-blue-700 text-blue-100 rounded">
                    {districtName}
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 flex-wrap">
                <span>District {districtName} {districtCode ? `(${districtCode})` : ''}</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400">School Education Department</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Govt. of {stateName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Data indicator + Status + Google Sheet Sync */}
        <div className="flex items-center gap-2.5 sm:gap-4 ml-auto">
          {/* Direct Live Sheet Sync Button */}
          {onSyncSheet && (
            <button
              onClick={onSyncSheet}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer disabled:opacity-60 ${
                isSheetConfigured
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700/80 hover:bg-amber-900'
              }`}
              title={isSheetConfigured ? 'Click to re-sync latest records directly from Google Sheet (.env)' : 'Configure VITE_GOOGLE_APPS_SCRIPT_URL in .env'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : isSheetConfigured ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">
                {isSyncing ? 'Syncing...' : isSheetConfigured ? 'Sync Live Sheet' : 'Configure .env'}
              </span>
              <span className="sm:hidden">
                {isSyncing ? 'Syncing' : 'Sync'}
              </span>
              {isSheetConfigured && !isSyncing && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          )}

          {/* Verified Source Indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <div className="text-left font-mono">
              <span className="text-white font-bold">{totalRecordsCount.toLocaleString()}</span>
              <span className="text-slate-400 ml-1">Students</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Authentic Dantewada Data Loaded"></span>
          </div>

          {/* Last Updated */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Drill-down Navigation Banner if active */}
      {(drillDownBlock || drillDownSchool) && (
        <div className="bg-blue-800/90 text-white px-4 lg:px-6 py-1.5 text-xs flex items-center justify-between border-t border-blue-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-200">Active Drill-Down:</span>
            <button
              onClick={() => onClearDrillDown?.('district')}
              className="hover:underline text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <span>{districtName} District</span>
            </button>
            {drillDownBlock && (
              <>
                <span className="text-blue-300">/</span>
                <span className="font-semibold text-amber-300 bg-blue-900/60 px-2 py-0.5 rounded">
                  Block: {drillDownBlock}
                </span>
              </>
            )}
            {drillDownSchool && (
              <>
                <span className="text-blue-300">/</span>
                <span className="font-semibold text-white bg-blue-950/80 px-2 py-0.5 rounded">
                  School: {drillDownSchool}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => onClearDrillDown?.('district')}
            className="text-[11px] underline hover:text-amber-300 text-blue-100 cursor-pointer"
          >
            Clear Drill-Down View
          </button>
        </div>
      )}
    </header>
  );
};
