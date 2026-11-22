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
    const validCredits =
      entry.credits === "" ||
      (typeof entry.credits === "number" && Number.isInteger(entry.credits) && entry.credits >= 1 && entry.credits <= 10);
    const validLetter =
      typeof entry.letterGrade === "string" &&
      (entry.letterGrade === "" || Object.prototype.hasOwnProperty.call(GRADE_CONVERSION, entry.letterGrade));
    const validScore10 =
      entry.score10 === "" ||
      (typeof entry.score10 === "number" && Number.isFinite(entry.score10) && entry.score10 >= 0 && entry.score10 <= 10);

    if (!validId || !validName || !validCredits || !validLetter || !validScore10) {
      throw new Error("Dữ liệu điểm đã lưu không hợp lệ.");
    }
    seenIds.add(entry.id as string);
  }

  return value as GpaSubject[];
}

export function calculateGpaStats(subjects: GpaSubject[]) {
  let totalCredits = 0;
  let totalPoints4 = 0;
  let totalPoints10 = 0;

  for (const s of subjects) {
    if (
      s.credits === "" ||
      typeof s.credits !== "number" ||
      !Number.isInteger(s.credits) ||
      s.credits < 1 ||
      s.credits > 10 ||
      s.letterGrade === "" ||
      s.score10 === "" ||
      typeof s.score10 !== "number" ||
      !Number.isFinite(s.score10) ||
      s.score10 < 0 ||
      s.score10 > 10 ||
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