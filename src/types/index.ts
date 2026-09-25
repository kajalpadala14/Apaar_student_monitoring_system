export interface Student {
  id: number;
  stateName: string;
  stateCode: string;
  districtName: string;
  districtCode: string;
  blockName: string;
  blockCode: string;
  schoolName: string;
  udiseCode: string;
  schoolManagement: string | number;
  schoolCategory: string | number;
  className: string;
  section: string;
  studentPen: string;
  studentName: string;
  isAadhaarProvided: 'YES' | 'NO';
  isAadhaarVerified: 'YES' | 'NO';
  apaarStatus: 'Generated' | 'Pending';
  apaarId?: string;
  pendingReason: string;
  updatedAt?: string;
}

export interface BlockSummary {
  blockName: string;
  blockCode: string;
  totalStudents: number;
  aadhaarProvided: number;
  aadhaarNotProvided: number;
  aadhaarVerified: number;
  aadhaarNotVerified: number;
  apaarGenerated: number;
  apaarPending: number;
  aadhaarProvidedPct: number;
  aadhaarVerifiedPct: number;
  completionPct: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  schoolCount: number;
}

export interface SchoolSummary {
  udiseCode: string;
  schoolName: string;
  blockName: string;
  totalStudents: number;
  aadhaarProvided: number;
  aadhaarVerified: number;
  apaarGenerated: number;
  apaarPending: number;
  completionPct: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
}

export interface DashboardKPIs {
  totalStudents: number;
  aadhaarProvided: number;
  aadhaarProvidedPct: number;
  aadhaarNotProvided: number;
  aadhaarNotProvidedPct: number;
  aadhaarVerified: number;
  aadhaarVerifiedPct: number;
  aadhaarNotVerified: number;
  aadhaarNotVerifiedPct: number;
  apaarGenerated: number;
  apaarPending: number;
  completionPct: number;
  totalSchools: number;
  totalBlocks: number;
  districtName?: string;
  districtCode?: string;
  stateName?: string;
  stateCode?: string;
}

export interface FilterState {
  block: string;
  school: string;
  udiseCode: string;
  className: string;
  aadhaarProvided: string;
  aadhaarVerified: string;
  apaarStatus: string;
  pendingReason: string;
  searchTerm: string;
}
