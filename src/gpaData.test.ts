import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateGpaStats,
  calculatePortalGpaStats,
  parseGpaSubjects,
  loadGpaSubjects,
  saveGpaSubjects,
  GPA_STORAGE_KEY,
  GPA_LEGACY_STORAGE_KEY,
  type PortalGradeRecord,
} from "./gpaData";
import type { GpaSubject } from "./components/GpaCalculator";

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
vi.stubGlobal("localStorage", mockLocalStorage);

describe("GPA Calculation - CA-088.02 - Edge Cases & BVA", () => {
  it("không tụt GPA khi thêm hàng mới chưa nhập điểm", () => {
    const subjects: GpaSubject[] = [
      { id: "1", name: "Toán", credits: 3, letterGrade: "A", score10: 8.5 },
      { id: "2", name: "Môn trống", credits: "", letterGrade: "", score10: "" },
    ];
    const result = calculateGpaStats(subjects);
    expect(result.totalCredits).toBe(3);
    expect(result.gpaScale4).toBe("3.70");
  });

  it("tính đúng GPA thấp nhất (toàn điểm F)", () => {
    const subjects: GpaSubject[] = [
      { id: "1", name: "Lý", credits: 3, letterGrade: "F", score10: 2.0 },
      { id: "2", name: "Hóa", credits: 2, letterGrade: "F", score10: 1.0 },
    ];
    const result = calculateGpaStats(subjects);
    expect(result.gpaScale4).toBe("0.00");
  });

  it("tính đúng GPA cao nhất (toàn điểm A+)", () => {
    const subjects: GpaSubject[] = [{ id: "1", name: "Lý", credits: 3, letterGrade: "A+", score10: 10.0 }];
    const result = calculateGpaStats(subjects);
    expect(result.gpaScale4).toBe("4.00");
  });

  it("trả về 0.00 khi bảng điểm trống", () => {
    expect(calculateGpaStats([]).gpaScale4).toBe("0.00");
  });

  it("không tính grade không thuộc allowlist vào tổng GPA", () => {
    const result = calculateGpaStats([{ id: "1", name: "Dữ liệu lỗi", credits: 3, letterGrade: "constructor", score10: 10 }]);
    expect(result.totalCredits).toBe(0);
    expect(result.gpaScale4).toBe("0.00");
  });

  it("tính đúng GPA tại các mốc biên BVA hợp lệ của score10 (0, 0.1, 5.0, 9.9, 10)", () => {
    const subjects: GpaSubject[] = [
      { id: "1", name: "M1", credits: 1, letterGrade: "F", score10: 0 },
      { id: "2", name: "M2", credits: 1, letterGrade: "F", score10: 0.1 },
      { id: "3", name: "M3", credits: 1, letterGrade: "D+", score10: 5.0 },
      { id: "4", name: "M4", credits: 1, letterGrade: "A+", score10: 9.9 },
      { id: "5", name: "M5", credits: 1, letterGrade: "A+", score10: 10 },
    ];
    const result = calculateGpaStats(subjects);
    expect(result.totalCredits).toBe(5);
    expect(result.gpaScale4).toBe("1.90");
    expect(result.gpaScale10).toBe("5.00");
  });

  it("tính đúng GPA tại các mốc biên BVA hợp lệ của credits (1, 2, 3, 9, 10)", () => {
    const subjects: GpaSubject[] = [
      { id: "1", name: "C1", credits: 1, letterGrade: "A+", score10: 9.5 },
      { id: "2", name: "C2", credits: 2, letterGrade: "A", score10: 8.5 },
      { id: "3", name: "C3", credits: 3, letterGrade: "B+", score10: 8.0 },
      { id: "4", name: "C9", credits: 9, letterGrade: "B", score10: 7.2 },
      { id: "5", name: "C10", credits: 10, letterGrade: "C+", score10: 6.5 },
    ];
    const result = calculateGpaStats(subjects);
    expect(result.totalCredits).toBe(25);
    expect(result.gpaScale4).toBe("2.96");
  });

  it("bỏ qua môn học có tín chỉ thập phân hoặc ngoài biên [1..10] khi tính GPA", () => {
    const subjects: GpaSubject[] = [
      { id: "1", name: "Hợp lệ", credits: 3, letterGrade: "A", score10: 8.5 },
      { id: "2", name: "Thập phân", credits: 2.5, letterGrade: "A+", score10: 9.5 },
      { id: "3", name: "Ngoài biên trên", credits: 11, letterGrade: "A+", score10: 9.5 },
    ];
    const result = calculateGpaStats(subjects);
    expect(result.totalCredits).toBe(3);
    expect(result.gpaScale4).toBe("3.70");
  });
});

