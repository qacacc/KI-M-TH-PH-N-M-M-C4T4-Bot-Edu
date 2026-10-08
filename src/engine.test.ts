import { describe, expect, it } from "vitest";
import {
  classifyDataScope,
  stripPiiFromPublicQuery,
  createFindDocumentsState,
  detectIntent,
  extractBirthYear,
  extractSemester,
  normalizeVietnamese,
  parseConfirmationIntent,
  parseDocumentActionIntent,
  parseFlowControlIntent,
  parseSlashCommand,
} from "./engine";
import type { Subject } from "./types";

const subjects: Subject[] = [
  {
    id: "network-programming",
    name: "Lập trình mạng",
    aliases: ["lap trinh mang", "ltm", "network programming"],
  },
];

describe("Vietnamese normalizer", () => {
  it("chuẩn hóa tiếng Việt có dấu về dạng khớp keyword", () => {
    expect(normalizeVietnamese("Tìm tài liệu Lập trình mạng!!!")).toBe("tim tai lieu lap trinh mang");
  });
});

describe("semester extractor", () => {
  it("trích xuất học kỳ từ câu có dấu", () => {
    expect(extractSemester("học kỳ 1")).toBe(1);
  });

  it("trích xuất học kỳ từ viết tắt", () => {
    expect(extractSemester("hk 1")).toBe(1);
  });

  it("trích xuất học kỳ khi người dùng chỉ nhập số trong ngữ cảnh đang hỏi học kỳ", () => {
    expect(extractSemester("1")).toBe(1);
  });
});

describe("public admissions helper", () => {
  it("trích xuất năm sinh từ câu hỏi khối học sinh", () => {
    expect(extractBirthYear("khối 2008 thì năm nào nhập học")).toBe(2008);
    expect(extractBirthYear("sinh năm 2008 thi THPT năm nào")).toBe(2008);
    expect(extractBirthYear("2008 thi chừng nào nhập học")).toBe(2008);
  });

  it("không nhầm năm tuyển sinh thành năm sinh", () => {
    expect(extractBirthYear("tuyển sinh năm 2026 có gì")).toBeNull();
  });

  it("không dùng helper engine để suy luận năm nhập học", () => {
    const intent = detectIntent("2008 thi chừng nào nhập học", subjects);
    expect(intent.intent).toBe("PUBLIC_ADMISSIONS_INFO");
    if (intent.intent === "PUBLIC_ADMISSIONS_INFO") {
      expect(intent.birthYear).toBe(2008);
    }
  });
});

describe("intent detector", () => {
  it("nhận diện FIND_DOCUMENTS và môn Lập trình mạng khi thiếu học kỳ", () => {
    const intent = detectIntent("tìm tài liệu lập trình mạng", subjects);
    expect(intent).toEqual({
      intent: "FIND_DOCUMENTS",
      subjectId: "network-programming",
      subjectName: "Lập trình mạng",
      semester: null,
    });
  });

  it("nhận diện FIND_DOCUMENTS với học kỳ trong cùng câu", () => {
    const intent = detectIntent("tim tai lieu lap trinh mang hoc ky 1", subjects);
    expect(intent.intent).toBe("FIND_DOCUMENTS");
    if (intent.intent === "FIND_DOCUMENTS") {
      expect(intent.semester).toBe(1);
    }
  });

  it("nhận diện intent thông báo local", () => {
    expect(detectIntent("xem thông báo mới nhất", subjects)).toEqual({ intent: "FIND_ANNOUNCEMENTS" });
  });

  it("nhận diện intent lịch học khi hỏi hết môn", () => {
    expect(detectIntent("bao giờ tui hết môn", subjects)).toEqual({ intent: "FIND_SCHEDULE", semester: null });
  });

  it("nhận diện intent thông báo khi hỏi nộp học phí", () => {
    expect(detectIntent("kỳ này hạn nộp học phí nhiu", subjects)).toEqual({ intent: "FIND_ANNOUNCEMENTS" });
  });

  it("nhận diện intent tài liệu khi yêu cầu tải dữ liệu môn", () => {
    const intent = detectIntent("tui cần bạn tải dữ liệu môn này về", subjects);
    expect(intent).toEqual({ intent: "NEEDS_SUBJECT", semester: null });
  });

  it("không tự chọn môn đầu tiên khi câu tìm tài liệu thiếu tên môn", () => {
    expect(detectIntent("tìm tài liệu", subjects)).toEqual({ intent: "NEEDS_SUBJECT", semester: null });
    expect(detectIntent("tìm tài liệu học kỳ 1", subjects)).toEqual({ intent: "NEEDS_SUBJECT", semester: 1 });
  });

  it("nhận diện intent lịch thi local", () => {
    expect(detectIntent("xem lịch thi hk 1", subjects)).toEqual({ intent: "FIND_EXAMS", semester: 1 });
  });

  it("nhận diện thông tin tuyển sinh công khai không cần đăng nhập", () => {
    expect(detectIntent("khối 2008 thì năm nào nhập học", subjects)).toEqual({
      intent: "PUBLIC_ADMISSIONS_INFO",
      birthYear: 2008,
    });
  });

  it("không suy đoán intent ngoài phạm vi v0.7", () => {
    expect(detectIntent("đăng nhập tài khoản trường", subjects)).toEqual({ intent: "UNKNOWN" });
  });

  it("câu chat random ngoài dữ liệu không bị nhận nhầm thành intent nghiệp vụ", () => {
    expect(detectIntent("mai đi biển nên mặc áo màu gì", subjects)).toEqual({ intent: "UNKNOWN" });
  });
});

