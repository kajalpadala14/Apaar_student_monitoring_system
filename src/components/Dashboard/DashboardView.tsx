import React, { useState, useMemo } from 'react';
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
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Layers,
  Table,
} from 'lucide-react';
import { Student } from '../../types/student';
import { ReportPreviewModal, ReportPreviewData } from '../Reports/ReportPreviewModal';
import {
  exportStudentDetailedReport,
  exportBlockWiseReasonMatrixReport,
  exportBlockWiseMultiSheetReport,
} from '../../lib/excel';
import { generatePDFReport } from '../../lib/pdf';

export const DashboardView: React.FC = () => {
  const {
    students,
    filteredStudents,
    stats,
    blockSummaries,
    reasonCounts,
    recentActivity,
    setActiveTab,
    setActiveFilters,
    currentUser,
  } = useStudents();

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null);

  const isSchoolUser = currentUser?.role === 'SCHOOL_USER';

  const distinctBlocks = useMemo(() => {
    const defaultBlocks = ['DANTEWADA', 'GEEDAM', 'KUAKONDA', 'KATEKALYAN'];
    const found = Array.from(
      new Set(
        filteredStudents
          .map((s) => (s.block_name || '').toUpperCase().trim())
          .filter(Boolean)
      )
    ).sort();
    return found.length > 0 ? found : defaultBlocks;
  }, [filteredStudents]);

  const blockReasonMatrix = useMemo(() => {
    const matrixMap = new Map<string, Record<string, number>>();
    const blockTotals: Record<string, number> = {};
    distinctBlocks.forEach((b) => { blockTotals[b] = 0; });
    let totalCount = 0;

    filteredStudents.forEach((s) => {
      if (s.apaar_pending_reason && s.apaar_pending_reason.trim()) {
        const r = s.apaar_pending_reason.trim();
        const b = (s.block_name || '').toUpperCase().trim();
        if (!matrixMap.has(r)) {
          const init: Record<string, number> = {};
          distinctBlocks.forEach((blk) => { init[blk] = 0; });
          matrixMap.set(r, init);
        }
        const counts = matrixMap.get(r)!;
        if (b in counts) {
          counts[b]++;
        } else {
          counts[b] = 1;
        }
        blockTotals[b] = (blockTotals[b] || 0) + 1;
        totalCount++;
      }
    });

    const rows = Array.from(matrixMap.entries()).map(([reason, counts]) => {
      const rowTotal = Object.values(counts).reduce((sum, val) => sum + val, 0);
      const percentage = totalCount > 0 ? ((rowTotal / totalCount) * 100).toFixed(1) : '0';
      return {
        reason,
        counts,
        total: rowTotal,
        percentage
      };
    }).sort((a, b) => b.total - a.total);

    return {
      rows,
      distinctBlocks,
      blockTotals,
      totalCount
    };
  }, [filteredStudents, distinctBlocks]);

  const formatApaarStatus = (status?: string) => {
    return status === 'YES' ? 'बन गई (YES)' : 'लंबित (Pending)';
  };

  const formatSurveyStatus = (status?: string) => {
    if (status === 'SURVEY COMPLETED') return 'सर्वे पूर्ण (Completed)';
    if (status === 'PENDING') return 'सर्वे लंबित (Pending)';
    if (status === 'FOLLOW-UP REQUIRED') return 'फॉलो-अप (Follow-up)';
    if (status === 'RESOLVED') return 'निराकृत (Resolved)';
    return status || '-';
  };

  const detailedPreviewHeaders = [
    'क्र.',
    'ब्लॉक',
    'संकुल',
    'स्कूल का नाम',
    'UDISE',
    'कक्षा',
    'पेन नंबर',
    'विद्यार्थी नाम (मार्कशीट)',
    'APAAR बन गई?',
    'नाम मिलान',
    'जन्मतिथि मिलान',
    'दस्तावेज़ उपलब्धता',
    'आधार उपलब्ध',
    'अपार न बनने का कारण',
    'सर्वे स्थिति',
    'सर्वेयर'
  ];

  const studentToPreviewRow = (s: Student, idx: number) => [
    idx + 1,
    s.block_name || '',
    s.sankul_name || '',
    s.school_name || '',
    s.udise_code || '',
    s.class_name || '',
    s.student_pen_number || '',
    s.student_name_marksheet || '',
    s.is_apaar_generated === 'YES' ? 'YES (बन गई)' : 'NO (लंबित)',
    s.name_match_status || '-',
    s.dob_match_status || '-',
    s.documents_available || '-',
    s.is_aadhaar_provided || '-',
    s.apaar_pending_reason || '-',
    s.survey_status || '',
    s.surveyor_name || '-'
  ];

  const getReasonStudents = (reasonName: string, blockName: string = '') => {
    return filteredStudents.filter((s) => {
      if (reasonName && s.apaar_pending_reason?.trim() !== reasonName.trim()) return false;
      if (blockName && (s.block_name || '').toUpperCase().trim() !== blockName.toUpperCase().trim()) return false;
      return !!s.apaar_pending_reason;
    });
  };

  const handlePreviewReasonDetailsExcel = (reasonName: string, blockName: string = '') => {
    const targetStudents = getReasonStudents(reasonName, blockName);
    const rows = targetStudents.map(studentToPreviewRow);
    const scopeLabel = blockName ? `ब्लॉक: ${blockName}` : '';
    const reasonLabel = reasonName ? `कारण: ${reasonName}` : 'सभी कारण (All Reasons)';
    const safeTitle = scopeLabel ? `कारण-वार विस्तृत छात्र रिपोर्ट (${scopeLabel} - ${reasonLabel})` : `कारण-वार विस्तृत छात्र रिपोर्ट: ${reasonLabel}`;
    
    let safeFilename = 'APAAR';
    if (blockName) safeFilename += `_${blockName.replace(/[:\\/?*\[\]\s]/g, '_')}`;
    if (reasonName) safeFilename += `_Reason_${reasonName.replace(/[:\\/?*\[\]\s]/g, '_').slice(0, 20)}`;
    else safeFilename += '_All_Reasons';
    safeFilename += '_Students';

    setPreviewData({
      title: `${safeTitle} (${targetStudents.length.toLocaleString('en-IN')} छात्र)`,
      format: 'excel',
      filename: safeFilename,
      sheetName: blockName ? `${blockName.slice(0, 15)}_Students` : 'Reason_Students',
      headers: detailedPreviewHeaders,
      rows,
      totalRecords: targetStudents.length,
      onDownload: () => exportStudentDetailedReport(targetStudents, safeFilename)
    });
  };

  const handlePreviewReasonDetailsPDF = (reasonName: string, blockName: string = '') => {
    const targetStudents = getReasonStudents(reasonName, blockName);
    const pdfHeaders = [
      'क्र.',
      'ब्लॉक (Block)',
      'संकुल (Cluster)',
      'स्कूल का नाम (School)',
      'कक्षा',
      'PEN नंबर',
      'विद्यार्थी नाम (Student Name)',
      'अपार लंबित कारण (Pending Reason)',
      'APAAR स्थिति',
      'सर्वेक्षण स्थिति'
    ];
    const pdfRows = targetStudents.map((s, idx) => [
      idx + 1,
      s.block_name || '-',
      s.sankul_name || '-',
      s.school_name || '-',
      s.class_name || '-',
      s.student_pen_number || '-',
      s.student_name_marksheet || '-',
      s.apaar_pending_reason || '-',
      formatApaarStatus(s.is_apaar_generated),
      formatSurveyStatus(s.survey_status)
    ]);
    const scopeLabel = blockName ? `[ब्लॉक: ${blockName}] ` : '';
    const reasonLabel = reasonName ? `कारण: ${reasonName}` : 'सभी कारणों की विस्तृत रिपोर्ट';
    const safeTitle = `${scopeLabel}${reasonLabel}`;
    
    let safeFilename = 'APAAR';
    if (blockName) safeFilename += `_${blockName.replace(/[:\\/?*\[\]\s]/g, '_')}`;
    if (reasonName) safeFilename += `_Reason_${reasonName.replace(/[:\\/?*\[\]\s]/g, '_').slice(0, 20)}`;
    else safeFilename += '_All_Reasons';
    safeFilename += '_PDF';

    setPreviewData({
      title: `${safeTitle} (${targetStudents.length.toLocaleString('en-IN')} छात्र)`,
      subtitle: `कार्यालय कलेक्टर एवं जिला मिशन संचालक, समग्र शिक्षा, जिला-दंतेवाड़ा (छ.ग.)`,
      format: 'pdf',
      filename: safeFilename,
      headers: pdfHeaders,
      rows: pdfRows,
      totalRecords: targetStudents.length,
      onDownload: (onProgress) => generatePDFReport({
        title: safeTitle,
        subtitle: `कार्यालय कलेक्टर एवं जिला मिशन संचालक, समग्र शिक्षा, जिला-दंतेवाड़ा (छ.ग.)`,
        filename: safeFilename,
        headers: pdfHeaders,
        rows: pdfRows,
        onProgress
      })
    });
  };

  const handlePreviewBlockReasonMatrixExcel = () => {
    const { rows, distinctBlocks, blockTotals, totalCount } = blockReasonMatrix;
    const excelRows = rows.map((r, idx) => {
      const obj: Record<string, any> = {
        'क्र. (S.No.)': idx + 1,
        'लंबित कारण (Pending Reason)': r.reason,
      };
      distinctBlocks.forEach((b) => {
        obj[b] = r.counts[b] || 0;
      });
      obj['कुल योग (Total)'] = r.total;
      obj['प्रतिशत (%)'] = `${r.percentage}%`;
      return obj;
    });

    const totalRow: Record<string, any> = {
      'क्र. (S.No.)': '',
      'लंबित कारण (Pending Reason)': 'कुल योग (Grand Total)',
    };
    distinctBlocks.forEach((b) => {
      totalRow[b] = blockTotals[b] || 0;
    });
    totalRow['कुल योग (Total)'] = totalCount;
    totalRow['प्रतिशत (%)'] = '100%';
    excelRows.push(totalRow);

    const headers = ['क्र.', 'लंबित कारण (Pending Reason)', ...distinctBlocks, 'कुल योग (Total)', 'प्रतिशत (%)'];
    const previewRows = rows.map((r, idx) => [
      idx + 1,
      r.reason,
      ...distinctBlocks.map((b) => r.counts[b] || 0),
      r.total,
      `${r.percentage}%`
    ]);
    previewRows.push([
      '',
      'कुल योग (Grand Total)',
      ...distinctBlocks.map((b) => blockTotals[b] || 0),
      totalCount,
      '100%'
    ]);

    setPreviewData({
      title: `Block-wise Reason Analysis Matrix (ब्लॉक-वार कारण विश्लेषण) - ${totalCount.toLocaleString('en-IN')} छात्र`,
      subtitle: 'District Dantewada - Reason Breakdown across Blocks',
      format: 'excel',
      filename: 'Dantewada_Block_Wise_Reason_Matrix',
      sheetName: 'Block_Reason_Matrix',
      headers,
      rows: previewRows,
      totalRecords: rows.length,
      onDownload: () => exportBlockWiseReasonMatrixReport(excelRows, 'Dantewada_Block_Wise_Reason_Matrix')
    });
  };

  const handlePreviewBlockReasonMatrixPDF = () => {
    const { rows, distinctBlocks, blockTotals, totalCount } = blockReasonMatrix;
    const pdfHeaders = ['क्र.', 'लंबित कारण (Pending Reason)', ...distinctBlocks, 'कुल छात्र (Total)', 'प्रतिशत (%)'];
    const pdfRows = rows.map((r, idx) => [
      idx + 1,
      r.reason,
      ...distinctBlocks.map((b) => r.counts[b] || 0),
      r.total,
      `${r.percentage}%`
    ]);
    pdfRows.push([
      '',
      'कुल योग (Grand Total)',
      ...distinctBlocks.map((b) => blockTotals[b] || 0),
      totalCount,
      '100%'
    ]);

    setPreviewData({
      title: 'BLOCK-WISE APAAR PENDING REASON REPORT (ब्लॉक-वार कारण विश्लेषण रिपोर्ट)',
      subtitle: `समग्र शिक्षा, जिला-दंतेवाड़ा (छ.ग.) - सभी 4 ब्लॉकों में अपार लंबित कारणों की तुलना (कुल: ${totalCount} छात्र)`,
      format: 'pdf',
      filename: 'Dantewada_Block_Wise_Reason_Report_PDF',
      headers: pdfHeaders,
      rows: pdfRows,
      totalRecords: rows.length,
      onDownload: (onProgress) => generatePDFReport({
        title: 'BLOCK-WISE APAAR PENDING REASON REPORT',
        subtitle: `समग्र शिक्षा, जिला-दंतेवाड़ा (छ.ग.) - ब्लॉक-वार कारण तुलना (कुल: ${totalCount} छात्र)`,
        filename: 'Dantewada_Block_Wise_Reason_Report_PDF',
        headers: pdfHeaders,
        rows: pdfRows,
        onProgress
      })
    });
  };

  const handleExportBlockWiseMultiSheet = () => {
    const { rows, distinctBlocks, totalCount } = blockReasonMatrix;
    const summaryRows = rows.map((r, idx) => {
      const obj: Record<string, any> = {
        'क्र.': idx + 1,
        'Pending Reason': r.reason,
      };
      distinctBlocks.forEach((b) => {
        obj[b] = r.counts[b] || 0;
      });
      obj['Total'] = r.total;
      obj['Percentage'] = `${r.percentage}%`;
      return obj;
    });

    const blockGroups = distinctBlocks.map((b) => ({
      block: b,
      students: filteredStudents.filter((s) => (s.block_name || '').toUpperCase().trim() === b && !!s.apaar_pending_reason)
    }));

    exportBlockWiseMultiSheetReport(blockGroups, summaryRows, 'Dantewada_Block_Wise_Reason_Students');
  };

  const handleFilterReasonAndBlock = (reasonName: string, blockName: string = '') => {
    setActiveFilters((prev) => ({
      ...prev,
      reason: reasonName,
      block: blockName || prev.block,
    }));
    setActiveTab('students');
  };

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

  const handleFilterReason = (reasonName: string) => {
    setActiveFilters((prev) => ({ ...prev, reason: reasonName }));
    setActiveTab('students');
  };

  const reasonsList = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const maxReasonCount = reasonsList.length > 0 ? Math.max(...reasonsList.map(([_, count]) => count)) : 1;

  // Class-wise breakdown for School Users
  const classSummaries = useMemo(() => {
    if (!isSchoolUser) return [];
    const map = new Map<string, { total: number; completed: number; pending: number; followUp: number; resolved: number; apaarGenerated: number }>();
    students.forEach((s) => {
      const c = (s.class_name || 'Unassigned').toString();
      let item = map.get(c);
      if (!item) {
        item = { total: 0, completed: 0, pending: 0, followUp: 0, resolved: 0, apaarGenerated: 0 };
        map.set(c, item);
      }
      item.total++;
      if (s.survey_status === 'SURVEY COMPLETED') item.completed++;
      else if (s.survey_status === 'PENDING') item.pending++;
      else if (s.survey_status === 'FOLLOW-UP REQUIRED') item.followUp++;
      else if (s.survey_status === 'RESOLVED') item.resolved++;

      if (s.is_apaar_generated === 'YES') {
        item.apaarGenerated++;
      }
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([className, counts]) => ({
        className,
        totalStudents: counts.total,
        surveyCompleted: counts.completed,
        surveyPending: counts.pending,
        apaarGenerated: counts.apaarGenerated,
        apaarRate: counts.total > 0 ? parseFloat(((counts.apaarGenerated / counts.total) * 100).toFixed(1)) : 0,
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

      {/* APAAR ID GENERATION STATUS BANNER */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                APAAR ID Generation Status (अपार आईडी बनने की स्थिति)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {stats.apaarGeneratedRate ?? 0}% Generated
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              कुल <strong>{stats.totalStudents.toLocaleString('en-IN')}</strong> में से <strong>{(stats.apaarGeneratedCount ?? 0).toLocaleString('en-IN')}</strong> छात्रों की APAAR ID बन चुकी है एवं <strong>{(stats.apaarPendingCount ?? 0).toLocaleString('en-IN')}</strong> छात्रों की लंबित है।
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveTab('students')}
            className="text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center space-x-1"
          >
            <span>छात्र सूची देखें</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 items-stretch">
        
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

        {/* Card 2: APAAR ID GENERATED (बन गई है) */}
        <div 
          onClick={() => {
            setActiveFilters((prev) => ({ ...prev, apaarStatus: 'YES', surveyStatus: '' }));
            setActiveTab('students');
          }}
          className="bg-white border-2 border-emerald-300 rounded-xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-emerald-500 hover:shadow-md cursor-pointer bg-gradient-to-br from-white via-white to-emerald-50/50 group"
          title="क्लिक करें: APAAR बन गई (YES) वाले सभी विद्यार्थियों की सूची देखें"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-extrabold text-emerald-800 uppercase tracking-wider truncate mr-1 flex items-center space-x-1 group-hover:text-emerald-950">
                <span>APAAR बन गई (YES)</span>
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5 flex items-baseline justify-between">
              <span className="text-xl sm:text-3xl font-black tracking-tight text-emerald-700 tabular-nums">
                {(stats.apaarGeneratedCount ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                {stats.apaarGeneratedRate ?? 0}%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 sm:pt-2 border-t border-emerald-100 text-[10px] sm:text-xs text-emerald-800 flex items-center justify-between">
            <span className="truncate font-semibold flex items-center space-x-1">
              <span>छात्र देखें</span>
              <span>&rarr;</span>
            </span>
            <span className="text-[9px] sm:text-[11px] text-emerald-600 hidden xs:inline">Direct & Verified</span>
          </div>
        </div>

        {/* Card 3: SURVEY COMPLETED */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wider truncate mr-1">
                Survey Completed
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50/80 border border-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5">
              <span className="text-xl sm:text-3xl font-bold tracking-tight text-blue-800 tabular-nums">
                {stats.surveyCompleted.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 text-[10px] sm:text-xs text-slate-500 flex items-center justify-between">
            <span className="text-blue-700 font-medium truncate">Verified & Recorded</span>
            <span className="text-[9px] sm:text-[11px] text-slate-400 hidden xs:inline">सत्यापित</span>
          </div>
        </div>

        {/* Card 4: SURVEY PENDING */}
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

        {/* Card 5: SURVEY COMPLETION */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200/90 rounded-xl p-3 sm:p-5 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-purple-700 uppercase tracking-wider truncate mr-1">
                Survey Completion
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50/80 border border-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-1.5 sm:mt-2.5 flex items-baseline justify-between">
              <span className="text-xl sm:text-3xl font-bold tracking-tight text-purple-800 tabular-nums">
                {stats.completionRate}%
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">100%</span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 sm:pt-2 border-t border-slate-100">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
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
                        <span>APAAR बन गई: <strong className="text-emerald-700">{c.apaarGenerated} ({c.apaarRate}%)</strong></span>
                        <span>Pending: <strong className="text-amber-700">{c.surveyPending}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <table className="hidden sm:table w-full min-w-[560px] text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3.5">Class (कक्षा)</th>
                      <th className="py-2.5 px-3.5 text-right">Total Students</th>
                      <th className="py-2.5 px-3.5 text-right text-emerald-800">APAAR बन गई (YES)</th>
                      <th className="py-2.5 px-3.5 text-right">Survey Done</th>
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
                          {c.apaarGenerated.toLocaleString('en-IN')} <span className="text-[11px] font-normal text-emerald-600">({c.apaarRate}%)</span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-blue-700 tabular-nums">
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
                        <span>APAAR बन गई: <strong className="text-emerald-700">{b.apaarGenerated?.toLocaleString('en-IN') || 0} ({b.apaarRate || 0}%)</strong></span>
                        <span>Pending: <strong className="text-amber-700">{b.surveyPending.toLocaleString('en-IN')}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <table className="hidden sm:table w-full min-w-[560px] text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3.5">Block (ब्लॉक)</th>
                      <th className="py-2.5 px-3.5 text-right">Total Students</th>
                      <th className="py-2.5 px-3.5 text-right text-emerald-800">APAAR बन गई (YES)</th>
                      <th className="py-2.5 px-3.5 text-right">Survey Done</th>
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
                          {(b.apaarGenerated || 0).toLocaleString('en-IN')} <span className="text-[11px] font-normal text-emerald-600">({b.apaarRate || 0}%)</span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-blue-700 tabular-nums">
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
              <div className="space-y-2">
                {reasonsList.slice(0, 10).map(([reason, count]) => {
                  const pct = stats.surveyCompleted > 0 ? ((count / stats.surveyCompleted) * 100).toFixed(1) : '0';
                  const barWidth = Math.max(8, Math.round((count / maxReasonCount) * 100));
                  return (
                    <div
                      key={reason}
                      onClick={() => handleFilterReason(reason)}
                      className="p-1.5 -mx-1.5 rounded-lg hover:bg-amber-50/80 transition-all cursor-pointer group space-y-1"
                      title={`Click to view ${count} students: "${reason}"`}
                    >
                      <div className="flex justify-between text-xs items-center">
                        <span className="font-medium text-slate-700 group-hover:text-amber-900 group-hover:underline truncate pr-2" title={reason}>
                          {reason}
                        </span>
                        <div className="flex items-center space-x-1 shrink-0">
                          <span className="font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                            {count} ({pct}%)
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-800 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-600 h-1.5 rounded-full transition-all duration-300 group-hover:bg-amber-700"
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
            <span>क्लिक करके छात्रों का विवरण देखें</span>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer inline-flex items-center space-x-0.5"
            >
              <span>रिपोर्ट्स</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>

      </div>

      {/* 6B. BLOCK-WISE REASON ANALYSIS MATRIX (User Requested: Dashboard Integration + Reason & Block Download) */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                Cross-Tab Analysis
              </span>
              <span className="text-xs font-semibold text-slate-500">
                कुल {blockReasonMatrix.totalCount.toLocaleString('en-IN')} छात्र
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-1 flex items-center space-x-2">
              <Table className="w-4 h-4 text-indigo-700" />
              <span>Block-wise Reason Analysis Matrix (ब्लॉक-वार लंबित कारण विश्लेषण)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              सभी 4 ब्लॉकों (दंतेवाड़ा, गीदम, कुआकोंडा, कटेकल्याण) में अपार न बनने के कारणों का विस्तृत क्रॉस-टैब विश्लेषण
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
            <button
              onClick={handlePreviewBlockReasonMatrixExcel}
              className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="पूरा मैट्रिक्स एक्सेल (.xlsx) में डाउनलोड करें"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel मैट्रिक्स</span>
            </button>
            <button
              onClick={handlePreviewBlockReasonMatrixPDF}
              className="inline-flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="पूरा मैट्रिक्स पीडीएफ (.pdf) में डाउनलोड करें"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF मैट्रिक्स</span>
            </button>
            <button
              onClick={handleExportBlockWiseMultiSheet}
              className="inline-flex items-center space-x-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="प्रत्येक ब्लॉक की अलग शीट वाला एक्सेल"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ब्लॉक मल्टी-शीट</span>
            </button>
          </div>
        </div>

        {/* Reason & Block Downloader Control Bar */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-3.5 sm:px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  विशिष्ट कारण चुनें (Select Reason):
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                >
                  <option value="">-- सभी कारण (All Reasons) --</option>
                  {blockReasonMatrix.rows.map((r) => (
                    <option key={r.reason} value={r.reason}>
                      {r.reason} ({r.total.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  ब्लॉक चुनें (Select Block):
                </label>
                <select
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                >
                  <option value="">-- सभी ब्लॉक (All Blocks) --</option>
                  {blockReasonMatrix.distinctBlocks.map((b) => (
                    <option key={b} value={b}>
                      {b} ({(blockReasonMatrix.blockTotals[b] || 0).toLocaleString('en-IN')} छात्र)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
              <button
                onClick={() => handlePreviewReasonDetailsExcel(selectedReason, selectedBlock)}
                className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="चयनित कारण एवं ब्लॉक के विद्यार्थियों की एक्सेल रिपोर्ट"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel विवरण डाउनलोड</span>
              </button>

              <button
                onClick={() => handlePreviewReasonDetailsPDF(selectedReason, selectedBlock)}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="चयनित कारण एवं ब्लॉक के विद्यार्थियों की पीडीएफ रिपोर्ट"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF विवरण डाउनलोड</span>
              </button>

              <button
                onClick={() => handleFilterReasonAndBlock(selectedReason, selectedBlock)}
                className="inline-flex items-center space-x-1 text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="छात्र सूची में देखें"
              >
                <span>छात्र सूची</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* The Matrix Table */}
        {blockReasonMatrix.rows.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No survey reason data recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3 w-10 text-center">क्र.</th>
                  <th className="py-2.5 px-3">लंबित कारण (Pending Reason)</th>
                  {blockReasonMatrix.distinctBlocks.map((b) => (
                    <th key={b} className="py-2.5 px-3 text-right">
                      {b}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900 bg-slate-100/70">
                    कुल योग (Total)
                  </th>
                  <th className="py-2.5 px-3 text-right">प्रतिशत (%)</th>
                  <th className="py-2.5 px-3 text-right min-w-[150px]">डाउनलोड (Reports)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blockReasonMatrix.rows.map((r, idx) => (
                  <tr key={r.reason} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td
                      className="py-2.5 px-3 font-semibold text-slate-900 hover:text-indigo-700 cursor-pointer"
                      onClick={() => handleFilterReasonAndBlock(r.reason)}
                      title={`क्लिक करके "${r.reason}" के छात्र देखें`}
                    >
                      {r.reason}
                    </td>
                    {blockReasonMatrix.distinctBlocks.map((b) => {
                      const cnt = r.counts[b] || 0;
                      return (
                        <td
                          key={b}
                          className={`py-2.5 px-3 text-right tabular-nums font-medium ${
                            cnt > 0
                              ? 'text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer'
                              : 'text-slate-300'
                          }`}
                          onClick={() => {
                            if (cnt > 0) {
                              handlePreviewReasonDetailsExcel(r.reason, b);
                            }
                          }}
                          title={cnt > 0 ? `${b} में "${r.reason}" के ${cnt} छात्र (क्लिक करके एक्सेल डाउनलोड करें)` : 'शून्य छात्र'}
                        >
                          {cnt > 0 ? cnt.toLocaleString('en-IN') : '-'}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900 tabular-nums bg-indigo-50/30">
                      {r.total.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">
                      {r.percentage}%
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handlePreviewReasonDetailsExcel(r.reason)}
                          className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          title={`इस कारण के सभी ${r.total} छात्रों की एक्सेल फाइल`}
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Excel</span>
                        </button>
                        <button
                          onClick={() => handlePreviewReasonDetailsPDF(r.reason)}
                          className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          title={`इस कारण के सभी ${r.total} छात्रों की पीडीएफ फाइल`}
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                  <td colSpan={2} className="py-2.5 px-3 text-left">
                    कुल योग (Grand Total)
                  </td>
                  {blockReasonMatrix.distinctBlocks.map((b) => (
                    <td key={b} className="py-2.5 px-3 text-right tabular-nums text-slate-900">
                      {(blockReasonMatrix.blockTotals[b] || 0).toLocaleString('en-IN')}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-right tabular-nums text-indigo-950 font-extrabold bg-indigo-100/70">
                    {blockReasonMatrix.totalCount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    100%
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={handlePreviewBlockReasonMatrixExcel}
                      className="text-[11px] text-indigo-700 hover:text-indigo-900 underline font-semibold cursor-pointer"
                    >
                      मैट्रिक्स डाउनलोड
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
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
                    <div className="flex items-center gap-1 shrink-0">
                      {student.is_apaar_generated === 'YES' ? (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          APAAR बन गई (YES)
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          APAAR लंबित
                        </span>
                      )}
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold ${
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
              <table className="w-full min-w-[720px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3.5">Student Name</th>
                    <th className="py-2.5 px-3.5">School Name</th>
                    <th className="py-2.5 px-3.5">Block</th>
                    <th className="py-2.5 px-3.5">APAAR स्थिति</th>
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
                      <td className="py-2.5 px-3.5 text-slate-600 max-w-[180px] truncate" title={student.school_name}>
                        {student.school_name}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700">
                        {student.block_name}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {student.is_apaar_generated === 'YES' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ बन गई (YES)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            लंबित (NO)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 max-w-[160px] truncate" title={student.apaar_pending_reason || ''}>
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

      {/* Report Preview Modal */}
      <ReportPreviewModal data={previewData} onClose={() => setPreviewData(null)} />

    </div>
  );
};
