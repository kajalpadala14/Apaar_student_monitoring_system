import { describe, it, expect } from 'vitest';
import { Student } from '../types';

const testStudents: Student[] = [
  {
    id: 1,
    stateName: 'CHHATTISGARH',
    stateCode: '22',
    districtName: 'DANTEWADA',
    districtCode: '2216',
    blockName: 'DANTEWADA',
    blockCode: '1',
    schoolName: 'Govt Higher Secondary School',
    udiseCode: '221601001',
    schoolManagement: 'Govt',
    schoolCategory: 'Sec',
    className: 'X',
    section: 'A',
    studentPen: '20240100123',
    studentName: 'Aarav Patel',
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
    blockName: 'GEEDAM',
    blockCode: '2',
    schoolName: 'Govt Middle School Geedam',
    udiseCode: '221602005',
    schoolManagement: 'Govt',
    schoolCategory: 'Mid',
    className: 'VIII',
    section: 'B',
    studentPen: '20240100456',
    studentName: 'Deepa Mandavi',
    isAadhaarProvided: 'NO',
    isAadhaarVerified: 'NO',
    apaarStatus: 'Pending',
    pendingReason: 'Aadhaar Not Available'
  }
];

describe('Student Filter & Search Logic', () => {
  it('should filter by block case-insensitively', () => {
    const filterBlock = 'geedam';
    const result = testStudents.filter(s => s.blockName.toUpperCase() === filterBlock.toUpperCase());
    expect(result.length).toBe(1);
    expect(result[0].studentName).toBe('Deepa Mandavi');
  });

  it('should search by student PEN', () => {
    const term = '00123';
    const result = testStudents.filter(s => s.studentPen.includes(term));
    expect(result.length).toBe(1);
    expect(result[0].studentName).toBe('Aarav Patel');
  });

  it('should search by student name case-insensitively', () => {
    const term = 'aarav';
    const result = testStudents.filter(s => s.studentName.toLowerCase().includes(term));
    expect(result.length).toBe(1);
    expect(result[0].studentPen).toBe('20240100123');
  });

  it('should filter by Aadhaar availability', () => {
    const provided = testStudents.filter(s => s.isAadhaarProvided === 'YES');
    const notProvided = testStudents.filter(s => s.isAadhaarProvided === 'NO');

    expect(provided.length).toBe(1);
    expect(notProvided.length).toBe(1);
  });
});
