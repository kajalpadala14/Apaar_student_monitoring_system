import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Header } from './Header';
import * as StudentContextModule from '../context/StudentContext';

vi.mock('../context/StudentContext', () => ({
  useStudents: vi.fn(),
}));

describe('Header component', () => {
  const baseStats = {
    totalStudents: 1500,
    surveyCompleted: 1200,
    surveyPending: 300,
    followUpRequired: 50,
    resolved: 250,
    completionRate: 80,
  };

  it('renders nothing when currentUser is null', () => {
    vi.mocked(StudentContextModule.useStudents).mockReturnValue({
      currentUser: null,
      stats: baseStats,
      logout: vi.fn(),
    } as any);

    const { container } = render(<Header />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Admin view when logged in as ADMIN', () => {
    vi.mocked(StudentContextModule.useStudents).mockReturnValue({
      currentUser: {
        name: 'District Admin',
        role: 'ADMIN',
      },
      stats: baseStats,
      logout: vi.fn(),
    } as any);

    render(<Header />);

    expect(screen.getByText('Dantewada APAAR Survey')).toBeInTheDocument();
    expect(screen.getByText('District Administrator')).toBeInTheDocument();
    expect(screen.getByText('Full District Access')).toBeInTheDocument();
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('renders School view when logged in as SCHOOL_USER', () => {
    vi.mocked(StudentContextModule.useStudents).mockReturnValue({
      currentUser: {
        name: 'GPS School',
        role: 'SCHOOL_USER',
        schoolName: 'Govt Primary School',
        udiseCode: '22160100101',
        blockName: 'Dantewada',
      },
      stats: {
        ...baseStats,
        totalStudents: 120,
      },
      logout: vi.fn(),
    } as any);

    render(<Header />);

    expect(screen.getByText('Govt Primary School')).toBeInTheDocument();
    expect(screen.getByText(/UDISE: 22160100101/i)).toBeInTheDocument();
    expect(screen.getByText('School Students')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('calls logout callback when logout button is clicked', () => {
    const logoutMock = vi.fn();
    vi.mocked(StudentContextModule.useStudents).mockReturnValue({
      currentUser: {
        name: 'Admin',
        role: 'ADMIN',
      },
      stats: baseStats,
      logout: logoutMock,
    } as any);

    render(<Header />);

    const logoutButton = screen.getByRole('button', { name: /लॉगआउट/i });
    fireEvent.click(logoutButton);

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
