import React from 'react';
import { BlockSummary } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Layers, ArrowRight, TrendingUp, BarChart2, ShieldCheck, Award } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface BlockWiseViewProps {
  blocks: BlockSummary[];
  onSelectBlock: (blockName: string) => void;
}

export const BlockWiseView: React.FC<BlockWiseViewProps> = ({ blocks, onSelectBlock }) => {
  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-900">Block-wise Monitoring & Comparative Analysis</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Status thresholds: Green (≥90%), Yellow (70-89%), Red (&lt;70%)
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Total Blocks: {blocks.length} {blocks.length > 0 ? `(${blocks.map(b => b.blockName).join(', ')})` : ''}
          </div>
        </div>

        {/* Comparative Chart */}
        <div className="mt-4 pt-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Block-wise Comparative Progress (Aadhaar Verification & Generation)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={blocks.map(b => ({
                  name: b.blockName,
                  'Total Students': b.totalStudents,
                  'Aadhaar Provided': b.aadhaarProvided,
                  'Aadhaar Verified': b.aadhaarVerified,
                  'APAAR Generated': b.apaarGenerated
                }))}
                margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Total Students" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Aadhaar Provided" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Aadhaar Verified" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Block Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Block-wise Administrative Performance Table
          </h3>
          <span className="text-xs text-blue-700 font-medium">
            Click any block row to drill down into its schools
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Block Name</th>
                <th className="py-3 px-4 text-center">Block Code</th>
                <th className="py-3 px-4 text-center">Schools</th>
                <th className="py-3 px-4 text-right">Total Students</th>
                <th className="py-3 px-4 text-right">Aadhaar Provided</th>
                <th className="py-3 px-4 text-right">Aadhaar Verified</th>
                <th className="py-3 px-4 text-right">APAAR Generated</th>
                <th className="py-3 px-4 text-right">APAAR Pending</th>
                <th className="py-3 px-4 text-center">Completion %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {blocks.map((b) => (
                <tr
                  key={b.blockName}
                  onClick={() => onSelectBlock(b.blockName)}
                  className="hover:bg-blue-50/60 transition cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                    <span>{b.blockName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                    {b.blockCode || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                    {b.schoolCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">
                    {b.totalStudents.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium">
                    <span className="text-emerald-700 font-bold">{b.aadhaarProvided.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block">({b.aadhaarProvidedPct}%)</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium">
                    <span className="text-emerald-700 font-bold">{b.aadhaarVerified.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block">({b.aadhaarVerifiedPct}%)</span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-800">
                    {b.apaarGenerated.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-orange-700">
                    {b.apaarPending.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1 font-bold">
                      <span>{b.completionPct}%</span>
                    </div>
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden">
                      <div
                        className={`h-full ${b.status === 'GREEN' ? 'bg-emerald-600' : b.status === 'YELLOW' ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.max(4, Math.min(100, b.completionPct))}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlock(b.blockName);
                      }}
                      className="px-2.5 py-1 bg-blue-100 group-hover:bg-blue-600 group-hover:text-white text-blue-800 rounded font-semibold text-[11px] inline-flex items-center gap-1 transition"
                    >
                      <span>Drill Down</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200/70 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-3 px-4">DISTRICT TOTAL</td>
                <td className="py-3 px-4 text-center text-slate-500 font-mono text-xs">ALL</td>
                <td className="py-3 px-4 text-center">
                  {blocks.reduce((acc, b) => acc + b.schoolCount, 0)}
                </td>
                <td className="py-3 px-4 text-right">
                  {blocks.reduce((acc, b) => acc + b.totalStudents, 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-emerald-800">
                  {blocks.reduce((acc, b) => acc + b.aadhaarProvided, 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-emerald-800">
                  {blocks.reduce((acc, b) => acc + b.aadhaarVerified, 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-emerald-800">
                  {blocks.reduce((acc, b) => acc + b.apaarGenerated, 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-orange-800">
                  {blocks.reduce((acc, b) => acc + b.apaarPending, 0).toLocaleString()}
                </td>
                <td className="py-3 px-4 text-center">
                  {(
                    (blocks.reduce((acc, b) => acc + b.apaarGenerated, 0) /
                      (blocks.reduce((acc, b) => acc + b.totalStudents, 0) || 1)) *
                    100
                  ).toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-center">
                  <StatusBadge status="RED" label="Focus Required" />
                </td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
