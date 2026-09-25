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

// Seed initial data from official Excel extract if empty
export async function initializeDatabase(onProgress?: (progress: number, message: string) => void): Promise<number> {
  const count = await db.students.count();
  if (count > 0) {
    return count;
  }

  if (onProgress) onProgress(10, 'Loading official student dataset...');
  
  try {
    const res = await fetch('/data/cleaned_students.json');
    if (!res.ok) {
      throw new Error(`Failed to fetch initial dataset: ${res.statusText}`);
    }
    
    const students: Student[] = await res.json();
    if (onProgress) onProgress(30, `Loaded ${students.length.toLocaleString()} records from dataset...`);

    if (onProgress) onProgress(60, 'Indexing students in local database...');
    // Dexie bulkAdd in chunks for smooth performance
    const chunkSize = 2500;
    for (let i = 0; i < students.length; i += chunkSize) {
      const chunk = students.slice(i, i + chunkSize);
      await db.students.bulkAdd(chunk);
      if (onProgress) {
        const pct = Math.min(95, 60 + Math.round((i / students.length) * 35));
        onProgress(pct, `Importing ${Math.min(i + chunkSize, students.length)} of ${students.length} records...`);
      }
    }

    if (onProgress) onProgress(100, 'Database ready');
    return students.length;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
