import Dexie, { Table } from 'dexie';
import { Student } from '../types';

export class ApaarDatabase extends Dexie {
  students!: Table<Student, number>;

  constructor() {
    super('ApaarDantewadaDB');
    this.version(2).stores({
      students: '++id, studentPen, studentName, blockName, schoolName, udiseCode, className, isAadhaarProvided, isAadhaarVerified, apaarStatus, pendingReason'
    });
  }
}

export const db = new ApaarDatabase();

// Initialize local database for Google Sheet data
export async function initializeDatabase(onProgress?: (progress: number, message: string) => void): Promise<number> {
  if (onProgress) onProgress(100, 'Database ready');
  return await db.students.count();
}
