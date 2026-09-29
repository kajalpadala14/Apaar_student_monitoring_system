import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { exportToExcel, exportStudentDetailedReport } from './excel';
import { Student } from '../types/student';

vi.mock('xlsx', () => {
  return {
    utils: {
      json_to_sheet: vi.fn().mockReturnValue({ '!ref': 'A1:C2' }),
      book_new: vi.fn().mockReturnValue({ SheetNames: [], Sheets: {} }),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  };
});

describe('excel utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToExcel', () => {
    it('creates a sheet and writes file with given filename and default sheet name', () => {
      const data = [{ name: 'Test', score: 100 }];
      exportToExcel(data, 'TestReport');

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'Sheet1'
      );
      expect(XLSX.writeFile).toHaveBeenCalledWith(expect.any(Object), 'TestReport.xlsx');
    });

    it('supports custom sheet names', () => {
      const data = [{ id: 1 }];
      exportToExcel(data, 'CustomReport', 'MyCustomSheet');

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'MyCustomSheet'
      );
    });
  });

  describe('exportStudentDetailedReport', () => {
    const mockStudents: Student[] = [
      {
        id: 'STU-001',
        block_name: 'Dantewada',
        sankul_name: 'Cluster A',
        category: 'Primary',
        school_name: 'GPS School',
        udise_code: '22160100101',
        class_name: '4',
        section: 'A',
        student_pen_number: 'PEN99999',
        student_name_marksheet: 'Ramesh',
        student_name_aadhaar: 'Ramesh Patel',
        name_match_status: 'Mismatch',
        dob_marksheet: '2015-05-10',
        dob_aadhaar: '2015-05-12',
        dob_match_status: 'Mismatch',
        father_name: 'Suresh Patel',
        district_name: 'Dantewada',
        documents_available: 'YES',
        is_aadhaar_provided: 'YES',
        is_aadhaar_verified: 'NO',
        apaar_pending_reason: 'नाम में अंतर',
        remarks: 'Correction needed',
        survey_status: 'FOLLOW-UP REQUIRED',
        surveyor_name: 'Teacher 1',
        survey_date: '2026-09-28T10:00:00Z',
      },
    ];

    it('maps student records to detailed survey columns in Hindi & English', () => {
      exportStudentDetailedReport(mockStudents, 'Dantewada_Survey');

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        expect.objectContaining({
          'क्र. (S.No.)': 1,
          'ब्लॉक का नाम': 'Dantewada',
          'CLUSTER': 'Cluster A',
          'स्कूल का नाम': 'GPS School',
          'UDISE Code': '22160100101',
          'विद्यार्थी का पेन नंबर': 'PEN99999',
          'विद्यार्थी का नाम (मार्कशीट के अनुसार)': 'Ramesh',
          'विद्यार्थी का नाम (आधार के अनुसार)': 'Ramesh Patel',
          'Name Match Status (नाम मिलान स्थिति)': 'Mismatch',
          'DOB Match Status (जन्मतिथि मिलान स्थिति)': 'Mismatch',
          'सर्वे स्थिति (Status)': 'FOLLOW-UP REQUIRED',
          'सर्वे दिनांक': '2026-09-28',
        }),
      ]);

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringMatching(/^Dantewada_Survey_\d{4}-\d{2}-\d{2}\.xlsx$/)
      );
    });
  });
});
