import { beforeEach, describe, expect, it, vi } from "vitest";
import { academicDataErrorMessage, loadAcademicSchedule, loadAcademicExams } from "./academicData";
import { listConnectorSchedules, listConnectorExams } from "./tauriApi";
import { createDefaultSchoolProfile } from "./schoolProfile";
vi.mock("./tauriApi", () => ({ listConnectorSchedules: vi.fn(), listConnectorExams: vi.fn() }));

const profile = { ...createDefaultSchoolProfile(), studentCode: "SV-TEST" };
const schedule = { id: "schedule", studentCode: "SV-TEST", subjectCode: "TEST", subjectName: "Môn kiểm thử", weekday: 2, startTime: "08:00", endTime: "09:00", room: "P1", lecturer: "GV", source: "uth-portal" };
const exam = { id: "exam", studentCode: "SV-TEST", subjectCode: "TEST", subjectName: "Môn kiểm thử", examDate: "2026-10-10", startTime: "08:00", durationMinutes: 60, room: "P1", format: "Thực hành", source: "uth-portal" };
beforeEach(() => vi.resetAllMocks());
describe("nguồn học tập tài khoản trường", () => {
  it("giải thích contract chưa verified và không đưa lỗi nội bộ vào UI", () => {
    expect(academicDataErrorMessage("CONTRACT_UNVERIFIED: internal")).toContain("chưa được xác minh");
    expect(academicDataErrorMessage(new Error("CONTRACT_UNVERIFIED"))).toContain("Cache cũ vẫn giữ");
    expect(academicDataErrorMessage(new Error("secret /private/path"))).not.toContain("/private/path");
  });
  it("không truy vấn cache UTH khi chưa có MSSV hoặc chọn trường khác", async () => {
    expect(await loadAcademicSchedule(createDefaultSchoolProfile())).toEqual([]);
    expect(await loadAcademicExams({ ...profile, schoolId: "hcmut" })).toEqual([]);
    expect(listConnectorSchedules).not.toHaveBeenCalled();
    expect(listConnectorExams).not.toHaveBeenCalled();
  });
  it("chỉ lấy cache đúng tài khoản và bỏ prototype", async () => {
    vi.mocked(listConnectorSchedules).mockResolvedValue([schedule, { ...schedule, source: "prototype-mock" }, { ...schedule, studentCode: "OTHER" }]);
    const result = await loadAcademicSchedule(profile);
    expect(result).toHaveLength(1);
    expect(result[0].startTime).toBe("08:00");
  });
  it("cache rỗng không sinh lịch mẫu", async () => {
    vi.mocked(listConnectorSchedules).mockResolvedValue([]);
    vi.mocked(listConnectorExams).mockResolvedValue([]);
    expect(await loadAcademicSchedule(profile)).toEqual([]);
    expect(await loadAcademicExams(profile)).toEqual([]);
  });
  it("lỗi đọc cache được propagate thay vì trở thành rỗng", async () => {
    vi.mocked(listConnectorSchedules).mockRejectedValue(new Error("DB unavailable"));
    vi.mocked(listConnectorExams).mockRejectedValue(new Error("DB unavailable"));
    await expect(loadAcademicSchedule(profile)).rejects.toThrow("DB unavailable");
    await expect(loadAcademicExams(profile)).rejects.toThrow("DB unavailable");
  });
  it("lịch thi không lấy cache mock hoặc tài khoản khác", async () => {
    vi.mocked(listConnectorExams).mockResolvedValue([exam, { ...exam, source: "prototype-mock" }, { ...exam, studentCode: "OTHER" }]);
    expect(await loadAcademicExams(profile)).toMatchObject([{ durationMinutes: 60, startTime: "08:00" }]);
  });
});
