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
 * Export detailed student list matching exact Excel structure
 */
export function exportStudentDetailedReport(students: Student[], filenamePrefix: string = 'APAAR_Survey_Report') {
  const exportRows = students.map((s, idx) => ({
    'क्र. (S.No.)': idx + 1,
    'ब्लॉक का नाम': s.block_name,
    'CLUSTER': s.sankul_name,
    'श्रेणी': s.category,
    'स्कूल का नाम': s.school_name,
    'UDISE Code': s.udise_code,
    'कक्षा': s.class_name,
    'Section': s.section,
    'विद्यार्थी का पेन नंबर': s.student_pen_number,
    'विद्यार्थी का नाम (मार्कशीट के अनुसार)': s.student_name_marksheet,
    'विद्यार्थी का नाम (आधार के अनुसार)': s.student_name_aadhaar || '',
    'विद्यार्थी का जन्मतिथि (मार्कशीट के अनुसार)': s.dob_marksheet || '',
    'विद्यार्थी का जन्मतिथि (आधार के अनुसार)': s.dob_aadhaar || '',
    'Is AADHAAR Provided (आधार उपलब्ध)': s.is_aadhaar_provided || '',
    'Is AADHAAR Verified (आधार सत्यापित)': s.is_aadhaar_verified || '',
    'Reason For Not Generated Apaar Id (अपार आईडी नहीं बनने का कारण)': s.apaar_pending_reason || '',
    'अन्य कारण': s.other_reason || '',
    'रिमार्क्स (Remarks)': s.remarks || '',
    'सर्वे स्थिति (Status)': s.survey_status,
    'सर्वेयर का नाम': s.surveyor_name || '',
    'सर्वे दिनांक': s.survey_date ? s.survey_date.split('T')[0] : ''
  }));

  exportToExcel(exportRows, `${filenamePrefix}_${new Date().toISOString().split('T')[0]}`, 'Student_Survey');
}
