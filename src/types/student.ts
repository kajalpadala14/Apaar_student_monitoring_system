export type SurveyStatus = 'PENDING' | 'SURVEY COMPLETED' | 'FOLLOW-UP REQUIRED' | 'RESOLVED';

export type UserRole = 'ADMIN' | 'SCHOOL_USER';

export interface CurrentUser {
  name: string;
  role: UserRole;
  udiseCode?: string;
  schoolName?: string;
  blockName?: string;
  clusterName?: string;
}

export interface Student {
  id: string; // Unique identifier: STU-XXXXX or UDISE-PEN-Name
  // Original Excel columns (Hindi & English mapped)
  block_name: string; // ब्लॉक का नाम
  sankul_name: string; // संकुल का नाम
  category: string; // श्रेणी
  school_name: string; // स्कूल का नाम
  udise_code: string; // UDISE Code
  class_name: string; // कक्षा
  section: string; // Section
  student_pen_number: string; // विद्यार्थी का पेन नंबर
  student_name_marksheet: string; // विद्यार्थी का नाम (मार्कशीट के अनुसार)
  student_name_aadhaar?: string; // विद्यार्थी का नाम (आधार के अनुसार)
  dob_marksheet?: string; // विद्यार्थी का जन्मतिथि (मार्कशीट के अनुसार)
  dob_aadhaar?: string; // विद्यार्थी का जन्मतिथि (आधार के अनुसार)
  pen_number?: string; // पेन नंबर
  father_name?: string; // विद्यार्थी के पिता का नाम
  student_district?: string; // विद्यार्थी किस जिले का निवासी है
  district_state?: string; // जिला या राज्य का नाम लिखें

  // Survey fields (3 Main Fields requested: Is AADHAAR Provided, Is AADHAAR Verified, Reason For Not Generated Apaar Id)
  is_aadhaar_provided?: string; // Is AADHAAR Provided (YES / NO)
  is_aadhaar_verified?: string; // Is AADHAAR Verified (YES / NO)
  apaar_pending_reason?: string; // Reason For Not Generated Apaar Id (अपार आईडी नहीं बनने का कारण)
  other_reason?: string;
  remarks?: string;
  survey_status: SurveyStatus;
  surveyor_name?: string;
  survey_date?: string;
  updated_at?: string;
}

export const SURVEY_REASONS = [
  'आधार एनरोलमेंट हुआ हैं परन्तु वर्तमान में आधार कार्ड उपलब्ध नहीं हैं',
  'आधार कार्ड उपलब्ध हैं एवं UDISE पोर्टल में एंट्री पूर्ण कर लिया गया हैं ।।',
  'आधार कार्ड उपलब्ध हैं परन्तु UDISE पोर्टल में एंट्री नहीं हुआ हैं',
  'जन्म प्रमाण पत्र बन गया हैं, परन्तु आधार एनरोलमेंट नहीं हुआ हैं।',
  'जन्म प्रमाण पत्र में बच्चें का नाम गलत हैं।',
  'जन्म प्रमाण पत्र में माता/पिता का नाम आधार कार्ड के अनुसार दर्ज नहीं हैं।',
  'बच्चें का जन्म प्रमाण पत्र ऑफलाइन हैं।',
  'बच्चें का जन्म प्रमाण पत्र नहीं बना हैं।',
  'अन्य (Other)'
] as const;

export const SURVEY_STATUS_OPTIONS: SurveyStatus[] = [
  'PENDING',
  'SURVEY COMPLETED',
  'FOLLOW-UP REQUIRED',
  'RESOLVED'
];

export interface BlockSummary {
  block: string;
  totalStudents: number;
  surveyCompleted: number;
  surveyPending: number;
  followUpRequired: number;
  resolved: number;
  completionRate: number;
}
