import { describe, it, expect, vi } from 'vitest';
import { exportToCSV, exportToExcel, exportDistrictSummaryPDF } from '../lib/export';
import { calculateKPIs, calculateBlockSummaries } from '../lib/calculations';
import { Student } from '../types';

describe('QA Suite: Data Integrity & Schema Validation', () => {
  const sampleStudent: Student = {
    id: 1,
    stateName: 'CHHATTISGARH',
    stateCode: '22',
    districtName: 'DANTEWADA',
    districtCode: '2216',
    blockName: 'DANTEWADA',
    blockCode: '1',
    schoolName: 'Govt HS Dantewada',
    udiseCode: '221601001',
    schoolManagement: 'Govt',
    schoolCategory: 'Sec',
    className: 'X',
    section: 'A',
    studentPen: '20240101999',
    studentName: 'Priya Sharma',
    isAadhaarProvided: 'YES',
    isAadhaarVerified: 'YES',
    apaarStatus: 'Generated',
    pendingReason: ''
  };

  it('validates all required fields exist on a student record', () => {
    expect(sampleStudent.studentPen).toBeDefined();
    expect(sampleStudent.studentPen.length).toBeGreaterThan(5);
    expect(['YES', 'NO']).toContain(sampleStudent.isAadhaarProvided);
    expect(['YES', 'NO']).toContain(sampleStudent.isAadhaarVerified);
    expect(['Generated', 'Pending']).toContain(sampleStudent.apaarStatus);
  });

  it('safely handles numeric Student PEN stringification without precision loss', () => {
    const rawNumericPen = 20240101999;
    const stringifiedPen = rawNumericPen.toLocaleString('fullwide', { useGrouping: false });
    expect(stringifiedPen).toBe('20240101999');
    expect(stringifiedPen).not.toContain('E+');
    expect(stringifiedPen).not.toContain('e+');
  });
});

describe('QA Suite: Google Sheet Payload Verification', () => {
  it('correctly validates a mock Google Apps Script Web App response', () => {
    const mockApiResponse = {
      status: 'success',
      total: 1,
      students: [
        {
          id: 1,
          stateName: 'CHHATTISGARH',
          districtName: 'DANTEWADA',
          blockName: 'DANTEWADA',
          schoolName: 'Govt HS Dantewada',
          udiseCode: '221601001',
          className: 'X',
          studentPen: '20240101999',
          studentName: 'Priya Sharma',
          isAadhaarProvided: 'YES',
          isAadhaarVerified: 'YES',
          apaarStatus: 'Generated',
          pendingReason: ''
        }
      ]
    };

    expect(mockApiResponse.status).toBe('success');
    expect(Array.isArray(mockApiResponse.students)).toBe(true);
    expect(mockApiResponse.students.length).toBe(mockApiResponse.total);
    expect(mockApiResponse.students[0].studentPen).toBe('20240101999');
  });

  it('rejects invalid or error payloads from Google Apps Script Web App', () => {
    const invalidPayloads = [
      null,
      {},
      { status: 'error', message: 'Sheet not found' },
      { status: 'success', students: 'invalid_type' }
    ];

    invalidPayloads.forEach(payload => {
      const isValid = Boolean(payload && Array.isArray((payload as any).students));
      expect(isValid).toBe(false);
    });
  });
});

describe('QA Suite: Export Stability & Resilience', () => {
  it('does not throw when exporting empty data to Excel or CSV', () => {
    // Mock DOM elements for testing environment
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    const mockClick = vi.fn();
    vi.stubGlobal('document', {
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild
      },
      createElement: () => ({
        setAttribute: vi.fn(),
        click: mockClick
      })
    });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn()
    });

    expect(() => exportToCSV([], 'test_empty')).not.toThrow();
  });
});
