/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GPA_STORAGE_KEY, GPA_LEGACY_STORAGE_KEY } from "../gpaData";
import { GpaCalculator } from "./GpaCalculator";

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

describe("GpaCalculator UI Integration Tests (Merged #9, #16, #26)", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("thêm hàng Pending không làm tụt GPA", () => {
    localStorage.setItem(
      GPA_STORAGE_KEY,
      JSON.stringify([{ id: "existing", name: "Toán", credits: 3, letterGrade: "A", score10: 8.5 }]),
    );

    render(<GpaCalculator />);
    expect(screen.getByText("3.70")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Thêm môn học/i }));

    expect(screen.getByText("3.70")).toBeTruthy();
    expect(screen.getAllByPlaceholderText("Nhập tên môn...")).toHaveLength(2);
  });

  it("nhập điểm F thật sự được tính vào GPA", () => {
    render(<GpaCalculator />);
    fireEvent.click(screen.getByRole("button", { name: /Thêm môn học/i }));

    const creditInput = screen.getByLabelText("Số tín chỉ");
    fireEvent.change(creditInput, { target: { value: "3" } });

    const scoreInput = screen.getByLabelText("Điểm thang 10");
    fireEvent.change(scoreInput, { target: { value: "2" } });

    expect((screen.getByPlaceholderText("Tự động") as HTMLInputElement).value).toBe("F");
    expect(screen.getByText("0.00")).toBeTruthy();
    expect(screen.getByText("2.00")).toBeTruthy();
    expect(screen.getByText(/Yếu \/ Cảnh báo/i)).toBeTruthy();
  });

  it("chặn tín chỉ thập phân hoặc ngoài khoảng nguyên 1-10 trên UI", () => {
    render(<GpaCalculator />);
    fireEvent.click(screen.getByRole("button", { name: /Thêm môn học/i }));

    const creditInput = screen.getByLabelText("Số tín chỉ") as HTMLInputElement;
    fireEvent.change(creditInput, { target: { value: "2.5" } });

    expect(creditInput.value).toBe("");
    expect(screen.getByRole("alert").textContent).toContain("Số tín chỉ phải là số nguyên từ 1 đến 10.");

    fireEvent.change(creditInput, { target: { value: "11" } });
    expect(creditInput.value).toBe("");
  });

  it("không tự ghi v1 sang v2 lúc tải và chỉ phục hồi khi người dùng xác nhận", () => {
    localStorage.setItem(
      GPA_LEGACY_STORAGE_KEY,
      JSON.stringify([{ id: "v1-1", name: "Cấu trúc dữ liệu", credits: 4, letterGrade: "A", score10: 8.5 }]),
    );

    render(<GpaCalculator />);

    // Lúc mới tải: v2 chưa bị ghi đè
    expect(localStorage.getItem(GPA_STORAGE_KEY)).toBeNull();
    expect(screen.getByText(/Phát hiện dữ liệu điểm phiên bản cũ \(v1\)/i)).toBeTruthy();

    // Người dùng hủy xác nhận -> v2 vẫn giữ nguyên null
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole("button", { name: /Xác nhận phục hồi dữ liệu cũ \(v1\)/i }));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(GPA_STORAGE_KEY)).toBeNull();

    // Người dùng đồng ý xác nhận -> v1 được phục hồi sang v2
    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: /Xác nhận phục hồi dữ liệu cũ \(v1\)/i }));
    expect(localStorage.getItem(GPA_STORAGE_KEY)).not.toBeNull();
    expect(screen.getByText("3.70")).toBeTruthy();
  });

  it("bảo vệ dữ liệu v2 bị hỏng và cho phép đặt lại an toàn", () => {
    localStorage.setItem(GPA_STORAGE_KEY, "{ corrupt-json");
    render(<GpaCalculator />);

    expect(screen.getByRole("alert").textContent).toContain("dữ liệu bị hỏng hoặc sai định dạng");

    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole("button", { name: /Xóa dữ liệu hỏng & Bắt đầu lại/i }));
    expect(localStorage.getItem(GPA_STORAGE_KEY)).toBe("[]");
  });

  it("không báo GPA Portal chính thức khi chưa có nguồn xác minh", () => {
    render(<GpaCalculator schoolShortName="UTH" />);
    expect(screen.getByText(/Bảng điểm Portal \(UTH\) — chưa kết nối/i)).toBeTruthy();
    expect(screen.getByText(/không phải điểm chính thức/i)).toBeTruthy();
    expect(screen.queryByText("0.00 / 4.00")).toBeNull();
    expect(screen.queryByRole("button", { name: /Nạp vào bảng ước tính/i })).toBeNull();
  });

  it("không làm mất dữ liệu hỏng khi bộ nhớ từ chối xóa", () => {
    localStorage.setItem(GPA_STORAGE_KEY, "{ corrupt-json");
    render(<GpaCalculator />);
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("quota"); });
    fireEvent.click(screen.getByRole("button", { name: /Xóa dữ liệu hỏng & Bắt đầu lại/i }));
    expect(localStorage.getItem(GPA_STORAGE_KEY)).toBe("{ corrupt-json");
    expect(screen.getAllByRole("alert").some((alert) => alert.textContent?.includes("dữ liệu bị hỏng"))).toBe(true);
    setItem.mockRestore();
  });

  it("không báo phục hồi v1 thành công khi bộ nhớ từ chối ghi", () => {
    localStorage.setItem(GPA_LEGACY_STORAGE_KEY, JSON.stringify([
      { id: "v1-1", name: "Toán", credits: 3, letterGrade: "A", score10: 8.5 },
    ]));
    render(<GpaCalculator />);
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("quota"); });
    fireEvent.click(screen.getByRole("button", { name: /Xác nhận phục hồi dữ liệu cũ/i }));
    expect(localStorage.getItem(GPA_STORAGE_KEY)).toBeNull();
    expect(screen.getByText(/Không lưu được dữ liệu cũ/i)).toBeTruthy();
    setItem.mockRestore();
  });

  it("từ chối điểm ngoài miền thay vì tự sửa thành điểm biên", () => {
    render(<GpaCalculator />);
    fireEvent.click(screen.getByRole("button", { name: /Thêm môn học/i }));
    const scoreInput = screen.getByLabelText("Điểm thang 10") as HTMLInputElement;
    fireEvent.change(scoreInput, { target: { value: "11" } });
    expect(scoreInput.value).toBe("");
    expect(screen.getByRole("alert").textContent).toContain("0 đến 10");
  });
});
