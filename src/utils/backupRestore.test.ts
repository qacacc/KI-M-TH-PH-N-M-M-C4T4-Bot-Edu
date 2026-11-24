import { describe, it, expect, beforeEach } from "vitest";
import {
  exportLocalAppDataJSON,
  importLocalAppDataJSON,
  MAX_BACKUP_BYTES,
} from "./backupRestore";

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
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: mockLocalStorage,
    writable: true,
  });
}

function buildValidBackupOfExactLength(targetLength: number): string {
  const prefix =
    '{"format":"campus-assistant-backup","schemaVersion":1,"appVersion":"1.0.1","exportedAt":"2026-11-20T00:00:00.000Z","data":{"ca-settings-lang":"';
  const suffix = '"}}';
  const padLength = Math.max(0, targetLength - prefix.length - suffix.length);
  return prefix + "v".repeat(padLength) + suffix;
}

describe("Backup & Restore JSON Security, BVA-01 & Decision Table 1 Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("DT1-Rule1: xuất và khôi phục round-trip đầy đủ active keys (appearance, layout, presets, GPA v2)", () => {
    localStorage.setItem("ca-settings-lang", "vi");
    localStorage.setItem("ca-settings-dev-mode", "true");
    localStorage.setItem("campus-assistant-appearance", '{"backgroundColor":"#181818"}');
    localStorage.setItem("campus-assistant-layout", '{"sidebar":240}');
    localStorage.setItem("ca_custom_theme_presets_v1", '[{"id":"p1","name":"Dark Neon"}]');
    localStorage.setItem("ca_gpa_calculator_manual_v2", '[{"id":"s1","name":"Kiểm thử phần mềm","credits":3}]');
    localStorage.setItem("sessionToken", "secret-12345"); // Non-allowlist key

    const jsonStr = exportLocalAppDataJSON();
    const parsed = JSON.parse(jsonStr);

    expect(parsed.format).toBe("campus-assistant-backup");
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.data["ca-settings-lang"]).toBe("vi");
    expect(parsed.data["campus-assistant-appearance"]).toBe('{"backgroundColor":"#181818"}');
    expect(parsed.data["campus-assistant-layout"]).toBe('{"sidebar":240}');
    expect(parsed.data["ca_custom_theme_presets_v1"]).toContain("Dark Neon");
    expect(parsed.data["ca_gpa_calculator_manual_v2"]).toContain("Kiểm thử phần mềm");
    expect(parsed.data["sessionToken"]).toBeUndefined();

    localStorage.clear();
    expect(importLocalAppDataJSON(jsonStr)).toBe(true);
    expect(localStorage.getItem("campus-assistant-appearance")).toBe('{"backgroundColor":"#181818"}');
    expect(localStorage.getItem("ca_gpa_calculator_manual_v2")).toContain("Kiểm thử phần mềm");
  });

  it("BVA-01: Kiểm tra đầy đủ 6 điểm biên kích thước chuỗi Backup JSON (0, 1, Nominal, Max-1, Max, Max+1)", () => {
    // 1. Min - 1 (0 bytes)
    expect(importLocalAppDataJSON("")).toBe(false);

    // 2. Min (1 byte - lỗi cú pháp JSON)
    expect(importLocalAppDataJSON("{")).toBe(false);

    // 3. Nominal (~500 bytes hợp lệ)
    const nominalPayload = buildValidBackupOfExactLength(500);
    expect(nominalPayload.length).toBe(500);
    expect(importLocalAppDataJSON(nominalPayload)).toBe(true);

    // 4. Max - 1 (1,048,575 bytes hợp lệ)
    const maxMinusOnePayload = buildValidBackupOfExactLength(MAX_BACKUP_BYTES - 1);
    expect(maxMinusOnePayload.length).toBe(MAX_BACKUP_BYTES - 1);
    expect(importLocalAppDataJSON(maxMinusOnePayload)).toBe(true);

    // 5. Max (Đúng 1,048,576 bytes = 1 MB hợp lệ)
    const exactMaxPayload = buildValidBackupOfExactLength(MAX_BACKUP_BYTES);
    expect(exactMaxPayload.length).toBe(MAX_BACKUP_BYTES);
    expect(importLocalAppDataJSON(exactMaxPayload)).toBe(true);

    // 6. Max + 1 (1,048,577 bytes -> vượt biên 1 MB, bị từ chối)
    const overMaxPayload = buildValidBackupOfExactLength(MAX_BACKUP_BYTES + 1);
    expect(overMaxPayload.length).toBe(MAX_BACKUP_BYTES + 1);
    expect(importLocalAppDataJSON(overMaxPayload)).toBe(false);
  });

  it("DT1-Rule5: từ chối chuỗi JSON sai cú pháp và giữ nguyên dữ liệu cũ", () => {
    localStorage.setItem("ca-settings-lang", "vi");
    const result = importLocalAppDataJSON("{ invalid json string }");
    expect(result).toBe(false);
    expect(localStorage.getItem("ca-settings-lang")).toBe("vi");
  });

  it("DT1-Rule4: từ chối tệp sai schemaVersion hoặc format không khớp", () => {
    const invalidSchema = JSON.stringify({
      format: "campus-assistant-backup",
      schemaVersion: 99,
      data: { "ca-settings-lang": "en" },
    });
    expect(importLocalAppDataJSON(invalidSchema)).toBe(false);

    const invalidFormat = JSON.stringify({
      format: "wrong-format",
      schemaVersion: 1,
      data: { "ca-settings-lang": "en" },
    });
    expect(importLocalAppDataJSON(invalidFormat)).toBe(false);
  });

  it("DT1-Rule3: Prototype Pollution Guard từ chối các tệp chứa khóa nguy hiểm __proto__, prototype, constructor", () => {
    const maliciousProto =
      '{"format":"campus-assistant-backup","schemaVersion":1,"data":{"ca-settings-lang":"en","__proto__":{"polluted":true}}}';
    expect(importLocalAppDataJSON(maliciousProto)).toBe(false);

    const maliciousConstructor =
      '{"format":"campus-assistant-backup","schemaVersion":1,"data":{"constructor":{"prototype":{"polluted":true}}}}';
    expect(importLocalAppDataJSON(maliciousConstructor)).toBe(false);
  });

  it("DT1-Rule2: bỏ qua các khóa không thuộc Allowlist và không lưu token/cookie giả", () => {
    const untrustedBackup = JSON.stringify({
      format: "campus-assistant-backup",
      schemaVersion: 1,
      data: {
        "ca-settings-lang": "en",
        untrusted_token: "fake-jwt-token",
        stolen_cookie: "session-cookie",
      },
    });

    const result = importLocalAppDataJSON(untrustedBackup);
    expect(result).toBe(true);
    expect(localStorage.getItem("ca-settings-lang")).toBe("en");
    expect(localStorage.getItem("untrusted_token")).toBeNull();
    expect(localStorage.getItem("stolen_cookie")).toBeNull();
  });

  it("DT1-Rule5: khôi phục snapshot cũ khi gặp lỗi trong quá trình import hoặc quota bị chặn (Rollback Test)", () => {
    localStorage.setItem("ca-settings-lang", "vi");
    localStorage.setItem("ca-settings-default-view", "chat");

    const corruptBackup = JSON.stringify({
      format: "campus-assistant-backup",
      schemaVersion: 1,
      data: null,
    });

    const result = importLocalAppDataJSON(corruptBackup);
    expect(result).toBe(false);
    expect(localStorage.getItem("ca-settings-lang")).toBe("vi");
    expect(localStorage.getItem("ca-settings-default-view")).toBe("chat");
  });
});
