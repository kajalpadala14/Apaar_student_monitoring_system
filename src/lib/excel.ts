import * as XLSX from 'xlsx';
import { Student } from '../types/student';

/**
 * Export generic data to Excel workbook
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Format student record for detailed export row
 */
export function formatStudentDetailedRow(s: Student, idx: number) {
  return {
    'क्र. (S.No.)': idx + 1,
    'ब्लॉक का नाम': s.block_name || '',
    'CLUSTER': s.sankul_name || '',
    'श्रेणी': s.category || '',
    'स्कूल का नाम': s.school_name || '',
    'UDISE Code': s.udise_code || '',
    'कक्षा': s.class_name || '',
    'Section': s.section || '',
    'विद्यार्थी का पेन नंबर': s.student_pen_number || '',
    'विद्यार्थी का नाम (मार्कशीट के अनुसार)': s.student_name_marksheet || '',
    'विद्यार्थी का नाम (आधार के अनुसार)': s.student_name_aadhaar || '',
    'Name Match Status (नाम मिलान स्थिति)': s.name_match_status || '',
    'विद्यार्थी का जन्मतिथि (मार्कशीट के अनुसार)': s.dob_marksheet || '',
    'विद्यार्थी का जन्मतिथि (आधार के अनुसार)': s.dob_aadhaar || '',
    'DOB Match Status (जन्मतिथि मिलान स्थिति)': s.dob_match_status || '',
    'पिता का नाम (Father Name)': s.father_name || '',
    'जिला (District Name)': s.district_name || s.student_district || '',
    'दस्तावेज़ उपलब्धता (Documents Available)': s.documents_available || '',
    'Is AADHAAR Provided (आधार उपलब्ध)': s.is_aadhaar_provided || '',
    'Is AADHAAR Verified (आधार सत्यापित)': s.is_aadhaar_verified || '',
    'क्या विद्यार्थी की APAAR ID बन गई है?': s.is_apaar_generated || (s.apaar_pending_reason === 'APAAR ID बन गई है' || (s.survey_status === 'SURVEY COMPLETED' && !s.apaar_pending_reason) ? 'YES' : 'NO'),
    'Reason For Not Generated Apaar Id (अपार आईडी नहीं बनने का कारण)': s.apaar_pending_reason || '',
    'अन्य कारण': s.other_reason || '',
    'रिमार्क्स (Remarks)': s.remarks || '',
    'सर्वे स्थिति (Status)': s.survey_status || '',
    'सर्वेयर का नाम': s.surveyor_name || '',
    'सर्वे दिनांक': s.survey_date ? s.survey_date.split('T')[0] : ''
  };
}

/**
 * Export detailed student list matching exact Excel structure
 */
export function exportStudentDetailedReport(students: Student[], filenamePrefix: string = 'APAAR_Survey_Report') {
  const exportRows = students.map((s, idx) => formatStudentDetailedRow(s, idx));
  exportToExcel(exportRows, `${filenamePrefix}_${new Date().toISOString().split('T')[0]}`, 'Student_Survey');
}

/**
 * Export multi-sheet workbook where each sheet has students grouped by reason
 */
export function exportReasonWiseMultiSheetReport(
  reasonGroups: { reason: string; students: Student[] }[],
  summaryRows: any[] = [],
  filenamePrefix: string = 'APAAR_Reason_Wise_Full_Report'
) {
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  if (summaryRows.length > 0) {
    const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Reason_Summary');
  }

  // 2. Individual Sheet for each Reason
  reasonGroups.forEach((group, index) => {
    const rows = group.students.map((s, idx) => formatStudentDetailedRow(s, idx));
    const ws = XLSX.utils.json_to_sheet(rows);
    let cleanName = group.reason.replace(/[:\\/?*\[\]]/g, ' ').trim();
    if (cleanName.length > 25) {
      cleanName = `R${index + 1}_${cleanName.slice(0, 22)}`;
    }
    const finalSheetName = cleanName || `Reason_${index + 1}`;
    XLSX.utils.book_append_sheet(wb, ws, finalSheetName);
  });

  XLSX.writeFile(wb, `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