describe("parseGpaSubjects - Validation, BVA & Security", () => {
  it("parse thành công mảng rỗng khi truyền null hoặc chuỗi rỗng", () => {
    expect(parseGpaSubjects(null)).toEqual([]);
    expect(parseGpaSubjects("")).toEqual([]);
  });

  it("parse thành công dữ liệu JSON hợp lệ có chứa giá trị rỗng", () => {
    const raw = JSON.stringify([{ id: "1", name: "Test", credits: "", letterGrade: "", score10: "" }]);
    const parsed = parseGpaSubjects(raw);
    expect(parsed[0].credits).toBe("");
  });

  it("chấp nhận các giá trị biên BVA hợp lệ của score10 (0, 0.1, 9.9, 10) và credits (1, 2, 9, 10)", () => {
    const raw = JSON.stringify([
      { id: "1", name: "M1", credits: 1, letterGrade: "F", score10: 0 },
      { id: "2", name: "M2", credits: 2, letterGrade: "F", score10: 0.1 },
      { id: "3", name: "M3", credits: 9, letterGrade: "A+", score10: 9.9 },
      { id: "4", name: "M4", credits: 10, letterGrade: "A+", score10: 10 },
    ]);
    expect(parseGpaSubjects(raw)).toHaveLength(4);
  });

  it("từ chối score10 ngoài biên (-0.1 và 10.1)", () => {
    const belowMin = JSON.stringify([{ id: "1", name: "Toán", credits: 3, letterGrade: "F", score10: -0.1 }]);
    const aboveMax = JSON.stringify([{ id: "1", name: "Toán", credits: 3, letterGrade: "A+", score10: 10.1 }]);
    expect(() => parseGpaSubjects(belowMin)).toThrow();
    expect(() => parseGpaSubjects(aboveMax)).toThrow();
  });

  it("từ chối credits ngoài biên (0 và 11) hoặc dạng số thập phân (2.5)", () => {
    const zeroCredit = JSON.stringify([{ id: "1", name: "Toán", credits: 0, letterGrade: "A", score10: 8.5 }]);
    const overCredit = JSON.stringify([{ id: "1", name: "Toán", credits: 11, letterGrade: "A", score10: 8.5 }]);
    const decimalCredit = JSON.stringify([{ id: "1", name: "Toán", credits: 2.5, letterGrade: "A", score10: 8.5 }]);
    expect(() => parseGpaSubjects(zeroCredit)).toThrow();
    expect(() => parseGpaSubjects(overCredit)).toThrow();
    expect(() => parseGpaSubjects(decimalCredit)).toThrow();
  });

  it("từ chối danh sách có hai môn học trùng ID", () => {
    const duplicateIds = JSON.stringify([
      { id: "dup-1", name: "Toán", credits: 3, letterGrade: "A", score10: 8.5 },
      { id: "dup-1", name: "Lý", credits: 2, letterGrade: "B", score10: 7.0 },
    ]);
    expect(() => parseGpaSubjects(duplicateIds)).toThrow();
  });

  it("ném lỗi độc lập khi thiếu trường bắt buộc id", () => {
    const raw = JSON.stringify([{ name: "Toán", credits: 3, letterGrade: "A", score10: 8.5 }]);
    expect(() => parseGpaSubjects(raw)).toThrow();
  });

  it("ném lỗi độc lập khi thiếu trường bắt buộc name", () => {
    const raw = JSON.stringify([{ id: "1", credits: 3, letterGrade: "A", score10: 8.5 }]);
    expect(() => parseGpaSubjects(raw)).toThrow();
  });

  it("ném lỗi độc lập khi thiếu trường bắt buộc credits", () => {
    const raw = JSON.stringify([{ id: "1", name: "Toán", letterGrade: "A", score10: 8.5 }]);
    expect(() => parseGpaSubjects(raw)).toThrow();
  });

  it("ném lỗi độc lập khi thiếu trường bắt buộc letterGrade", () => {
    const raw = JSON.stringify([{ id: "1", name: "Toán", credits: 3, score10: 8.5 }]);
    expect(() => parseGpaSubjects(raw)).toThrow();
  });

  it("ném lỗi độc lập khi thiếu trường bắt buộc score10", () => {
    const raw = JSON.stringify([{ id: "1", name: "Toán", credits: 3, letterGrade: "A" }]);
    expect(() => parseGpaSubjects(raw)).toThrow();
  });

  it("ném lỗi khi dữ liệu không phải mảng hoặc sai kiểu dữ liệu", () => {
    expect(() => parseGpaSubjects(JSON.stringify({ id: "1" }))).toThrow();
    expect(() => parseGpaSubjects(JSON.stringify([{ id: "1", name: "Toán", credits: "3", letterGrade: "A", score10: 8.5 }]))).toThrow();
  });
});

