import { describe, it, expect } from 'vitest';
import {
  calculateKPIs,
  calculateBlockSummaries,
  calculateSchoolSummaries,
  calculateReasonSummaries
} from '../lib/calculations';
import { Student } from '../types';

const mockStudents: Student[] = [
  {
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
    studentPen: 'PEN1001',
    studentName: 'Rahul Verma',
    isAadhaarProvided: 'YES',
    isAadhaarVerified: 'YES',
    apaarStatus: 'Generated',
    pendingReason: ''
  },
  {
    id: 2,
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
    section: 'B',
    studentPen: 'PEN1002',
    studentName: 'Pooja Kashyap',
    isAadhaarProvided: 'YES',
    isAadhaarVerified: 'NO',
    apaarStatus: 'Pending',
    pendingReason: 'Demographic Mismatch'
  },
  {
    id: 3,
    stateName: 'CHHATTISGARH',
    stateCode: '22',
    districtName: 'DANTEWADA',
    districtCode: '2216',
    blockName: 'GEEDAM',
    blockCode: '2',
    schoolName: 'Govt MS Geedam',
    udiseCode: '221602002',
    schoolManagement: 'Govt',
    schoolCategory: 'Mid',
    className: 'VIII',
    section: 'A',
    studentPen: 'PEN2001',
    studentName: 'Amit Sahu',
    isAadhaarProvided: 'NO',
    isAadhaarVerified: 'NO',
    apaarStatus: 'Pending',
    pendingReason: 'Aadhaar Not Available'
  },
  {
    id: 4,
    stateName: 'CHHATTISGARH',
    stateCode: '22',
    districtName: 'DANTEWADA',
    districtCode: '2216',
    blockName: 'GEEDAM',
    blockCode: '2',
    schoolName: 'Govt MS Geedam',
    udiseCode: '221602002',
    schoolManagement: 'Govt',
    schoolCategory: 'Mid',
    className: 'VIII',
    section: 'B',
    studentPen: 'PEN2002',
    studentName: 'Sunita Markam',
    isAadhaarProvided: 'YES',
    isAadhaarVerified: 'YES',
    apaarStatus: 'Generated',
    pendingReason: ''
  }
];

describe('calculateKPIs', () => {
  it('should return zeroed KPIs for empty student array', () => {
    const kpis = calculateKPIs([]);
    expect(kpis.totalStudents).toBe(0);
    expect(kpis.aadhaarProvided).toBe(0);
    expect(kpis.aadhaarVerified).toBe(0);
    expect(kpis.apaarGenerated).toBe(0);
    expect(kpis.completionPct).toBe(0);
    expect(kpis.totalSchools).toBe(0);
    expect(kpis.totalBlocks).toBe(0);
  });

  it('should accurately calculate total students, counts, and percentages', () => {
    const kpis = calculateKPIs(mockStudents);

    expect(kpis.totalStudents).toBe(4);
    // Aadhaar Provided: 3 of 4 (75%)
    expect(kpis.aadhaarProvided).toBe(3);
    expect(kpis.aadhaarProvidedPct).toBe(75);
    // Aadhaar Not Provided: 1 of 4 (25%)
    expect(kpis.aadhaarNotProvided).toBe(1);
    expect(kpis.aadhaarNotProvidedPct).toBe(25);
    // Aadhaar Verified: 2 of 4 (50%)
    expect(kpis.aadhaarVerified).toBe(2);
    expect(kpis.aadhaarVerifiedPct).toBe(50);
    // Aadhaar Not Verified: 2 of 4 (50%)
    expect(kpis.aadhaarNotVerified).toBe(2);
    expect(kpis.aadhaarNotVerifiedPct).toBe(50);
    // APAAR Generated: 2 of 4 (50%)
    expect(kpis.apaarGenerated).toBe(2);
    expect(kpis.apaarPending).toBe(2);
    expect(kpis.completionPct).toBe(50);
    // Deduplication of schools and blocks
    expect(kpis.totalSchools).toBe(2);
    expect(kpis.totalBlocks).toBe(2);
    // Dynamic metadata extraction
    expect(kpis.districtName).toBe('DANTEWADA');
    expect(kpis.districtCode).toBe('2216');
    expect(kpis.stateName).toBe('CHHATTISGARH');
    expect(kpis.stateCode).toBe('22');
  });
});

