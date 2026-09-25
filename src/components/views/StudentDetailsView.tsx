import React, { useState, useMemo } from 'react';
import { Student } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  User,
  School,
  ShieldCheck,
  Award,
  CheckCircle,
  XCircle,
  X,
  Edit3,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { exportToExcel, exportToCSV, exportStudentsPDF } from '../../lib/export';

interface StudentDetailsViewProps {
  students: Student[];
  onUpdateStudent?: (studentPen: string, updates: Partial<Student>) => Promise<void>;
  initialPenSearch?: string;
}

export const StudentDetailsView: React.FC<StudentDetailsViewProps> = ({
  students,
  onUpdateStudent,
  initialPenSearch = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(initialPenSearch);
  const [blockFilter, setBlockFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [aadhaarProvidedFilter, setAadhaarProvidedFilter] = useState('');
  const [aadhaarVerifiedFilter, setAadhaarVerifiedFilter] = useState('');
  const [apaarStatusFilter, setApaarStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<keyof Student>('studentName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAadhaarVerified, setEditAadhaarVerified] = useState<'YES' | 'NO'>('NO');
  const [editApaarStatus, setEditApaarStatus] = useState<'Generated' | 'Pending'>('Pending');
  const [editApaarId, setEditApaarId] = useState('');
  const [editReason, setEditReason] = useState('Not Applied');
  const [isSaving, setIsSaving] = useState(false);

  // Extract filter options
  const blocks = useMemo(() => Array.from(new Set(students.map(s => s.blockName))).sort(), [students]);
  const classes = useMemo(() => Array.from(new Set(students.map(s => s.className))).sort(), [students]);
  const reasons = useMemo(() => Array.from(new Set(students.map(s => s.pendingReason))).sort(), [students]);

  // Filtering
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch =
        !searchTerm ||
        s.studentPen.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        s.schoolName.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchBlock = !blockFilter || s.blockName.toUpperCase() === blockFilter.toUpperCase();
      const matchClass = !classFilter || s.className === classFilter;
      const matchProv = !aadhaarProvidedFilter || s.isAadhaarProvided === aadhaarProvidedFilter;
      const matchVer = !aadhaarVerifiedFilter || s.isAadhaarVerified === aadhaarVerifiedFilter;
      const matchApaar = !apaarStatusFilter || s.apaarStatus === apaarStatusFilter;
      const matchReason = !reasonFilter || s.pendingReason === reasonFilter;

      return matchSearch && matchBlock && matchClass && matchProv && matchVer && matchApaar && matchReason;
    });
  }, [
    students,
    searchTerm,
    blockFilter,
    classFilter,
    aadhaarProvidedFilter,
    aadhaarVerifiedFilter,
    apaarStatusFilter,
    reasonFilter
  ]);

  // Sorting
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as any) - (bVal as any) : (bVal as any) - (aVal as any);
    });
  }, [filteredStudents, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage, pageSize]);

  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleOpenStudentModal = (student: Student) => {
    setSelectedStudent(student);
    setEditAadhaarVerified(student.isAadhaarVerified);
    setEditApaarStatus(student.apaarStatus);
    setEditApaarId(student.apaarId || '');
    setEditReason(student.pendingReason || 'Not Applied');
    setIsEditing(false);
  };

  const handleSaveStudentUpdate = async () => {
    if (!selectedStudent || !onUpdateStudent) return;
    setIsSaving(true);
    try {
      const updates: Partial<Student> = {
        isAadhaarVerified: editAadhaarVerified,
        apaarStatus: editApaarStatus,
        apaarId: editApaarStatus === 'Generated' ? (editApaarId.trim() || undefined) : undefined,
        pendingReason: editApaarStatus === 'Generated' ? 'Completed' : editReason,
        updatedAt: new Date().toISOString()
      };
      await onUpdateStudent(selectedStudent.studentPen, updates);
      setSelectedStudent({ ...selectedStudent, ...updates });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    if (format === 'pdf') {
      exportStudentsPDF(sortedStudents, 'Dantewada_Student_Roster');
    } else {
      const exportData = sortedStudents.map(s => ({
        'Student PEN': s.studentPen,
        'Student Name': s.studentName,
        'Class': s.className,
        'Section': s.section,
        'Block Name': s.blockName,
        'School Name': s.schoolName,
        'UDISE Code': s.udiseCode,
        'Aadhaar Provided': s.isAadhaarProvided,
        'Aadhaar Verified': s.isAadhaarVerified,
        'APAAR Status': s.apaarStatus,
        'APAAR ID': s.apaarId || '',
        'Reason for Not Generated': s.pendingReason
      }));

      if (format === 'excel') {
        exportToExcel(exportData, `APAAR_Students_Dantewada_${new Date().toISOString().slice(0, 10)}`);
      } else {
        exportToCSV(exportData, `APAAR_Students_Dantewada_${new Date().toISOString().slice(0, 10)}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-900">Student-Level Master Roster</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authorized student tracking and verification records from Dantewada School Education Dept
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('excel')}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              PDF Roster
            </button>
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by PEN (11-digit) or Student Name..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-md border border-slate-300 pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Block */}
          <div>
            <select
              value={blockFilter}
              onChange={e => {
                setBlockFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Blocks</option>
              {blocks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <select
              value={classFilter}
              onChange={e => {
                setClassFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Aadhaar Verified */}
          <div>
            <select
              value={aadhaarVerifiedFilter}
              onChange={e => {
                setAadhaarVerifiedFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            >
              <option value="">Aadhaar Verified: All</option>
              <option value="YES">Verified (YES)</option>
              <option value="NO">Not Verified (NO)</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <select
              value={reasonFilter}
              onChange={e => {
                setReasonFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Reasons</option>
              {reasons.map(r => (
                <option key={r} value={r}>
                  {r.length > 20 ? r.slice(0, 20) + '...' : r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter and Page Size */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <span>Found {filteredStudents.length.toLocaleString()} students matching criteria</span>
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs border border-slate-300 rounded px-1.5 py-1 bg-white"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                <th
                  onClick={() => handleSort('studentPen')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="flex items-center gap-1">
                    <span>Student PEN</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('studentName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="flex items-center gap-1">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('className')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Class</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('blockName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="flex items-center gap-1">
                    <span>Block</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('schoolName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="flex items-center gap-1">
                    <span>School Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Aadhaar Prov</th>
                <th className="py-3 px-3 text-center">Aadhaar Ver</th>
                <th className="py-3 px-3 text-center">APAAR Status</th>
                <th className="py-3 px-3">Pending Reason</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedStudents.map(s => (
                <tr
                  key={s.studentPen}
                  onClick={() => handleOpenStudentModal(s)}
                  className="hover:bg-blue-50/60 transition cursor-pointer group"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-900 group-hover:text-blue-700">
                    {s.studentPen}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {s.studentName}
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {s.className} {s.section ? `(${s.section})` : ''}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">
                    {s.blockName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs" title={s.schoolName}>
                    {s.schoolName}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <StatusBadge status={s.isAadhaarProvided} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <StatusBadge status={s.isAadhaarVerified} />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <StatusBadge status={s.apaarStatus} />
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                    <span className="truncate max-w-[160px] inline-block" title={s.pendingReason}>
                      {s.pendingReason}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStudentModal(s);
                      }}
                      className="px-2 py-0.5 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-800 rounded text-[11px] font-semibold transition"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedStudents.length)} of {sortedStudents.length.toLocaleString()} students
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Student Detail Modal / Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-800 rounded-lg">
                  <User className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedStudent.studentName}</h3>
                  <p className="text-xs text-slate-300 font-mono">
                    PEN: {selectedStudent.studentPen} | UDISE: {selectedStudent.udiseCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Info Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Class & Section</span>
                  <span className="font-bold text-slate-800">{selectedStudent.className}{selectedStudent.section ? ` (${selectedStudent.section})` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Block</span>
                  <span className="font-bold text-slate-800">{selectedStudent.blockName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Aadhaar Provided</span>
                  <StatusBadge status={selectedStudent.isAadhaarProvided} />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Aadhaar Verified</span>
                  <StatusBadge status={selectedStudent.isAadhaarVerified} />
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">School Name</span>
                  <span className="font-semibold text-slate-900 text-right">{selectedStudent.schoolName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">UDISE School Code</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedStudent.udiseCode}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">School Management Code</span>
                  <span className="font-semibold text-slate-900">{selectedStudent.schoolManagement ? String(selectedStudent.schoolManagement) : '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">School Category Code</span>
                  <span className="font-semibold text-slate-900">{selectedStudent.schoolCategory ? String(selectedStudent.schoolCategory) : '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Current APAAR Status</span>
                  <StatusBadge status={selectedStudent.apaarStatus} />
                </div>
                {selectedStudent.apaarId && (
                  <div className="flex justify-between py-2 border-b border-slate-100 bg-emerald-50 px-2 rounded">
                    <span className="text-emerald-800 font-bold">APAAR ID</span>
                    <span className="font-mono font-black text-emerald-900">{selectedStudent.apaarId}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Reason for Not Generated</span>
                  <span className="font-bold text-orange-800">{selectedStudent.pendingReason}</span>
                </div>
              </div>

              {/* Edit / Quick Status Update Section */}
              <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                    Authorized Status Modification / Verification
                  </h4>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-blue-700 font-semibold hover:underline"
                    >
                      Update Record
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Aadhaar Verified Status
                        </label>
                        <select
                          value={editAadhaarVerified}
                          onChange={e => setEditAadhaarVerified(e.target.value as any)}
                          className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                        >
                          <option value="YES">YES - Verified</option>
                          <option value="NO">NO - Unverified</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          APAAR Status
                        </label>
                        <select
                          value={editApaarStatus}
                          onChange={e => setEditApaarStatus(e.target.value as any)}
                          className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Generated">Generated (Success)</option>
                        </select>
                      </div>
                    </div>

                    {editApaarStatus === 'Pending' ? (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Pending Reason
                        </label>
                        <select
                          value={editReason}
                          onChange={e => setEditReason(e.target.value)}
                          className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                        >
                          <option value="Not Applied">Not Applied</option>
                          <option value="Mobile Account Limit Exceeded">Mobile Account Limit Exceeded</option>
                          <option value="Aadhaar Data Mismatch">Aadhaar Data Mismatch</option>
                          <option value="Invalid Mobile Number">Invalid Mobile Number</option>
                          <option value="Consent Date Older Than 30 Days">Consent Date Older Than 30 Days</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          APAAR ID (12 digits)
                        </label>
                        <input
                          type="text"
                          placeholder="Auto-generated if empty"
                          value={editApaarId}
                          onChange={e => setEditApaarId(e.target.value)}
                          className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-mono"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-semibold hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveStudentUpdate}
                        disabled={isSaving}
                        className="px-3.5 py-1.5 bg-blue-700 text-white rounded text-xs font-semibold hover:bg-blue-800 disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save & Log Audit'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600">
                    Officers can record Aadhaar biometric verification or APAAR ID generation directly into the system. All modifications are logged in the audit trail.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Official Record: State {selectedStudent.stateName || 'CHHATTISGARH'} | District {selectedStudent.districtName || 'DANTEWADA'}
              </span>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
