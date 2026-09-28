import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Student, BlockSummary, CurrentUser } from '../types/student';
import { getCachedStudents, saveStudent, bulkSaveStudents, resetDatabaseToInitial } from '../lib/db';
import {
  getGoogleScriptUrl,
  fetchFromGoogleSheet,
  saveToGoogleSheet
} from '../lib/googleSheets';
import {
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  validateAdminCredentials,
  findSchoolByUdise
} from '../lib/auth';

interface StudentFilterState {
  block: string;
  sankul: string;
  school: string;
  className: string;
  surveyStatus: string;
  reason: string;
  searchQuery: string;
}

interface StudentContextType {
  rawStudents: Student[];
  students: Student[];
  loading: boolean;
  error: string | null;
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  loginAsSchool: (udiseCode: string) => Promise<{ success: boolean; school?: CurrentUser; error?: string }>;
  loginAsAdmin: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  activeTab: 'dashboard' | 'students' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'students' | 'reports') => void;
  activeFilters: StudentFilterState;
  setActiveFilters: React.Dispatch<React.SetStateAction<StudentFilterState>>;
  resetFilters: () => void;
  filteredStudents: Student[];
  googleScriptUrl: string;
  syncWithGoogleSheet: (customUrl?: string) => Promise<{ success: boolean; count: number; error?: string }>;
  stats: {
    totalStudents: number;
    surveyCompleted: number;
    surveyPending: number;
    followUpRequired: number;
    resolved: number;
    completionRate: number;
  };
  blockSummaries: BlockSummary[];
  reasonCounts: Record<string, number>;
  recentActivity: Student[];
  updateStudentSurvey: (id: string, surveyData: Partial<Student>) => Promise<boolean>;
  resetToMasterExcel: () => Promise<void>;
}

