import { listConnectorSchedules, listConnectorExams } from "./tauriApi";
import type { SchoolProfile } from "./schoolProfile";
import type { ExamRecord, ScheduleRecord } from "./types";

export { ACADEMIC_CACHE_UPDATED_EVENT } from "./academicEvents";
export const ACADEMIC_CONNECTION_REQUIRED = "Chưa có dữ liệu học tập từ tài khoản trường. Mở Trường & tài khoản để kiểm tra kết nối.";

export function academicDataErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (message.includes("CONTRACT_UNVERIFIED")) {
    return "Dữ liệu UTH chưa được xác minh. Cache cũ vẫn giữ trên máy nhưng chưa được dùng làm lịch học/lịch thi chính thức. Mở website trường để xem dữ liệu trực tiếp.";
  }
  return "Không đọc được cache học tập. Dữ liệu đã lưu vẫn được giữ; hãy thử mở lại trang.";
}

export async function loadAcademicSchedule(profile: SchoolProfile): Promise<ScheduleRecord[]> {
  if (profile.schoolId !== "uth" || !profile.studentCode.trim()) return [];
  const records = await listConnectorSchedules(profile.studentCode.trim());
  return records.filter((record) => record.source === "uth-portal" && record.studentCode === profile.studentCode.trim())
    .map((record) => ({
      id: record.id, subjectId: record.subjectCode, subjectName: record.subjectName,
      semester: 0, weekday: record.weekday, startTime: record.startTime, endTime: record.endTime,
      room: record.room, lecturer: record.lecturer, note: "Cache UTH Portal; kiểm tra thời điểm đồng bộ trong Trường & tài khoản.",
    }));
}

export async function loadAcademicExams(profile: SchoolProfile): Promise<ExamRecord[]> {
  if (profile.schoolId !== "uth" || !profile.studentCode.trim()) return [];
  const records = await listConnectorExams(profile.studentCode.trim());
  return records.filter((record) => record.source === "uth-portal" && record.studentCode === profile.studentCode.trim())
    .map((record) => ({
      id: record.id, subjectId: record.subjectCode, subjectName: record.subjectName,
      semester: 0, examDate: record.examDate, startTime: record.startTime,
      durationMinutes: record.durationMinutes, room: record.room, format: record.format,
      note: "Cache UTH Portal thử nghiệm; đối chiếu lịch thi trên cổng trường.",
    }));
}
