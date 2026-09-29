import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Navbar } from './Navbar';
import * as StudentContextModule from '../context/StudentContext';

vi.mock('../context/StudentContext', () => ({
  useStudents: vi.fn(),
}));

describe('Navbar component', () => {
  it('renders all navigation tabs with labels and hindi translations', () => {
    vi.mocked(StudentContextModule.useStudents).mockReturnValue({
      activeTab: 'dashboard',
      setActiveTab: vi.fn(),
    } as any);

    render(<Navbar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('(डैशबोर्ड)')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('(विद्यार्थी सूची)')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('(रिपोर्ट्स व आंकड़े)')).toBeInTheDocument();
  });

  it('triggers setActiveTab when a tab button is clicked', () => {
    const setActiveTabMock = vi.fn();
    vi.mocked(StudentContextModule.useStudents).mockReturnValue({
      activeTab: 'dashboard',
      setActiveTab: setActiveTabMock,
    } as any);

    render(<Navbar />);

    const studentsButton = screen.getByRole('button', { name: /Students/i });
    fireEvent.click(studentsButton);

    expect(setActiveTabMock).toHaveBeenCalledWith('students');
  });

  it('highlights the active tab', () => {
    vi.mocked(StudentContextModule.useStudents).mockReturnValue({
      activeTab: 'reports',
      setActiveTab: vi.fn(),
    } as any);

    render(<Navbar />);

    const reportsButton = screen.getByRole('button', { name: /Reports/i });
    expect(reportsButton.className).toContain('border-blue-700');
    expect(reportsButton.className).toContain('text-blue-700');
  });
});
