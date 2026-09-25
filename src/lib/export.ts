import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, BlockSummary, SchoolSummary, DashboardKPIs } from '../types';

export function exportToCSV(data: any[], filename: string) {
  const exportData = data.length > 0 ? data : [{ 'Status': 'No records available for export' }];
  const ws = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(data: any[], filename: string, sheetName = 'Data') {
  const exportData = data.length > 0 ? data : [{ 'Status': 'No records available for export' }];
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportDistrictSummaryPDF(kpis: DashboardKPIs, blocks: BlockSummary[]) {
  const doc = new jsPDF('p', 'pt', 'a4');
  
  // Government Header
  doc.setFillColor(30, 58, 138); // Navy blue
  doc.rect(0, 0, 595, 65, 'F');
  
  const stateTitle = kpis.stateName ? `GOVERNMENT OF ${kpis.stateName.toUpperCase()}` : 'GOVERNMENT OF CHHATTISGARH';
  const districtTitle = `DISTRICT ADMINISTRATION ${kpis.districtName ? kpis.districtName.toUpperCase() : 'DANTEWADA'} | SCHOOL EDUCATION DEPARTMENT`;

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(stateTitle, 297, 26, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(districtTitle, 297, 42, { align: 'center' });
  doc.text('APAAR STUDENT MONITORING EXECUTIVE SUMMARY REPORT', 297, 56, { align: 'center' });

  // Report metadata
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Generated On: ${new Date().toLocaleString('en-IN')}`, 40, 85);
  doc.text(`Total Students: ${kpis.totalStudents.toLocaleString()} | Total Schools: ${kpis.totalSchools} | Total Blocks: ${kpis.totalBlocks}`, 40, 98);

  // KPI Table
  autoTable(doc, {
    startY: 110,
    head: [['Metric', 'Count', 'Percentage', 'Status Indicator']],
    body: [
      ['Total Enrolled Students', kpis.totalStudents.toLocaleString(), '100.00%', 'Baseline Dataset'],
      ['Aadhaar Provided', kpis.aadhaarProvided.toLocaleString(), `${kpis.aadhaarProvidedPct}%`, kpis.aadhaarProvidedPct >= 80 ? 'Good' : 'Needs Consent Camp'],
      ['Aadhaar Not Provided', kpis.aadhaarNotProvided.toLocaleString(), `${kpis.aadhaarNotProvidedPct}%`, 'Critical - Immediate Action'],
      ['Aadhaar Verified', kpis.aadhaarVerified.toLocaleString(), `${kpis.aadhaarVerifiedPct}%`, kpis.aadhaarVerifiedPct >= 80 ? 'Verified' : 'Verification Required'],
      ['Aadhaar Not Verified', kpis.aadhaarNotVerified.toLocaleString(), `${kpis.aadhaarNotVerifiedPct}%`, 'Pending Demographics/Biometrics'],
      ['APAAR Generated', kpis.apaarGenerated.toLocaleString(), `${kpis.completionPct}%`, kpis.completionPct >= 90 ? 'High' : 'Pending Generation'],
      ['APAAR Pending', kpis.apaarPending.toLocaleString(), `${(100 - kpis.completionPct).toFixed(2)}%`, 'Active Worklist']
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5 }
  });

  const lastTable = (doc as any).lastAutoTable;
  const startBlockY = lastTable ? lastTable.finalY + 25 : 260;

  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.text('Block-wise APAAR Progress Breakdown', 40, startBlockY - 8);

  // Block Table
  autoTable(doc, {
    startY: startBlockY,
    head: [['Block Name', 'Schools', 'Total Students', 'Aadhaar Provided', 'Aadhaar Verified', 'APAAR Generated', 'Completion %', 'Status']],
    body: blocks.map(b => [
      b.blockName,
      b.schoolCount,
      b.totalStudents.toLocaleString(),
      `${b.aadhaarProvided.toLocaleString()} (${b.aadhaarProvidedPct}%)`,
      `${b.aadhaarVerified.toLocaleString()} (${b.aadhaarVerifiedPct}%)`,
      b.apaarGenerated.toLocaleString(),
      `${b.completionPct}%`,
      b.status
    ]),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8 }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const districtDocTitle = kpis.districtName || 'District';
    doc.text(`Official Document - ${districtDocTitle} School Education Monitoring Portal | Page ${i} of ${pageCount}`, 297, 825, { align: 'center' });
  }

  doc.save(`APAAR_${kpis.districtName || 'District'}_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportStudentsPDF(students: Student[], title = 'APAAR Student Roster') {
  const doc = new jsPDF('l', 'pt', 'a4');
  
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 842, 50, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DANTEWADA DISTRICT - APAAR MONITORING REPORT', 421, 24, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${title.toUpperCase()} (Total Records: ${students.length}) - Generated: ${new Date().toLocaleString('en-IN')}`, 421, 39, { align: 'center' });

  // Only take top 200 rows if very large to prevent memory crash in PDF
  const rowsToPrint = students.slice(0, 250);

  autoTable(doc, {
    startY: 65,
    head: [['#', 'PEN', 'Student Name', 'Class', 'Block', 'School Name', 'UDISE', 'Aadhaar Prov', 'Aadhaar Ver', 'APAAR', 'Reason']],
    body: rowsToPrint.map((s, idx) => [
      idx + 1,
      s.studentPen,
      s.studentName,
      s.className,
      s.blockName,
      s.schoolName.length > 25 ? s.schoolName.slice(0, 25) + '...' : s.schoolName,
      s.udiseCode,
      s.isAadhaarProvided,
      s.isAadhaarVerified,
      s.apaarStatus,
      s.pendingReason
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 3 }
  });

  if (students.length > 250) {
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(8);
    doc.setTextColor(220, 38, 38);
    doc.text(`* Displaying first 250 of ${students.length} records in PDF. Use Excel/CSV export for complete dataset.`, 40, finalY);
  }

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
