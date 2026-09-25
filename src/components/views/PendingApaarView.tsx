import React from 'react';
import { Student, DashboardKPIs } from '../../types';
import { ReasonSummary } from '../../lib/calculations';
import { StatusBadge } from '../common/StatusBadge';
import {
  AlertCircle,
  ArrowDown,
  FileSpreadsheet,
  Download,
  School,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { exportToExcel, exportToCSV } from '../../lib/export';

interface PendingApaarViewProps {
  kpis: DashboardKPIs;
  reasons: ReasonSummary[];
  students: Student[];
  onSelectReason: (reason: string) => void;
  onSelectMissingAadhaar: () => void;
  onSelectUnverifiedAadhaar: () => void;
}

export const PendingApaarView: React.FC<PendingApaarViewProps> = ({
  kpis,
  reasons,
  students,
  onSelectReason,
  onSelectMissingAadhaar,
  onSelectUnverifiedAadhaar
}) => {
  const pendingStudents = students.filter(s => s.apaarStatus === 'Pending');
  const otherReasonsCount = reasons
    .filter(r => r.reason !== 'Not Applied')
    .reduce((sum, r) => sum + r.count, 0);

  const handleExport = (format: 'excel' | 'csv') => {
    const data = reasons.map(r => ({
      'Pending Reason': r.reason,
      'Student Count': r.count,
      'Percentage (%)': `${r.percentage}%`,
      'Affected Schools': r.relatedSchoolsCount,
      'Affected Blocks': r.relatedBlocksCount
    }));

    if (format === 'excel') {
      exportToExcel(data, `Pending_APAAR_Reasons_Report_${new Date().toISOString().slice(0, 10)}`);
    } else {
      exportToCSV(data, `Pending_APAAR_Reasons_Report_${new Date().toISOString().slice(0, 10)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Pending APAAR Generation Analysis
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Root-cause diagnosis and actionable bottleneck hierarchy across reported students
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('excel')}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Reason Summary
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* Funnel Flow Section */}
        <div className="mt-5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            Pending APAAR Funnel & Progression Bottlenecks
          </h3>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 relative">
            {/* Step 1: Total Pending */}
            <div className="w-full md:w-1/4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Step 1: Total Pending
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {kpis.apaarPending.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {kpis.totalStudents > 0 ? ((kpis.apaarPending / kpis.totalStudents) * 100).toFixed(1) : 0}% of reported roster
              </p>
            </div>

            <div className="hidden md:flex text-slate-300">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="md:hidden text-slate-300">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Step 2: Aadhaar Not Provided */}
            <div
              onClick={onSelectMissingAadhaar}
              className="w-full md:w-1/4 bg-white border border-slate-200/80 hover:border-slate-300 p-4 rounded-xl transition cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
                  Step 2: No Aadhaar
                </span>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">Critical</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1 group-hover:text-rose-600 transition">
                {kpis.aadhaarNotProvided.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {kpis.aadhaarNotProvidedPct}% without Aadhaar
              </p>
            </div>

            <div className="hidden md:flex text-slate-300">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="md:hidden text-slate-300">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Step 3: Aadhaar Not Verified */}
            <div
              onClick={onSelectUnverifiedAadhaar}
              className="w-full md:w-1/4 bg-white border border-slate-200/80 hover:border-slate-300 p-4 rounded-xl transition cursor-pointer group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                  Step 3: Unverified
                </span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">High</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1 group-hover:text-amber-600 transition">
                {kpis.aadhaarNotVerified.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {kpis.aadhaarNotVerifiedPct}% demographic mismatch
              </p>
            </div>

            <div className="hidden md:flex text-slate-300">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="md:hidden text-slate-300">
              <ArrowDown className="w-4 h-4" />
            </div>

            {/* Step 4: Technical & Other Reasons */}
            <div className="w-full md:w-1/4 bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                  Step 4: Other Reasons
                </span>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Review</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {otherReasonsCount.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Mobile limits & consent expiry
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart & Reason Analysis Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">
            Pending Reason Proportion Chart
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reasons}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="reason"
                  tick={{ fontSize: 10 }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString()} students`, 'Count']}
                />
                <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reason Table Column */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Reason-wise Analysis & Impact Scope
            </h3>
            <span className="text-xs text-slate-400">Direct source Excel values</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-3 px-3">Pending Reason</th>
                  <th className="py-3 px-3 text-right">No. of Students</th>
                  <th className="py-3 px-3 text-right">Percentage</th>
                  <th className="py-3 px-3 text-center">Related Schools</th>
                  <th className="py-3 px-3 text-center">Related Blocks</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {reasons.map((r) => (
                  <tr
                    key={r.reason}
                    className="hover:bg-orange-50/50 transition cursor-pointer group"
                    onClick={() => onSelectReason(r.reason)}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900 group-hover:text-orange-700">
                      {r.reason}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {r.count.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-600">
                      {r.percentage}%
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-800">
                      {r.relatedSchoolsCount}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {r.relatedBlocksCount}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReason(r.reason);
                        }}
                        className="px-2 py-0.5 bg-orange-100 group-hover:bg-orange-600 group-hover:text-white text-orange-900 rounded text-[11px] font-semibold transition"
                      >
                        Filter Students
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
