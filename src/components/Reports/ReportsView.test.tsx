import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportsView } from './ReportsView';
import { useStudents } from '../../context/StudentContext';

vi.mock('../../context/StudentContext', () => ({
  useStudents: vi.fn(),
}));

vi.mock('../../lib/excel', () => ({
  exportToExcel: vi.fn(),
  exportStudentDetailedReport: vi.fn(),
  exportReasonWiseMultiSheetReport: vi.fn(),
  exportBlockWiseReasonMatrixReport: vi.fn(),
  exportBlockWiseMultiSheetReport: vi.fn(),
}));

vi.mock('../../lib/pdf', () => ({
  generatePDFReport: vi.fn(),
}));

const mockStudents = [
  {
    id: 'STU-1',
    block_name: 'DANTEWADA',
    sankul_name: 'Cluster A',
    school_name: 'School 1',
    udise_code: '221601',
    class_name: '5',
    student_pen_number: 'PEN001',
    student_name_marksheet: 'Student One',
    apaar_pending_reason: 'नाम में अंतर',
    survey_status: 'SURVEY COMPLETED',
  },
  {
    id: 'STU-2',
    block_name: 'GEEDAM',
    sankul_name: 'Cluster B',
    school_name: 'School 2',
    udise_code: '221602',
    class_name: '6',
    student_pen_number: 'PEN002',
    student_name_marksheet: 'Student Two',
    apaar_pending_reason: 'जन्म तिथि में अंतर',
    survey_status: 'PENDING',
  },
  {
    id: 'STU-3',
    block_name: 'DANTEWADA',
    sankul_name: 'Cluster A',
    school_name: 'School 1',
    udise_code: '221601',
    class_name: '5',
    student_pen_number: 'PEN003',
    student_name_marksheet: 'Student Three',
    apaar_pending_reason: 'नाम में अंतर',
    survey_status: 'FOLLOW-UP REQUIRED',
  },
];

describe('ReportsView - Block Wise Reason Report Option', () => {
  const defaultContext = {
    students: mockStudents,
    filteredStudents: mockStudents,
    activeFilters: {
      block: '',
      sankul: '',
      school: '',
      surveyStatus: '',
      reason: '',
      apaarStatus: '',
    },
    setActiveFilters: vi.fn(),
    resetFilters: vi.fn(),
    currentUser: { role: 'ADMIN', name: 'Admin User' },
    setActiveTab: vi.fn(),
  };

  it('renders Block dropdown inside Reason-wise Detailed Report (Card 3B)', () => {
    (useStudents as any).mockReturnValue(defaultContext);
    render(<ReportsView />);

    expect(screen.getByText('ब्लॉक चुनें (Select Block):')).toBeDefined();
    expect(screen.getByText('3C. Block-wise Reason Report')).toBeDefined();
    expect(screen.getByText('Block × Reason Matrix')).toBeDefined();
  });

  it('renders Block × Reason tab button in report tables preview and switches views', () => {
    (useStudents as any).mockReturnValue(defaultContext);
    render(<ReportsView />);

    const tabButton = screen.getByRole('button', { name: /Block × Reason/i });
    expect(tabButton).toBeDefined();

    fireEvent.click(tabButton);
    expect(screen.getByText('ब्लॉक × कारण मैट्रिक्स (Cross-Tab)')).toBeDefined();
    expect(screen.getByText('कुल योग (Grand Total)')).toBeDefined();
  });
});
