import { describe, expect, it, vi, beforeEach } from "vitest";
import { loadAcademicSchedule, loadAcademicExams, academicDataErrorMessage } from "./academicData";
import { listConnectorSchedules, listConnectorExams } from "./tauriApi";
import { createDefaultSchoolProfile } from "./schoolProfile";

vi.mock("./tauriApi");

describe("nguồn học tập tài khoản trường", () => {
  const profile = { ...createDefaultSchoolProfile(), studentCode: "SV-TEST", schoolId: "uth" };
  const schedule = { id: "sched", source: "uth-portal", studentCode: "SV-TEST", subjectCode: "TEST", subjectName: "Môn kiểm thử", weekday: 2, startTime: "08:00", endTime: "10:30", room: "P1", lecturer: "GV1" };
  const exam = { id: "exam", source: "uth-portal", studentCode: "SV-TEST", subjectCode: "TEST", subjectName: "Môn kiểm thử", examDate: "2026-10-10", startTime: "08:00", durationMinutes: 60, room: "P1", format: "Thực hành" };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("giải thích contract chưa verified và không đưa lỗi nội bộ vào UI", () => {
    expect(academicDataErrorMessage(new Error("CONTRACT_UNVERIFIED_2026_HK1"))).toContain("UTH chưa được xác minh");
    expect(academicDataErrorMessage(new Error("Network timeout object not found at 0x00A"))).not.toContain("0x00A");
  });

  it("không truy vấn cache UTH khi chưa có MSSV hoặc chọn trường khác", async () => {
    expect(await loadAcademicSchedule(createDefaultSchoolProfile())).toEqual({ status: 'NOT_CONNECTED', data: null, provenance: null });
    expect(await loadAcademicExams({ ...profile, schoolId: "hcmut" })).toEqual({ status: 'NOT_CONNECTED', data: null, provenance: null });
    expect(listConnectorSchedules).not.toHaveBeenCalled();
  });

  it("chỉ lấy cache đúng tài khoản và bỏ prototype", async () => {
    vi.mocked(listConnectorSchedules).mockResolvedValue([schedule, { ...schedule, source: "prototype-mock" }, { ...schedule, studentCode: "OTHER" }]);
    const result = await loadAcademicSchedule(profile);
    expect(result.status).toBe('LOADING');
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].startTime).toBe("08:00");
  });

  it("cache rỗng không sinh lịch mẫu", async () => {
    vi.mocked(listConnectorSchedules).mockResolvedValue([]);
    vi.mocked(listConnectorExams).mockResolvedValue([]);
    expect(await loadAcademicSchedule(profile)).toEqual({ status: 'EMPTY', data: null, provenance: null });
    expect(await loadAcademicExams(profile)).toEqual({ status: 'EMPTY', data: null, provenance: null });
  });

  it("lỗi đọc cache được propagate thành ERROR status thay vì reject", async () => {
    vi.mocked(listConnectorSchedules).mockRejectedValue(new Error("DB unavailable"));
    vi.mocked(listConnectorExams).mockRejectedValue(new Error("DB unavailable"));
    
    const schedResult = await loadAcademicSchedule(profile);
    expect(schedResult.status).toBe('ERROR');
    expect(schedResult.error).toContain("Lỗi tải dữ liệu");

    const examResult = await loadAcademicExams(profile);
    expect(examResult.status).toBe('ERROR');
    expect(examResult.error).toContain("Lỗi tải dữ liệu");
  });

  it("lịch thi không lấy cache mock hoặc tài khoản khác", async () => {
    vi.mocked(listConnectorExams).mockResolvedValue([exam, { ...exam, source: "prototype-mock" }, { ...exam, studentCode: "OTHER" }]);
    const result = await loadAcademicExams(profile);
    expect(result.status).toBe('LOADING');
    expect(result.data?.[0]).toMatchObject({ durationMinutes: 60, startTime: "08:00" });
  });
});