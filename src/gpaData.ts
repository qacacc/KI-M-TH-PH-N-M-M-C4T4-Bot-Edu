import type { GpaSubject } from "./components/GpaCalculator";

export const GPA_STORAGE_KEY = "ca_gpa_calculator_manual_v2";
export const GPA_LEGACY_STORAGE_KEY = "ca_gpa_calculator_data_v1";

export function parseGpaSubjects(raw: string | null): GpaSubject[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every((item) => item && typeof item.id === "string" &&
    typeof item.name === "string" && Number.isFinite(item.credits) && item.credits >= 1 && item.credits <= 10 &&
    typeof item.letterGrade === "string" && ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"].includes(item.letterGrade) &&
    Number.isFinite(item.score10) && item.score10 >= 0 && item.score10 <= 10)) {
    throw new Error("Dữ liệu điểm đã lưu không hợp lệ.");
  }
  return value;
}