describe("minimal conversation state", () => {
  it("chuyển sang WAITING_FOR_SEMESTER khi thiếu học kỳ", () => {
    const intent = detectIntent("tìm tài liệu lập trình mạng", subjects);
    expect(intent.intent).toBe("FIND_DOCUMENTS");
    if (intent.intent === "FIND_DOCUMENTS") {
      expect(createFindDocumentsState(intent)).toEqual({
        flow: "FIND_DOCUMENTS",
        step: "WAITING_FOR_SEMESTER",
        data: {
          subjectId: "network-programming",
          subjectName: "Lập trình mạng",
          semester: null,
        },
      });
    }
  });
});

describe("slash command parser", () => {
  it("nhận diện các lệnh nhanh v0.7", () => {
    expect(parseSlashCommand("/help")).toBe("help");
    expect(parseSlashCommand("/commands")).toBe("help");
    expect(parseSlashCommand("/documents")).toBe("documents");
    expect(parseSlashCommand("/announcements")).toBe("announcements");
    expect(parseSlashCommand("/news")).toBe("announcements");
    expect(parseSlashCommand("/schedule")).toBe("schedule");
    expect(parseSlashCommand("/calendar")).toBe("schedule");
    expect(parseSlashCommand("/exams")).toBe("exams");
    expect(parseSlashCommand("/files")).toBe("files");
    expect(parseSlashCommand("/storage")).toBe("storage");
    expect(parseSlashCommand("/health")).toBe("health");
    expect(parseSlashCommand("/check")).toBe("health");
    expect(parseSlashCommand("/release")).toBe("release");
    expect(parseSlashCommand("/about")).toBe("release");
    expect(parseSlashCommand("/appearance")).toBe("appearance");
    expect(parseSlashCommand("/theme")).toBe("appearance");
    expect(parseSlashCommand("/admissions")).toBe("admissions");
    expect(parseSlashCommand("/tuyensinh")).toBe("admissions");
    expect(parseSlashCommand("/gpa")).toBe("gpa");
    expect(parseSlashCommand("/cpa")).toBe("gpa");
    expect(parseSlashCommand("/logs")).toBe("logs");
    expect(parseSlashCommand("/privacy")).toBe("privacy");
    expect(parseSlashCommand("/clear")).toBe("clear");
  });

  it("không suy đoán lệnh chưa hỗ trợ", () => {
    expect(parseSlashCommand("/zalo")).toBe("unknown");
  });

  it("phân loại đúng Data Sensitivity (Public vs Private vs Local)", () => {
    expect(classifyDataScope("Có thông báo gì mới không")).toBe("public");
    expect(classifyDataScope("Quy chế đào tạo hiện tại")).toBe("public");
    expect(classifyDataScope("Lịch học của tui")).toBe("private");
    expect(classifyDataScope("Điểm của tôi môn AI")).toBe("private");
    expect(classifyDataScope("Cho xem công nợ của mình")).toBe("private");
    expect(classifyDataScope("MSSV của tôi là gì")).toBe("private");
    expect(classifyDataScope("MSSV 2251120099, tìm quy chế học lại")).toBe("public");
    expect(classifyDataScope("MSSV là gì")).toBe("ambiguous");
  });

  it("loại bỏ MSSV / PII nhạy cảm khỏi câu hỏi trước khi Public Search", () => {
    expect(stripPiiFromPublicQuery("MSSV 2251120099, tui muốn tìm quy định học lại")).toBe("tui muốn tìm quy định học lại");
    expect(stripPiiFromPublicQuery("2251120001 tìm thông báo tuyển sinh")).toBe("tìm thông báo tuyển sinh");
  });
});

describe("confirmation parser", () => {
  it("nhận diện xác nhận thao tác file bằng chat", () => {
    expect(parseConfirmationIntent("xác nhận")).toBe("confirm");
    expect(parseConfirmationIntent("đồng ý")).toBe("confirm");
    expect(parseConfirmationIntent("ok")).toBe("confirm");
  });

  it("nhận diện hủy thao tác file bằng chat", () => {
    expect(parseConfirmationIntent("hủy")).toBe("cancel");
    expect(parseConfirmationIntent("không")).toBe("cancel");
    expect(parseConfirmationIntent("cancel")).toBe("cancel");
  });

  it("không suy đoán câu xác nhận mơ hồ", () => {
    expect(parseConfirmationIntent("để tui xem lại")).toBe("unknown");
  });
});

describe("document action parser", () => {
  it("nhận diện lệnh mở file theo số thứ tự", () => {
    expect(parseDocumentActionIntent("mở 1")).toEqual({ action: "open", ordinal: 1 });
    expect(parseDocumentActionIntent("mở file 12")).toEqual({ action: "open", ordinal: 12 });
  });

  it("nhận diện lệnh copy file theo số thứ tự", () => {
    expect(parseDocumentActionIntent("copy 2")).toEqual({ action: "copy", ordinal: 2 });
    expect(parseDocumentActionIntent("sao chép file 3")).toEqual({ action: "copy", ordinal: 3 });
  });

  it("không chọn file khi câu thiếu hành động rõ ràng", () => {
    expect(parseDocumentActionIntent("file 1")).toBeNull();
    expect(parseDocumentActionIntent("mở hoặc copy 1")).toBeNull();
  });
});

describe("flow control parser", () => {
  it("nhận diện lệnh hủy luồng hiện tại", () => {
    expect(parseFlowControlIntent("hủy")).toBe("cancel");
    expect(parseFlowControlIntent("thoát")).toBe("cancel");
  });

  it("nhận diện lệnh quay lại chọn học kỳ", () => {
    expect(parseFlowControlIntent("quay lại")).toBe("back");
    expect(parseFlowControlIntent("đổi học kỳ")).toBe("back");
  });

  it("không suy đoán câu điều hướng mơ hồ", () => {
    expect(parseFlowControlIntent("xem file 1")).toBe("unknown");
  });
});
