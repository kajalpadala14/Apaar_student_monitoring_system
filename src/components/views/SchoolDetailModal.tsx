import React, { useMemo } from 'react';
import { Student } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { School, X, Download, User, CheckCircle, Clock } from 'lucide-react';
import { exportToExcel } from '../../lib/export';

interface SchoolDetailModalProps {
  udiseCode: string;
  schoolName: string;
  students: Student[];
  onClose: () => void;
  onSelectStudent: (student: Student) => void;
}

export const SchoolDetailModal: React.FC<SchoolDetailModalProps> = ({
  udiseCode,
  schoolName,
  students,
  onClose,
  onSelectStudent
}) => {
  const schoolStudents = useMemo(() => {
    return students.filter(s => s.udiseCode === udiseCode || s.schoolName === schoolName);
  }, [students, udiseCode, schoolName]);

  const total = schoolStudents.length;
  const prov = schoolStudents.filter(s => s.isAadhaarProvided === 'YES').length;
  const ver = schoolStudents.filter(s => s.isAadhaarVerified === 'YES').length;
  const gen = schoolStudents.filter(s => s.apaarStatus === 'Generated').length;
  const pend = total - gen;
  const completionPct = total > 0 ? Number(((gen / total) * 100).toFixed(2)) : 0;

  const handleExport = () => {
    const data = schoolStudents.map(s => ({
      'PEN': s.studentPen,
      'Student Name': s.studentName,
      'Class': s.className,
      'Section': s.section,
      'Aadhaar Provided': s.isAadhaarProvided,
      'Aadhaar Verified': s.isAadhaarVerified,
      'APAAR Status': s.apaarStatus,
      'Pending Reason': s.pendingReason
    }));
    exportToExcel(data, `School_${udiseCode}_Students`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-800 rounded-lg">
              <School className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{schoolName}</h3>
              <p className="text-xs text-slate-300 font-mono">
                UDISE Code: {udiseCode} | Block: {schoolStudents[0]?.blockName || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* School KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Students</span>
            <span className="text-base font-black text-slate-900">{total}</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Aadhaar Provided</span>
            <span className="text-base font-black text-emerald-800">{prov} ({total > 0 ? ((prov/total)*100).toFixed(0) : 0}%)</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Aadhaar Verified</span>
            <span className="text-base font-black text-emerald-800">{ver} ({total > 0 ? ((ver/total)*100).toFixed(0) : 0}%)</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">APAAR Generated</span>
            <span className="text-base font-black text-blue-900">{gen}</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Completion</span>
            <span className="text-base font-black text-slate-900">{completionPct}%</span>
          </div>
        </div>

        {/* Action & Student List */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-2">
            <span className="text-xs font-bold text-slate-800 uppercase">
              Student Enrolment Roster ({schoolStudents.length})
            </span>
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export School Roster
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="p-2.5">PEN</th>
                  <th className="p-2.5">Student Name</th>
                  <th className="p-2.5 text-center">Class</th>
                  <th className="p-2.5 text-center">Aadhaar Prov</th>
                  <th className="p-2.5 text-center">Aadhaar Ver</th>
                  <th className="p-2.5 text-center">APAAR</th>
                  <th className="p-2.5">Reason</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {schoolStudents.map(s => (
                  <tr
                    key={s.studentPen}
                    onClick={() => onSelectStudent(s)}
                    className="hover:bg-blue-50/60 transition cursor-pointer"
                  >
                    <td className="p-2.5 font-mono font-bold text-blue-900">{s.studentPen}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{s.studentName}</td>
                    <td className="p-2.5 text-center">{s.className}</td>
                    <td className="p-2.5 text-center"><StatusBadge status={s.isAadhaarProvided} /></td>
                    <td className="p-2.5 text-center"><StatusBadge status={s.isAadhaarVerified} /></td>
                    <td className="p-2.5 text-center"><StatusBadge status={s.apaarStatus} /></td>
                    <td className="p-2.5 text-slate-600 truncate max-w-[140px]">{s.pendingReason}</td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(s);
                        }}
                        className="px-2 py-0.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-800 rounded text-[11px] font-semibold transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 text-xs transition"
          >
            Close School View
          </button>
        </div>
      </div>
    </div>
  );
};
