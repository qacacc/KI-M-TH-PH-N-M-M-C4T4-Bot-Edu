import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  exportLocalAppDataJSON,
  importLocalAppDataJSON,
  MAX_BACKUP_BYTES,
  uploadBackupFile,
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

// Bắt buộc ghi đè localStorage của Node bằng mock object của Vitest
vi.stubGlobal("localStorage", mockLocalStorage);

describe("Backup & Restore JSON Security & Validation Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("xuất đúng định dạng contract backup với allowlist keys", () => {
    localStorage.setItem("ca-settings-lang", "vi");
    localStorage.setItem("ca-settings-dev-mode", "true");
    localStorage.setItem("sessionToken", "secret-12345"); // Non-allowlist key

    const jsonStr = exportLocalAppDataJSON();
    const parsed = JSON.parse(jsonStr);

    expect(parsed.format).toBe("campus-assistant-backup");
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.data["ca-settings-lang"]).toBe("vi");
    expect(parsed.data["ca-settings-dev-mode"]).toBe("true");
    expect(parsed.data["sessionToken"]).toBeUndefined(); // Must NOT export sensitive keys
  });

  it("từ chối chuỗi JSON sai cú pháp", () => {
    localStorage.setItem("ca-settings-lang", "vi");
    const result = importLocalAppDataJSON("{ invalid json string }");
    expect(result).toBe(false);
    expect(localStorage.getItem("ca-settings-lang")).toBe("vi"); // Unchanged
  });

  it("từ chối tệp lớn hơn 1 MB (MAX_BACKUP_BYTES)", () => {
    const hugeString = "a".repeat(MAX_BACKUP_BYTES + 10);
    const result = importLocalAppDataJSON(hugeString);
    expect(result).toBe(false);
  });

  it("từ chối tệp sai schemaVersion hoặc format không khớp", () => {
    const invalidSchema = JSON.stringify({
      format: "campus-assistant-backup",
      schemaVersion: 99, // Unknown version
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

  it("Prototype Pollution Guard: Từ chối các tệp chứa khóa nguy hiểm __proto__, prototype, constructor", () => {
    const maliciousProto = '{"format":"campus-assistant-backup","schemaVersion":1,"data":{"ca-settings-lang":"en","__proto__":{"polluted":true}}}';
    expect(importLocalAppDataJSON(maliciousProto)).toBe(false);

    const maliciousConstructor = '{"format":"campus-assistant-backup","schemaVersion":1,"data":{"constructor":{"prototype":{"polluted":true}}}}';
    expect(importLocalAppDataJSON(maliciousConstructor)).toBe(false);
  });

  it("bỏ qua các khóa không thuộc Allowlist và không lưu token/cookie giả", () => {
    const untrustedBackup = JSON.stringify({
      format: "campus-assistant-backup",
      schemaVersion: 1,
      data: {
        "ca-settings-lang": "en",
        "untrusted_token": "fake-jwt-token",
        "stolen_cookie": "session-cookie",
      },
    });

    const result = importLocalAppDataJSON(untrustedBackup);
    expect(result).toBe(true);
    expect(localStorage.getItem("ca-settings-lang")).toBe("en");
    expect(localStorage.getItem("untrusted_token")).toBeNull();
    expect(localStorage.getItem("stolen_cookie")).toBeNull();
  });

  it("khôi phục snapshot cũ khi gặp lỗi trong quá trình import (Rollback Test)", () => {
    localStorage.setItem("ca-settings-lang", "vi");
    localStorage.setItem("ca-settings-default-view", "chat");

    // Invalid payload
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