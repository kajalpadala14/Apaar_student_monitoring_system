import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { StudentDetailModal } from './StudentDetailModal';
import * as StudentContextModule from '../../context/StudentContext';
import { Student } from '../../types/student';

vi.mock('../../context/StudentContext', () => ({
  useStudents: vi.fn(),
}));

describe('StudentDetailModal APAAR ID Gatekeeper', () => {
  const dummyStudent: Student = {
    id: 'STU-101',
    block_name: 'Dantewada',
    sankul_name: 'Cluster 1',
    category: 'Primary',
    school_name: 'GPS School',
    udise_code: '22160100101',
    class_name: '5',
    section: 'A',
    student_pen_number: 'PEN123456',
    student_name_marksheet: 'Rahul Kumar',
    survey_status: 'PENDING',
  };

  it('renders gatekeeper question initially and not the full form', () => {
    vi.mocked(StudentContextModule.useStudents).mockReturnValue({
      currentUser: { name: 'Teacher', role: 'SCHOOL_USER' },
      updateStudentSurvey: vi.fn().mockResolvedValue(true),
    } as any);

    render(<StudentDetailModal student={dummyStudent} onClose={vi.fn()} />);

    // Gatekeeper question must be visible
    expect(screen.getByText('क्या विद्यार्थी की APAAR ID बन गई है?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /हाँ \(YES\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /नहीं \(NO\)/i })).toBeInTheDocument();

    // Full form sections should not be visible before clicking 'नहीं'
    expect(screen.queryByText(/APAAR Pending Verification & Survey Details/i)).not.toBeInTheDocument();
  });

  it('directly submits when "हाँ (YES)" is clicked', async () => {
    const updateStudentSurveyMock = vi.fn().mockResolvedValue(true);
    const onCloseMock = vi.fn();

    vi.mocked(StudentContextModule.useStudents).mockReturnValue({
      currentUser: { name: 'Teacher', role: 'SCHOOL_USER' },
      updateStudentSurvey: updateStudentSurveyMock,
    } as any);

    render(<StudentDetailModal student={dummyStudent} onClose={onCloseMock} />);

    // Click 'हाँ (YES)'
    const yesButton = screen.getByRole('button', { name: /हाँ \(YES\)/i });
    fireEvent.click(yesButton);

    expect(updateStudentSurveyMock).toHaveBeenCalledTimes(1);
    expect(updateStudentSurveyMock).toHaveBeenCalledWith('STU-101', expect.objectContaining({
      is_apaar_generated: 'YES',
      survey_status: 'SURVEY COMPLETED',
      apaar_pending_reason: '',
    }));
  });

  it('opens full form when "नहीं (NO)" is clicked', () => {
    vi.mocked(StudentContextModule.useStudents).mockReturnValue({
      currentUser: { name: 'Teacher', role: 'SCHOOL_USER' },
      updateStudentSurvey: vi.fn().mockResolvedValue(true),
    } as any);

    render(<StudentDetailModal student={dummyStudent} onClose={vi.fn()} />);

    // Click 'नहीं (NO)'
    const noButton = screen.getByRole('button', { name: /नहीं \(NO\)/i });
    fireEvent.click(noButton);

    // Full form sections must now appear
    expect(screen.getByText(/APAAR Pending Verification & Survey Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Is AADHAAR Provided \?/i)).toBeInTheDocument();
    expect(screen.getByText(/Is AADHAAR Verified \?/i)).toBeInTheDocument();
    expect(screen.getByText(/Name \(विद्यार्थी का नाम\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Date of Birth \(D\.O\.B\. \/ जन्मतिथि\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Father's Name \(पिता का नाम\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Documents Availability \(दस्तावेज़ उपलब्धता\)/i)).toBeInTheDocument();
  });
});
