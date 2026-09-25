import React from 'react';
import { DashboardKPIs, BlockSummary, SchoolSummary } from '../../types';
import { ArrowRight, AlertCircle, ShieldAlert, CheckCircle, MapPin } from 'lucide-react';

interface PriorityActionsProps {
  kpis: DashboardKPIs;
  blocks: BlockSummary[];
  schools: SchoolSummary[];
  onActionClick: (actionType: string, filterParams?: any) => void;
}

export const PriorityActions: React.FC<PriorityActionsProps> = ({
  kpis,
  blocks,
  onActionClick
}) => {
  const lowCompletionBlocks = [...blocks].sort((a, b) => a.aadhaarVerifiedPct - b.aadhaarVerifiedPct);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Key Administrative Priorities
          </h3>
          <p className="text-xs text-slate-500">
            Immediate action items for block and school-level verification drives
          </p>
        </div>
        <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full">
          {kpis.districtName ? `${kpis.districtName} District Focus` : 'District Focus'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Missing Aadhaar */}
        <div
          onClick={() => onActionClick('aadhaar-missing', { aadhaarProvided: 'NO' })}
          className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Missing Aadhaar
              </span>
              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                Critical
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {kpis.aadhaarNotProvided.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Students needing new Aadhaar enrolment camps
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center text-xs font-semibold text-blue-700 group-hover:text-blue-800">
            <span>View Students</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition group-hover:translate-x-0.5" />
          </div>
        </div>

        {/* 2. Unverified Aadhaar */}
        <div
          onClick={() => onActionClick('aadhaar-unverified', { aadhaarVerified: 'NO' })}
          className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Unverified Aadhaar
              </span>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                High
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {kpis.aadhaarNotVerified.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Demographic mismatches requiring school verification
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center text-xs font-semibold text-blue-700 group-hover:text-blue-800">
            <span>View Roster</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition group-hover:translate-x-0.5" />
          </div>
        </div>

        {/* 3. Ready for Generation */}
        <div
          onClick={() => onActionClick('ready-generation', { aadhaarVerified: 'YES', apaarStatus: 'Pending' })}
          className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Generation Ready
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                Ready
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {kpis.aadhaarVerified.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verified students eligible for immediate APAAR push
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center text-xs font-semibold text-blue-700 group-hover:text-blue-800">
            <span>Review Ready List</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition group-hover:translate-x-0.5" />
          </div>
        </div>

        {/* 4. Lowest Verification Block */}
        <div
          onClick={() => onActionClick('focus-block', { block: lowCompletionBlocks[0]?.blockName })}
          className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Focus Block
              </span>
              <span className="text-[10px] font-bold bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded">
                Attention
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {lowCompletionBlocks[0]?.blockName || 'N/A'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Lowest verification rate ({lowCompletionBlocks[0]?.aadhaarVerifiedPct}% verified)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center text-xs font-semibold text-blue-700 group-hover:text-blue-800">
            <span>Drill into Block</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
