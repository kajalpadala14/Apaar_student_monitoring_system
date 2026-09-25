import { Student, BlockSummary, SchoolSummary, DashboardKPIs } from '../types';

export function calculateKPIs(students: Student[]): DashboardKPIs {
  const totalStudents = students.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      aadhaarProvided: 0,
      aadhaarProvidedPct: 0,
      aadhaarNotProvided: 0,
      aadhaarNotProvidedPct: 0,
      aadhaarVerified: 0,
      aadhaarVerifiedPct: 0,
      aadhaarNotVerified: 0,
      aadhaarNotVerifiedPct: 0,
      apaarGenerated: 0,
      apaarPending: 0,
      completionPct: 0,
      totalSchools: 0,
      totalBlocks: 0
    };
  }

  const aadhaarProvided = students.filter(s => s.isAadhaarProvided === 'YES').length;
  const aadhaarNotProvided = totalStudents - aadhaarProvided;
  const aadhaarVerified = students.filter(s => s.isAadhaarVerified === 'YES').length;
  const aadhaarNotVerified = totalStudents - aadhaarVerified;
  const apaarGenerated = students.filter(s => s.apaarStatus === 'Generated').length;
  const apaarPending = totalStudents - apaarGenerated;

  const schoolsSet = new Set<string>();
  const blocksSet = new Set<string>();
  for (let i = 0; i < students.length; i++) {
    schoolsSet.add(students[i].udiseCode || students[i].schoolName);
    blocksSet.add(students[i].blockName);
  }

  return {
    totalStudents,
    aadhaarProvided,
    aadhaarProvidedPct: Number(((aadhaarProvided / totalStudents) * 100).toFixed(2)),
    aadhaarNotProvided,
    aadhaarNotProvidedPct: Number(((aadhaarNotProvided / totalStudents) * 100).toFixed(2)),
    aadhaarVerified,
    aadhaarVerifiedPct: Number(((aadhaarVerified / totalStudents) * 100).toFixed(2)),
    aadhaarNotVerified,
    aadhaarNotVerifiedPct: Number(((aadhaarNotVerified / totalStudents) * 100).toFixed(2)),
    apaarGenerated,
    apaarPending,
    completionPct: Number(((apaarGenerated / totalStudents) * 100).toFixed(2)),
    totalSchools: schoolsSet.size,
    totalBlocks: blocksSet.size,
    districtName: students[0]?.districtName || '',
    districtCode: students[0]?.districtCode || '',
    stateName: students[0]?.stateName || '',
    stateCode: students[0]?.stateCode || ''
  };
}

export function calculateBlockSummaries(students: Student[]): BlockSummary[] {
  const map = new Map<string, {
    blockName: string;
    blockCode: string;
    total: number;
    prov: number;
    ver: number;
    gen: number;
    schools: Set<string>;
  }>();

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const bName = s.blockName || 'UNKNOWN';
    let entry = map.get(bName);
    if (!entry) {
      entry = {
        blockName: bName,
        blockCode: s.blockCode || '',
        total: 0,
        prov: 0,
        ver: 0,
        gen: 0,
        schools: new Set<string>()
      };
      map.set(bName, entry);
    }
    entry.total++;
    if (s.isAadhaarProvided === 'YES') entry.prov++;
    if (s.isAadhaarVerified === 'YES') entry.ver++;
    if (s.apaarStatus === 'Generated') entry.gen++;
    entry.schools.add(s.udiseCode || s.schoolName);
  }

  const result: BlockSummary[] = [];
  for (const item of map.values()) {
    const completionPct = item.total > 0 ? Number(((item.gen / item.total) * 100).toFixed(2)) : 0;
    const aadhaarProvidedPct = item.total > 0 ? Number(((item.prov / item.total) * 100).toFixed(2)) : 0;
    const aadhaarVerifiedPct = item.total > 0 ? Number(((item.ver / item.total) * 100).toFixed(2)) : 0;

    let status: 'GREEN' | 'YELLOW' | 'RED' = 'RED';
    if (completionPct >= 90) status = 'GREEN';
    else if (completionPct >= 70) status = 'YELLOW';
    else status = 'RED';

    result.push({
      blockName: item.blockName,
      blockCode: item.blockCode,
      totalStudents: item.total,
      aadhaarProvided: item.prov,
      aadhaarNotProvided: item.total - item.prov,
      aadhaarVerified: item.ver,
      aadhaarNotVerified: item.total - item.ver,
      apaarGenerated: item.gen,
      apaarPending: item.total - item.gen,
      aadhaarProvidedPct,
      aadhaarVerifiedPct,
      completionPct,
      status,
      schoolCount: item.schools.size
    });
  }

  // Sort descending by total students
  return result.sort((a, b) => b.totalStudents - a.totalStudents);
}

