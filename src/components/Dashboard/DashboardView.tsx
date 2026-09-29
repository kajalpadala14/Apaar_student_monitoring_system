import React, { useMemo } from 'react';
import { useStudents } from '../../context/StudentContext';
import { FilterBar } from './FilterBar';
import {
  Users,
  CheckCircle2,
  Clock3,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
  School,
  BookOpen,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import { Student } from '../../types/student';

export const DashboardView: React.FC = () => {
  const {
    students,
    stats,
    blockSummaries,
    reasonCounts,
    recentActivity,
    setActiveTab,
    setActiveFilters,
    currentUser,
  } = useStudents();

  const isSchoolUser = currentUser?.role === 'SCHOOL_USER';

  const handleViewStudent = (_student: Student) => {
    setActiveTab('students');
  };

  const handleFilterBlock = (blockName: string) => {
    if (!isSchoolUser) {
      setActiveFilters((prev) => ({ ...prev, block: blockName }));
    }
  };

  const handleFilterClass = (className: string) => {
    setActiveFilters((prev) => ({ ...prev, className }));
  };

  const reasonsList = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const maxReasonCount = reasonsList.length > 0 ? Math.max(...reasonsList.map(([_, count]) => count)) : 1;

  // Class-wise breakdown for School Users
  const classSummaries = useMemo(() => {
    if (!isSchoolUser) return [];
    const map = new Map<string, { total: number; completed: number; pending: number; followUp: number; resolved: number }>();
    students.forEach((s) => {
      const c = (s.class_name || 'Unassigned').toString();
      let item = map.get(c);
      if (!item) {
        item = { total: 0, completed: 0, pending: 0, followUp: 0, resolved: 0 };
        map.set(c, item);
      }
      item.total++;
      if (s.survey_status === 'SURVEY COMPLETED') item.completed++;
      else if (s.survey_status === 'PENDING') item.pending++;
      else if (s.survey_status === 'FOLLOW-UP REQUIRED') item.followUp++;
      else if (s.survey_status === 'RESOLVED') item.resolved++;
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([className, counts]) => ({
        className,
        totalStudents: counts.total,
        surveyCompleted: counts.completed,
        surveyPending: counts.pending,
        completionRate: counts.total > 0 ? parseFloat((((counts.completed + counts.resolved) / counts.total) * 100).toFixed(1)) : 0,
      }));
  }, [students, isSchoolUser]);

  return (
    <div className="space-y-5">
      
      {/* 2. MAIN TITLE / HERO SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
            {isSchoolUser ? 'School APAAR Survey Dashboard' : 'District APAAR Survey Dashboard'}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">
            {isSchoolUser ? (
              <span>
                {currentUser?.schoolName} &bull; <span className="text-slate-500 font-normal">UDISE: {currentUser?.udiseCode}</span>
              </span>
            ) : (
              <span>
                दंतेवाड़ा जिला &bull; <span className="text-slate-500 font-normal">Master Database Monitoring</span>
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('students')}
          className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span>{isSchoolUser ? 'View School Students List' : 'View Students Master List'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* School User Welcome Context Card */}
      {isSchoolUser && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <School className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">{currentUser?.schoolName}</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                  Authorized School
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2.5">
                <span>UDISE: <span className="font-mono font-medium text-slate-800">{currentUser?.udiseCode}</span></span>
                <span>&bull;</span>
                <span>ब्लॉक: <span className="font-medium text-slate-800">{currentUser?.blockName}</span></span>
                <span>&bull;</span>
                <span>संकुल: <span className="font-medium text-slate-800">{currentUser?.clusterName}</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs self-start md:self-auto">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Total Students</span>
              <span className="font-bold text-slate-900 tabular-nums">{stats.totalStudents}</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold block">Completed</span>
              <span className="font-bold text-emerald-700 tabular-nums">{stats.completionRate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. FILTER SECTION */}
      <FilterBar />

      {/* 4. KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 items-stretch">
        
        {/* Card 1: TOTAL STUDENTS */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate mr-1">
                {isSchoolUser ? 'School Students' : 'Total Students'}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5">
              <span className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                {stats.totalStudents.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 text-[10px] sm:text-xs text-slate-500 flex items-center justify-between">
            <span className="truncate">{isSchoolUser ? 'School Records' : 'Master Database'}</span>
            <span className="text-[9px] sm:text-[11px] text-slate-400 hidden xs:inline">कुल नामांकित</span>
          </div>
        </div>

        {/* Card 2: SURVEY COMPLETED */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 uppercase tracking-wider truncate mr-1">
                Survey Completed
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50/80 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5">
              <span className="text-xl sm:text-3xl font-bold tracking-tight text-emerald-700 tabular-nums">
                {stats.surveyCompleted.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 text-[10px] sm:text-xs text-slate-500 flex items-center justify-between">
            <span className="text-emerald-700 font-medium truncate">Verified & Recorded</span>
            <span className="text-[9px] sm:text-[11px] text-slate-400 hidden xs:inline">सत्यापित</span>
          </div>
        </div>

        {/* Card 3: SURVEY PENDING */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-amber-700 uppercase tracking-wider truncate mr-1">
                Survey Pending
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50/80 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5">
              <span className="text-xl sm:text-3xl font-bold tracking-tight text-amber-700 tabular-nums">
                {stats.surveyPending.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 text-[10px] sm:text-xs text-slate-500 flex items-center justify-between">
            <span className="text-amber-700 font-medium truncate">Awaiting Action</span>
            <span className="text-[9px] sm:text-[11px] text-slate-400 hidden xs:inline">लंबित कार्य</span>
          </div>
        </div>

        {/* Card 4: SURVEY COMPLETION */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wider truncate mr-1">
                Survey Completion
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50/80 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5 flex items-baseline justify-between">
              <span className="text-xl sm:text-3xl font-bold tracking-tight text-blue-800 tabular-nums">
                {stats.completionRate}%
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">100%</span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 sm:pt-2 border-t border-slate-100">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
              ></div>
            </div>
            <div className="mt-1 flex justify-between text-[9px] sm:text-[11px] text-slate-400">
              <span className="truncate">{isSchoolUser ? 'School' : 'District'}</span>
              <span className="tabular-nums">{stats.surveyCompleted}/{stats.totalStudents}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5 & 6. PROGRESS SECTION: Block-wise Progress & Reason-wise Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* 5. BLOCK-WISE PROGRESS TABLE (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-col overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-wide flex items-center space-x-1.5">
                {isSchoolUser ? (
                  <>
                    <BookOpen className="w-4 h-4 text-blue-700" />
                    <span>Class-wise Progress (कक्षा वार प्रगति)</span>
                  </>
                ) : (
                  <span>Block-wise Progress (ब्लॉक वार स्थिति)</span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSchoolUser
                  ? `${currentUser?.schoolName} &bull; Class Breakdown`
                  : 'Dantewada District &bull; 4 Administrative Blocks'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors inline-flex items-center space-x-1 cursor-pointer"
            >
              <span>View Full Report</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {isSchoolUser ? (
              /* School User: Class Breakdown */
              <>
                {/* Mobile View: Cards */}
                <div className="block sm:hidden divide-y divide-slate-100 p-2 space-y-1">
                  {classSummaries.map((c) => (
                    <div
                      key={c.className}
                      onClick={() => handleFilterClass(c.className)}
                      className="p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5 active:bg-slate-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">Class {c.className}</span>
                        <span className="font-bold text-blue-700 text-xs">{c.completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(c.completionRate, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>Total: <strong className="text-slate-800">{c.totalStudents}</strong></span>
                        <span>Done: <strong className="text-emerald-700">{c.surveyCompleted}</strong></span>
                        <span>Pending: <strong className="text-amber-700">{c.surveyPending}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <table className="hidden sm:table w-full min-w-[480px] text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3.5">Class (कक्षा)</th>
                      <th className="py-2.5 px-3.5 text-right">Total Students</th>
                      <th className="py-2.5 px-3.5 text-right">Completed</th>
                      <th className="py-2.5 px-3.5 text-right">Pending</th>
                      <th className="py-2.5 px-3.5 text-right min-w-[120px]">Completion %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classSummaries.map((c) => (
                      <tr
                        key={c.className}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => handleFilterClass(c.className)}
                        title={`Click to filter by Class ${c.className}`}
                      >
                        <td className="py-2.5 px-3.5 font-medium text-slate-900 flex items-center space-x-1.5">
                          <span className="group-hover:text-blue-700">Class {c.className}</span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-medium text-slate-700 tabular-nums">
                          {c.totalStudents.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-emerald-700 tabular-nums">
                          {c.surveyCompleted.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-medium text-amber-700 tabular-nums">
                          {c.surveyPending.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="font-semibold text-slate-800 w-10 text-right tabular-nums">{c.completionRate}%</span>
                            <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(c.completionRate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              /* Admin: 4 Blocks Breakdown */
              <>
                {/* Mobile View: Cards */}
                <div className="block sm:hidden divide-y divide-slate-100 p-2 space-y-1">
                  {blockSummaries.map((b) => (
                    <div
                      key={b.block}
                      onClick={() => handleFilterBlock(b.block)}
                      className="p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer space-y-1.5 active:bg-slate-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{b.block}</span>
                        <span className="font-bold text-blue-700 text-xs">{b.completionRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(b.completionRate, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>Total: <strong className="text-slate-800">{b.totalStudents.toLocaleString('en-IN')}</strong></span>
                        <span>Done: <strong className="text-emerald-700">{b.surveyCompleted.toLocaleString('en-IN')}</strong></span>
                        <span>Pending: <strong className="text-amber-700">{b.surveyPending.toLocaleString('en-IN')}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <table className="hidden sm:table w-full min-w-[480px] text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3.5">Block (ब्लॉक)</th>
                      <th className="py-2.5 px-3.5 text-right">Total Students</th>
                      <th className="py-2.5 px-3.5 text-right">Completed</th>
                      <th className="py-2.5 px-3.5 text-right">Pending</th>
                      <th className="py-2.5 px-3.5 text-right min-w-[120px]">Completion %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {blockSummaries.map((b) => (
                      <tr
                        key={b.block}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => handleFilterBlock(b.block)}
                        title={`Click to filter dashboard by ${b.block}`}
                      >
                        <td className="py-2.5 px-3.5 font-medium text-slate-900">
                          <span className="group-hover:text-blue-700">{b.block}</span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-medium text-slate-700 tabular-nums">
                          {b.totalStudents.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-emerald-700 tabular-nums">
                          {b.surveyCompleted.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-medium text-amber-700 tabular-nums">
                          {b.surveyPending.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="font-semibold text-slate-800 w-10 text-right tabular-nums">{b.completionRate}%</span>
                            <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(b.completionRate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
          
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isSchoolUser
                ? 'कक्षा पर क्लिक करके फ़िल्टर करें।'
                : 'Click any block row to filter the dashboard.'}
            </span>
            <span className="font-semibold text-slate-700">
              {isSchoolUser ? `Total: ${stats.totalStudents}` : 'District Total: 9,747'}
            </span>
          </div>
        </div>

        {/* 6. REASON-WISE PENDING (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-col justify-between">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-wide">
                Reason-wise Pending Surveys
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">लंबित रहने के मुख्य कारण (Field Survey Analysis)</p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center">
            {reasonsList.length === 0 ? (
              /* Clean Government-Style Empty State */
              <div className="py-8 text-center text-slate-500 my-auto">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-semibold text-slate-800">No survey data available yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Reason-wise analysis will appear after surveys are submitted.
                </p>
                <div className="mt-3.5">
                  <button
                    onClick={() => setActiveTab('students')}
                    className="inline-flex items-center space-x-1 text-xs text-blue-700 bg-blue-50/80 border border-blue-200 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <span>View Student List</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {reasonsList.slice(0, 7).map(([reason, count]) => {
                  const pct = stats.surveyCompleted > 0 ? ((count / stats.surveyCompleted) * 100).toFixed(1) : '0';
                  const barWidth = Math.max(8, Math.round((count / maxReasonCount) * 100));
                  return (
                    <div key={reason} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate pr-2" title={reason}>
                          {reason}
                        </span>
                        <span className="font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>Pending Surveys: {stats.surveyPending}</span>
            <span className="text-[11px] text-slate-400">Based on verified entries</span>
          </div>
        </div>

      </div>

      {/* 7. RECENT SURVEY ACTIVITY TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-wide">
              Recent Survey Activity (हाल ही में किया गया सर्वे)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time log of surveyed students</p>
          </div>
          <button
            onClick={() => setActiveTab('students')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors inline-flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Students</span>
            <span>&rarr;</span>
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <p className="font-medium text-slate-700">No recent activity recorded yet.</p>
            <p className="text-slate-400 mt-0.5">Survey entries completed by teachers will appear here.</p>
            <div className="mt-3">
              <button
                onClick={() => setActiveTab('students')}
                className="bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
              >
                Go to Students Directory
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Mobile View: Cards */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {recentActivity.map((student) => (
                <div key={student.id} className="p-3 space-y-1.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {student.student_name_marksheet}
                    </span>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold shrink-0 ${
                      student.survey_status === 'SURVEY COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : student.survey_status === 'FOLLOW-UP REQUIRED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : student.survey_status === 'RESOLVED'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {student.survey_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    {student.school_name} &bull; {student.block_name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span className="text-amber-800 truncate max-w-[200px]">
                      {student.apaar_pending_reason || '-'}
                    </span>
                    <button
                      onClick={() => handleViewStudent(student)}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer ml-2"
                    >
                      View &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3.5">Student Name</th>
                    <th className="py-2.5 px-3.5">School Name</th>
                    <th className="py-2.5 px-3.5">Block</th>
                    <th className="py-2.5 px-3.5">Reason</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5">Survey Date</th>
                    <th className="py-2.5 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentActivity.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3.5 font-medium text-slate-900">
                        {student.student_name_marksheet}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 max-w-[200px] truncate" title={student.school_name}>
                        {student.school_name}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700">
                        {student.block_name}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600">
                        {student.apaar_pending_reason || '-'}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          student.survey_status === 'SURVEY COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : student.survey_status === 'FOLLOW-UP REQUIRED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : student.survey_status === 'RESOLVED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {student.survey_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-500">
                        {student.survey_date ? new Date(student.survey_date).toLocaleDateString('en-IN') : 'Just now'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          onClick={() => handleViewStudent(student)}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
