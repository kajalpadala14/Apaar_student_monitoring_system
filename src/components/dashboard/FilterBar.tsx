import React, { useState } from 'react';
import { FilterState } from '../../types';
import { Filter, RotateCcw, Download, ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  onResetFilter: () => void;
  onExport: (format: 'excel' | 'csv' | 'pdf') => void;
  availableBlocks: string[];
  availableSchools: { udise: string; name: string; block: string }[];
  availableClasses: string[];
  availableReasons: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  onResetFilter,
  onExport,
  availableBlocks,
  availableSchools,
  availableClasses,
  availableReasons
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilter, setLocalFilter] = useState<FilterState>({ ...filter });

  const filteredSchools = localFilter.block
    ? availableSchools.filter(s => s.block.toUpperCase() === localFilter.block.toUpperCase())
    : availableSchools;

  const handleApply = () => {
    onFilterChange(localFilter);
  };

  const handleReset = () => {
    const emptyFilter: FilterState = {
      block: '',
      school: '',
      udiseCode: '',
      className: '',
      aadhaarProvided: '',
      aadhaarVerified: '',
      apaarStatus: '',
      pendingReason: '',
      searchTerm: ''
    };
    setLocalFilter(emptyFilter);
    onResetFilter();
  };

  // Count active filters
  const activeCount = [
    localFilter.block,
    localFilter.school,
    localFilter.udiseCode,
    localFilter.className,
    localFilter.aadhaarProvided,
    localFilter.aadhaarVerified,
    localFilter.apaarStatus,
    localFilter.pendingReason,
    localFilter.searchTerm
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs mb-6">
      {/* Primary Clean Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by PEN (11-digit) or Student Name..."
            value={localFilter.searchTerm}
            onChange={e => setLocalFilter({ ...localFilter, searchTerm: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter') handleApply();
            }}
            className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        {/* Block */}
        <div className="w-full sm:w-44">
          <select
            value={localFilter.block}
            onChange={e => setLocalFilter({ ...localFilter, block: e.target.value, school: '' })}
            className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-600 focus:bg-white transition"
          >
            <option value="">All Blocks</option>
            {availableBlocks.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* School */}
        <div className="w-full sm:w-60">
          <select
            value={localFilter.school}
            onChange={e => {
              const selectedSchool = filteredSchools.find(s => s.name === e.target.value);
              setLocalFilter({
                ...localFilter,
                school: e.target.value,
                udiseCode: selectedSchool ? selectedSchool.udise : localFilter.udiseCode
              });
            }}
            className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:outline-hidden focus:border-blue-600 focus:bg-white transition"
          >
            <option value="">All Schools ({filteredSchools.length})</option>
            {filteredSchools.slice(0, 300).map(s => (
              <option key={s.udise} value={s.name}>
                {s.name.length > 25 ? s.name.slice(0, 25) + '...' : s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
              showAdvanced || activeCount > 2
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>More Filters</span>
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleApply}
            className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            Apply
          </button>

          {activeCount > 0 && (
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {isExportOpen && (
              <div
                className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30"
                onMouseLeave={() => setIsExportOpen(false)}
              >
                <button
                  onClick={() => {
                    setIsExportOpen(false);
                    onExport('excel');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Excel (.xlsx)</span>
                  <span className="text-[10px] text-emerald-600 font-bold">XLSX</span>
                </button>
                <button
                  onClick={() => {
                    setIsExportOpen(false);
                    onExport('csv');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>CSV (.csv)</span>
                  <span className="text-[10px] text-blue-600 font-bold">CSV</span>
                </button>
                <button
                  onClick={() => {
                    setIsExportOpen(false);
                    onExport('pdf');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between border-t border-slate-100"
                >
                  <span>Official PDF</span>
                  <span className="text-[10px] text-rose-600 font-bold">PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Advanced Filters Row */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-4 mt-3 border-t border-slate-100 animate-in fade-in duration-150">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Class</label>
            <select
              value={localFilter.className}
              onChange={e => setLocalFilter({ ...localFilter, className: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600"
            >
              <option value="">All Classes</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Aadhaar Provided</label>
            <select
              value={localFilter.aadhaarProvided}
              onChange={e => setLocalFilter({ ...localFilter, aadhaarProvided: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600"
            >
              <option value="">All</option>
              <option value="YES">YES (Provided)</option>
              <option value="NO">NO (Not Provided)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Aadhaar Verified</label>
            <select
              value={localFilter.aadhaarVerified}
              onChange={e => setLocalFilter({ ...localFilter, aadhaarVerified: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600"
            >
              <option value="">All</option>
              <option value="YES">YES (Verified)</option>
              <option value="NO">NO (Not Verified)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">APAAR Status</label>
            <select
              value={localFilter.apaarStatus}
              onChange={e => setLocalFilter({ ...localFilter, apaarStatus: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600"
            >
              <option value="">All</option>
              <option value="Generated">Generated</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Pending Reason</label>
            <select
              value={localFilter.pendingReason}
              onChange={e => setLocalFilter({ ...localFilter, pendingReason: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:border-blue-600"
            >
              <option value="">All Reasons</option>
              {availableReasons.map(r => (
                <option key={r} value={r}>
                  {r.length > 22 ? r.slice(0, 22) + '...' : r}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
