import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Student } from '../types/student';

interface ApaarDB extends DBSchema {
  students: {
    key: string;
    value: Student;
    indexes: {
      'by-block': string;
      'by-sankul': string;
      'by-school': string;
      'by-pen': string;
      'by-status': string;
      'by-udise': string;
    };
  };
  meta: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'dantewada_apaar_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ApaarDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ApaarDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('students')) {
          const store = db.createObjectStore('students', { keyPath: 'id' });
          store.createIndex('by-block', 'block_name');
          store.createIndex('by-sankul', 'sankul_name');
          store.createIndex('by-school', 'school_name');
          store.createIndex('by-pen', 'student_pen_number');
          store.createIndex('by-status', 'survey_status');
          store.createIndex('by-udise', 'udise_code');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Get all cached students directly from local IndexedDB
 */
export async function getCachedStudents(): Promise<Student[]> {
  try {
    const db = await getDB();
    const records = await db.getAll('students');
    return records || [];
  } catch (err) {
    console.warn('Error reading from IndexedDB:', err);
    return [];
  }
}

/**
 * Initialize students database safely without wiping cache
 */
export async function initStudentsDatabase(): Promise<Student[]> {
  try {
    const cached = await getCachedStudents();
    if (cached && cached.length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('Cache read failed:', err);
  }
  return [];
}

export async function saveStudent(student: Student): Promise<void> {
  const db = await getDB();
  await db.put('students', {
    ...student,
    updated_at: new Date().toISOString()
  });
}

export async function bulkSaveStudents(students: Student[]): Promise<void> {
  if (!students || students.length === 0) return;
  const db = await getDB();
  const tx = db.transaction('students', 'readwrite');
  for (const s of students) {
    tx.store.put(s);
  }
  await tx.done;
}

export async function resetDatabaseToInitial(): Promise<Student[]> {
  const db = await getDB();
  const tx = db.transaction(['students', 'meta'], 'readwrite');
  await tx.objectStore('students').clear();
  await tx.done;
  return [];
}
