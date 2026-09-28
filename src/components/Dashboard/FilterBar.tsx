import React, { useMemo } from 'react';
import { useStudents } from '../../context/StudentContext';
import { Filter, RotateCcw } from 'lucide-react';
import { SURVEY_STATUS_OPTIONS } from '../../types/student';

export const FilterBar: React.FC = () => {
  const { students, activeFilters, setActiveFilters, resetFilters, currentUser } = useStudents();
  const isSchoolUser = currentUser?.role === 'SCHOOL_USER';

  // Extract distinct lists dynamically
  const blocks = useMemo(() => {
    if (isSchoolUser && currentUser?.blockName) {
      return [currentUser.blockName.toUpperCase()];
    }
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.block_name) set.add(s.block_name.toUpperCase());
    });
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
    students.forEach((s) => {
      if (s.class_name) set.add(s.class_name);
    });
    return Array.from(set).sort();
  }, [students]);

  const isFiltered = Boolean(
    (!isSchoolUser && (activeFilters.block || activeFilters.sankul || activeFilters.school)) ||
    activeFilters.className ||
    activeFilters.surveyStatus
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-2xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-blue-700" />
          <span>
            {isSchoolUser ? 'School Data Filters (कक्षा व स्थिति फ़िल्टर)' : 'Dashboard Filters (फ़िल्टर करें)'}
          </span>
          {isFiltered && (
            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Active
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className="flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-800 font-medium self-start lg:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
        {/* Block Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Block (ब्लॉक)
          </label>
          <select
            value={isSchoolUser ? currentUser?.blockName || '' : activeFilters.block}
            disabled={isSchoolUser}
            onChange={(e) => setActiveFilters((prev) => ({ ...prev, block: e.target.value, sankul: '', school: '' }))}
            className={`w-full text-xs border rounded-md py-1.5 px-2.5 ${
              isSchoolUser
                ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white'
            }`}
          >
            {isSchoolUser ? (
              <option value={currentUser?.blockName || ''}>{currentUser?.blockName || 'Assigned Block'}</option>
            ) : (
              <>
                <option value="">All Blocks (सभी ब्लॉक)</option>
                {blocks.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Cluster Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Cluster (संकुल)
          </label>
          <select
            value={isSchoolUser ? currentUser?.clusterName || '' : activeFilters.sankul}
            disabled={isSchoolUser}
            onChange={(e) => setActiveFilters((prev) => ({ ...prev, sankul: e.target.value, school: '' }))}
            className={`w-full text-xs border rounded-md py-1.5 px-2.5 ${
              isSchoolUser
                ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white'
            }`}
          >
            {isSchoolUser ? (
              <option value={currentUser?.clusterName || ''}>{currentUser?.clusterName || 'Assigned Cluster'}</option>
            ) : (
              <>
                <option value="">All Clusters ({sankuls.length})</option>
                {sankuls.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* School Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            School (स्कूल)
          </label>
          <select
            value={isSchoolUser ? currentUser?.schoolName || '' : activeFilters.school}
            disabled={isSchoolUser}
            onChange={(e) => setActiveFilters((prev) => ({ ...prev, school: e.target.value }))}
            className={`w-full text-xs border rounded-md py-1.5 px-2.5 ${
              isSchoolUser
                ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed font-medium truncate'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white'
            }`}
          >
            {isSchoolUser ? (
              <option value={currentUser?.schoolName || ''}>{currentUser?.schoolName || 'Assigned School'}</option>
            ) : (
              <>
                <option value="">All Schools ({schools.length})</option>
                {schools.map((sc) => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </>
            )}
          </select>
        </div>

        {/* Class Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Class (कक्षा)
          </label>
          <select
            value={activeFilters.className}
            onChange={(e) => setActiveFilters((prev) => ({ ...prev, className: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md py-1.5 px-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
          >
            <option value="">All Classes ({classes.length})</option>
            {classes.map((c) => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
        </div>

        {/* Survey Status Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-600 mb-1">
            Survey Status (स्थिति)
          </label>
          <select
            value={activeFilters.surveyStatus}
            onChange={(e) => setActiveFilters((prev) => ({ ...prev, surveyStatus: e.target.value }))}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md py-1.5 px-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
          >
            <option value="">All Statuses</option>
            {SURVEY_STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
