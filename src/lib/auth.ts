import { CurrentUser, Student } from '../types/student';

const AUTH_STORAGE_KEY = 'apaar_dantewada_auth_session';

/**
 * Get current authenticated user session
 */
export function getStoredUser(): CurrentUser | null {
  try {
    const data = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as CurrentUser;
  } catch (err) {
    console.error('Failed to parse auth session:', err);
    return null;
  }
}

/**
 * Save user session on successful login
 */
export function setStoredUser(user: CurrentUser): void {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to store auth session:', err);
  }
}

/**
 * Clear user session on logout
 */
export function clearStoredUser(): void {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear auth session:', err);
  }
}

/**
 * Validate District Admin credentials against .env or secure defaults
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  const adminUser = (import.meta.env.VITE_ADMIN_USERNAME as string) || 'admin';
  const adminPass = (import.meta.env.VITE_ADMIN_PASSWORD as string) || 'admin123';

  return username.trim() === adminUser.trim() && password === adminPass;
}

/**
 * Validate School User by UDISE Code in student dataset
 */
export function findSchoolByUdise(udiseCode: string, allStudents: Student[]): CurrentUser | null {
  const cleanCode = udiseCode.trim();
  if (!cleanCode || !allStudents || allStudents.length === 0) return null;

  const match = allStudents.find((s) => {
    const code = String(s.udise_code || (s as any).udiseCode || '').trim();
    return code === cleanCode;
  });

  if (!match) return null;

  return {
    role: 'SCHOOL_USER',
    name: match.school_name,
    udiseCode: String(match.udise_code || (match as any).udiseCode || cleanCode).trim(),
    schoolName: match.school_name,
    blockName: match.block_name,
    clusterName: match.sankul_name || (match as any).cluster_name || '',
  };
}
