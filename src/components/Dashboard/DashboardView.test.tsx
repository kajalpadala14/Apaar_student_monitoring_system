import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardView } from './DashboardView';
import { useStudents } from '../../context/StudentContext';

vi.mock('../../context/StudentContext', () => ({
  useStudents: vi.fn(),
}));

vi.mock('./FilterBar', () => ({
  FilterBar: () => <div data-testid="filter-bar">FilterBar</div>,
}));

vi.mock('../../lib/excel', () => ({
  exportStudentDetailedReport: vi.fn(),
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
    apaar_pending_reason: 'आधार कार्ड उपलब्ध है, परंतु नाम सही नहीं है।',
    survey_status: 'SURVEY COMPLETED',
    is_apaar_generated: 'NO',
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
    apaar_pending_reason: 'अन्य (Other)',
    survey_status: 'SURVEY COMPLETED',
    is_apaar_generated: 'NO',
  },
];

describe('DashboardView - Block-wise Reason Matrix & Download', () => {
  const defaultContext = {
    students: mockStudents,
    filteredStudents: mockStudents,
    stats: {
      totalStudents: 2,
      surveyCompleted: 2,
      surveyPending: 0,
      completionRate: 100,
      apaarGeneratedCount: 0,
      apaarGeneratedRate: 0,
      apaarPendingCount: 2,
    },
    blockSummaries: [
      {
        block: 'DANTEWADA',
        totalStudents: 1,
        surveyCompleted: 1,
        surveyPending: 0,
        completionRate: 100,
        apaarGenerated: 0,
        apaarRate: 0,
      },
      {
        block: 'GEEDAM',
        totalStudents: 1,
        surveyCompleted: 1,
        surveyPending: 0,
        completionRate: 100,
        apaarGenerated: 0,
        apaarRate: 0,
      },
    ],
    reasonCounts: {
      'आधार कार्ड उपलब्ध है, परंतु नाम सही नहीं है।': 1,
      'अन्य (Other)': 1,
    },
    recentActivity: mockStudents,
    setActiveTab: vi.fn(),
    setActiveFilters: vi.fn(),
    currentUser: { role: 'ADMIN', name: 'Admin User' },
  };

  it('renders the Block-wise Reason Analysis Matrix on Dashboard', () => {
    (useStudents as any).mockReturnValue(defaultContext);
    render(<DashboardView />);

    expect(
      screen.getByText('Block-wise Reason Analysis Matrix (ब्लॉक-वार लंबित कारण विश्लेषण)')
    ).toBeInTheDocument();
    expect(screen.getByText('Excel मैट्रिक्स')).toBeInTheDocument();
    expect(screen.getByText('PDF मैट्रिक्स')).toBeInTheDocument();
    expect(screen.getByText('ब्लॉक मल्टी-शीट')).toBeInTheDocument();
  });

  it('renders Reason & Block selectors and download buttons', () => {
    (useStudents as any).mockReturnValue(defaultContext);
    render(<DashboardView />);

    expect(screen.getByText('विशिष्ट कारण चुनें (Select Reason):')).toBeInTheDocument();
    expect(screen.getByText('ब्लॉक चुनें (Select Block):')).toBeInTheDocument();
    expect(screen.getByText('Excel विवरण डाउनलोड')).toBeInTheDocument();
    expect(screen.getByText('PDF विवरण डाउनलोड')).toBeInTheDocument();
  });

  it('opens report preview modal when clicking Excel matrix button', () => {
    (useStudents as any).mockReturnValue(defaultContext);
    render(<DashboardView />);

    const excelMatrixBtn = screen.getByText('Excel मैट्रिक्स');
    fireEvent.click(excelMatrixBtn);

    expect(screen.getAllByText(/Block-wise Reason Analysis Matrix/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: /Excel डाउनलोड करें/i })).toBeInTheDocument();
  });
});
