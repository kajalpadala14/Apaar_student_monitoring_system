import React, { useState } from 'react';
import { Student, BlockSummary, SchoolSummary, DashboardKPIs, FilterState } from '../../types';
import { ReasonSummary } from '../../lib/calculations';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileBarChart2,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  Building2,
  Users,
  Layers,
  School
} from 'lucide-react';
import { exportToExcel, exportToCSV, exportDistrictSummaryPDF, exportStudentsPDF } from '../../lib/export';

interface ReportsViewProps {
  kpis: DashboardKPIs;
  blocks: BlockSummary[];
  schools: SchoolSummary[];
  reasons: ReasonSummary[];
  students: Student[];
  currentFilter: FilterState;
}

type ReportType = 'district' | 'block' | 'school' | 'pending' | 'student';

export const ReportsView: React.FC<ReportsViewProps> = ({
  kpis,
  blocks,
  schools,
  reasons,
  students,
  currentFilter
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('district');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (activeReport === 'district' || activeReport === 'block') {
      exportDistrictSummaryPDF(kpis, blocks);
    } else {
      exportStudentsPDF(students, `APAAR_${activeReport.toUpperCase()}_REPORT`);
    }
  };

  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    if (activeReport === 'district') {
      const data = [
        { Metric: 'Total Students', Value: kpis.totalStudents },
        { Metric: 'Aadhaar Provided', Value: kpis.aadhaarProvided, Pct: `${kpis.aadhaarProvidedPct}%` },
        { Metric: 'Aadhaar Not Provided', Value: kpis.aadhaarNotProvided, Pct: `${kpis.aadhaarNotProvidedPct}%` },
        { Metric: 'Aadhaar Verified', Value: kpis.aadhaarVerified, Pct: `${kpis.aadhaarVerifiedPct}%` },
        { Metric: 'Aadhaar Not Verified', Value: kpis.aadhaarNotVerified, Pct: `${kpis.aadhaarNotVerifiedPct}%` },
        { Metric: 'APAAR Generated', Value: kpis.apaarGenerated, Pct: `${kpis.completionPct}%` },
        { Metric: 'APAAR Pending', Value: kpis.apaarPending, Pct: `${(100 - kpis.completionPct).toFixed(2)}%` }
      ];
      exportToExcel(data, `District_Summary_Report_${timestamp}`);
    } else if (activeReport === 'block') {
      const data = blocks.map(b => ({
        'Block Name': b.blockName,
        'Total Students': b.totalStudents,
        'Aadhaar Provided': b.aadhaarProvided,
        'Aadhaar Verified': b.aadhaarVerified,
        'APAAR Generated': b.apaarGenerated,
        'Completion %': `${b.completionPct}%`,
        'Status': b.status
      }));
      exportToExcel(data, `Block_Wise_Report_${timestamp}`);
    } else if (activeReport === 'school') {
      const data = schools.map(s => ({
        'Block': s.blockName,
        'School Name': s.schoolName,
        'UDISE Code': s.udiseCode,
        'Total Students': s.totalStudents,
        'Aadhaar Provided': s.aadhaarProvided,
        'Aadhaar Verified': s.aadhaarVerified,
        'APAAR Generated': s.apaarGenerated,
        'Completion %': `${s.completionPct}%`,
        'Status': s.status
      }));
      exportToExcel(data, `School_Wise_Report_${timestamp}`);
    } else if (activeReport === 'pending') {
      const data = reasons.map(r => ({
        'Pending Reason': r.reason,
        'Students': r.count,
        'Percentage': `${r.percentage}%`,
        'Related Schools': r.relatedSchoolsCount,
        'Related Blocks': r.relatedBlocksCount
      }));
      exportToExcel(data, `Pending_APAAR_Report_${timestamp}`);
    } else {
      const data = students.map(s => ({
        'PEN': s.studentPen,
        'Name': s.studentName,
        'Class': s.className,
        'Block': s.blockName,
        'School': s.schoolName,
        'Aadhaar Provided': s.isAadhaarProvided,
        'Aadhaar Verified': s.isAadhaarVerified,
        'APAAR Status': s.apaarStatus,
        'Pending Reason': s.pendingReason
      }));
      exportToExcel(data, `Student_Wise_Pending_Report_${timestamp}`);
    }
  };

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    if (activeReport === 'block') {
      exportToCSV(blocks, `Block_Report_${timestamp}`);
    } else if (activeReport === 'school') {
      exportToCSV(schools, `School_Report_${timestamp}`);
    } else if (activeReport === 'pending') {
      exportToCSV(reasons, `Pending_Report_${timestamp}`);
    } else {
      exportToCSV(students, `Student_Report_${timestamp}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Print/Export Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileBarChart2 className="w-5 h-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-900">
                Official Administrative Reports & Dossiers
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Export and print standardized government reports respecting active filters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex flex-wrap gap-2 pt-4">
          {[
            { id: 'district', label: 'A. District Summary' },
            { id: 'block', label: 'B. Block-wise Report' },
            { id: 'school', label: 'C. School-wise Report' },
            { id: 'pending', label: 'D. Pending APAAR Analysis' },
            { id: 'student', label: 'E. Student-wise Pending Roster' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                activeReport === tab.id
                  ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Printable Report Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 md:p-8">
        {/* Official Header on Printed Document */}
        <div className="text-center pb-6 border-b-2 border-slate-800 mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/emblem.svg" alt="Emblem" className="w-12 h-12" />
            <div className="text-left">
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                GOVERNMENT OF {kpis.stateName ? kpis.stateName.toUpperCase() : 'CHHATTISGARH'}
              </h1>
              <p className="text-xs font-bold text-slate-700">
                DISTRICT ADMINISTRATION {kpis.districtName ? kpis.districtName.toUpperCase() : 'DANTEWADA'} | SCHOOL EDUCATION DEPARTMENT
              </p>
            </div>
          </div>
          <div className="mt-2 inline-block px-4 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-bold uppercase tracking-wider text-slate-800">
            {activeReport === 'district' && 'Report A: District-Level APAAR Performance Executive Summary'}
            {activeReport === 'block' && 'Report B: Block-wise APAAR Verification & Generation Dossier'}
            {activeReport === 'school' && 'Report C: School-wise Comprehensive Performance Roster'}
            {activeReport === 'pending' && 'Report D: Pending APAAR Generation Root-Cause Analysis'}
            {activeReport === 'student' && 'Report E: Student-Level Actionable Pending Worklist'}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span>District: <strong>{kpis.districtName || 'Dantewada'} {kpis.districtCode ? `(${kpis.districtCode})` : ''}</strong></span>
            <span>•</span>
            <span>Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong></span>
            <span>•</span>
            <span>Dataset: <strong>Official Active Dataset</strong></span>
          </div>
        </div>

        {/* Report Content: District Summary */}
        {activeReport === 'district' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-slate-200 p-3 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Total Students</span>
                <div className="text-xl font-black text-slate-900">{kpis.totalStudents.toLocaleString()}</div>
              </div>
              <div className="border border-slate-200 p-3 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Aadhaar Provided</span>
                <div className="text-xl font-black text-emerald-800">{kpis.aadhaarProvided.toLocaleString()} ({kpis.aadhaarProvidedPct}%)</div>
              </div>
              <div className="border border-slate-200 p-3 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Aadhaar Verified</span>
                <div className="text-xl font-black text-emerald-800">{kpis.aadhaarVerified.toLocaleString()} ({kpis.aadhaarVerifiedPct}%)</div>
              </div>
              <div className="border border-slate-200 p-3 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-bold">APAAR Generated</span>
                <div className="text-xl font-black text-blue-900">{kpis.apaarGenerated.toLocaleString()} ({kpis.completionPct}%)</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Performance Dimension</th>
                    <th className="p-3 text-right">Student Count</th>
                    <th className="p-3 text-right">Percentage</th>
                    <th className="p-3 text-center">Status / Action Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-semibold">Total Enrolled Students</td>
                    <td className="p-3 text-right font-bold">{kpis.totalStudents.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">100.00%</td>
                    <td className="p-3 text-center"><StatusBadge status="GREEN" label="Official Master" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Aadhaar Numbers Provided</td>
                    <td className="p-3 text-right font-bold">{kpis.aadhaarProvided.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">{kpis.aadhaarProvidedPct}%</td>
                    <td className="p-3 text-center"><StatusBadge status="GREEN" label="Available" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-rose-800">Aadhaar Numbers Missing (Not Provided)</td>
                    <td className="p-3 text-right font-bold text-rose-800">{kpis.aadhaarNotProvided.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium text-rose-800">{kpis.aadhaarNotProvidedPct}%</td>
                    <td className="p-3 text-center"><StatusBadge status="CRITICAL" label="Camp Required" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Aadhaar Verified with UIDAI</td>
                    <td className="p-3 text-right font-bold">{kpis.aadhaarVerified.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">{kpis.aadhaarVerifiedPct}%</td>
                    <td className="p-3 text-center"><StatusBadge status="GREEN" label="Verified" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-amber-800">Aadhaar Unverified (Demographic Mismatch)</td>
                    <td className="p-3 text-right font-bold text-amber-800">{kpis.aadhaarNotVerified.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium text-amber-800">{kpis.aadhaarNotVerifiedPct}%</td>
                    <td className="p-3 text-center"><StatusBadge status="HIGH" label="Verification Camp" /></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-orange-800">APAAR Pending Generation</td>
                    <td className="p-3 text-right font-bold text-orange-800">{kpis.apaarPending.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">{(100 - kpis.completionPct).toFixed(2)}%</td>
                    <td className="p-3 text-center"><StatusBadge status="PENDING" label="Active Pipeline" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report Content: Block-wise */}
        {activeReport === 'block' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Block Name</th>
                  <th className="p-3 text-center">Schools</th>
                  <th className="p-3 text-right">Total Students</th>
                  <th className="p-3 text-right">Aadhaar Provided</th>
                  <th className="p-3 text-right">Aadhaar Verified</th>
                  <th className="p-3 text-right">APAAR Generated</th>
                  <th className="p-3 text-center">Completion %</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blocks.map(b => (
                  <tr key={b.blockName}>
                    <td className="p-3 font-bold text-slate-900">{b.blockName}</td>
                    <td className="p-3 text-center">{b.schoolCount}</td>
                    <td className="p-3 text-right font-bold">{b.totalStudents.toLocaleString()}</td>
                    <td className="p-3 text-right">{b.aadhaarProvided.toLocaleString()} ({b.aadhaarProvidedPct}%)</td>
                    <td className="p-3 text-right">{b.aadhaarVerified.toLocaleString()} ({b.aadhaarVerifiedPct}%)</td>
                    <td className="p-3 text-right font-bold">{b.apaarGenerated}</td>
                    <td className="p-3 text-center font-bold">{b.completionPct}%</td>
                    <td className="p-3 text-center"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report Content: School-wise Top 50 */}
        {activeReport === 'school' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Showing top 50 schools by student population. Use "Export Excel" for complete roster of all {schools.length} schools.
            </p>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Block</th>
                    <th className="p-2.5">School Name</th>
                    <th className="p-2.5 text-center">UDISE</th>
                    <th className="p-2.5 text-right">Total</th>
                    <th className="p-2.5 text-right">Aadhaar Prov</th>
                    <th className="p-2.5 text-right">Aadhaar Ver</th>
                    <th className="p-2.5 text-center">Completion %</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schools.slice(0, 50).map(s => (
                    <tr key={s.udiseCode || s.schoolName}>
                      <td className="p-2 font-medium">{s.blockName}</td>
                      <td className="p-2 font-medium text-slate-900">{s.schoolName}</td>
                      <td className="p-2 text-center font-mono">{s.udiseCode}</td>
                      <td className="p-2 text-right font-bold">{s.totalStudents}</td>
                      <td className="p-2 text-right">{s.aadhaarProvided}</td>
                      <td className="p-2 text-right">{s.aadhaarVerified}</td>
                      <td className="p-2 text-center font-bold">{s.completionPct}%</td>
                      <td className="p-2 text-center"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report Content: Pending Analysis */}
        {activeReport === 'pending' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Pending Reason</th>
                  <th className="p-3 text-right">Affected Students</th>
                  <th className="p-3 text-right">Percentage</th>
                  <th className="p-3 text-center">Related Schools</th>
                  <th className="p-3 text-center">Related Blocks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reasons.map(r => (
                  <tr key={r.reason}>
                    <td className="p-3 font-bold text-slate-900">{r.reason}</td>
                    <td className="p-3 text-right font-black">{r.count.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">{r.percentage}%</td>
                    <td className="p-3 text-center font-bold">{r.relatedSchoolsCount}</td>
                    <td className="p-3 text-center font-bold">{r.relatedBlocksCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report Content: Student Roster preview */}
        {activeReport === 'student' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Showing first 50 students from current filtered dataset ({students.length.toLocaleString()} total). Use "Export Excel" or "Download PDF" for comprehensive rosters.
            </p>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">PEN</th>
                    <th className="p-2">Student Name</th>
                    <th className="p-2">Class</th>
                    <th className="p-2">Block</th>
                    <th className="p-2">School</th>
                    <th className="p-2 text-center">Aadhaar Prov</th>
                    <th className="p-2 text-center">Aadhaar Ver</th>
                    <th className="p-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.slice(0, 50).map(s => (
                    <tr key={s.studentPen}>
                      <td className="p-2 font-mono font-bold text-blue-900">{s.studentPen}</td>
                      <td className="p-2 font-semibold text-slate-900">{s.studentName}</td>
                      <td className="p-2">{s.className}</td>
                      <td className="p-2">{s.blockName}</td>
                      <td className="p-2 truncate max-w-xs">{s.schoolName}</td>
                      <td className="p-2 text-center"><StatusBadge status={s.isAadhaarProvided} /></td>
                      <td className="p-2 text-center"><StatusBadge status={s.isAadhaarVerified} /></td>
                      <td className="p-2 text-slate-600">{s.pendingReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Document Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <span>District Education Officer, {kpis.districtName || 'Dantewada'}, {kpis.stateName || 'Chhattisgarh'}</span>
          <span>APAAR Student Monitoring Portal - Generated on {new Date().toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};