describe('calculateBlockSummaries', () => {
  it('should group data by blockName accurately', () => {
    const blocks = calculateBlockSummaries(mockStudents);

    expect(blocks.length).toBe(2);

    const dantewada = blocks.find(b => b.blockName === 'DANTEWADA');
    expect(dantewada).toBeDefined();
    expect(dantewada?.totalStudents).toBe(2);
    expect(dantewada?.aadhaarProvided).toBe(2);
    expect(dantewada?.aadhaarVerified).toBe(1);
    expect(dantewada?.apaarGenerated).toBe(1);
    expect(dantewada?.apaarPending).toBe(1);
    expect(dantewada?.completionPct).toBe(50);
    expect(dantewada?.status).toBe('RED'); // < 70% is RED
    expect(dantewada?.schoolCount).toBe(1);

    const geedam = blocks.find(b => b.blockName === 'GEEDAM');
    expect(geedam).toBeDefined();
    expect(geedam?.totalStudents).toBe(2);
    expect(geedam?.aadhaarProvided).toBe(1);
    expect(geedam?.schoolCount).toBe(1);
  });

  it('should assign status GREEN when completion >= 90% and YELLOW when between 70-89%', () => {
    const highPerformingStudents: Student[] = Array.from({ length: 10 }, (_, i) => ({
      ...mockStudents[0],
      id: i + 10,
      studentPen: `HIGH_PEN_${i}`,
      apaarStatus: i < 9 ? 'Generated' : 'Pending' // 90%
    }));

    const blocks = calculateBlockSummaries(highPerformingStudents);
    expect(blocks[0].completionPct).toBe(90);
    expect(blocks[0].status).toBe('GREEN');

    const midPerformingStudents: Student[] = Array.from({ length: 10 }, (_, i) => ({
      ...mockStudents[0],
      id: i + 20,
      studentPen: `MID_PEN_${i}`,
      apaarStatus: i < 7 ? 'Generated' : 'Pending' // 70%
    }));

    const midBlocks = calculateBlockSummaries(midPerformingStudents);
    expect(midBlocks[0].completionPct).toBe(70);
    expect(midBlocks[0].status).toBe('YELLOW');
  });
});

describe('calculateSchoolSummaries', () => {
  it('should summarize school metrics by UDISE code', () => {
    const schools = calculateSchoolSummaries(mockStudents);

    expect(schools.length).toBe(2);

    const hsDantewada = schools.find(s => s.udiseCode === '221601001');
    expect(hsDantewada).toBeDefined();
    expect(hsDantewada?.schoolName).toBe('Govt HS Dantewada');
    expect(hsDantewada?.blockName).toBe('DANTEWADA');
    expect(hsDantewada?.totalStudents).toBe(2);
    expect(hsDantewada?.aadhaarProvided).toBe(2);
    expect(hsDantewada?.aadhaarVerified).toBe(1);
    expect(hsDantewada?.apaarGenerated).toBe(1);
    expect(hsDantewada?.apaarPending).toBe(1);
    expect(hsDantewada?.completionPct).toBe(50);
  });
});

describe('calculateReasonSummaries', () => {
  it('should aggregate pending reasons and sort by frequency', () => {
    const reasons = calculateReasonSummaries(mockStudents);

    // Mock students has: 2 Pending ('Demographic Mismatch', 'Aadhaar Not Available')
    expect(reasons.length).toBe(2);
    expect(reasons[0].count).toBe(1);
    expect(reasons[1].count).toBe(1);

    const mismatch = reasons.find(r => r.reason === 'Demographic Mismatch');
    expect(mismatch).toBeDefined();
    expect(mismatch?.count).toBe(1);
    expect(mismatch?.percentage).toBe(50); // 1 out of 2 pending
    expect(mismatch?.relatedSchoolsCount).toBe(1);
    expect(mismatch?.relatedBlocksCount).toBe(1);
  });

  it('should handle students with empty reason gracefully and default to Not Applied', () => {
    const studentsWithBlankReasons: Student[] = [
      {
        ...mockStudents[0],
        id: 99,
        apaarStatus: 'Pending',
        pendingReason: ''
      }
    ];
    const reasons = calculateReasonSummaries(studentsWithBlankReasons);
    expect(reasons.length).toBe(1);
    expect(reasons[0].reason).toBe('Not Applied');
  });

  it('should handle zero pending students without division by zero errors', () => {
    const allGenerated: Student[] = [
      {
        ...mockStudents[0],
        id: 100,
        apaarStatus: 'Generated'
      }
    ];
    const reasons = calculateReasonSummaries(allGenerated);
    expect(reasons.length).toBe(0);
  });
});

