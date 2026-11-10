import { listConnectorSchedules, listConnectorExams } from "./tauriApi";
import type { SchoolProfile } from "./schoolProfile";
import type { ExamRecord, ScheduleRecord, AcademicQueryResult } from "./types";

export { ACADEMIC_CACHE_UPDATED_EVENT } from "./academicEvents";
export const ACADEMIC_CONNECTION_REQUIRED = "Chưa có dữ liệu học tập từ tài khoản trường. Mở Trường & tài khoản để kiểm tra kết nối.";

export function academicDataErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (message.includes("CONTRACT_UNVERIFIED")) {
    return "Dữ liệu UTH chưa được xác minh. Cache cũ vẫn giữ trên máy nhưng chưa được dùng làm lịch học/lịch thi chính thức. Mở website trường để xem dữ liệu trực tiếp.";
  }
  return "Lỗi tải dữ liệu. Nhấn 'Thử lại' để tải lại danh sách."; // CA-089.02: Đổi câu thông báo chuẩn
}

// CA-089.02: Hàm tạo đối tượng Empty hoặc Not Connected dùng chung
function buildEmptyResult<T>(status: 'NOT_CONNECTED' | 'EMPTY'): AcademicQueryResult<T> {
  return {
    status,
    data: null,
    provenance: null,
  };
}

export async function loadAcademicSchedule(profile: SchoolProfile): Promise<AcademicQueryResult<ScheduleRecord[]>> {
  // CA-089.02: Chặn cứng nếu không phải trường đang hỗ trợ (uth) hoặc không có mã sinh viên
  if (profile.schoolId !== "uth" || !profile.studentCode.trim()) {
    return buildEmptyResult('NOT_CONNECTED');
  }

  try {
    const rawRecords = await listConnectorSchedules(profile.studentCode.trim());
    const filtered = rawRecords.filter(
      (record) => record.source === "uth-portal" && record.studentCode === profile.studentCode.trim()
    );

    if (filtered.length === 0) {
      return buildEmptyResult('EMPTY');
    }

    const schedules: ScheduleRecord[] = filtered.map((record) => ({
      id: record.id, 
      subjectId: record.subjectCode, 
      subjectName: record.subjectName,
      semester: 0, 
      weekday: record.weekday, 
      startTime: record.startTime, 
      endTime: record.endTime,
      room: record.room, 
      lecturer: record.lecturer, 
      note: "Cache UTH Portal; kiểm tra thời điểm đồng bộ trong phần cài đặt.",
    }));

    return {
      status: 'LOADING', // Được chuyển sang SUCCESS ngầm định khi có data
      data: schedules,
      provenance: {
        source: "uth-sqlite-local",
        account: profile.studentCode.trim(),
        scope: "current-semester", // Sẽ lấy từ API sau này
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      status: 'ERROR',
      data: null,
      provenance: null,
      error: academicDataErrorMessage(error)
    };
  }
}

export async function loadAcademicExams(profile: SchoolProfile): Promise<AcademicQueryResult<ExamRecord[]>> {
  // CA-089.02: Chặn cứng nếu không phải trường đang hỗ trợ (uth) hoặc không có mã sinh viên
  if (profile.schoolId !== "uth" || !profile.studentCode.trim()) {
    return buildEmptyResult('NOT_CONNECTED');
  }

  try {
    const rawRecords = await listConnectorExams(profile.studentCode.trim());
    const filtered = rawRecords.filter(
      (record) => record.source === "uth-portal" && record.studentCode === profile.studentCode.trim()
    );

    if (filtered.length === 0) {
      return buildEmptyResult('EMPTY');
    }

    const exams: ExamRecord[] = filtered.map((record) => ({
      id: record.id, 
      subjectId: record.subjectCode, 
      subjectName: record.subjectName,
      semester: 0, 
      examDate: record.examDate, 
      startTime: record.startTime,
      durationMinutes: record.durationMinutes, 
      room: record.room, 
      format: record.format,
      note: "Cache UTH Portal thử nghiệm; đối chiếu lịch thi trên cổng trường.",
    }));

    return {
      status: 'LOADING',
      data: exams,
      provenance: {
        source: "uth-sqlite-local",
        account: profile.studentCode.trim(),
        scope: "current-exams",
        fetchedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      status: 'ERROR',
      data: null,
      provenance: null,
      error: academicDataErrorMessage(error)
    };
  }
}