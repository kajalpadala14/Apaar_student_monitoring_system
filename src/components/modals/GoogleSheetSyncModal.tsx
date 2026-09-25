import React, { useState } from 'react';
import { X, FileSpreadsheet, RefreshCw, CheckCircle2, AlertCircle, Copy, ExternalLink } from 'lucide-react';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (scriptUrl: string) => Promise<{ success: boolean; total?: number; message?: string }>;
  currentUrl: string;
  lastSynced: string | null;
  onDisconnect: () => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  onSync,
  currentUrl,
  lastSynced,
  onDisconnect
}) => {
  const [url, setUrl] = useState(currentUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRunSync = async () => {
    if (!url.trim()) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await onSync(url.trim());
      if (res.success) {
        setSyncStatus({ success: true, message: `Successfully synced ${res.total?.toLocaleString()} records from Google Sheet!` });
      } else {
        setSyncStatus({ success: false, message: res.message || 'Failed to sync. Please verify Web App URL and permissions.' });
      }
    } catch (err: any) {
      setSyncStatus({ success: false, message: err.message || 'Network error connecting to Apps Script Web App.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyScriptCode = () => {
    const script = `// Paste this in Google Sheets -> Extensions -> Apps Script
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("APAAR Pending Status Report") || ss.getSheetByName("APAAR Pending Status Report (2)") || ss.getSheets()[0];
  var values = sheet.getDataRange().getValues();
  var startRow = (values.length > 2 && String(values[1][0]).indexOf('(') !== -1) ? 2 : 1;
  var headers = values[0].map(function(h) { return String(h).trim().toLowerCase(); });
  
  function findCol(keys) {
    for (var i = 0; i < headers.length; i++) {
      for (var k = 0; k < keys.length; k++) {
        if (headers[i].indexOf(keys[k].toLowerCase()) !== -1) return i;
      }
    }
    return -1;
  }
  
  var colBlock = findCol(['block name']);
  var colSchool = findCol(['school name']);
  var colUdise = findCol(['udise']);
  var colClass = findCol(['class']);
  var colPen = findCol(['student pen', 'pen']);
  var colName = findCol(['student name', 'name']);
  var colProv = findCol(['provided']);
  var colVer = findCol(['verified']);
  var colReason = findCol(['reason']);
  var colStatus = findCol(['status']);

  var students = [];
  for (var r = startRow; r < values.length; r++) {
    var row = values[r];
    var pen = colPen !== -1 ? String(row[colPen]).trim() : '';
    if (!pen || pen.length < 5 || pen.indexOf('(') !== -1) continue;
    
    students.push({
      id: r,
      districtName: 'DANTEWADA',
      blockName: colBlock !== -1 ? String(row[colBlock]).trim().toUpperCase() : 'DANTEWADA',
      schoolName: colSchool !== -1 ? String(row[colSchool]).trim() : '',
      udiseCode: colUdise !== -1 ? String(row[colUdise]).trim() : '',
      className: colClass !== -1 ? String(row[colClass]).trim() : '',
      studentPen: pen,
      studentName: colName !== -1 ? String(row[colName]).trim() : '',
      isAadhaarProvided: colProv !== -1 && String(row[colProv]).trim().toUpperCase() === 'YES' ? 'YES' : 'NO',
      isAadhaarVerified: colVer !== -1 && String(row[colVer]).trim().toUpperCase() === 'YES' ? 'YES' : 'NO',
      apaarStatus: colStatus !== -1 && String(row[colStatus]).toUpperCase().indexOf('GEN') !== -1 ? 'Generated' : 'Pending',
      pendingReason: colReason !== -1 ? String(row[colReason]).trim() || 'Not Applied' : 'Not Applied'
    });
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', total: students.length, students: students })).setMimeType(ContentService.MimeType.JSON);
}`;

    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Sheet Live Connection</h3>
              <p className="text-xs text-slate-300">
                Sync dashboard directly with your online Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* Quick instructions */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 leading-relaxed">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Setup Steps (Apps Script Web App):</span>
              <button
                onClick={copyScriptCode}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <Copy className="w-3 h-3 text-slate-500" />
                <span>{copied ? 'Copied Code!' : 'Copy Code.gs'}</span>
              </button>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600">
              <li>Open your Google Sheet (with <i>APAAR Pending Status Report</i>).</li>
              <li>Go to <strong>Extensions</strong> → <strong>Apps Script</strong>.</li>
              <li>Paste the code from <code className="bg-slate-200 px-1 rounded font-mono">google-apps-script/Code.gs</code>.</li>
              <li>Click <strong>Deploy</strong> → <strong>New deployment</strong> → Select <strong>Web app</strong>.</li>
              <li>Set <i>Execute as:</i> <strong>Me</strong> and <i>Who has access:</i> <strong>Anyone</strong>.</li>
              <li>Deploy and copy the Web App URL (ends with <code className="bg-slate-200 px-1 rounded font-mono">/exec</code>).</li>
            </ol>
          </div>

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Google Apps Script Web App URL:
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 placeholder-slate-400 font-mono focus:outline-hidden focus:border-blue-600"
            />
            {lastSynced && (
              <p className="text-[11px] text-emerald-700 font-medium">
                Last synced: {lastSynced}
              </p>
            )}
          </div>

          {/* Feedback message */}
          {syncStatus && (
            <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
              syncStatus.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {syncStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          {currentUrl ? (
            <button
              onClick={() => {
                onDisconnect();
                setUrl('');
                setSyncStatus({ success: true, message: 'Disconnected from Google Sheet.' });
              }}
              className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              Disconnect Sheet
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">Offline baseline loaded</span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleRunSync}
              disabled={isSyncing || !url.trim()}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Data Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