const initialFilters: StudentFilterState = {
  block: '',
  sankul: '',
  school: '',
  className: '',
  surveyStatus: '',
  reason: '',
  searchQuery: '',
};

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Master raw dataset (all 9,747 Dantewada students from Google Sheet / Cache)
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticated user session (persisted in sessionStorage & localStorage)
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(() => getStoredUser());

  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'reports'>('dashboard');
  const [activeFilters, setActiveFilters] = useState<StudentFilterState>(initialFilters);
  const googleScriptUrl = getGoogleScriptUrl();

  // Active fetch promise reference to prevent duplicate calls and enable login awaiting
  const activeFetchRef = useRef<Promise<Student[]> | null>(null);

  const setCurrentUser = useCallback((user: CurrentUser | null) => {
    if (user) {
      setStoredUser(user);
    } else {
      clearStoredUser();
    }
    setCurrentUserState(user);
  }, []);

  // Fetch function with caching
  const loadMasterData = useCallback(async (): Promise<Student[]> => {
    if (activeFetchRef.current) {
      return activeFetchRef.current;
    }

    const fetchPromise = (async () => {
      try {
        const targetUrl = getGoogleScriptUrl();
        if (targetUrl) {
          console.log('Fetching live master dataset from Google Sheet:', targetUrl);
          const sheetStudents = await fetchFromGoogleSheet(targetUrl);
          if (sheetStudents && sheetStudents.length > 0) {
            setRawStudents(sheetStudents);
            bulkSaveStudents(sheetStudents).catch(console.warn);
            setError(null);
            return sheetStudents;
          }
        }
      } catch (err: any) {
        console.warn('Google Sheet fetch error:', err);
      }

      // Check cache if sheet fetch failed
      const cached = await getCachedStudents();
      if (cached && cached.length > 0) {
        setRawStudents(cached);
        setError(null);
        return cached;
      }

      return [];
    })();

    activeFetchRef.current = fetchPromise;
    try {
      const res = await fetchPromise;
      return res;
    } finally {
      activeFetchRef.current = null;
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoading(true);

      // 1. Instant load from IndexedDB if available
      try {
        const cached = await getCachedStudents();
        if (isMounted && cached && cached.length > 0) {
          console.log(`Instant startup: Loaded ${cached.length} students from local cache.`);
          setRawStudents(cached);
          setLoading(false);
        }
      } catch (cacheErr) {
        console.warn('Cache check failed:', cacheErr);
      }

      // 2. Fetch fresh live data from Google Sheet
      try {
        const liveData = await loadMasterData();
        if (isMounted && liveData.length > 0) {
          setRawStudents(liveData);
          setError(null);
        } else if (isMounted && rawStudents.length === 0) {
          setError('Google Sheet से डेटा प्राप्त नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें।');
        }
      } catch (err: any) {
        if (isMounted && rawStudents.length === 0) {
          setError(err.message || 'Error loading database');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [loadMasterData]);

  // School Login by UDISE Code
  const loginAsSchool = useCallback(
    async (udiseCode: string): Promise<{ success: boolean; school?: CurrentUser; error?: string }> => {
      const cleanCode = udiseCode.trim();
      if (!cleanCode) {
        return { success: false, error: 'कृपया UDISE कोड दर्ज करें।' };
      }

      // 1. Try finding in current in-memory rawStudents
      let dataset = rawStudents;

      // 2. If rawStudents is empty (still downloading from Google Sheet), wait for the active fetch!
      if (dataset.length === 0) {
        try {
          dataset = await loadMasterData();
        } catch (fetchErr) {
          console.warn('Waiting for master data failed:', fetchErr);
        }
      }

      // 3. Fallback to cached IndexedDB if still empty
      if (dataset.length === 0) {
        dataset = await getCachedStudents();
        if (dataset.length > 0) {
          setRawStudents(dataset);
        }
      }

      // 4. Validate UDISE code in dataset
      const matchedSchool = findSchoolByUdise(cleanCode, dataset);

      if (!matchedSchool) {
        return {
          success: false,
          error: `अमान्य UDISE कोड (${cleanCode})। यह कोड मास्टर डेटाबेस में उपलब्ध नहीं है।`,
        };
      }

      setCurrentUser(matchedSchool);
      setActiveFilters(initialFilters);
      setActiveTab('dashboard');
      return { success: true, school: matchedSchool };
    },
    [rawStudents, loadMasterData, setCurrentUser]
  );

  // District Admin Login
  const loginAsAdmin = useCallback(
    async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      const isValid = validateAdminCredentials(username, pass);
      if (!isValid) {
        return {
          success: false,
          error: 'अमान्य एडमिन क्रेडेंशियल्स (Invalid Admin credentials)। कृपया यूजरनेम और पासवर्ड जांचें।',
        };
      }

      const adminUser: CurrentUser = {
        name: 'District Administrator Dantewada',
        role: 'ADMIN',
      };

      setCurrentUser(adminUser);
      setActiveFilters(initialFilters);
      setActiveTab('dashboard');
      return { success: true };
    },
    [setCurrentUser]
  );

  // Logout & Clear Session
  const logout = useCallback(() => {
    clearStoredUser();
    setCurrentUserState(null);
    setActiveFilters(initialFilters);
    setActiveTab('dashboard');
  }, []);

  // Sync with Google Sheets
  const syncWithGoogleSheet = useCallback(
    async (customUrl?: string) => {
      const targetUrl = customUrl || googleScriptUrl;
      if (!targetUrl) {
        return { success: false, count: 0, error: 'Google Apps Script Web App URL .env फ़ाइल में नहीं मिला।' };
      }
      try {
        setLoading(true);
        const sheetStudents = await fetchFromGoogleSheet(targetUrl);
        if (sheetStudents && sheetStudents.length > 0) {
          setRawStudents(sheetStudents);
          await bulkSaveStudents(sheetStudents);
          setError(null);
          return { success: true, count: sheetStudents.length };
        }
        return { success: false, count: 0, error: 'शीट से कोई छात्र रिकॉर्ड प्राप्त नहीं हुआ।' };
      } catch (err: any) {
        return { success: false, count: 0, error: err.message || 'Google Sheet से कनेक्ट करने में त्रुटि।' };
      } finally {
        setLoading(false);
      }
    },
    [googleScriptUrl]
  );

  // Role-Based School Data Isolation Layer
  // When currentUser is SCHOOL_USER: ONLY their own school's records are exposed!
  // When currentUser is ADMIN: All district records are accessible.
  // When currentUser is null: Empty array.
  const students = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'SCHOOL_USER' && currentUser.udiseCode) {
      const targetUdise = String(currentUser.udiseCode).trim();
      return rawStudents.filter((s) => {
        const code = String(s.udise_code || (s as any).udiseCode || '').trim();
        return code === targetUdise;
      });
    }

    return rawStudents;
  }, [rawStudents, currentUser]);

  const resetFilters = useCallback(() => {
    setActiveFilters(initialFilters);
  }, []);

  // Filter students based on role permissions and active UI filters
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Filter by block
      if (activeFilters.block && s.block_name.toUpperCase() !== activeFilters.block.toUpperCase()) {
        return false;
      }
      // Filter by sankul
      if (activeFilters.sankul && s.sankul_name !== activeFilters.sankul) {
        return false;
      }
      // Filter by school
      if (activeFilters.school && s.school_name !== activeFilters.school) {
        return false;
      }
      // Filter by class
      if (activeFilters.className && s.class_name !== activeFilters.className) {
        return false;
      }
      // Filter by survey status
      if (activeFilters.surveyStatus && s.survey_status !== activeFilters.surveyStatus) {
        return false;
      }
      // Filter by reason
      if (activeFilters.reason && s.apaar_pending_reason !== activeFilters.reason) {
        return false;
      }

      // Search Query: supports student name (English & Hindi), PEN, School, UDISE, Father name
      if (activeFilters.searchQuery.trim()) {
        const query = activeFilters.searchQuery.trim().toLowerCase();
        const matchName = s.student_name_marksheet?.toLowerCase().includes(query);
        const matchAadhaarName = s.student_name_aadhaar?.toLowerCase().includes(query);
        const matchPen = s.student_pen_number?.toLowerCase().includes(query);
        const matchSchool = s.school_name?.toLowerCase().includes(query);
        const matchUdise = s.udise_code?.toLowerCase().includes(query);
        const matchFather = s.father_name?.toLowerCase().includes(query);

        if (!matchName && !matchAadhaarName && !matchPen && !matchSchool && !matchUdise && !matchFather) {
          return false;
        }
      }

      return true;
    });
  }, [students, activeFilters]);

  // Dynamic KPI Stats calculated strictly from authorized filtered dataset
  const stats = useMemo(() => {
    const targetSet = filteredStudents;
    const total = targetSet.length;
    let completed = 0;
    let pending = 0;
    let followUp = 0;
    let resolved = 0;

    targetSet.forEach((s) => {
      if (s.survey_status === 'SURVEY COMPLETED') completed++;
      else if (s.survey_status === 'PENDING') pending++;
      else if (s.survey_status === 'FOLLOW-UP REQUIRED') followUp++;
      else if (s.survey_status === 'RESOLVED') resolved++;
    });

    const completionRate = total > 0 ? parseFloat((((completed + resolved) / total) * 100).toFixed(1)) : 0;

    return {
      totalStudents: total,
      surveyCompleted: completed,
      surveyPending: pending,
      followUpRequired: followUp,
      resolved: resolved,
      completionRate,
    };
  }, [filteredStudents]);

  // Block-wise summary rows
  const blockSummaries = useMemo(() => {
    const blocks = ['DANTEWADA', 'GEEDAM', 'KUAKONDA', 'KATEKALYAN'];
    const map = new Map<string, { total: number; completed: number; pending: number; followUp: number; resolved: number }>();

    blocks.forEach((b) => {
      map.set(b, { total: 0, completed: 0, pending: 0, followUp: 0, resolved: 0 });
    });

    // In school user mode, only their school's students are counted
    students.forEach((s) => {
      const b = (s.block_name || '').toUpperCase().trim();
      let entry = map.get(b);
      if (!entry) {
        entry = { total: 0, completed: 0, pending: 0, followUp: 0, resolved: 0 };
        map.set(b, entry);
      }
      entry.total++;
      if (s.survey_status === 'SURVEY COMPLETED') entry.completed++;
      else if (s.survey_status === 'PENDING') entry.pending++;
      else if (s.survey_status === 'FOLLOW-UP REQUIRED') entry.followUp++;
      else if (s.survey_status === 'RESOLVED') entry.resolved++;
    });

    return Array.from(map.entries()).map(([block, counts]) => ({
      block,
      totalStudents: counts.total,
      surveyCompleted: counts.completed,
      surveyPending: counts.pending,
      followUpRequired: counts.followUp,
      resolved: counts.resolved,
      completionRate: counts.total > 0 ? parseFloat((((counts.completed + counts.resolved) / counts.total) * 100).toFixed(1)) : 0,
    }));
  }, [students]);

  // Reason-wise counts from recorded surveys
  const reasonCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredStudents.forEach((s) => {
      if (s.apaar_pending_reason) {
        const reason = s.apaar_pending_reason.trim();
        counts[reason] = (counts[reason] || 0) + 1;
      }
    });
    return counts;
  }, [filteredStudents]);

  // Recent Survey Activity (students updated)
  const recentActivity = useMemo(() => {
    return students
      .filter((s) => s.survey_status !== 'PENDING' || s.apaar_pending_reason)
      .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
      .slice(0, 10);
  }, [students]);

  // Update a student's survey with strict role validation
  const updateStudentSurvey = useCallback(
    async (id: string, surveyData: Partial<Student>): Promise<boolean> => {
      try {
        const existing = rawStudents.find((s) => s.id === id);
        if (!existing) return false;

        // Security Check: If school user, ensure student belongs to their UDISE code!
        if (currentUser?.role === 'SCHOOL_USER') {
          const userUdise = String(currentUser.udiseCode || '').trim();
          const studentUdise = String(existing.udise_code || '').trim();
          if (userUdise !== studentUdise) {
            console.error('Security Violation: School user attempted to edit student of another school!');
            return false;
          }
        }

        const updatedStudent: Student = {
          ...existing,
          ...surveyData,
          surveyor_name: surveyData.surveyor_name || currentUser?.name || 'Authorized User',
          survey_date: surveyData.survey_date || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // 1. Save to local IndexedDB
        await saveStudent(updatedStudent);

        // 2. Sync to Google Sheets if configured
        const targetUrl = googleScriptUrl || getGoogleScriptUrl();
        if (targetUrl) {
          saveToGoogleSheet(
            updatedStudent.student_pen_number || updatedStudent.pen_number || '',
            updatedStudent.is_aadhaar_provided || '',
            updatedStudent.is_aadhaar_verified || '',
            updatedStudent.apaar_pending_reason || '',
            (updatedStudent as any).rowIndex,
            targetUrl,
            updatedStudent.udise_code,
            {
              studentNameMarksheet: updatedStudent.student_name_marksheet,
              studentNameAadhaar: updatedStudent.student_name_aadhaar,
              nameMatchStatus: updatedStudent.name_match_status,
              dobMarksheet: updatedStudent.dob_marksheet,
              dobAadhaar: updatedStudent.dob_aadhaar,
              dobMatchStatus: updatedStudent.dob_match_status,
              fatherName: updatedStudent.father_name,
              districtName: updatedStudent.district_name || updatedStudent.student_district,
              documentsAvailable: updatedStudent.documents_available,
              remarks: updatedStudent.remarks,
            }
          ).catch((err) => console.warn('Google Sheet background sync warning:', err));
        }

        // 3. Update React state in rawStudents
        setRawStudents((prev) => prev.map((s) => (s.id === id ? updatedStudent : s)));

        return true;
      } catch (err) {
        console.error('Failed to update student survey:', err);
        return false;
      }
    },
    [rawStudents, currentUser, googleScriptUrl]
  );

  // Reset database back to master dataset
  const resetToMasterExcel = useCallback(async () => {
    setLoading(true);
    try {
      await resetDatabaseToInitial();
      const fresh = await loadMasterData();
      setRawStudents(fresh);
    } catch (err: any) {
      console.error('Error resetting database:', err);
    } finally {
      setLoading(false);
    }
  }, [loadMasterData]);

  return (
    <StudentContext.Provider
      value={{
        rawStudents,
        students,
        loading,
        error,
        currentUser,
        setCurrentUser,
        loginAsSchool,
        loginAsAdmin,
        logout,
        activeTab,
        setActiveTab,
        activeFilters,
        setActiveFilters,
        resetFilters,
        filteredStudents,
        googleScriptUrl,
        syncWithGoogleSheet,
        stats,
        blockSummaries,
        reasonCounts,
        recentActivity,
        updateStudentSurvey,
        resetToMasterExcel,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};
