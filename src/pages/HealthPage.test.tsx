/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import type { HealthReport } from "../types";
import { HealthPage } from "./HealthPage";

const report: HealthReport = {
  generatedAt: "2026-11-25T00:00:00Z",
  version: "1.0.1",
  items: [
    { id: "db", label: "SQLite", status: "PASS", detail: "Đã kết nối" },
    { id: "update", label: "Cập nhật", status: "WARN", detail: "Chưa cấu hình" },
    { id: "file", label: "File mẫu", status: "FAIL", detail: "Thiếu file" },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderHealth(overrides: Partial<ComponentProps<typeof HealthPage>> = {}) {
  const onRefresh = vi.fn();
  const onExport = vi.fn();
  render(
    <HealthPage
      appVersion="1.0.1"
      report={null}
      onRefresh={onRefresh}
      onExport={onExport}
      isBusy={false}
      isChecking={false}
      error={false}
      {...overrides}
    />,
  );
  return { onRefresh, onExport };
}

describe("HealthPage - phân lớp và giá trị biên", () => {
  it("trình duyệt: không chạy lệnh native và không báo 0 pass giả", () => {
    renderHealth();
    expect(screen.getByRole("status").textContent).toContain("Chỉ bản desktop");
    expect(screen.getByRole("button", { name: /Chạy kiểm tra/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Xuất báo cáo/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("desktop, 0 kết quả: chỉ chạy sau khi người dùng bấm", () => {
    vi.stubGlobal("__TAURI_INTERNALS__", {});
    const { onRefresh } = renderHealth();
    expect(onRefresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Chạy kiểm tra/ }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("đang chạy: khóa thao tác lặp và không xuất báo cáo rỗng", () => {
    vi.stubGlobal("__TAURI_INTERNALS__", {});
    renderHealth({ isChecking: true });
    expect(screen.getByRole("button", { name: /Đang kiểm tra/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Xuất báo cáo/ }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Đang đọc trạng thái local/)).toBeTruthy();
  });

  it("desktop, 1 báo cáo: đếm đúng từng trạng thái và cho xuất", () => {
    vi.stubGlobal("__TAURI_INTERNALS__", {});
    const { onExport } = renderHealth({ report });
    expect(screen.getAllByText("1")).toHaveLength(3);
    expect(screen.getByText("SQLite")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Xuất báo cáo/ }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("lỗi sau kết quả cũ: hiển thị cảnh báo và giữ bản cũ", () => {
    vi.stubGlobal("__TAURI_INTERNALS__", {});
    renderHealth({ report, error: true });
    expect(screen.getByRole("alert").textContent).toContain("kết quả của lần kiểm tra trước");
    expect(screen.getByText("SQLite")).toBeTruthy();
  });

  it("lỗi khi chưa có báo cáo: không hiện số pass giả", () => {
    vi.stubGlobal("__TAURI_INTERNALS__", {});
    renderHealth({ error: true });
    expect(screen.getByRole("alert").textContent).toContain("Chưa có kết quả hợp lệ");
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("báo cáo rỗng hợp lệ: hiện 0, khác với chưa chạy", () => {
    vi.stubGlobal("__TAURI_INTERNALS__", {});
    renderHealth({ report: { ...report, items: [] } });
    expect(screen.getAllByText("0")).toHaveLength(3);
    expect(screen.queryByText("SQLite")).toBeNull();
  });

  it("hai item cùng status: đếm cả hai", () => {
    vi.stubGlobal("__TAURI_INTERNALS__", {});
    renderHealth({ report: { ...report, items: [report.items[0], { ...report.items[0], id: "db2" }] } });
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getAllByText("SQLite")).toHaveLength(2);
  });
});
