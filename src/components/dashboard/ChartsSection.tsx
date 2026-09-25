import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { DashboardKPIs, BlockSummary, Student } from '../../types';
import { ReasonSummary } from '../../lib/calculations';
import { BarChart3, PieChart as PieIcon, Layers, BookOpen, AlertCircle } from 'lucide-react';

interface ChartsSectionProps {
  kpis: DashboardKPIs;
  blocks: BlockSummary[];
  reasons: ReasonSummary[];
  students: Student[];
  onChartClick: (type: string, value: string) => void;
}

const COLORS = {
  blue: '#1e40af',
  teal: '#0284c7',
  emerald: '#059669',
  amber: '#d97706',
  rose: '#e11d48',
  slate: '#64748b'
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  kpis,
  blocks,
  reasons,
  students,
  onChartClick
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'primary' | 'detailed'>('primary');

  // 1. Aadhaar Status Breakdown Data
  const aadhaarData = [
    { name: 'Aadhaar Verified', value: kpis.aadhaarVerified, color: COLORS.emerald },
    { name: 'Unverified (Mismatch)', value: Math.max(0, kpis.aadhaarProvided - kpis.aadhaarVerified), color: COLORS.amber },
    { name: 'Aadhaar Missing', value: kpis.aadhaarNotProvided, color: COLORS.rose }
  ];

  // 2. Block-wise Bar Data
  const blockBarData = blocks.map(b => ({
    name: b.blockName,
    'Total Students': b.totalStudents,
    'Aadhaar Provided': b.aadhaarProvided,
    'Aadhaar Verified': b.aadhaarVerified
  }));

  // 3. Class Distribution Data
  const classOrder = ['Nursery/KG', 'LKG/KG1/Pre-School', 'UKG/KG2/Pre-Primary', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const classCounts = new Map<string, number>();
  for (let i = 0; i < students.length; i++) {
    const c = students[i].className || 'Other';
    classCounts.set(c, (classCounts.get(c) || 0) + 1);
  }
  const allClasses = Array.from(classCounts.keys()).sort((a, b) => {
    const idxA = classOrder.indexOf(a);
    const idxB = classOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
  const classData = allClasses.map(c => ({
    class: c,
    count: classCounts.get(c) || 0
  }));

  // 4. Pending Reasons Data
  const reasonChartData = reasons.map(r => ({
    name: r.reason,
    count: r.count,
    percentage: r.percentage
  }));

  return (
    <div className="space-y-4">
      {/* Clean Tab Switcher for Charts to avoid visual congestion */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Analytical Visualizations
          </h3>
          <p className="text-xs text-slate-500">
            Click on any chart bar or slice to apply instant dashboard filters
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 text-xs">
          <button
            onClick={() => setActiveChartTab('primary')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              activeChartTab === 'primary'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Block & Verification Overview
          </button>
          <button
            onClick={() => setActiveChartTab('detailed')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              activeChartTab === 'detailed'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Class & Reason Breakdowns
          </button>
        </div>
      </div>

      {activeChartTab === 'primary' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Chart 1: Block-wise Progress Comparison (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Block-wise Enrolment & Verification
                </h4>
                <p className="text-xs text-slate-400">Comparing students across {blocks.length} blocks</p>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Click bar to drill down</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={blockBarData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 10 }}
                  onClick={(state) => {
                    if (state && state.activeLabel) {
                      onChartClick('block', String(state.activeLabel));
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Total Students" fill={COLORS.blue} radius={[4, 4, 0, 0]} cursor="pointer" />
                  <Bar dataKey="Aadhaar Provided" fill={COLORS.teal} radius={[4, 4, 0, 0]} cursor="pointer" />
                  <Bar dataKey="Aadhaar Verified" fill={COLORS.emerald} radius={[4, 4, 0, 0]} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Aadhaar Status Donut (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Verification Breakdown
                </h4>
                <p className="text-xs text-slate-400">UIDAI demographic verification status</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aadhaarData}
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    cursor="pointer"
                    onClick={(entry) => {
                      if (entry && entry.name) {
                        if (entry.name.includes('Verified')) onChartClick('aadhaarVerified', 'YES');
                        else if (entry.name.includes('Missing')) onChartClick('aadhaarProvided', 'NO');
                        else onChartClick('aadhaarVerified', 'NO');
                      }
                    }}
                  >
                    {aadhaarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                    formatter={(val: any) => [
                      `${Number(val).toLocaleString()} (${((Number(val)/kpis.totalStudents)*100).toFixed(1)}%)`,
                      'Students'
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Verified Rate: <strong className="text-slate-800">{kpis.aadhaarVerifiedPct}%</strong></span>
              <span>Missing Rate: <strong className="text-rose-600">{kpis.aadhaarNotProvidedPct}%</strong></span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
          {/* Chart 3: Pending Reasons */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Pending APAAR Reasons Breakdown
                </h4>
                <p className="text-xs text-slate-400">Diagnosis from source report</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={reasonChartData}
                  margin={{ top: 10, right: 20, left: 50, bottom: 10 }}
                  onClick={(state) => {
                    if (state && state.activeLabel) {
                      onChartClick('pendingReason', String(state.activeLabel));
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#475569' }}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} students`, 'Count']}
                  />
                  <Bar dataKey="count" fill={COLORS.amber} radius={[0, 4, 4, 0]} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Class Distribution */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Student Distribution by Class
                </h4>
                <p className="text-xs text-slate-400">Enrolment across grades I - XII</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                  onClick={(state) => {
                    if (state && state.activeLabel) {
                      onChartClick('className', String(state.activeLabel));
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="class"
                    tick={{ fontSize: 9.5, fill: '#475569' }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                  />
                  <Bar dataKey="count" fill={COLORS.blue} radius={[4, 4, 0, 0]} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
