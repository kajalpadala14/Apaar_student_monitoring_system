import React from 'react';
import { DashboardKPIs } from '../../types';
import {
  Users,
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';

interface KpiCardsProps {
  kpis: DashboardKPIs;
  onCardClick?: (metric: string) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis, onCardClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Students & Completion */}
      <div
        onClick={() => onCardClick?.('total')}
        className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Enrolment
            </span>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {kpis.totalStudents.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-500">Students</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {kpis.totalSchools} Schools across {kpis.totalBlocks} Blocks
          </p>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">APAAR Completion</span>
          <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
            kpis.completionPct >= 90
              ? 'bg-emerald-50 text-emerald-700'
              : kpis.completionPct >= 70
              ? 'bg-amber-50 text-amber-700'
              : 'bg-rose-50 text-rose-700'
          }`}>
            {kpis.completionPct}% Completed
          </span>
        </div>
      </div>

      {/* 2. Aadhaar Availability (Provided vs Not Provided) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Aadhaar Availability
            </span>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {kpis.aadhaarProvided.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              ({kpis.aadhaarProvidedPct}%)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Students with Aadhaar Provided
          </p>
        </div>

        <div
          onClick={() => onCardClick?.('aadhaar-not-provided')}
          className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs cursor-pointer group"
        >
          <div className="flex items-center gap-1.5 text-slate-600 group-hover:text-rose-600 transition">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Missing Aadhaar:</span>
          </div>
          <span className="font-semibold text-rose-600">
            {kpis.aadhaarNotProvided.toLocaleString()} ({kpis.aadhaarNotProvidedPct}%)
          </span>
        </div>
      </div>

      {/* 3. Aadhaar Verification (Verified vs Unverified) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              UIDAI Verification
            </span>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {kpis.aadhaarVerified.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              ({kpis.aadhaarVerifiedPct}%)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Demographically Verified
          </p>
        </div>

        <div
          onClick={() => onCardClick?.('aadhaar-not-verified')}
          className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs cursor-pointer group"
        >
          <div className="flex items-center gap-1.5 text-slate-600 group-hover:text-amber-600 transition">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Verification:</span>
          </div>
          <span className="font-semibold text-amber-600">
            {kpis.aadhaarNotVerified.toLocaleString()} ({kpis.aadhaarNotVerifiedPct}%)
          </span>
        </div>
      </div>

      {/* 4. APAAR Pipeline (Generated vs Pending) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              APAAR Progress
            </span>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
              <Award className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {kpis.apaarGenerated.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-500">Generated</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Active ID Generation Pipeline
          </p>
        </div>

        <div
          onClick={() => onCardClick?.('apaar-pending')}
          className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs cursor-pointer group"
        >
          <div className="flex items-center gap-1.5 text-slate-600 group-hover:text-orange-600 transition">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            <span>Pending Generation:</span>
          </div>
          <span className="font-semibold text-orange-600 flex items-center gap-1">
            {kpis.apaarPending.toLocaleString()}
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