export function calculateSchoolSummaries(students: Student[]): SchoolSummary[] {
  const map = new Map<string, {
    udiseCode: string;
    schoolName: string;
    blockName: string;
    total: number;
    prov: number;
    ver: number;
    gen: number;
  }>();

  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const udise = s.udiseCode || s.schoolName;
    let entry = map.get(udise);
    if (!entry) {
      entry = {
        udiseCode: s.udiseCode,
        schoolName: s.schoolName,
        blockName: s.blockName,
        total: 0,
        prov: 0,
        ver: 0,
        gen: 0
      };
      map.set(udise, entry);
    }
    entry.total++;
    if (s.isAadhaarProvided === 'YES') entry.prov++;
    if (s.isAadhaarVerified === 'YES') entry.ver++;
    if (s.apaarStatus === 'Generated') entry.gen++;
  }

  const result: SchoolSummary[] = [];
  for (const item of map.values()) {
    const completionPct = item.total > 0 ? Number(((item.gen / item.total) * 100).toFixed(2)) : 0;
    let status: 'GREEN' | 'YELLOW' | 'RED' = 'RED';
    if (completionPct >= 90) status = 'GREEN';
    else if (completionPct >= 70) status = 'YELLOW';
    else status = 'RED';

    result.push({
      udiseCode: item.udiseCode,
      schoolName: item.schoolName,
      blockName: item.blockName,
      totalStudents: item.total,
      aadhaarProvided: item.prov,
      aadhaarVerified: item.ver,
      apaarGenerated: item.gen,
      apaarPending: item.total - item.gen,
      completionPct,
      status
    });
  }

  return result.sort((a, b) => b.totalStudents - a.totalStudents);
}

export interface ReasonSummary {
  reason: string;
  count: number;
  percentage: number;
  relatedSchoolsCount: number;
  relatedBlocksCount: number;
}

export function calculateReasonSummaries(students: Student[]): ReasonSummary[] {
  const pendingStudents = students.filter(s => s.apaarStatus === 'Pending');
  const totalPending = pendingStudents.length;
  if (totalPending === 0) return [];

  const map = new Map<string, {
    count: number;
    schools: Set<string>;
    blocks: Set<string>;
  }>();

  for (let i = 0; i < pendingStudents.length; i++) {
    const s = pendingStudents[i];
    const reason = s.pendingReason || 'Not Applied';
    let entry = map.get(reason);
    if (!entry) {
      entry = { count: 0, schools: new Set(), blocks: new Set() };
      map.set(reason, entry);
    }
    entry.count++;
    entry.schools.add(s.udiseCode || s.schoolName);
    entry.blocks.add(s.blockName);
  }

  const result: ReasonSummary[] = [];
  for (const [reason, item] of map.entries()) {
    result.push({
      reason,
      count: item.count,
      percentage: Number(((item.count / totalPending) * 100).toFixed(2)),
      relatedSchoolsCount: item.schools.size,
      relatedBlocksCount: item.blocks.size
    });
  }

  return result.sort((a, b) => b.count - a.count);
}
