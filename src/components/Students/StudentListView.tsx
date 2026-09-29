import React, { useState, useMemo } from 'react';
import { useStudents } from '../../context/StudentContext';
import { Student } from '../../types/student';
import { StudentDetailModal } from './StudentDetailModal';
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight, ClipboardCheck, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { SURVEY_REASONS, SURVEY_STATUS_OPTIONS } from '../../types/student';

export const StudentListView: React.FC = () => {
  const {
    students,
    filteredStudents,
    activeFilters,
    setActiveFilters,
    resetFilters,
    currentUser,
  } = useStudents();

  const [inspectStudent, setInspectStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<keyof Student>('student_name_marksheet');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const isSchoolUser = currentUser?.role === 'SCHOOL_USER';

  // Dynamic filter options
  const blocks = useMemo(() => {
    if (isSchoolUser && currentUser?.blockName) {
      return [currentUser.blockName.toUpperCase()];
    }
    const set = new Set<string>();
    students.forEach((s) => s.block_name && set.add(s.block_name.toUpperCase()));
    return Array.from(set).sort();
  }, [students, isSchoolUser, currentUser]);

  const sankuls = useMemo(() => {
    if (isSchoolUser && currentUser?.clusterName) {
      return [currentUser.clusterName];
    }
    const set = new Set<string>();
    students.forEach((s) => {
      if (activeFilters.block && s.block_name.toUpperCase() !== activeFilters.block.toUpperCase()) return;
      if (s.sankul_name) set.add(s.sankul_name);
    });
    return Array.from(set).sort();
  }, [students, activeFilters.block, isSchoolUser, currentUser]);

  const schools = useMemo(() => {
    if (isSchoolUser && currentUser?.schoolName) {
      return [currentUser.schoolName];
    }
    const set = new Set<string>();
    students.forEach((s) => {
      if (activeFilters.block && s.block_name.toUpperCase() !== activeFilters.block.toUpperCase()) return;
      if (activeFilters.sankul && s.sankul_name !== activeFilters.sankul) return;
      if (s.school_name) set.add(s.school_name);
    });
    return Array.from(set).sort();
  }, [students, activeFilters.block, activeFilters.sankul, isSchoolUser, currentUser]);

  const classes = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.class_name && set.add(s.class_name));
    return Array.from(set).sort();
  }, [students]);

  // Handle Sort
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();
      if (sortOrder === 'asc') return valA.localeCompare(valB, undefined, { numeric: true });
      return valB.localeCompare(valA, undefined, { numeric: true });
    });
  }, [filteredStudents, sortField, sortOrder]);

  const toggleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedStudents = sortedStudents.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isSchoolUser ? 'School Students List (विद्यार्थी सूची)' : 'Students Master List (विद्यार्थी सूची)'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSchoolUser ? (
              <span>Showing {filteredStudents.length.toLocaleString('en-IN')} of {students.length.toLocaleString('en-IN')} students ({currentUser?.schoolName})</span>
            ) : (
              <span>Showing {filteredStudents.length.toLocaleString('en-IN')} of {students.length.toLocaleString('en-IN')} students</span>
            )}
          </p>
        </div>

        {/* Quick Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="नाम, PEN, स्कूल या UDISE Code खोजें..."
            value={activeFilters.searchQuery}
            onChange={(e) => {
              setActiveFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
          />
          {activeFilters.searchQuery && (
            <button
              onClick={() => setActiveFilters((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Quick Status Filter Tabs (Only Pending, Completed, All) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
        <button
          onClick={() => {
            setActiveFilters((prev) => ({ ...prev, surveyStatus: '' }));
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
            activeFilters.surveyStatus === '' 
              ? 'bg-blue-900 text-white border-blue-900 shadow-2xs' 
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          All Students (सभी: {students.length.toLocaleString('en-IN')})
        </button>

        <button
          onClick={() => {
            setActiveFilters((prev) => ({ ...prev, surveyStatus: 'PENDING' }));
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
            activeFilters.surveyStatus === 'PENDING'
              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs ring-2 ring-amber-300' 
              : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
          }`}
        >
          <span>⏳ केवल लंबित छात्र (Pending)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeFilters.surveyStatus === 'PENDING' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-900'
          }`}>
            {students.filter(s => s.survey_status === 'PENDING').length.toLocaleString('en-IN')}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveFilters((prev) => ({ ...prev, surveyStatus: 'SURVEY COMPLETED' }));
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
            activeFilters.surveyStatus === 'SURVEY COMPLETED'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs' 
              : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          <span>✓ सर्वे पूर्ण (Completed)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeFilters.surveyStatus === 'SURVEY COMPLETED' ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-100 text-emerald-900'
          }`}>
            {students.filter(s => s.survey_status === 'SURVEY COMPLETED').length.toLocaleString('en-IN')}
          </span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-200 rounded-lg p-2.5 sm:p-3 shadow-2xs">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-700" />
            <span>फ़िल्टर विकल्प (Filters)</span>
            {[
              !isSchoolUser && activeFilters.block,
              !isSchoolUser && activeFilters.sankul,
              !isSchoolUser && activeFilters.school,
              activeFilters.className,
              activeFilters.surveyStatus,
              activeFilters.reason,
            ].filter(Boolean).length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {[
                  !isSchoolUser && activeFilters.block,
                  !isSchoolUser && activeFilters.sankul,
                  !isSchoolUser && activeFilters.school,
                  activeFilters.className,
                  activeFilters.surveyStatus,
                  activeFilters.reason,
                ].filter(Boolean).length} Active
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {[
              activeFilters.block,
              activeFilters.sankul,
              activeFilters.school,
              activeFilters.className,
              activeFilters.surveyStatus,
              activeFilters.reason,
            ].filter(Boolean).length > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1 cursor-pointer"
                title="फ़िल्टर रीसेट करें"
              >
                <RotateCcw className="w-3 h-3" />
                <span>रीसेट</span>
              </button>
            )}
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="sm:hidden text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold px-2 py-0.5 rounded border border-blue-200 flex items-center space-x-1 cursor-pointer"
            >
              <span>{isMobileFiltersOpen ? 'छिपाएँ' : 'फ़िल्टर'}</span>
              {isMobileFiltersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className={`${isMobileFiltersOpen ? 'grid' : 'hidden sm:grid'} grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs pt-1`}>
          
          {/* Block */}
          <div>
            <select
              value={isSchoolUser ? currentUser?.blockName || '' : activeFilters.block}
              disabled={isSchoolUser}
              onChange={(e) => {
                setActiveFilters((prev) => ({ ...prev, block: e.target.value, sankul: '', school: '' }));
                setCurrentPage(1);
              }}
              className={`w-full border rounded-md py-1.5 px-2 text-[11px] ${
                isSchoolUser
                  ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:bg-white'
              }`}
            >
              {isSchoolUser ? (
                <option value={currentUser?.blockName || ''}>{currentUser?.blockName}</option>
              ) : (
                <>
                  <option value="">Block (सभी ब्लॉक)</option>
                  {blocks.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Sankul */}
          <div>
            <select
              value={isSchoolUser ? currentUser?.clusterName || '' : activeFilters.sankul}
              disabled={isSchoolUser}
              onChange={(e) => {
                setActiveFilters((prev) => ({ ...prev, sankul: e.target.value, school: '' }));
                setCurrentPage(1);
              }}
              className={`w-full border rounded-md py-1.5 px-2 text-[11px] ${
                isSchoolUser
                  ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:bg-white'
              }`}
            >
              {isSchoolUser ? (
                <option value={currentUser?.clusterName || ''}>{currentUser?.clusterName}</option>
              ) : (
                <>
                  <option value="">Cluster (All Clusters)</option>
                  {sankuls.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* School */}
          <div>
            <select
              value={isSchoolUser ? currentUser?.schoolName || '' : activeFilters.school}
              disabled={isSchoolUser}
              onChange={(e) => {
                setActiveFilters((prev) => ({ ...prev, school: e.target.value }));
                setCurrentPage(1);
              }}
              className={`w-full border rounded-md py-1.5 px-2 text-[11px] truncate ${
                isSchoolUser
                  ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:bg-white'
              }`}
            >
              {isSchoolUser ? (
                <option value={currentUser?.schoolName || ''}>{currentUser?.schoolName}</option>
              ) : (
                <>
                  <option value="">School (सभी स्कूल)</option>
                  {schools.map((sc) => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Class */}
          <div>
            <select
              value={activeFilters.className}
              onChange={(e) => {
                setActiveFilters((prev) => ({ ...prev, className: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-md py-1.5 px-2 text-slate-800 focus:bg-white text-[11px]"
            >
              <option value="">Class (सभी कक्षाएं)</option>
              {classes.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          {/* Survey Status */}
          <div>
            <select
              value={activeFilters.surveyStatus}
              onChange={(e) => {
                setActiveFilters((prev) => ({ ...prev, surveyStatus: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-md py-1.5 px-2 text-slate-800 focus:bg-white text-[11px]"
            >
              <option value="">Status (सभी स्थिति)</option>
              {SURVEY_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <select
              value={activeFilters.reason}
              onChange={(e) => {
                setActiveFilters((prev) => ({ ...prev, reason: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-md py-1.5 px-2 text-slate-800 focus:bg-white text-[11px]"
            >
              <option value="">Reason (सभी कारण)</option>
              {SURVEY_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Main Table */}
      {/* Main Content: Mobile Cards (<640px) + Desktop Table (>=640px) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        
        {/* Mobile View: Touch Cards for phones */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {paginatedStudents.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs p-4">
              कोई छात्र वर्तमान खोज या फ़िल्टर से मेल नहीं खाता।
              <div className="mt-2">
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-700 font-semibold hover:underline cursor-pointer"
                >
                  सभी फ़िल्टर रीसेट करें
                </button>
              </div>
            </div>
          ) : (
            paginatedStudents.map((student, idx) => {
              const sNo = startIndex + idx + 1;
              const isCompleted = student.survey_status === 'SURVEY COMPLETED';
              const isPending = student.survey_status === 'PENDING';
              const isResolved = student.survey_status === 'RESOLVED';
              const isFollowUp = student.survey_status === 'FOLLOW-UP REQUIRED';

              const cardBorderColor = isCompleted
                ? 'border-l-4 border-l-emerald-500'
                : isPending
                ? 'border-l-4 border-l-amber-500'
                : isResolved
                ? 'border-l-4 border-l-blue-500'
                : isFollowUp
                ? 'border-l-4 border-l-purple-500'
                : 'border-l-4 border-l-slate-300';

              return (
                <div key={student.id} className={`p-3.5 space-y-2.5 hover:bg-slate-50 transition-colors ${cardBorderColor}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-mono">#{sNo}</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {student.student_name_marksheet}
                        </span>
                        {student.name_match_status && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                            student.name_match_status === 'Match'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border border-rose-300'
                          }`}>
                            {student.name_match_status}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        PEN: <strong className="text-slate-800 font-bold">{student.student_pen_number}</strong>
                      </p>
                    </div>

                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : isFollowUp
                        ? 'bg-purple-50 text-purple-700 border border-purple-300'
                        : isResolved
                        ? 'bg-blue-50 text-blue-700 border border-blue-300'
                        : isPending
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}>
                      {student.survey_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">स्कूल व कक्षा:</span>
                      <span className="text-slate-800 font-medium truncate block" title={student.school_name}>
                        {student.school_name} &bull; Class {student.class_name} ({student.section || 'A'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ब्लॉक व संकुल:</span>
                      <span className="text-slate-700 truncate block">
                        {student.block_name} &bull; {student.sankul_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">आधार उपलब्ध:</span>
                      <span className="text-slate-800 font-medium">
                        {student.is_aadhaar_provided || 'नहीं'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">लंबित कारण:</span>
                      <span className="text-amber-800 font-medium truncate block" title={student.apaar_pending_reason || '-'}>
                        {student.apaar_pending_reason || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-0.5">
                    <button
                      onClick={() => setInspectStudent(student)}
                      className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs py-2.5 px-3 rounded-lg transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.99]"
                    >
                      <ClipboardCheck className="w-4 h-4 text-blue-100" />
                      <span>सर्वेक्षण फॉर्म भरें / विवरण देखें</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Laptop / Large Screen Table (>=640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold select-none">
                <th className="py-2.5 px-3 w-12 text-center">S.No.</th>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('block_name')}>
                  <div className="flex items-center space-x-1">
                    <span>Block</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 whitespace-nowrap" onClick={() => toggleSort('sankul_name')}>
                  <div className="flex items-center space-x-1">
                    <span>CLUSTER NAME</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">School Name</th>
                <th className="py-2.5 px-2 text-center">Class</th>
                <th className="py-2.5 px-2 text-center">Sec</th>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleSort('student_name_marksheet')}>
                  <div className="flex items-center space-x-1">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Father Name</th>
                <th className="py-2.5 px-3 font-mono">PEN</th>
                <th className="py-2.5 px-2 text-center">Aadhaar Provided</th>
                <th className="py-2.5 px-2 text-center">Aadhaar Verified</th>
                <th className="py-2.5 px-3">Survey Status</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-500">
                    No students match the current filter and search criteria.
                    <div className="mt-2">
                      <button
                        onClick={resetFilters}
                        className="text-xs text-blue-700 font-semibold hover:underline"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student, idx) => {
                  const sNo = startIndex + idx + 1;
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {sNo}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                        {student.block_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[140px] truncate" title={student.sankul_name}>
                        {student.sankul_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 max-w-[200px] truncate" title={student.school_name}>
                        {student.school_name}
                      </td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-800">
                        {student.class_name}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500">
                        {student.section || 'A'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setInspectStudent(student)}
                            className="hover:text-blue-700 hover:underline text-left cursor-pointer"
                            title="Click to view complete student profile"
                          >
                            {student.student_name_marksheet}
                          </button>
                          {student.name_match_status && (
                            <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${
                              student.name_match_status === 'Match'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-rose-50 text-rose-700 border border-rose-300'
                            }`}>
                              {student.name_match_status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[130px] truncate" title={student.father_name || '-'}>
                        {student.father_name || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {student.student_pen_number}
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {student.is_aadhaar_provided ? (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            student.is_aadhaar_provided === 'YES' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-300'
                          }`}>
                            {student.is_aadhaar_provided}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {student.is_aadhaar_verified ? (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            student.is_aadhaar_verified === 'YES' ? 'bg-blue-50 text-blue-700 border border-blue-300' : 'bg-amber-50 text-amber-700 border border-amber-300'
                          }`}>
                            {student.is_aadhaar_verified}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          student.survey_status === 'SURVEY COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : student.survey_status === 'FOLLOW-UP REQUIRED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-300'
                            : student.survey_status === 'RESOLVED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}>
                          {student.survey_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[140px] truncate" title={student.apaar_pending_reason || '-'}>
                        {student.apaar_pending_reason || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setInspectStudent(student)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-[11px] px-2.5 py-1 rounded transition-colors border border-blue-200 inline-flex items-center space-x-1 cursor-pointer"
                          title="सर्वे / विवरण देखें"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5 text-blue-700" />
                          <span>सर्वे / विवरण</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-3.5 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600 text-[11px] sm:text-xs">
            <span>Showing</span>
            <span className="font-semibold text-slate-900">{filteredStudents.length > 0 ? startIndex + 1 : 0}</span>
            <span>to</span>
            <span className="font-semibold text-slate-900">{Math.min(startIndex + pageSize, filteredStudents.length)}</span>
            <span>of</span>
            <span className="font-semibold text-slate-900">{filteredStudents.length.toLocaleString('en-IN')}</span>
            <span>records</span>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-2.5 sm:space-x-3 w-full sm:w-auto">
            {/* Rows per page */}
            <div className="flex items-center space-x-1 text-slate-600 text-[11px] sm:text-xs">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs"
              >
                <option value={20}>20</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Page navigation */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                className="p-1 sm:p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 sm:px-2 font-medium text-slate-700 text-[11px] sm:text-xs">
                Page {validCurrentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className="p-1 sm:p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Inspect Student Profile & Survey Modal */}
      {inspectStudent && (() => {
        const currentIndex = sortedStudents.findIndex((s) => s.id === inspectStudent.id);
        const hasNext = currentIndex !== -1 && currentIndex < sortedStudents.length - 1;
        const hasPrev = currentIndex > 0;
        return (
          <StudentDetailModal
            student={inspectStudent}
            onClose={() => setInspectStudent(null)}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onNext={() => hasNext && setInspectStudent(sortedStudents[currentIndex + 1])}
            onPrev={() => hasPrev && setInspectStudent(sortedStudents[currentIndex - 1])}
          />
        );
      })()}

    </div>
  );
};
