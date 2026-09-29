import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  validateAdminCredentials,
  findSchoolByUdise,
} from './auth';
import { CurrentUser, Student } from '../types/student';

describe('auth utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Session Storage (getStoredUser, setStoredUser, clearStoredUser)', () => {
    const mockUser: CurrentUser = {
      name: 'Test School',
      role: 'SCHOOL_USER',
      udiseCode: '22160100101',
      schoolName: 'Govt Primary School',
      blockName: 'Dantewada',
      clusterName: 'Cluster A',
    };

    it('returns null when no session is saved', () => {
      expect(getStoredUser()).toBeNull();
    });

    it('stores user session in both sessionStorage and localStorage', () => {
      setStoredUser(mockUser);
      const retrieved = getStoredUser();
      expect(retrieved).toEqual(mockUser);
    });

    it('clears user session from both storages', () => {
      setStoredUser(mockUser);
      expect(getStoredUser()).toEqual(mockUser);

      clearStoredUser();
      expect(getStoredUser()).toBeNull();
    });

    it('handles JSON parsing errors gracefully', () => {
      sessionStorage.setItem('apaar_dantewada_auth_session', 'invalid json string');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = getStoredUser();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('validateAdminCredentials', () => {
    it('authenticates valid default admin credentials', () => {
      expect(validateAdminCredentials('admin', 'admin123')).toBe(true);
      expect(validateAdminCredentials('  admin  ', 'admin123')).toBe(true);
    });

    it('rejects invalid username or password', () => {
      expect(validateAdminCredentials('wrongUser', 'admin123')).toBe(false);
      expect(validateAdminCredentials('admin', 'wrongPass')).toBe(false);
      expect(validateAdminCredentials('', '')).toBe(false);
    });
  });

  describe('findSchoolByUdise', () => {
    const mockStudents: Student[] = [
      {
        id: 'STU-001',
        block_name: 'Dantewada',
        sankul_name: 'Sankul 1',
        category: 'Primary',
        school_name: 'PS Dantewada',
        udise_code: '22160100101',
        class_name: '5',
        section: 'A',
        student_pen_number: 'PEN12345',
        student_name_marksheet: 'Rahul Kumar',
        survey_status: 'PENDING',
      },
      {
        id: 'STU-002',
        block_name: 'Geedam',
        sankul_name: 'Sankul 2',
        category: 'Middle',
        school_name: 'MS Geedam',
        udise_code: '22160200202',
        class_name: '8',
        section: 'B',
        student_pen_number: 'PEN67890',
        student_name_marksheet: 'Pooja Sahu',
        survey_status: 'SURVEY COMPLETED',
      },
    ];

    it('returns school user when matching UDISE code is found', () => {
      const user = findSchoolByUdise('22160100101', mockStudents);
      expect(user).not.toBeNull();
      expect(user?.role).toBe('SCHOOL_USER');
      expect(user?.udiseCode).toBe('22160100101');
      expect(user?.schoolName).toBe('PS Dantewada');
      expect(user?.blockName).toBe('Dantewada');
      expect(user?.clusterName).toBe('Sankul 1');
    });

    it('matches UDISE code with whitespace trimming', () => {
      const user = findSchoolByUdise('  22160200202  ', mockStudents);
      expect(user).not.toBeNull();
      expect(user?.schoolName).toBe('MS Geedam');
    });

    it('returns null if UDISE code does not exist in dataset', () => {
      const user = findSchoolByUdise('99999999999', mockStudents);
      expect(user).toBeNull();
    });

    it('returns null when given empty string or empty student array', () => {
      expect(findSchoolByUdise('', mockStudents)).toBeNull();
      expect(findSchoolByUdise('   ', mockStudents)).toBeNull();
      expect(findSchoolByUdise('22160100101', [])).toBeNull();
    });
  });
});
