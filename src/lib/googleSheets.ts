import { Student } from '../types/student';

export function getGoogleScriptUrl(): string {
  return (import.meta.env.VITE_GOOGLE_SCRIPT_URL as string) || '';
}

/**
 * Fetch all students from Google Sheets via Code.gs Web App
 */
export async function fetchFromGoogleSheet(customUrl?: string): Promise<Student[]> {
  const url = customUrl || getGoogleScriptUrl();
  if (!url) return [];

  try {
    const res = await fetch(`${url}?action=getStudents`, { credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.students)) {
      return data.students;
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch from Google Sheet:', err);
    throw err;
  }
}

/**
 * Save single student survey response to Google Sheet via Code.gs Web App
 */
export async function saveToGoogleSheet(
  studentPen: string,
  isAadhaarProvided: string,
  isAadhaarVerified: string,
  reason: string,
  rowIndex?: number,
  customUrl?: string,
  udiseCode?: string
): Promise<boolean> {
  const url = customUrl || getGoogleScriptUrl();
  if (!url) return false;

  try {
    const payload = {
      action: 'updateSurvey',
      studentPen,
      isAadhaarProvided,
      isAadhaarVerified,
      reason,
      rowIndex,
      udiseCode
    };

    // Google Apps Script requires text/plain or no-cors / standard POST
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      credentials: 'omit',
      mode: 'no-cors' // Google Apps Script redirects require mode: no-cors or redirect handling
    });

    return true;
  } catch (err) {
    console.warn('Failed to save to Google Sheet:', err);
    return false;
  }
}
