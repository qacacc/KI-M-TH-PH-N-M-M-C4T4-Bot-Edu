import { afterEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import {
  deleteStudentNote,
  importStudentNotesBackup,
  listStudentNotes,
  openExternalUrl,
  saveStudentNote,
} from "./tauriApi";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("mở portal desktop", () => {
  it("đợi command Rust thành công mới resolve", async () => {
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.mocked(invoke).mockResolvedValue(undefined);
    await expect(openExternalUrl("https://portal.ut.edu.vn/")).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith("open_external_url", { url: "https://portal.ut.edu.vn/" });
  });
  it("không nuốt lỗi Rust rồi báo đã mở thành công", async () => {
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.mocked(invoke).mockRejectedValue(new Error("Không mở được trình duyệt"));
    await expect(openExternalUrl("https://portal.ut.edu.vn/")).rejects.toThrow("Không mở được trình duyệt");
  });
});

describe("CA-106 & CA-090: Tauri IPC Sổ ghi chú học tập local (SQLite)", () => {
  it("gọi đúng command list_student_notes và save_student_note với tham số môn học", async () => {
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    const mockNote = {
      id: "note_1",
      title: "Ôn tập Kiểm thử BVA",
      content: "Nội dung ghi chú SQLite",
      subjectId: "ST101",
      subjectName: "Kiểm thử phần mềm",
      createdAt: "2026-11-24T00:00:00Z",
      updatedAt: "2026-11-24T00:00:00Z",
    };
    vi.mocked(invoke).mockResolvedValueOnce(mockNote).mockResolvedValueOnce([mockNote]);

    const saved = await saveStudentNote({
      id: "note_1",
      title: "Ôn tập Kiểm thử BVA",
      content: "Nội dung ghi chú SQLite",
      subjectId: "ST101",
      subjectName: "Kiểm thử phần mềm",
    });
    expect(saved.id).toBe("note_1");
    expect(invoke).toHaveBeenCalledWith("save_student_note", {
      id: "note_1",
      title: "Ôn tập Kiểm thử BVA",
      content: "Nội dung ghi chú SQLite",
      subject_id: "ST101",
      subject_name: "Kiểm thử phần mềm",
      subjectId: "ST101",
      subjectName: "Kiểm thử phần mềm",
    });

    const list = await listStudentNotes("BVA", "ST101");
    expect(list).toHaveLength(1);
    expect(invoke).toHaveBeenCalledWith("list_student_notes", {
      search_query: "BVA",
      subject_filter: "ST101",
      searchQuery: "BVA",
      subjectFilter: "ST101",
    });
  });

  it("truyền nguyên vẹn lỗi DB từ Rust lên UI và hỗ trợ xóa / khôi phục backup ghi chú", async () => {
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.mocked(invoke)
      .mockRejectedValueOnce("Tiêu đề không được để trống.")
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(2);

    await expect(
      saveStudentNote({ title: "   ", content: "Nội dung" }),
    ).rejects.toBe("Tiêu đề không được để trống.");

    await expect(deleteStudentNote("note_1")).resolves.toBe(true);
    await expect(importStudentNotesBackup([])).resolves.toBe(2);
  });
});