describe("GPA Persistence, Legacy v1 Confirmation & Portal Integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("lưu và nạp dữ liệu v2 thành công mà không báo lỗi hỏng", () => {
    const mockData: GpaSubject[] = [{ id: "1", name: "Toán", credits: 3, letterGrade: "A", score10: 8.5 }];
    expect(saveGpaSubjects(mockData)).toBe(true);
    const result = loadGpaSubjects();
    expect(result.isCorrupted).toBe(false);
    expect(result.subjects[0].name).toBe("Toán");
  });

  it("KHÔNG tự động ghi dữ liệu v1 sang v2 lúc tải khi chưa có xác nhận", () => {
    const mockV1 = JSON.stringify([{ id: "2", name: "Lý", credits: 2, letterGrade: "B", score10: 7.2 }]);
    localStorage.setItem(GPA_LEGACY_STORAGE_KEY, mockV1);

    const result = loadGpaSubjects();
    expect(result.isCorrupted).toBe(false);
    expect(result.hasLegacyV1).toBe(true);
    expect(result.subjects).toEqual([]);
    expect(localStorage.getItem(GPA_STORAGE_KEY)).toBeNull();
  });

  it("bắt lỗi và bật cờ isCorrupted khi dữ liệu v2 bị hỏng", () => {
    localStorage.setItem(GPA_STORAGE_KEY, "{ invalid json");
    const result = loadGpaSubjects();
    expect(result.isCorrupted).toBe(true);
    expect(result.subjects).toEqual([]);
  });

  it("tính thuần trên bản ghi giả lập có cờ xác minh, chưa chứng minh đồng bộ Portal", () => {
    const records: PortalGradeRecord[] = [
      {
        id: "p1",
        subjectCode: "IT001",
        subjectName: "Nhập môn lập trình",
        credits: 4,
        score10: 8.5,
        letterGrade: "A",
        source: "uth-portal",
        verified: true,
      },
      {
        id: "p2",
        subjectCode: "IT002",
        subjectName: "Bản ghi chưa xác minh",
        credits: 3,
        score10: 2.0,
        letterGrade: "F",
        source: "uth-portal",
        verified: false,
      },
    ];
    const stats = calculatePortalGpaStats(records);
    expect(stats.hasVerifiedData).toBe(true);
    expect(stats.subjectCount).toBe(1);
    expect(stats.totalCredits).toBe(4);
    expect(stats.gpaScale4).toBe("3.70");
  });
});
