import { describe, expect, it } from "vitest";
import { buildReleaseChecklist } from "./releaseChecklist";

describe("release checklist", () => {
  it("không báo FAIL khi dữ liệu học tập local-only đang rỗng", () => {
    const items = buildReleaseChecklist({
      appVersion: "1.0.1",
      bootstrap: null,
      healthReport: null,
      storageSummary: null,
      actionLogCount: 0,
    });

    const dataItem = items.find((item) => item.label === "Nguồn dữ liệu học tập");
    expect(dataItem?.status).toBe("WARN");
    expect(dataItem?.detail).toContain("local-only");
    expect(items.some((item) => item.label === "Nguồn dữ liệu học tập" && item.status === "FAIL")).toBe(false);
  });

  it("chỉ phản ánh FAIL từ version hoặc health report runtime", () => {
    const items = buildReleaseChecklist({
      appVersion: "1.0.0",
      bootstrap: null,
      healthReport: {
        generatedAt: "2026-10-21T00:00:00Z",
        version: "1.0.1",
        items: [{ id: "sqlite", status: "FAIL", label: "SQLite", detail: "database error" }],
      },
      storageSummary: null,
      actionLogCount: 0,
    });

    expect(items.find((item) => item.label === "Version")?.status).toBe("FAIL");
    expect(items.find((item) => item.label === "Health report")?.status).toBe("FAIL");
    expect(items.find((item) => item.label === "Diagnostic export")?.status).toBe("WARN");
  });
});
