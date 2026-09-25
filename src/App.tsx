import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { db, initializeDatabase } from './lib/db';
import {
  Student,
  DashboardKPIs,
  BlockSummary,
  SchoolSummary,
  FilterState
} from './types';
import {
  calculateKPIs,
  calculateBlockSummaries,
  calculateSchoolSummaries,
  calculateReasonSummaries,
  ReasonSummary
} from './lib/calculations';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { FilterBar } from './components/dashboard/FilterBar';
import { KpiCards } from './components/dashboard/KpiCards';
import { PriorityActions } from './components/dashboard/PriorityActions';
import { ChartsSection } from './components/dashboard/ChartsSection';
import { BlockWiseView } from './components/views/BlockWiseView';
import { SchoolWiseView } from './components/views/SchoolWiseView';
import { StudentDetailsView } from './components/views/StudentDetailsView';
import { PendingApaarView } from './components/views/PendingApaarView';
import { ReportsView } from './components/views/ReportsView';
import { SchoolDetailModal } from './components/views/SchoolDetailModal';
import { exportToExcel, exportToCSV, exportDistrictSummaryPDF } from './lib/export';
import { RefreshCw, Database, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [loading, setLoading] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [initMessage, setInitMessage] = useState('Initializing Dantewada Portal...');
  const [students, setStudents] = useState<Student[]>([]);

  // Navigation & Drill-Down
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSchoolModal, setSelectedSchoolModal] = useState<{ udise: string; name: string } | null>(null);

  // Global Filter State
  const [filter, setFilter] = useState<FilterState>({
    block: '',
    school: '',
    udiseCode: '',
    className: '',
    aadhaarProvided: '',
    aadhaarVerified: '',
    apaarStatus: '',
    pendingReason: '',
    searchTerm: ''
  });

  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Google Sheet Integration via .env (with fallback)
  const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpQcPt49Sv03r8KAldMs3frBE0Ru_MOVrmeCsW4XgOozVnEkcGd1PHA_cDvIP4ZgmXZQ/exec';
  const googleSheetUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || DEFAULT_SCRIPT_URL;

  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = React.useRef(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; error?: boolean } | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(
    () => localStorage.getItem('apaar_sheet_last_synced') || null
  );

  const handleSyncGoogleSheet = async (scriptUrl = googleSheetUrl) => {
    if (isSyncingRef.current) {
      return { success: false, message: 'Sync already in progress' };
    }
    if (!scriptUrl) {
      setSyncFeedback({ message: 'Google Apps Script URL is not configured', error: true });
      return { success: false, message: 'Missing script URL' };
    }

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      // Helper with retry on transient Google Apps Script errors (404/5xx when script is busy)
      let response: Response | null = null;
      const maxRetries = 2;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          response = await fetch(scriptUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            redirect: 'follow'
          });
          if (response.ok) {
            break;
          }
          // If Google Apps Script returned 404/503 (transient busy state), wait and retry
          if ((response.status === 404 || response.status >= 500) && attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
        } catch (fetchErr) {
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          throw fetchErr;
        }
      }

      if (!response || !response.ok) {
        const status = response ? response.status : 'Unknown';
        if (status === 404) {
          throw new Error('Google Apps Script endpoint is temporarily unavailable or busy. Please retry in a moment.');
        }
        throw new Error(`Google Apps Script returned status ${status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.students)) {
        throw new Error(data?.message || 'Invalid response format from Google Apps Script.');
      }
      if (data.students.length === 0) {
        throw new Error('Google Sheet returned 0 students. Please check sheet name and headers.');
      }

      // Replace Dexie records with fresh Google Sheet records
      await db.students.clear();
      await db.students.bulkAdd(data.students);

      const now = new Date().toLocaleTimeString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      localStorage.setItem('apaar_sheet_last_synced', now);
      setLastSyncedTime(now);

      const allStudents = await db.students.toArray();
      setStudents(allStudents);
      setLastUpdated(now);
      setSyncFeedback({ message: `Successfully synced ${data.students.length.toLocaleString()} records from Google Sheet!` });
      setTimeout(() => setSyncFeedback(null), 5000);
      return { success: true, total: data.students.length };
    } catch (err: any) {
      console.error('Error syncing Google Sheet:', err);
      const userMessage = err.message || 'Failed to sync with Google Sheet';
      setSyncFeedback({ message: userMessage, error: true });
      setTimeout(() => setSyncFeedback(null), 7000);
      return { success: false, message: userMessage };
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  };

  // Load database
  const loadData = useCallback(async () => {
    try {
      const allStudents = await db.students.toArray();
      setStudents(allStudents);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load database records:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      try {
        // 1. Immediately load any existing records for 0ms initial wait
        const existingCount = await db.students.count();
        if (existingCount > 0 && isMounted) {
          await loadData();
          setLoading(false);
        }

        // 2. Sync with Google Sheet
        if (googleSheetUrl) {
          if (existingCount === 0 && isMounted) {
            setInitMessage('Connecting and syncing with Google Sheet...');
          }
          const syncRes = await handleSyncGoogleSheet(googleSheetUrl);
          if (isMounted && syncRes.success) {
            setLoading(false);
            return;
          }
        }

        // 3. Fallback database load if not already loaded
        await initializeDatabase();
        if (isMounted) {
          await loadData();
        }
      } catch (e) {
        console.error('Boot error:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    boot();

    return () => {
      isMounted = false;
    };
  }, [loadData, googleSheetUrl]);

  // Filter application
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (filter.block && s.blockName.toUpperCase() !== filter.block.toUpperCase()) {
        return false;
      }
      if (filter.school && s.schoolName.toLowerCase() !== filter.school.toLowerCase()) {
        return false;
      }
      if (filter.udiseCode && !s.udiseCode.includes(filter.udiseCode)) {
        return false;
      }
      if (filter.className && s.className !== filter.className) {
        return false;
      }
      if (filter.aadhaarProvided && s.isAadhaarProvided !== filter.aadhaarProvided) {
        return false;
      }
      if (filter.aadhaarVerified && s.isAadhaarVerified !== filter.aadhaarVerified) {
        return false;
      }
      if (filter.apaarStatus && s.apaarStatus !== filter.apaarStatus) {
        return false;
      }
      if (filter.pendingReason && s.pendingReason !== filter.pendingReason) {
        return false;
      }
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase().trim();
        const matchPen = s.studentPen.toLowerCase().includes(term);
        const matchName = s.studentName.toLowerCase().includes(term);
        if (!matchPen && !matchName) return false;
      }
      return true;
    });
  }, [students, filter]);

  // Derived calculations
  const kpis: DashboardKPIs = useMemo(() => calculateKPIs(filteredStudents), [filteredStudents]);
  const blockSummaries: BlockSummary[] = useMemo(() => calculateBlockSummaries(filteredStudents), [filteredStudents]);
  const schoolSummaries: SchoolSummary[] = useMemo(() => calculateSchoolSummaries(filteredStudents), [filteredStudents]);
  const reasonSummaries: ReasonSummary[] = useMemo(() => calculateReasonSummaries(filteredStudents), [filteredStudents]);

  // Options for filter dropdowns
  const availableBlocks = useMemo(() => {
    return Array.from(new Set(students.map(s => s.blockName))).sort();
  }, [students]);

  const availableSchools = useMemo(() => {
    const map = new Map<string, { udise: string; name: string; block: string }>();
    students.forEach(s => {
      if (!map.has(s.schoolName)) {
        map.set(s.schoolName, { udise: s.udiseCode, name: s.schoolName, block: s.blockName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const availableClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className))).sort();
  }, [students]);

  const availableReasons = useMemo(() => {
    return Array.from(new Set(students.map(s => s.pendingReason))).sort();
  }, [students]);

  // Drill-down handlers
  const handleSelectBlock = (blockName: string) => {
    setFilter(prev => ({ ...prev, block: blockName, school: '' }));
    setCurrentTab('school-wise');
  };

  const handleSelectSchool = (udiseCode: string, schoolName: string) => {
    setSelectedSchoolModal({ udise: udiseCode, name: schoolName });
  };

  const handleClearDrillDown = () => {
    setFilter(prev => ({ ...prev, block: '', school: '', udiseCode: '' }));
  };

  // Interactive Chart Click Handler
  const handleChartClick = (type: string, value: string) => {
    if (type === 'block') {
      setFilter(prev => ({ ...prev, block: value }));
      setCurrentTab('school-wise');
    } else if (type === 'className') {
      setFilter(prev => ({ ...prev, className: value }));
      setCurrentTab('students');
    } else if (type === 'pendingReason') {
      setFilter(prev => ({ ...prev, pendingReason: value }));
      setCurrentTab('pending-apaar');
    } else if (type === 'aadhaarVerified') {
      setFilter(prev => ({ ...prev, aadhaarVerified: value }));
      setCurrentTab('students');
    } else if (type === 'aadhaarProvided') {
      setFilter(prev => ({ ...prev, aadhaarProvided: value }));
      setCurrentTab('students');
    }
  };

  // Priority Actions Click Handler
  const handlePriorityAction = (actionType: string, filterParams?: any) => {
    if (filterParams) {
      setFilter(prev => ({ ...prev, ...filterParams }));
    }
    if (actionType === 'focus-block') {
      setCurrentTab('school-wise');
    } else {
      setCurrentTab('students');
    }
  };

  // Student update action
  const handleUpdateStudent = async (studentPen: string, updates: Partial<Student>) => {
    const existing = await db.students.where('studentPen').equals(studentPen).first();
    if (!existing) return;

    await db.students.update(existing.id, updates);
    await loadData();
  };

  // Global Export Handler
  const handleGlobalExport = (format: 'excel' | 'csv' | 'pdf') => {
    const timestamp = new Date().toISOString().slice(0, 10);
    if (format === 'pdf') {
      exportDistrictSummaryPDF(kpis, blockSummaries);
    } else {
      const data = filteredStudents.map(s => ({
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
        'Reason for Not Generated': s.pendingReason
      }));
      if (format === 'excel') {
        exportToExcel(data, `APAAR_Monitoring_${kpis.districtName || 'District'}_${timestamp}`);
      } else {
        exportToCSV(data, `APAAR_Monitoring_${kpis.districtName || 'District'}_${timestamp}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <img src="/emblem.svg" alt="Emblem" className="w-20 h-20 mx-auto animate-bounce duration-1000" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">APAAR Student Monitoring Portal</h1>
            <p className="text-xs text-amber-400 mt-1 font-semibold">
              District Administration | School Education Dept
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${initProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>{initMessage}</span>
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            Parsing and indexing student records into local high-performance database...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Official Government Header */}
      <Header
        lastUpdated={lastUpdated}
        totalRecordsCount={students.length}
        districtName={kpis.districtName}
        districtCode={kpis.districtCode}
        stateName={kpis.stateName}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        drillDownBlock={filter.block}
        drillDownSchool={filter.school}
        onClearDrillDown={handleClearDrillDown}
        isSheetConfigured={Boolean(googleSheetUrl)}
        isSyncing={isSyncing}
        onSyncSheet={() => handleSyncGoogleSheet()}
      />

      {/* Real-time Sync Feedback Notification */}
      {syncFeedback && (
        <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 border-b ${
          syncFeedback.error
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {syncFeedback.error ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{syncFeedback.message}</span>
        </div>
      )}

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          pendingCount={kpis.apaarPending}
          districtName={kpis.districtName}
          districtCode={kpis.districtCode}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {students.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-4 my-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {googleSheetUrl ? 'Google Sheet Live Synchronization' : 'Google Sheet URL Not Configured'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                    {googleSheetUrl ? (
                      <>
                        Dashboard is connected to Google Sheet via <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-800">.env</code>. Click below to load live records.
                      </>
                    ) : (
                      <>
                        Please set <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-800">VITE_GOOGLE_APPS_SCRIPT_URL</code> in your <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-800">.env</code> file to load student data.
                      </>
                    )}
                  </p>
                </div>
                {googleSheetUrl && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleSyncGoogleSheet()}
                      disabled={isSyncing}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition shadow-xs disabled:opacity-60"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Sync Live Sheet Now'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Global Filter Bar (visible on Dashboard, Block-wise, School-wise, Student Details, and Pending views) */}
                {['dashboard', 'block-wise', 'school-wise', 'students', 'pending-apaar'].includes(currentTab) && (
                  <FilterBar
                filter={filter}
                onFilterChange={setFilter}
                onResetFilter={() =>
                  setFilter({
                    block: '',
                    school: '',
                    udiseCode: '',
                    className: '',
                    aadhaarProvided: '',
                    aadhaarVerified: '',
                    apaarStatus: '',
                    pendingReason: '',
                    searchTerm: ''
                  })
                }
                onExport={handleGlobalExport}
                availableBlocks={availableBlocks}
                availableSchools={availableSchools}
                availableClasses={availableClasses}
                availableReasons={availableReasons}
              />
            )}

            {/* TAB 1: DASHBOARD OVERVIEW */}
            {currentTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Top KPI Cards */}
                <KpiCards
                  kpis={kpis}
                  onCardClick={(metric) => {
                    if (metric === 'aadhaar-not-provided') {
                      setFilter(prev => ({ ...prev, aadhaarProvided: 'NO' }));
                      setCurrentTab('students');
                    } else if (metric === 'aadhaar-not-verified') {
                      setFilter(prev => ({ ...prev, aadhaarVerified: 'NO' }));
                      setCurrentTab('students');
                    } else if (metric === 'apaar-pending') {
                      setCurrentTab('pending-apaar');
                    } else {
                      setCurrentTab('students');
                    }
                  }}
                />

                {/* Priority / Action Required Directives */}
                <PriorityActions
                  kpis={kpis}
                  blocks={blockSummaries}
                  schools={schoolSummaries}
                  onActionClick={handlePriorityAction}
                />

                {/* Interactive Recharts Section */}
                <ChartsSection
                  kpis={kpis}
                  blocks={blockSummaries}
                  reasons={reasonSummaries}
                  students={filteredStudents}
                  onChartClick={handleChartClick}
                />
              </div>
            )}

            {/* TAB 2: BLOCK-WISE STATUS */}
            {currentTab === 'block-wise' && (
              <BlockWiseView
                blocks={blockSummaries}
                onSelectBlock={handleSelectBlock}
              />
            )}

            {/* TAB 3: SCHOOL-WISE STATUS */}
            {currentTab === 'school-wise' && (
              <SchoolWiseView
                schools={schoolSummaries}
                onSelectSchool={handleSelectSchool}
                initialBlockFilter={filter.block}
              />
            )}

            {/* TAB 4: STUDENT DETAILS */}
            {currentTab === 'students' && (
              <StudentDetailsView
                students={filteredStudents}
                onUpdateStudent={handleUpdateStudent}
                initialPenSearch={filter.searchTerm}
              />
            )}

            {/* TAB 5: PENDING APAAR */}
            {currentTab === 'pending-apaar' && (
              <PendingApaarView
                kpis={kpis}
                reasons={reasonSummaries}
                students={filteredStudents}
                onSelectReason={(reason) => {
                  setFilter(prev => ({ ...prev, pendingReason: reason }));
                  setCurrentTab('students');
                }}
                onSelectMissingAadhaar={() => {
                  setFilter(prev => ({ ...prev, aadhaarProvided: 'NO' }));
                  setCurrentTab('students');
                }}
                onSelectUnverifiedAadhaar={() => {
                  setFilter(prev => ({ ...prev, aadhaarVerified: 'NO' }));
                  setCurrentTab('students');
                }}
              />
            )}

            {/* TAB 6: REPORTS */}
            {currentTab === 'reports' && (
              <ReportsView
                kpis={kpis}
                blocks={blockSummaries}
                schools={schoolSummaries}
                reasons={reasonSummaries}
                students={filteredStudents}
                currentFilter={filter}
              />
            )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* School Detail Drill-Down Modal */}
      {selectedSchoolModal && (
        <SchoolDetailModal
          udiseCode={selectedSchoolModal.udise}
          schoolName={selectedSchoolModal.name}
          students={students}
          onClose={() => setSelectedSchoolModal(null)}
          onSelectStudent={(student) => {
            setSelectedSchoolModal(null);
            setFilter(prev => ({ ...prev, searchTerm: student.studentPen }));
            setCurrentTab('students');
          }}
        />
      )}
    </div>
  );
}
export default App;
