import React, { useMemo } from 'react';
import { useStudents } from '../../context/StudentContext';
import { FilterBar } from './FilterBar';
import { Users, CheckCircle, Clock, Percent, ArrowUpRight, BarChart3, AlertCircle, ChevronRight, School, BookOpen } from 'lucide-react';
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
    <div className="space-y-6">
      
      {/* Title & District / School Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isSchoolUser ? 'School APAAR Survey Dashboard' : 'District APAAR Survey Dashboard'}
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-0.5">
            {isSchoolUser ? (
              <span>
                {currentUser?.schoolName} &bull; <span className="text-slate-500 font-normal">UDISE: {currentUser?.udiseCode}</span>
              </span>
            ) : (
              <span>
                दंतेवाड़ा जिला (समस्त ब्लॉक एवं स्कूल) &bull; <span className="text-slate-500 font-normal">Master Database Monitoring</span>
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('students')}
          className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>{isSchoolUser ? 'View School Students List' : 'View Students Master List'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* School User Welcome Profile Banner */}
      {isSchoolUser && (
        <div className="bg-linear-to-r from-blue-50 via-slate-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {currentUser?.schoolName}
                </h3>
                <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Authorized School Access
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>UDISE Code: <strong className="font-mono text-blue-900">{currentUser?.udiseCode}</strong></span>
                <span>&bull;</span>
                <span>ब्लॉक: <strong className="text-slate-800">{currentUser?.blockName}</strong></span>
                <span>&bull;</span>
                <span>संकुल: <strong className="text-slate-800">{currentUser?.clusterName}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white border border-blue-200/80 rounded-lg p-2.5 text-xs self-start md:self-auto shadow-2xs">
            <div className="text-right">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">School Records</div>
              <div className="font-bold text-blue-900">{stats.totalStudents} Students</div>
            </div>
            <div className="h-7 w-px bg-slate-200 mx-1"></div>
            <div className="text-right">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Progress</div>
              <div className="font-bold text-emerald-700">{stats.completionRate}% Done</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar />

      {/* Top KPI Cards (Clean, Government Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isSchoolUser ? 'School Students' : 'Total Students'}
            </span>
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {stats.totalStudents.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500">
              {isSchoolUser ? 'School Records' : 'Master Database'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isSchoolUser ? 'स्कूल में कुल नामांकित विद्यार्थी' : 'कुल नामांकित विद्यार्थी (Excel रिकॉर्ड)'}
          </p>
        </div>

        {/* Survey Completed */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Survey Completed
            </span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">
              {stats.surveyCompleted.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">सत्यापित एवं सर्वे पूर्ण छात्र</p>
        </div>

        {/* Survey Pending */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Survey Pending
            </span>
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700">
              {stats.surveyPending.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
              Awaiting Action
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">शेष छात्र जिनका सर्वे बाकी है</p>
        </div>

        {/* Completion % */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Survey Completion
            </span>
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-800">
              {stats.completionRate}%
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {isSchoolUser ? 'School Target' : 'District Target'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Main Grid: Progress Table & Reason-Wise Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left 7 Columns: Class-wise for School / Block-wise for Admin */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
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
                  ? `${currentUser?.schoolName} की कक्षा-वार सर्वेक्षण स्थिति`
                  : 'Dantewada District 4 Administrative Blocks'}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              Full Report →
            </button>
          </div>

          <div className="overflow-x-auto">
            {isSchoolUser ? (
              /* School User: Class Breakdown Table */
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Class (कक्षा)</th>
                    <th className="py-2.5 px-3 text-right">Total Students</th>
                    <th className="py-2.5 px-3 text-right">Completed</th>
                    <th className="py-2.5 px-3 text-right">Pending</th>
                    <th className="py-2.5 px-3 text-right">Completion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classSummaries.map((c) => (
                    <tr
                      key={c.className}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => handleFilterClass(c.className)}
                      title={`Click to filter by Class ${c.className}`}
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center space-x-1.5">
                        <span>Class {c.className}</span>
                        <span className="text-[10px] text-blue-600 font-normal">🔍</span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {c.totalStudents.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                        {c.surveyCompleted.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-amber-700">
                        {c.surveyPending.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="font-bold text-slate-900 w-10 text-right">{c.completionRate}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(c.completionRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* Admin: 4 Blocks Breakdown Table */
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Block (ब्लॉक)</th>
                    <th className="py-2.5 px-3 text-right">Total Students</th>
                    <th className="py-2.5 px-3 text-right">Completed</th>
                    <th className="py-2.5 px-3 text-right">Pending</th>
                    <th className="py-2.5 px-3 text-right">Completion %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {blockSummaries.map((b) => (
                    <tr
                      key={b.block}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => handleFilterBlock(b.block)}
                      title={`Click to filter dashboard by ${b.block}`}
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center space-x-1.5">
                        <span>{b.block}</span>
                        <span className="text-[10px] text-blue-600 font-normal">🔍</span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {b.totalStudents.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                        {b.surveyCompleted.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-amber-700">
                        {b.surveyPending.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="font-bold text-slate-900 w-10 text-right">{b.completionRate}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(b.completionRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isSchoolUser
                ? 'कक्षा पर क्लिक करके छात्रों की सूची फ़िल्टर करें।'
                : 'Click any block row to filter the entire portal view.'}
            </span>
            <span className="font-medium text-slate-700">
              {isSchoolUser ? `School Total: ${stats.totalStudents}` : 'Master Total: 9,747'}
            </span>
          </div>
        </div>

        {/* Reason-wise Analysis (Right 5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-2xs flex flex-col">
          <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Reason-wise Pending (कारण वार विवरण)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Based on recorded field surveys</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {reasonsList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No survey responses recorded yet</p>
                <p className="text-slate-400 mt-1 max-w-xs mx-auto">
                  Pending reasons recorded for students will appear in this breakdown.
                </p>
                <button
                  onClick={() => setActiveTab('students')}
                  className="mt-3 inline-flex items-center space-x-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 font-semibold px-3 py-1.5 rounded-md hover:bg-blue-100 cursor-pointer"
                >
                  <span>View Student Records</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 py-1">
                {reasonsList.slice(0, 7).map(([reason, count]) => {
                  const pct = stats.surveyCompleted > 0 ? ((count / stats.surveyCompleted) * 100).toFixed(1) : '0';
                  const barWidth = Math.max(8, Math.round((count / maxReasonCount) * 100));
                  return (
                    <div key={reason} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate pr-2" title={reason}>
                          {reason}
                        </span>
                        <span className="font-bold text-slate-900 whitespace-nowrap">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Survey Overall Progress Bar Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Survey Progress ({isSchoolUser ? 'स्कूल सर्वेक्षण प्रगति' : 'कुल सर्वेक्षण प्रगति'})
            </h4>
            <p className="text-xs text-slate-500">
              {stats.surveyCompleted} of {stats.totalStudents} Completed &bull; {stats.surveyPending} Remaining
            </p>
          </div>
          <span className="text-sm font-bold text-blue-800">
            {stats.completionRate}% Done
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
          <div
            className="bg-linear-to-r from-blue-600 to-emerald-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Recent Survey Activity Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Survey Activity (हाल ही में किया गया सर्वे)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time log of surveyed students</p>
          </div>
          <button
            onClick={() => setActiveTab('students')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            View All Students →
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No recent activity recorded yet. Click below to view student records.
            <div className="mt-3">
              <button
                onClick={() => setActiveTab('students')}
                className="bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-blue-800 cursor-pointer"
              >
                View Students List
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">School Name</th>
                  <th className="py-2.5 px-3">Block</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Survey Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivity.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {student.student_name_marksheet}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={student.school_name}>
                      {student.school_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {student.block_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {student.apaar_pending_reason || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
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
                    <td className="py-2.5 px-3 text-slate-500">
                      {student.survey_date ? new Date(student.survey_date).toLocaleDateString('en-IN') : 'Just now'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
