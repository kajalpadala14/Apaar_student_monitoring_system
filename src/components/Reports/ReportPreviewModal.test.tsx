import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ReportPreviewModal, ReportPreviewData } from './ReportPreviewModal';

describe('ReportPreviewModal component', () => {
  const mockExcelData: ReportPreviewData = {
    title: 'Block Wise Survey Report',
    format: 'excel',
    filename: 'Dantewada_Block_Wise_Report',
    sheetName: 'Block_Summary',
    headers: ['Block', 'Total Students', 'Survey Completed'],
    rows: [
      ['DANTEWADA', 1200, 950],
      ['GEEDAM', 1500, 1100],
      ['KUAKONDA', 800, 600],
    ],
    totalRecords: 3,
    onDownload: vi.fn(),
  };

  const mockPDFData: ReportPreviewData = {
    title: 'BLOCK-WISE APAAR PENDING SURVEY REPORT',
    format: 'pdf',
    filename: 'Dantewada_Block_Wise_PDF',
    headers: ['Block', 'Total', 'Completed'],
    rows: [
      ['DANTEWADA', 1200, 950],
      ['GEEDAM', 1500, 1100],
    ],
    totalRecords: 2,
    onDownload: vi.fn(),
  };

  it('renders nothing when data is null', () => {
    const { container } = render(
      <ReportPreviewModal data={null} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Excel preview with headers, rows, and sheet name', () => {
    render(<ReportPreviewModal data={mockExcelData} onClose={vi.fn()} />);

    expect(screen.getByText('Block Wise Survey Report')).toBeInTheDocument();
    expect(screen.getByText('Excel Spreadsheet Preview')).toBeInTheDocument();
    expect(screen.getByText('Sheet: Block_Summary')).toBeInTheDocument();
    expect(screen.getByText('DANTEWADA')).toBeInTheDocument();
    expect(screen.getByText('GEEDAM')).toBeInTheDocument();
    expect(screen.getByText('KUAKONDA')).toBeInTheDocument();
    expect(screen.getByText('Excel डाउनलोड करें (.xlsx)')).toBeInTheDocument();
  });

  it('renders PDF preview with headers and PDF format styling', () => {
    render(<ReportPreviewModal data={mockPDFData} onClose={vi.fn()} />);

    expect(screen.getAllByText('BLOCK-WISE APAAR PENDING SURVEY REPORT').length).toBeGreaterThan(0);
    expect(screen.getByText('PDF Document Preview')).toBeInTheDocument();
    expect(screen.getByText(/Format: PDF Auto-Table Landscape/i)).toBeInTheDocument();
    expect(screen.getByText('PDF डाउनलोड करें (.pdf)')).toBeInTheDocument();
  });

  it('filters rows when typing in the search box', () => {
    render(<ReportPreviewModal data={mockExcelData} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('प्रिव्यू में खोजें...');
    fireEvent.change(searchInput, { target: { value: 'GEEDAM' } });

    expect(screen.getByText('GEEDAM')).toBeInTheDocument();
    expect(screen.queryByText('DANTEWADA')).not.toBeInTheDocument();
    expect(screen.queryByText('KUAKONDA')).not.toBeInTheDocument();
  });

  it('calls onDownload when clicking download button', () => {
    const downloadMock = vi.fn();
    const dataWithMock = { ...mockExcelData, onDownload: downloadMock };

    render(<ReportPreviewModal data={dataWithMock} onClose={vi.fn()} />);

    const downloadBtn = screen.getByText('Excel डाउनलोड करें (.xlsx)');
    fireEvent.click(downloadBtn);

    expect(downloadMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('डाउनलोड हो गया (Downloaded)')).toBeInTheDocument();
  });

  it('calls onClose when clicking Cancel button', () => {
    const closeMock = vi.fn();
    render(<ReportPreviewModal data={mockExcelData} onClose={closeMock} />);

    const cancelBtn = screen.getByText('रद्द करें (Cancel)');
    fireEvent.click(cancelBtn);

    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});
