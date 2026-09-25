import React, { useState, useMemo } from 'react';
import { SchoolSummary } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Download, School, Eye, AlertTriangle } from 'lucide-react';
import { exportToExcel, exportToCSV } from '../../lib/export';

interface SchoolWiseViewProps {
  schools: SchoolSummary[];
  onSelectSchool: (udiseCode: string, schoolName: string) => void;
  initialBlockFilter?: string;
}

export const SchoolWiseView: React.FC<SchoolWiseViewProps> = ({
  schools,
  onSelectSchool,
  initialBlockFilter = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [blockFilter, setBlockFilter] = useState(initialBlockFilter);
  const [sortField, setSortField] = useState<keyof SchoolSummary>('totalStudents');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const blocks = useMemo(() => {
    return Array.from(new Set(schools.map(s => s.blockName))).sort();
  }, [schools]);

  // Filtering
  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      const matchBlock = !blockFilter || s.blockName.toUpperCase() === blockFilter.toUpperCase();
      const matchSearch =
        !searchTerm ||
        s.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.udiseCode.includes(searchTerm);
      return matchBlock && matchSearch;
    });
  }, [schools, blockFilter, searchTerm]);

  // Sorting
  const sortedSchools = useMemo(() => {
    return [...filteredSchools].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [filteredSchools, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedSchools.length / pageSize) || 1;
  const paginatedSchools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSchools.slice(start, start + pageSize);
  }, [sortedSchools, currentPage, pageSize]);

  const handleSort = (field: keyof SchoolSummary) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = (format: 'excel' | 'csv') => {
    const exportData = sortedSchools.map(s => ({
      'Block Name': s.blockName,
      'School Name': s.schoolName,
      'UDISE Code': s.udiseCode,
      'Total Students': s.totalStudents,
      'Aadhaar Provided': s.aadhaarProvided,
      'Aadhaar Verified': s.aadhaarVerified,
      'APAAR Generated': s.apaarGenerated,
      'APAAR Pending': s.apaarPending,
      'Completion %': `${s.completionPct}%`,
      'Status': s.status
    }));

    if (format === 'excel') {
      exportToExcel(exportData, `School_Monitoring_Report_${new Date().toISOString().slice(0, 10)}`);
    } else {
      exportToCSV(exportData, `School_Monitoring_Report_${new Date().toISOString().slice(0, 10)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-900">School-wise Monitoring & Performance</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Monitoring {schools.length} schools across all active blocks
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
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search school name or UDISE code..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-md border border-slate-300 pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <select
              value={blockFilter}
              onChange={e => {
                setBlockFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Blocks ({blocks.length})</option>
              {blocks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Showing {sortedSchools.length} of {schools.length} schools</span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
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
      </div>

      {/* School Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
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
                <th
                  onClick={() => handleSort('udiseCode')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>UDISE Code</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalStudents')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Students</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('aadhaarProvided')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Aadhaar Prov</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('aadhaarVerified')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Aadhaar Ver</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('apaarGenerated')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>APAAR Gen</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('apaarPending')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>APAAR Pend</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('completionPct')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Completion %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedSchools.map(s => {
                const isCritical = s.status === 'RED' && s.totalStudents >= 15;
                return (
                  <tr
                    key={s.udiseCode || s.schoolName}
                    onClick={() => onSelectSchool(s.udiseCode, s.schoolName)}
                    className={`hover:bg-blue-50/60 transition cursor-pointer group ${
                      isCritical ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {s.blockName}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 group-hover:text-blue-700">
                      <div className="flex items-center gap-1.5">
                        {isCritical && (
                          <span title="Low completion rate">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          </span>
                        )}
                        <span className="truncate max-w-xs">{s.schoolName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-center text-slate-600">
                      {s.udiseCode || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {s.totalStudents}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-800 font-semibold">
                      {s.aadhaarProvided}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-800 font-semibold">
                      {s.aadhaarVerified}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 font-bold">
                      {s.apaarGenerated}
                    </td>
                    <td className="py-2.5 px-3 text-right text-orange-700 font-bold">
                      {s.apaarPending}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span>{s.completionPct}%</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSchool(s.udiseCode, s.schoolName);
                        }}
                        className="px-2 py-1 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedSchools.length)} of {sortedSchools.length} schools
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
    </div>
  );
};
