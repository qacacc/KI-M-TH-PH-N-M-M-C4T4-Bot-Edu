import type { GpaSubject } from "./components/GpaCalculator";

export const GPA_STORAGE_KEY = "ca_gpa_calculator_manual_v2";
export const GPA_LEGACY_STORAGE_KEY = "ca_gpa_calculator_data_v1";

export const GRADE_CONVERSION: Record<string, { scale4: number; defaultScore10: number }> = {
  "A+": { scale4: 4.0, defaultScore10: 9.5 },
  "A": { scale4: 3.7, defaultScore10: 8.5 },
  "B+": { scale4: 3.5, defaultScore10: 8.0 },
  "B": { scale4: 3.0, defaultScore10: 7.2 },
  "C+": { scale4: 2.5, defaultScore10: 6.5 },
  "C": { scale4: 2.0, defaultScore10: 5.8 },
  "D+": { scale4: 1.5, defaultScore10: 5.0 },
  "D": { scale4: 1.0, defaultScore10: 4.2 },
  "F": { scale4: 0.0, defaultScore10: 2.0 },
};

export interface PortalGradeRecord {
  id: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  score10: number;
  letterGrade: string;
  semester?: string;
  source: "uth-portal";
  verified: boolean;
}

export interface GpaLoadResult {
  subjects: GpaSubject[];
  isCorrupted: boolean;
  hasLegacyV1: boolean;
  legacyCorrupted: boolean;
}

export function isValidCredits(credits: unknown): credits is number {
  return typeof credits === "number" && Number.isInteger(credits) && credits >= 1 && credits <= 10;
}

export function isValidScore10(score: unknown): score is number {
  return typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 10;
}

export function getLetterGradeFrom10(score: number): string {
  if (score >= 9.0) return "A+";
  if (score >= 8.5) return "A";
  if (score >= 8.0) return "B+";
  if (score >= 7.0) return "B";
  if (score >= 6.5) return "C+";
  if (score >= 5.5) return "C";
  if (score >= 5.0) return "D+";
  if (score >= 4.0) return "D";
  return "F";
}

export function parseGpaSubjects(raw: string | null): GpaSubject[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) {
    throw new Error("Dữ liệu điểm đã lưu không hợp lệ.");
  }

  const seenIds = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") {
      throw new Error("Dữ liệu điểm đã lưu không hợp lệ.");
    }
    const entry = item as Record<string, unknown>;
    const validId = typeof entry.id === "string" && entry.id.trim().length > 0 && !seenIds.has(entry.id);
    const validName = typeof entry.name === "string";
    const validCredits = entry.credits === "" || isValidCredits(entry.credits);
    const validLetter =
      typeof entry.letterGrade === "string" &&
      (entry.letterGrade === "" || Object.prototype.hasOwnProperty.call(GRADE_CONVERSION, entry.letterGrade));
    const validScore10 = entry.score10 === "" || isValidScore10(entry.score10);

    if (!validId || !validName || !validCredits || !validLetter || !validScore10) {
      throw new Error("Dữ liệu điểm đã lưu không hợp lệ.");
    }
    seenIds.add(entry.id as string);
  }

  return value as GpaSubject[];
}

export function saveGpaSubjects(subjects: GpaSubject[]): boolean {
  try {
    localStorage.setItem(GPA_STORAGE_KEY, JSON.stringify(subjects));
    return true;
  } catch {
    return false;
  }
}

export function loadGpaSubjects(): GpaLoadResult {
  let hasLegacyV1 = false;
  let legacyCorrupted = false;

  try {
    const rawV1 = localStorage.getItem(GPA_LEGACY_STORAGE_KEY);
    if (rawV1 !== null && rawV1.trim() !== "") {
      try {
        const parsedV1 = parseGpaSubjects(rawV1);
        hasLegacyV1 = parsedV1.length > 0;
      } catch {
        legacyCorrupted = true;
      }
    }
  } catch {
    legacyCorrupted = true;
  }

  try {
    const rawV2 = localStorage.getItem(GPA_STORAGE_KEY);
    if (rawV2 !== null) {
      try {
        return {
          subjects: parseGpaSubjects(rawV2),
          isCorrupted: false,
          hasLegacyV1,
          legacyCorrupted,
        };
      } catch {
        return {
          subjects: [],
          isCorrupted: true,
          hasLegacyV1,
          legacyCorrupted,
        };
      }
    }

    return {
      subjects: [],
      isCorrupted: false,
      hasLegacyV1,
      legacyCorrupted,
    };
  } catch {
    return {
      subjects: [],
      isCorrupted: true,
      hasLegacyV1,
      legacyCorrupted,
    };
  }
}

export function calculateGpaStats(subjects: GpaSubject[]) {
  let totalCredits = 0;
  let totalPoints4 = 0;
  let totalPoints10 = 0;

  for (const s of subjects) {
    if (
      !isValidCredits(s.credits) ||
      s.letterGrade === "" ||
      !isValidScore10(s.score10) ||
      !Object.prototype.hasOwnProperty.call(GRADE_CONVERSION, s.letterGrade)
    ) {
      continue;
    }

    const credits = s.credits;
    const scale4 = GRADE_CONVERSION[s.letterGrade]?.scale4 ?? 0;
    const score10 = s.score10;

    totalCredits += credits;
    totalPoints4 += scale4 * credits;
    totalPoints10 += score10 * credits;
  }

  if (totalCredits === 0) {
    return {
      totalCredits: 0,
      gpaScale4: "0.00",
      gpaScale10: "0.00",
      numGpa4: 0,
    };
  }

  const gpaScale4 = (totalPoints4 / totalCredits).toFixed(2);
  const gpaScale10 = (totalPoints10 / totalCredits).toFixed(2);

  return {
    totalCredits,
    gpaScale4,
    gpaScale10,
    numGpa4: Number(gpaScale4),
  };
}

export function calculatePortalGpaStats(records: PortalGradeRecord[]) {
  const verifiedRecords = records.filter(
    (r) =>
      r.source === "uth-portal" &&
      r.verified === true &&
      isValidCredits(r.credits) &&
      isValidScore10(r.score10) &&
      Object.prototype.hasOwnProperty.call(GRADE_CONVERSION, r.letterGrade),
  );

  if (verifiedRecords.length === 0) {
    return {
      hasVerifiedData: false,
      subjectCount: 0,
      totalCredits: 0,
      gpaScale4: "0.00",
      gpaScale10: "0.00",
      numGpa4: 0,
    };
  }

  const mapped: GpaSubject[] = verifiedRecords.map((r) => ({
    id: r.id,
    name: r.subjectName,
    credits: r.credits,
    letterGrade: r.letterGrade,
    score10: r.score10,
  }));

  const stats = calculateGpaStats(mapped);
  return {
    hasVerifiedData: stats.totalCredits > 0,
    subjectCount: verifiedRecords.length,
    ...stats,
  };
}