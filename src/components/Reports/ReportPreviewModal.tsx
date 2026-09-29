import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Eye,
  Search,
  CheckCircle2,
} from 'lucide-react';

export interface ReportPreviewData {
  title: string;
  format: 'excel' | 'pdf';
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  totalRecords?: number;
  sheetName?: string;
  onDownload: () => void;
}

interface ReportPreviewModalProps {
  data: ReportPreviewData | null;
  onClose: () => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  data,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setSearchTerm('');
    setIsDownloaded(false);
  }, [data]);

  if (!data) return null;

  const isExcel = data.format === 'excel';
  const totalCount = data.totalRecords || data.rows.length;

  const filteredRows = searchTerm.trim()
    ? data.rows.filter((row) =>
        row.some((cell) =>
          String(cell).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data.rows;

  // Show up to 50 rows in preview for smooth rendering
  const previewLimit = 50;
  const displayedRows = filteredRows.slice(0, previewLimit);

  const handleDownload = () => {
    data.onDownload();
    setIsDownloaded(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-none sm:rounded-xl shadow-2xl border-0 sm:border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col h-full sm:h-auto sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between shrink-0 text-white ${
            isExcel ? 'bg-emerald-900' : 'bg-slate-900'
          }`}
        >
          <div className="flex items-center space-x-2.5 sm:space-x-3 truncate mr-2">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isExcel
                  ? 'bg-emerald-800 text-emerald-200'
                  : 'bg-slate-800 text-blue-300'
              }`}
            >
              {isExcel ? (
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center">
                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
                  <span className="truncate">
                    {isExcel ? 'Excel Spreadsheet Preview' : 'PDF Document Preview'}
                  </span>
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-[10px] sm:text-[11px] bg-white/10 px-1.5 py-0.2 rounded font-mono">
                  .{isExcel ? 'xlsx' : 'pdf'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white mt-0.5 truncate">
                {data.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer shrink-0"
            title="बंद करें (Close Preview)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-bar: Search, Record count, Download Button */}
        <div className="bg-slate-50 border-b border-slate-200 px-3.5 sm:px-5 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-slate-600 flex-wrap">
            <span className="font-semibold text-slate-800">
              कुल रिकॉर्ड (Total Records):{' '}
              <strong className="text-slate-900 font-bold">{totalCount}</strong>
            </span>
            <span>&bull;</span>
            <span className="text-slate-500 text-[11px] sm:text-xs">
              जिला दंतेवाड़ा &bull; {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Quick search inside preview */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="प्रिव्यू में खोजें..."
                className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 w-full focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Document Printable Header (for PDF preview feel) */}
        {!isExcel && (
          <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 text-center space-y-0.5">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
              स्कूल शिक्षा विभाग, छत्तीसगढ़ शासन &bull; DISTRICT ADMINISTRATION DANTEWADA
            </div>
            <div className="text-sm font-bold text-slate-900 uppercase">
              {data.title}
            </div>
            <div className="text-[10px] text-slate-500">
              Generated: {new Date().toLocaleString('en-IN')} &bull; Status: Official Survey Record
            </div>
          </div>
        )}

        {/* Table Preview Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-5 text-xs">
          {displayedRows.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="font-medium text-slate-600">कोई डेटा मेल नहीं खाता (No matching data)</p>
              <p className="text-xs mt-1">खोज शब्द बदलें या रीसेट करें।</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-300 text-slate-700 font-bold z-10">
                  <tr>
                    {data.headers.map((h, i) => (
                      <th
                        key={i}
                        className="py-2.5 px-3 whitespace-nowrap border-r border-slate-200 last:border-r-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={
                        rIdx % 2 === 0
                          ? 'bg-white hover:bg-slate-50/80'
                          : 'bg-slate-50/50 hover:bg-slate-50'
                      }
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="py-2 px-3 border-r border-slate-100 last:border-r-0 whitespace-nowrap text-slate-800"
                        >
                          {cell !== null && cell !== undefined ? String(cell) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Row limit disclaimer */}
          {filteredRows.length > previewLimit && (
            <div className="mt-3 text-center text-[11px] text-slate-500 bg-slate-50 border border-slate-200 p-2 rounded-lg">
              Showing preview of first <strong>{previewLimit}</strong> records.{' '}
              डाउनलोड करने पर सभी <strong>{totalCount}</strong> रिकॉर्ड फ़ाइल में उपलब्ध होंगे।
            </div>
          )}
        </div>

        {/* Footer with Sheet Info & Action Buttons */}
        <div className="bg-slate-50 border-t border-slate-200 px-3.5 sm:px-5 py-2.5 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-600 flex-wrap gap-y-1">
            {isExcel ? (
              <span className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono text-[11px] border border-emerald-200">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sheet: {data.sheetName || 'Sheet1'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono text-[11px] border border-blue-200">
                <FileText className="w-3.5 h-3.5" />
                <span>Format: PDF Auto-Table Landscape</span>
              </span>
            )}
            <span className="text-slate-400 hidden xs:inline">|</span>
            <span className="text-[11px] text-slate-500 font-mono truncate max-w-[200px] sm:max-w-none">
              {data.filename}.{isExcel ? 'xlsx' : 'pdf'}
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none text-xs font-semibold text-slate-600 hover:text-slate-800 px-3.5 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-center"
            >
              रद्द करें (Cancel)
            </button>

            <button
              onClick={handleDownload}
              className={`flex-1 sm:flex-none text-xs font-bold text-white px-4 py-2 rounded-lg shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                isDownloaded
                  ? 'bg-emerald-600'
                  : isExcel
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {isDownloaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 animate-in zoom-in" />
                  <span>डाउनलोड हो गया (Downloaded)</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {isExcel ? 'Excel डाउनलोड करें (.xlsx)' : 'PDF डाउनलोड करें (.pdf)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
