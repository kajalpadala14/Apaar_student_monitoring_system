import React, { useState, useMemo } from 'react';
import { useStudents } from '../../context/StudentContext';
import { Student } from '../../types/student';
import { exportToExcel, exportStudentDetailedReport, exportReasonWiseMultiSheetReport } from '../../lib/excel';
import { generatePDFReport } from '../../lib/pdf';
import {
  FileSpreadsheet,
  Download,
  Filter,
  FileText,
  BarChart2,
  Building,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
  ArrowUpRight,
  Layers,
  ListFilter
} from 'lucide-react';
import { SURVEY_REASONS, SURVEY_STATUS_OPTIONS } from '../../types/student';
import { ReportPreviewModal, ReportPreviewData } from './ReportPreviewModal';

export const ReportsView: React.FC = () => {
  const { students, filteredStudents, activeFilters, setActiveFilters, resetFilters, currentUser, setActiveTab } = useStudents();
  const isSchoolUser = currentUser?.role === 'SCHOOL_USER';
  const [selectedReportView, setSelectedReportView] = useState<'block' | 'school' | 'reason' | 'detailed'>(
    currentUser?.role === 'SCHOOL_USER' ? 'school' : 'block'
  );
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null);
  const [selectedDetailedReason, setSelectedDetailedReason] = useState<string>('');

  // Dynamic filter options
  const availableReasons = useMemo(() => {
    const set = new Set<string>();
    SURVEY_REASONS.forEach((r) => set.add(r));
    students.forEach((s) => {
      if (s.apaar_pending_reason && s.apaar_pending_reason.trim()) {
        set.add(s.apaar_pending_reason.trim());
      }
    });
    return Array.from(set);
  }, [students]);

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

  // 1. Block-wise Report Data
  const blockReportData = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; pending: number; followUp: number; resolved: number }>();
    ['DANTEWADA', 'GEEDAM', 'KUAKONDA', 'KATEKALYAN'].forEach((b) => {
      map.set(b, { total: 0, completed: 0, pending: 0, followUp: 0, resolved: 0 });
    });

    filteredStudents.forEach((s) => {
      const b = (s.block_name || '').toUpperCase().trim();
      let item = map.get(b);
      if (!item) {
        item = { total: 0, completed: 0, pending: 0, followUp: 0, resolved: 0 };
        map.set(b, item);
      }
      item.total++;
      if (s.survey_status === 'SURVEY COMPLETED') item.completed++;
      else if (s.survey_status === 'PENDING') item.pending++;
      else if (s.survey_status === 'FOLLOW-UP REQUIRED') item.followUp++;
      else if (s.survey_status === 'RESOLVED') item.resolved++;
    });

    return Array.from(map.entries()).map(([block, counts]) => {
      const rate = counts.total > 0 ? parseFloat(((counts.completed + counts.resolved) / counts.total * 100).toFixed(1)) : 0;
      return {
        block,
        total: counts.total,
        completed: counts.completed,
        pending: counts.pending,
        followUp: counts.followUp,
        resolved: counts.resolved,
        completionRate: rate,
      };
    });
  }, [filteredStudents]);

  // 2. School-wise Report Data
  const schoolReportData = useMemo(() => {
    const map = new Map<string, { schoolName: string; udise: string; block: string; total: number; completed: number; pending: number; resolved: number }>();

    filteredStudents.forEach((s) => {
      const key = `${s.udise_code}_${s.school_name}`;
      let item = map.get(key);
      if (!item) {
        item = { schoolName: s.school_name, udise: s.udise_code, block: s.block_name, total: 0, completed: 0, pending: 0, resolved: 0 };
        map.set(key, item);
      }
      item.total++;
      if (s.survey_status === 'SURVEY COMPLETED') item.completed++;
      else if (s.survey_status === 'PENDING') item.pending++;
      else if (s.survey_status === 'RESOLVED') item.resolved++;
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredStudents]);

  // 3. Reason-wise Report Data
  const reasonReportData = useMemo(() => {
    const map = new Map<string, { count: number; completed: number; followUp: number; resolved: number }>();

    filteredStudents.forEach((s) => {
      if (s.apaar_pending_reason) {
        const r = s.apaar_pending_reason.trim();
        let item = map.get(r);
        if (!item) {
          item = { count: 0, completed: 0, followUp: 0, resolved: 0 };
          map.set(r, item);
        }
        item.count++;
        if (s.survey_status === 'SURVEY COMPLETED') item.completed++;
        else if (s.survey_status === 'FOLLOW-UP REQUIRED') item.followUp++;
        else if (s.survey_status === 'RESOLVED') item.resolved++;
      }
    });

    const totalSurveyed = filteredStudents.filter((s) => s.apaar_pending_reason).length;

    return Array.from(map.entries())
      .map(([reason, stats]) => ({
        reason,
        count: stats.count,
        percentage: totalSurveyed > 0 ? ((stats.count / totalSurveyed) * 100).toFixed(1) : '0',
        completed: stats.completed,
        followUp: stats.followUp,
        resolved: stats.resolved,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredStudents]);

  // Preview Table Helpers
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

  // Helper to fetch students for a particular reason
  const getReasonStudents = (reasonName: string) => {
    return filteredStudents.filter((s) => s.apaar_pending_reason?.trim() === reasonName.trim());
  };

  // Preview & Export Single Reason Student Details (Excel)
  const handlePreviewReasonDetailsExcel = (reasonName: string) => {
    const targetStudents = reasonName ? getReasonStudents(reasonName) : filteredStudents.filter(s => !!s.apaar_pending_reason);
    const rows = targetStudents.map(studentToPreviewRow);
    const safeTitle = reasonName ? `कारण-वार विस्तृत छात्र रिपोर्ट: ${reasonName}` : 'All Reasons Detailed Students Report';
    const safeFilename = reasonName
      ? `APAAR_Reason_${reasonName.replace(/[:\\/?*\[\]\s]/g, '_').slice(0, 25)}_Students`
      : 'APAAR_All_Reasons_Detailed_Students';

    setPreviewData({
      title: `${safeTitle} (${targetStudents.length.toLocaleString('en-IN')} छात्र)`,
      format: 'excel',
      filename: safeFilename,
      sheetName: 'Reason_Students',
      headers: detailedPreviewHeaders,
      rows,
      totalRecords: targetStudents.length,
      onDownload: () => exportStudentDetailedReport(targetStudents, safeFilename)
    });
  };

  // Preview & Export Single Reason Student Details (PDF)
  const handlePreviewReasonDetailsPDF = (reasonName: string) => {
    const targetStudents = reasonName ? getReasonStudents(reasonName) : filteredStudents.filter(s => !!s.apaar_pending_reason);
    const pdfHeaders = ['क्र.', 'ब्लॉक', 'संकुल', 'स्कूल', 'कक्षा', 'PEN', 'विद्यार्थी नाम', 'कारण', 'स्थिति'];
    const pdfRows = targetStudents.slice(0, 100).map((s, idx) => [
      idx + 1,
      s.block_name || '-',
      s.sankul_name || '-',
      s.school_name || '-',
      s.class_name || '-',
      s.student_pen_number || '-',
      s.student_name_marksheet || '-',
      s.apaar_pending_reason || '-',
      s.survey_status || '-'
    ]);
    const safeTitle = reasonName ? `कारण: ${reasonName}` : 'ALL REASONS DETAILED SNAPSHOT';
    const safeFilename = reasonName
      ? `APAAR_Reason_${reasonName.replace(/[:\\/?*\[\]\s]/g, '_').slice(0, 25)}_PDF`
      : 'APAAR_All_Reasons_Students_PDF';

    setPreviewData({
      title: `${safeTitle} (${targetStudents.length.toLocaleString('en-IN')} छात्र)`,
      subtitle: `Dantewada APAAR Student Pending Reason Report`,
      format: 'pdf',
      filename: safeFilename,
      headers: pdfHeaders,
      rows: pdfRows,
      totalRecords: targetStudents.length,
      onDownload: () => generatePDFReport({
        title: safeTitle,
        subtitle: `Dantewada APAAR Student Pending Reason Report (${targetStudents.length} छात्र)`,
        filename: safeFilename,
        headers: pdfHeaders,
        rows: pdfRows
      })
    });
  };

  // Export All Reasons Multi-Sheet Excel
  const handleExportAllReasonsMultiSheet = () => {
    const reasonGroups = reasonReportData.map((r) => ({
      reason: r.reason,
      students: filteredStudents.filter((s) => s.apaar_pending_reason?.trim() === r.reason.trim())
    }));
    const summaryRows = reasonReportData.map((r) => ({
      'Reason (अपार न बनने का कारण)': r.reason,
      'Student Count (छात्र संख्या)': r.count,
      'Percentage (प्रतिशत)': `${r.percentage}%`,
      'Survey Completed (पूर्ण)': r.completed,
      'Follow-up Required (फॉलो-अप)': r.followUp,
      'Resolved (निराकृत)': r.resolved
    }));
    exportReasonWiseMultiSheetReport(reasonGroups, summaryRows, 'Dantewada_Reason_Wise_All_Students');
  };

  // Navigate to Students list filtered by reason
  const handleNavigateToReasonStudents = (reasonName: string) => {
    setActiveFilters((prev) => ({ ...prev, reason: reasonName }));
    setActiveTab('students');
  };

  // 1. Block Wise
  const handlePreviewBlockExcel = () => {
    const rows = blockReportData.map((b) => ({
      'Block': b.block,
      'Total Students': b.total,
      'Survey Completed': b.completed,
      'Survey Pending': b.pending,
      'Follow-up Required': b.followUp,
      'Resolved': b.resolved,
      'Completion %': `${b.completionRate}%`
    }));
    setPreviewData({
      title: 'Block Wise Survey Report (ब्लॉक-वार सर्वेक्षण रिपोर्ट)',
      format: 'excel',
      filename: 'Dantewada_Block_Wise_APAAR_Report',
      sheetName: 'Block_Summary',
      headers: ['Block', 'Total Students', 'Survey Completed', 'Survey Pending', 'Follow-up Required', 'Resolved', 'Completion %'],
      rows: blockReportData.map((b) => [b.block, b.total, b.completed, b.pending, b.followUp, b.resolved, `${b.completionRate}%`]),
      totalRecords: blockReportData.length,
      onDownload: () => exportToExcel(rows, 'Dantewada_Block_Wise_APAAR_Report', 'Block_Summary')
    });
  };

  const handlePreviewBlockPDF = () => {
    const headers = ['Block', 'Total Students', 'Survey Completed', 'Survey Pending', 'Follow-up Req.', 'Resolved', 'Completion %'];
    const rows = blockReportData.map((b) => [b.block, b.total, b.completed, b.pending, b.followUp, b.resolved, `${b.completionRate}%`]);
    setPreviewData({
      title: 'BLOCK-WISE APAAR PENDING SURVEY REPORT',
      format: 'pdf',
      filename: 'Dantewada_Block_Wise_Report',
      headers,
      rows,
      totalRecords: rows.length,
      onDownload: () => generatePDFReport({
        title: 'BLOCK-WISE APAAR PENDING SURVEY REPORT',
        filename: 'Dantewada_Block_Wise_Report',
        headers,
        rows
      })
    });
  };

  // 2. School Wise
  const handlePreviewSchoolExcel = () => {
    const rows = schoolReportData.map((s) => ({
      'School Name': s.schoolName,
      'UDISE Code': s.udise,
      'Block': s.block,
      'Total Students': s.total,
      'Survey Completed': s.completed,
      'Survey Pending': s.pending,
      'Resolved': s.resolved,
      'Completion %': `${s.total > 0 ? ((s.completed + s.resolved) / s.total * 100).toFixed(1) : 0}%`
    }));
    const previewRows = schoolReportData.map((s) => [
      s.schoolName,
      s.udise,
      s.block,
      s.total,
      s.completed,
      s.pending,
      s.resolved,
      `${s.total > 0 ? ((s.completed + s.resolved) / s.total * 100).toFixed(1) : 0}%`
    ]);
    setPreviewData({
      title: 'School Wise Survey Report (स्कूल-वार सर्वेक्षण रिपोर्ट)',
      format: 'excel',
      filename: 'Dantewada_School_Wise_APAAR_Report',
      sheetName: 'School_Summary',
      headers: ['School Name', 'UDISE Code', 'Block', 'Total Students', 'Survey Completed', 'Survey Pending', 'Resolved', 'Completion %'],
      rows: previewRows,
      totalRecords: schoolReportData.length,
      onDownload: () => exportToExcel(rows, 'Dantewada_School_Wise_APAAR_Report', 'School_Summary')
    });
  };

  const handlePreviewSchoolPDF = () => {
    const headers = ['School Name', 'UDISE Code', 'Block', 'Total Students', 'Completed', 'Pending', 'Resolved', 'Completion %'];
    const rows = schoolReportData.map((s) => [
      s.schoolName,
      s.udise,
      s.block,
      s.total,
      s.completed,
      s.pending,
      s.resolved,
      `${s.total > 0 ? ((s.completed + s.resolved) / s.total * 100).toFixed(1) : 0}%`
    ]);
    setPreviewData({
      title: 'SCHOOL-WISE APAAR PENDING SURVEY REPORT',
      format: 'pdf',
      filename: 'Dantewada_School_Wise_Report',
      headers,
      rows,
      totalRecords: rows.length,
      onDownload: () => generatePDFReport({
        title: 'SCHOOL-WISE APAAR PENDING SURVEY REPORT',
        filename: 'Dantewada_School_Wise_Report',
        headers,
        rows
      })
    });
  };

  // 3. Reason Wise
  const handlePreviewReasonExcel = () => {
    const rows = reasonReportData.map((r) => ({
      'Reason': r.reason,
      'Student Count': r.count,
      'Percentage': `${r.percentage}%`,
      'Survey Completed': r.completed,
      'Follow-up Required': r.followUp,
      'Resolved': r.resolved
    }));
    const previewRows = reasonReportData.map((r) => [
      r.reason,
      r.count,
      `${r.percentage}%`,
      r.completed,
      r.followUp,
      r.resolved
    ]);
    setPreviewData({
      title: 'Reason Wise Analysis Report (कारण-वार विश्लेषण रिपोर्ट)',
      format: 'excel',
      filename: 'Dantewada_Reason_Wise_APAAR_Report',
      sheetName: 'Reason_Analysis',
      headers: ['Reason', 'Student Count', 'Percentage', 'Survey Completed', 'Follow-up Required', 'Resolved'],
      rows: previewRows,
      totalRecords: reasonReportData.length,
      onDownload: () => exportToExcel(rows, 'Dantewada_Reason_Wise_APAAR_Report', 'Reason_Analysis')
    });
  };

  const handlePreviewReasonPDF = () => {
    const headers = ['Pending Reason', 'Student Count', 'Percentage %', 'Completed', 'Follow-up Req.', 'Resolved'];
    const rows = reasonReportData.map((r) => [r.reason, r.count, `${r.percentage}%`, r.completed, r.followUp, r.resolved]);
    setPreviewData({
      title: 'REASON-WISE APAAR PENDING ANALYSIS REPORT',
      format: 'pdf',
      filename: 'Dantewada_Reason_Wise_Report',
      headers,
      rows,
      totalRecords: rows.length,
      onDownload: () => generatePDFReport({
        title: 'REASON-WISE APAAR PENDING ANALYSIS REPORT',
        filename: 'Dantewada_Reason_Wise_Report',
        headers,
        rows
      })
    });
  };

  // 4. Survey Status
  const handlePreviewStatusExcel = () => {
    const statusStats = [
      { status: 'SURVEY COMPLETED', count: filteredStudents.filter((s) => s.survey_status === 'SURVEY COMPLETED').length },
      { status: 'PENDING', count: filteredStudents.filter((s) => s.survey_status === 'PENDING').length },
      { status: 'FOLLOW-UP REQUIRED', count: filteredStudents.filter((s) => s.survey_status === 'FOLLOW-UP REQUIRED').length },
      { status: 'RESOLVED', count: filteredStudents.filter((s) => s.survey_status === 'RESOLVED').length },
    ];
    const total = filteredStudents.length;
    const rows = statusStats.map((s) => ({
      'Survey Status': s.status,
      'Student Count': s.count,
      'Percentage': `${total > 0 ? ((s.count / total) * 100).toFixed(1) : 0}%`
    }));
    setPreviewData({
      title: 'Survey Status Summary Report (सर्वेक्षण स्थिति रिपोर्ट)',
      format: 'excel',
      filename: 'Dantewada_Survey_Status_Report',
      sheetName: 'Status_Summary',
      headers: ['Survey Status', 'Student Count', 'Percentage %'],
      rows: statusStats.map((s) => [s.status, s.count, `${total > 0 ? ((s.count / total) * 100).toFixed(1) : 0}%`]),
      totalRecords: statusStats.length,
      onDownload: () => exportToExcel(rows, 'Dantewada_Survey_Status_Report', 'Status_Summary')
    });
  };

  const handlePreviewStatusPDF = () => {
    const statusStats = [
      { status: 'SURVEY COMPLETED', count: filteredStudents.filter((s) => s.survey_status === 'SURVEY COMPLETED').length },
      { status: 'PENDING', count: filteredStudents.filter((s) => s.survey_status === 'PENDING').length },
      { status: 'FOLLOW-UP REQUIRED', count: filteredStudents.filter((s) => s.survey_status === 'FOLLOW-UP REQUIRED').length },
      { status: 'RESOLVED', count: filteredStudents.filter((s) => s.survey_status === 'RESOLVED').length },
    ];
    const total = filteredStudents.length;
    const headers = ['Survey Status', 'Student Count', 'Percentage %'];
    const rows = statusStats.map((s) => [s.status, s.count, `${total > 0 ? ((s.count / total) * 100).toFixed(1) : 0}%`]);
    setPreviewData({
      title: 'SURVEY STATUS SUMMARY REPORT',
      format: 'pdf',
      filename: 'Dantewada_Survey_Status_Report',
      headers,
      rows,
      totalRecords: rows.length,
      onDownload: () => generatePDFReport({
        title: 'SURVEY STATUS SUMMARY REPORT',
        filename: 'Dantewada_Survey_Status_Report',
        headers,
        rows
      })
    });
  };

  // 5. Pending Survey
  const handlePreviewPendingExcel = () => {
    const pendings = filteredStudents.filter((s) => s.survey_status === 'PENDING');
    const rows = pendings.map(studentToPreviewRow);
    setPreviewData({
      title: 'Pending Survey Students Report (लंबित सर्वेक्षण विद्यार्थी सूची)',
      format: 'excel',
      filename: 'Dantewada_Pending_Students_Report',
      sheetName: 'Pending_Students',
      headers: detailedPreviewHeaders,
      rows,
      totalRecords: pendings.length,
      onDownload: () => exportStudentDetailedReport(pendings, 'Dantewada_Pending_Students_Report')
    });
  };

  const handlePreviewPendingPDF = () => {
    const pendings = filteredStudents.filter((s) => s.survey_status === 'PENDING');
    const pdfHeaders = ['S.No', 'Block', 'Cluster', 'School Name', 'Student Name', 'PEN', 'Reason', 'Status'];
    const pdfRows = pendings.slice(0, 100).map((s, idx) => [
      idx + 1,
      s.block_name || '-',
      s.sankul_name || '-',
      s.school_name || '-',
      s.student_name_marksheet || '-',
      s.student_pen_number || '-',
      s.apaar_pending_reason || '-',
      s.survey_status || '-'
    ]);
    setPreviewData({
      title: 'PENDING SURVEY STUDENTS REPORT (Top 100 Snapshot)',
      format: 'pdf',
      filename: 'Dantewada_Pending_Students_PDF',
      headers: pdfHeaders,
      rows: pdfRows,
      totalRecords: pendings.length,
      onDownload: () => generatePDFReport({
        title: 'PENDING SURVEY STUDENTS REPORT (Top 100 Snapshot)',
        filename: 'Dantewada_Pending_Students_PDF',
        headers: pdfHeaders,
        rows: pdfRows
      })
    });
  };

  // 6. Completed Survey
  const handlePreviewCompletedExcel = () => {
    const completed = filteredStudents.filter((s) => s.survey_status === 'SURVEY COMPLETED');
    const rows = completed.map(studentToPreviewRow);
    setPreviewData({
      title: 'Completed Survey Students Report (पूर्ण सर्वेक्षण विद्यार्थी सूची)',
      format: 'excel',
      filename: 'Dantewada_Completed_Survey_Report',
      sheetName: 'Completed_Survey',
      headers: detailedPreviewHeaders,
      rows,
      totalRecords: completed.length,
      onDownload: () => exportStudentDetailedReport(completed, 'Dantewada_Completed_Survey_Report')
    });
  };

  const handlePreviewCompletedPDF = () => {
    const completed = filteredStudents.filter((s) => s.survey_status === 'SURVEY COMPLETED');
    const pdfHeaders = ['S.No', 'Block', 'Cluster', 'School Name', 'Student Name', 'PEN', 'Reason', 'Status'];
    const pdfRows = completed.slice(0, 100).map((s, idx) => [
      idx + 1,
      s.block_name || '-',
      s.sankul_name || '-',
      s.school_name || '-',
      s.student_name_marksheet || '-',
      s.student_pen_number || '-',
      s.apaar_pending_reason || '-',
      s.survey_status || '-'
    ]);
    setPreviewData({
      title: 'COMPLETED SURVEY STUDENTS REPORT (Top 100 Snapshot)',
      format: 'pdf',
      filename: 'Dantewada_Completed_Survey_PDF',
      headers: pdfHeaders,
      rows: pdfRows,
      totalRecords: completed.length,
      onDownload: () => generatePDFReport({
        title: 'COMPLETED SURVEY STUDENTS REPORT (Top 100 Snapshot)',
        filename: 'Dantewada_Completed_Survey_PDF',
        headers: pdfHeaders,
        rows: pdfRows
      })
    });
  };

  // 6B. APAAR ID Generated Report (बन गई है - YES)
  const handlePreviewApaarGeneratedExcel = () => {
    const apaarStudents = filteredStudents.filter((s) => s.is_apaar_generated === 'YES');
    const rows = apaarStudents.map(studentToPreviewRow);
    setPreviewData({
      title: `APAAR ID Generated Students Report - बन गई (YES) (${apaarStudents.length.toLocaleString('en-IN')} छात्र)`,
      format: 'excel',
      filename: 'Dantewada_APAAR_ID_Generated_Students_Report',
      sheetName: 'APAAR_Generated',
      headers: detailedPreviewHeaders,
      rows,
      totalRecords: apaarStudents.length,
      onDownload: () => exportStudentDetailedReport(apaarStudents, 'Dantewada_APAAR_ID_Generated_Students_Report')
    });
  };

  const handlePreviewApaarGeneratedPDF = () => {
    const apaarStudents = filteredStudents.filter((s) => s.is_apaar_generated === 'YES');
    const pdfHeaders = ['S.No', 'Block', 'Cluster', 'School Name', 'Class', 'Student Name', 'PEN', 'APAAR Status'];
    const pdfRows = apaarStudents.slice(0, 100).map((s, idx) => [
      idx + 1,
      s.block_name || '-',
      s.sankul_name || '-',
      s.school_name || '-',
      s.class_name || '-',
      s.student_name_marksheet || '-',
      s.student_pen_number || '-',
      'YES (बन गई)'
    ]);
    setPreviewData({
      title: `APAAR ID GENERATED STUDENTS REPORT (Top 100 Snapshot - Total: ${apaarStudents.length})`,
      format: 'pdf',
      filename: 'Dantewada_APAAR_Generated_Students_PDF',
      headers: pdfHeaders,
      rows: pdfRows,
      totalRecords: apaarStudents.length,
      onDownload: () => generatePDFReport({
        title: `APAAR ID GENERATED STUDENTS REPORT (Total: ${apaarStudents.length})`,
        filename: 'Dantewada_APAAR_Generated_Students_PDF',
        headers: pdfHeaders,
        rows: pdfRows
      })
    });
  };

  // 7. Master Detailed Survey
  const handlePreviewDetailedExcel = () => {
    const rows = filteredStudents.map(studentToPreviewRow);
    setPreviewData({
      title: 'Detailed Student Survey Master Report (मास्टर विद्यार्थी सर्वेक्षण विस्तृत रिपोर्ट)',
      format: 'excel',
      filename: 'Dantewada_Detailed_Student_Survey_Report',
      sheetName: 'Student_Survey',
      headers: detailedPreviewHeaders,
      rows,
      totalRecords: filteredStudents.length,
      onDownload: () => exportStudentDetailedReport(filteredStudents, 'Dantewada_Detailed_Student_Survey_Report')
    });
  };

  const handlePreviewDetailedPDF = () => {
    const pdfHeaders = ['S.No', 'Block', 'Cluster Name', 'School Name', 'Student Name', 'PEN', 'Reason', 'Aadhaar Provided', 'Status'];
    const pdfRows = filteredStudents.slice(0, 100).map((s, idx) => [
      idx + 1,
      s.block_name || '-',
      s.sankul_name || '-',
      s.school_name || '-',
      s.student_name_marksheet || '-',
      s.student_pen_number || '-',
      s.apaar_pending_reason || '-',
      s.is_aadhaar_provided || '-',
      s.survey_status || '-'
    ]);
    setPreviewData({
      title: 'DETAILED STUDENT SURVEY MASTER REPORT (Top 100 Snapshot)',
      filename: 'Dantewada_Student_Survey_Master',
      format: 'pdf',
      headers: pdfHeaders,
      rows: pdfRows,
      totalRecords: filteredStudents.length,
      onDownload: () => generatePDFReport({
        title: 'DETAILED STUDENT SURVEY MASTER REPORT (Top 100 Snapshot)',
        filename: 'Dantewada_Student_Survey_Master',
        headers: pdfHeaders,
        rows: pdfRows
      })
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Survey Reports (सर्वेक्षण रिपोर्ट्स एवं विश्लेषण)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download standard Excel & PDF administrative reports filtered by block, school, or status.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-700" />
            <span>Filter Report Scope (रिपोर्ट फ़िल्टर)</span>
          </span>
          {(activeFilters.block || activeFilters.sankul || activeFilters.school || activeFilters.surveyStatus || activeFilters.reason || activeFilters.apaarStatus) && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Block</label>
            <select
              value={isSchoolUser ? currentUser?.blockName || '' : activeFilters.block}
              disabled={isSchoolUser}
              onChange={(e) => setActiveFilters((prev) => ({ ...prev, block: e.target.value, sankul: '', school: '' }))}
              className={`w-full border rounded p-1.5 text-xs ${
                isSchoolUser ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              {isSchoolUser ? (
                <option value={currentUser?.blockName || ''}>{currentUser?.blockName}</option>
              ) : (
                <>
                  <option value="">All Blocks</option>
                  {blocks.map((b) => <option key={b} value={b}>{b}</option>)}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Cluster</label>
            <select
              value={isSchoolUser ? currentUser?.clusterName || '' : activeFilters.sankul}
              disabled={isSchoolUser}
              onChange={(e) => setActiveFilters((prev) => ({ ...prev, sankul: e.target.value, school: '' }))}
              className={`w-full border rounded p-1.5 text-xs ${
                isSchoolUser ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              {isSchoolUser ? (
                <option value={currentUser?.clusterName || ''}>{currentUser?.clusterName}</option>
              ) : (
                <>
                  <option value="">All Clusters</option>
                  {sankuls.map((s) => <option key={s} value={s}>{s}</option>)}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">School</label>
            <select
              value={isSchoolUser ? currentUser?.schoolName || '' : activeFilters.school}
              disabled={isSchoolUser}
              onChange={(e) => setActiveFilters((prev) => ({ ...prev, school: e.target.value }))}
              className={`w-full border rounded p-1.5 text-xs truncate ${
                isSchoolUser ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              {isSchoolUser ? (
                <option value={currentUser?.schoolName || ''}>{currentUser?.schoolName}</option>
              ) : (
                <>
                  <option value="">All Schools</option>
                  {schools.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Survey Status</label>
            <select
              value={activeFilters.surveyStatus}
              onChange={(e) => setActiveFilters((prev) => ({ ...prev, surveyStatus: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-800"
            >
              <option value="">All Statuses</option>
              {SURVEY_STATUS_OPTIONS.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Reason (कारण)</label>
            <select
              value={activeFilters.reason}
              onChange={(e) => setActiveFilters((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-800 text-xs truncate"
            >
              <option value="">All Reasons (सभी कारण)</option>
              {availableReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5 font-medium text-emerald-800">APAAR स्थिति</label>
            <select
              value={activeFilters.apaarStatus || ''}
              onChange={(e) => setActiveFilters((prev) => ({ ...prev, apaarStatus: e.target.value }))}
              className="w-full bg-slate-50 border border-emerald-300 rounded p-1.5 text-slate-800 text-xs font-semibold"
            >
              <option value="">All (सभी छात्र)</option>
              <option value="YES">✓ APAAR बन गई (YES)</option>
              <option value="NO">⏳ APAAR लंबित (NO)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 7 Report Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
        {/* Card 1: Block Wise (Admin Only) */}
        {!isSchoolUser && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">
                Administrative
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-2">1. Block Wise Report</h3>
              <p className="text-xs text-slate-500 mt-1">
                Summary across 4 blocks (Dantewada, Geedam, Kuakonda, Katekalyan) with completion rates.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
              <button
                onClick={handlePreviewBlockExcel}
                className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={handlePreviewBlockPDF}
                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* Card 2: School Wise */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase">
              School Breakdown
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-2">2. School Wise Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              Detailed tracking for each of the 724 schools in the district with UDISE codes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
            <button
              onClick={handlePreviewSchoolExcel}
              className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handlePreviewSchoolPDF}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Card 3: Reason Wise */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase">
              Root Cause
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-2">3. Reason Wise Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              Analysis of name mismatch, DOB mismatch, missing Aadhaar, and consent issues.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
            <button
              onClick={handlePreviewReasonExcel}
              className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (Summary)</span>
            </button>
            <button
              onClick={handlePreviewReasonPDF}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF (Summary)</span>
            </button>
          </div>
        </div>

        {/* Card 3B: Reason-Wise Student Detailed Report */}
        <div className="bg-white border-2 border-amber-300/80 rounded-lg p-4 shadow-2xs flex flex-col justify-between relative overflow-hidden bg-linear-to-b from-amber-50/40 to-white">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded uppercase">
                Reason Student Details (विस्तृत)
              </span>
              <span className="text-[11px] font-bold text-amber-900 tabular-nums">
                {selectedDetailedReason
                  ? `${getReasonStudents(selectedDetailedReason).length} छात्र`
                  : `${filteredStudents.filter((s) => !!s.apaar_pending_reason).length} छात्र`}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              Reason-wise Detailed Report
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              किसी भी विशिष्ट कारण के सभी छात्रों की विस्तृत सूची (PEN, नाम, स्कूल, कक्षा, आदि) डाउनलोड करें।
            </p>

            {/* Select Reason */}
            <div className="mt-2.5">
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                विशिष्ट कारण चुनें (Select Reason):
              </label>
              <select
                value={selectedDetailedReason}
                onChange={(e) => setSelectedDetailedReason(e.target.value)}
                className="w-full bg-white border border-amber-300 rounded p-1.5 text-xs text-slate-800 truncate focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-medium"
              >
                <option value="">-- सभी कारण (All Reasons) --</option>
                {reasonReportData.map((r) => (
                  <option key={r.reason} value={r.reason}>
                    {r.reason} ({r.count} छात्र)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-100 space-y-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePreviewReasonDetailsExcel(selectedDetailedReason)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer shadow-2xs transition-colors"
                title="चयनित कारण के छात्रों की विस्तृत एक्सेल रिपोर्ट डाउनलोड/प्रिव्यू करें"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel विवरण</span>
              </button>
              <button
                onClick={() => handlePreviewReasonDetailsPDF(selectedDetailedReason)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer shadow-2xs transition-colors"
                title="चयनित कारण के छात्रों की पीडीएफ रिपोर्ट डाउनलोड/प्रिव्यू करें"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF विवरण</span>
              </button>
            </div>

            <button
              onClick={handleExportAllReasonsMultiSheet}
              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold py-1 px-2 rounded flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
              title="डाउनलोड करें सिंगल एक्सेल जिसमें प्रत्येक कारण की अलग शीट हो"
            >
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              <span>ऑल-रीजन मल्टी-शीट Excel</span>
            </button>
          </div>
        </div>

        {/* Card 4: Survey Status Report */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
              Status Metrics
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-2">4. Survey Status Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              Counts by Completed, Pending, Follow-up Required, and Resolved categories.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
            <button
              onClick={handlePreviewStatusExcel}
              className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handlePreviewStatusPDF}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Card 5: Pending Survey Report */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded uppercase">
              Action Priority
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-2">5. Pending Survey Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              List of all students whose field survey is still pending for targeted surveyor follow-up.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
            <button
              onClick={handlePreviewPendingExcel}
              className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handlePreviewPendingPDF}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Card 6: Completed Survey Report */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase">
              Verified Records
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-2">6. Completed Survey Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              List of surveyed students with recorded reasons and document availability status.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
            <button
              onClick={handlePreviewCompletedExcel}
              className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handlePreviewCompletedPDF}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Card 6B: APAAR ID Generated Report (बन गई है - YES) */}
        <div className="bg-white border-2 border-emerald-400 rounded-lg p-4 shadow-2xs flex flex-col justify-between bg-gradient-to-b from-emerald-50/50 to-white">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                APAAR ID बन गई (YES)
              </span>
              <span className="text-[11px] font-bold text-emerald-800 tabular-nums">
                {filteredStudents.filter(s => s.is_apaar_generated === 'YES').length} छात्र
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">6B. APAAR Generated Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              उन सभी विद्यार्थियों की विशेष सूची जिनकी APAAR ID बन चुकी है (YES)। एक्सेल व पीडीएफ डाउनलोड करें।
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center space-x-2">
            <button
              onClick={handlePreviewApaarGeneratedExcel}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handlePreviewApaarGeneratedPDF}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-2 rounded flex items-center justify-center space-x-1 cursor-pointer shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Card 7: Detailed Student Survey Master Report */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 bg-linear-to-r from-blue-900 to-slate-900 text-white border border-blue-950 rounded-lg p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-200 bg-blue-800/80 px-2 py-0.5 rounded uppercase">
              Complete Dataset Export
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white mt-2">7. Detailed Student Survey Report (Master)</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-4xl">
              Full student records export matching the 19 original Excel columns + all survey answers, action items, remarks, surveyor names, and dates.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-blue-800/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <button
              onClick={handlePreviewDetailedExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 sm:py-2 px-4 rounded-md shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Full Excel (.xlsx)</span>
            </button>
            <button
              onClick={handlePreviewDetailedPDF}
              className="bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold py-2.5 sm:py-2 px-4 rounded-md shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF Snapshot</span>
            </button>
          </div>
        </div>

      </div>

      {/* Live Data Preview Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Report Data Tables Preview
            </h3>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
            {!isSchoolUser && (
              <button
                onClick={() => setSelectedReportView('block')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  selectedReportView === 'block' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Block Summary
              </button>
            )}
            <button
              onClick={() => setSelectedReportView('school')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                selectedReportView === 'school' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isSchoolUser ? 'School Summary' : 'Top Schools'}
            </button>
            <button
              onClick={() => setSelectedReportView('reason')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                selectedReportView === 'reason' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reason Breakdown
            </button>
          </div>
        </div>

        {/* View 1: Block Table */}
        {selectedReportView === 'block' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3">Block (ब्लॉक)</th>
                  <th className="py-2.5 px-3 text-right">Total Students</th>
                  <th className="py-2.5 px-3 text-right">Survey Completed</th>
                  <th className="py-2.5 px-3 text-right">Survey Pending</th>
                  <th className="py-2.5 px-3 text-right">Follow-up Req.</th>
                  <th className="py-2.5 px-3 text-right">Resolved</th>
                  <th className="py-2.5 px-3 text-right">Completion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blockReportData.map((b) => (
                  <tr key={b.block} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{b.block}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">{b.total.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{b.completed.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-amber-700">{b.pending.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{b.followUp}</td>
                    <td className="py-2.5 px-3 text-right text-blue-700">{b.resolved}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{b.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View 2: School Table */}
        {selectedReportView === 'school' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3">School Name</th>
                  <th className="py-2.5 px-3 font-mono">UDISE Code</th>
                  <th className="py-2.5 px-3">Block</th>
                  <th className="py-2.5 px-3 text-right">Total Students</th>
                  <th className="py-2.5 px-3 text-right">Completed</th>
                  <th className="py-2.5 px-3 text-right">Pending</th>
                  <th className="py-2.5 px-3 text-right">Completion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schoolReportData.slice(0, 15).map((s) => {
                  const rate = s.total > 0 ? ((s.completed + s.resolved) / s.total * 100).toFixed(1) : '0';
                  return (
                    <tr key={`${s.udise}_${s.schoolName}`} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[250px] truncate" title={s.schoolName}>
                        {s.schoolName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{s.udise}</td>
                      <td className="py-2.5 px-3 text-slate-700">{s.block}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">{s.total}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">{s.completed}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-amber-700">{s.pending}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-right text-[11px] text-slate-400 mt-2">Showing top 15 schools of {schoolReportData.length} total schools.</p>
          </div>
        )}

        {/* View 3: Reason Table */}
        {selectedReportView === 'reason' && (
          <div>
            {reasonReportData.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No survey reason data recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header Action Bar */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="text-xs text-amber-950 flex items-center space-x-2">
                    <span className="font-bold bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded text-[10px] uppercase">
                      कारण-वार विस्तृत रिपोर्ट
                    </span>
                    <span className="hidden sm:inline text-slate-600">
                      प्रत्येक कारण के छात्र विवरण देखने या Excel / PDF डाउनलोड करने हेतु पंक्ति में दिए गए विकल्पों का उपयोग करें।
                    </span>
                  </div>

                  <button
                    onClick={handleExportAllReasonsMultiSheet}
                    className="inline-flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>सभी कारणों का मल्टी-शीट Excel डाउनलोड करें</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                        <th className="py-2.5 px-3">Pending Reason (कारण)</th>
                        <th className="py-2.5 px-3 text-right">Student Count</th>
                        <th className="py-2.5 px-3 text-right">Percentage %</th>
                        <th className="py-2.5 px-3 text-right">Completed</th>
                        <th className="py-2.5 px-3 text-right">Follow-up</th>
                        <th className="py-2.5 px-3 text-right">Resolved</th>
                        <th className="py-2.5 px-3 text-right min-w-[230px]">Student Details & Reports (विस्तृत छात्र रिपोर्ट)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reasonReportData.map((r) => (
                        <tr key={r.reason} className="hover:bg-slate-50/80 transition-colors">
                          <td
                            className="py-2.5 px-3 font-semibold text-slate-900 hover:text-blue-700 cursor-pointer"
                            onClick={() => handlePreviewReasonDetailsExcel(r.reason)}
                            title={`क्लिक करके "${r.reason}" के सभी ${r.count} छात्रों का विवरण देखें`}
                          >
                            <span>{r.reason}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-amber-700 tabular-nums">{r.count}</td>
                          <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">{r.percentage}%</td>
                          <td className="py-2.5 px-3 text-right text-emerald-700 tabular-nums">{r.completed}</td>
                          <td className="py-2.5 px-3 text-right text-amber-700 tabular-nums">{r.followUp}</td>
                          <td className="py-2.5 px-3 text-right text-blue-700 tabular-nums">{r.resolved}</td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* 1. Preview Student Details */}
                              <button
                                onClick={() => handlePreviewReasonDetailsExcel(r.reason)}
                                className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
                                title={`इस कारण के ${r.count} छात्रों का विवरण प्रिव्यू करें`}
                              >
                                <Eye className="w-3 h-3 text-slate-500" />
                                <span>विवरण</span>
                              </button>

                              {/* 2. Download Excel */}
                              <button
                                onClick={() => {
                                  const reasonStudents = getReasonStudents(r.reason);
                                  exportStudentDetailedReport(
                                    reasonStudents,
                                    `APAAR_${r.reason.replace(/[:\\/?*\[\]\s]/g, '_').slice(0, 25)}_Students`
                                  );
                                }}
                                className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                title={`इस कारण के ${r.count} छात्रों की एक्सेल फाइल डाउनलोड करें`}
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>Excel</span>
                              </button>

                              {/* 3. Download PDF */}
                              <button
                                onClick={() => handlePreviewReasonDetailsPDF(r.reason)}
                                className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                title={`इस कारण के ${r.count} छात्रों की पीडीएफ फाइल डाउनलोड करें`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </button>

                              {/* 4. Navigate to Students list */}
                              <button
                                onClick={() => handleNavigateToReasonStudents(r.reason)}
                                className="inline-flex items-center space-x-0.5 text-blue-700 hover:text-blue-900 font-semibold px-1.5 py-1 text-[11px] cursor-pointer hover:bg-blue-50 rounded"
                                title={`छात्र सूची में देखें और संपादन करें`}
                              >
                                <span>छात्र</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Report Preview Modal */}
      <ReportPreviewModal
        data={previewData}
        onClose={() => setPreviewData(null)}
      />

    </div>
  );
};
