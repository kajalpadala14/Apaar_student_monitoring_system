import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as idb from 'idb';
import {
  getCachedStudents,
  saveStudent,
  bulkSaveStudents,
  resetDatabaseToInitial,
} from './db';
import { Student } from '../types/student';

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('IndexedDB operations (db.ts)', () => {
  const mockStudent: Student = {
    id: 'STU-001',
    block_name: 'Dantewada',
    sankul_name: 'Cluster A',
    category: 'Primary',
    school_name: 'GPS School',
    udise_code: '22160100101',
    class_name: '4',
    section: 'A',
    student_pen_number: 'PEN99999',
    student_name_marksheet: 'Ramesh',
    survey_status: 'PENDING',
  };

  const mockDb = {
    getAll: vi.fn(),
    put: vi.fn(),
    transaction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(idb.openDB).mockResolvedValue(mockDb as any);
  });

  it('getCachedStudents returns list of students from IndexedDB', async () => {
    mockDb.getAll.mockResolvedValueOnce([mockStudent]);

    const result = await getCachedStudents();
    expect(result).toEqual([mockStudent]);
    expect(mockDb.getAll).toHaveBeenCalledWith('students');
  });

  it('getCachedStudents returns empty array if error occurs', async () => {
    mockDb.getAll.mockRejectedValueOnce(new Error('DB read error'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await getCachedStudents();
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('saveStudent updates student with timestamp in IndexedDB', async () => {
    mockDb.put.mockResolvedValueOnce('STU-001');

    await saveStudent(mockStudent);
    expect(mockDb.put).toHaveBeenCalledWith(
      'students',
      expect.objectContaining({
        ...mockStudent,
        updated_at: expect.any(String),
      })
    );
  });

  it('bulkSaveStudents writes all students inside a transaction', async () => {
    const mockStore = { put: vi.fn() };
    const mockTx = {
      store: mockStore,
      done: Promise.resolve(),
    };
    mockDb.transaction.mockReturnValueOnce(mockTx);

    await bulkSaveStudents([mockStudent]);
    expect(mockDb.transaction).toHaveBeenCalledWith('students', 'readwrite');
    expect(mockStore.put).toHaveBeenCalledWith(mockStudent);
  });

  it('resetDatabaseToInitial clears the students object store', async () => {
    const mockObjectStore = { clear: vi.fn() };
    const mockTx = {
      objectStore: vi.fn().mockReturnValue(mockObjectStore),
      done: Promise.resolve(),
    };
    mockDb.transaction.mockReturnValueOnce(mockTx);

    const result = await resetDatabaseToInitial();
    expect(mockTx.objectStore).toHaveBeenCalledWith('students');
    expect(mockObjectStore.clear).toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
