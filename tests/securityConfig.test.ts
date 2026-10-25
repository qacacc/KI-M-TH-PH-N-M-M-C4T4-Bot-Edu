import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// CA-094.01: kiểm tra tĩnh CSP, capability tối thiểu và việc frontend không mang token/mật khẩu
const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

function parseCsp(csp: string) {
  return Object.fromEntries(
    csp
      .split(";")
      .map((directive) => directive.trim().split(/\s+/))
      .filter((parts) => parts[0])
      .map(([name, ...values]) => [name, values]),
  ) as Record<string, string[]>;
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(relative);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [relative] : [];
  });
}

const SENSITIVE = /token|jwt|password|passwd|mat ?khau|mật khẩu|cookie|secret|bearer/i;
const tauriConfig = JSON.parse(read("src-tauri/tauri.conf.json"));
const capability = JSON.parse(read("src-tauri/capabilities/default.json"));
const frontendFiles = sourceFiles("src").map((file) => ({ file, text: read(file) }));

describe("CA-094.01 - CSP production", () => {
  const csp = parseCsp(tauriConfig.app.security.csp ?? "");

  it("có CSP thay vì null và chỉ cho tài nguyên nội bộ", () => {
    expect(csp["default-src"]).toEqual(["'self'"]);
    expect(csp["script-src"]).toEqual(["'self'"]);
    expect(csp["style-src"]).toEqual(["'self'"]);
    expect(csp["font-src"]).toEqual(["'self'", "data:"]);
    expect(csp["object-src"]).toEqual(["'none'"]);
  });

  it("cấm eval và inline script ở mọi directive production", () => {
    const all = Object.values(csp).flat();
    expect(all).not.toContain("'unsafe-eval'");
    expect(all).not.toContain("'unsafe-inline'");
    expect(all.some((value) => value === "*" || value === "https:" || value === "http:")).toBe(false);
  });

  it("chỉ mở IPC và asset protocol cho kết nối/ảnh local", () => {
    expect(csp["connect-src"]).toEqual(["'self'", "ipc:", "http://ipc.localhost"]);
    expect(csp["img-src"]).toEqual(["'self'", "data:", "asset:", "http://asset.localhost"]);
  });

  it("devCsp vẫn cấm eval", () => {
    const dev = Object.values(parseCsp(tauriConfig.app.security.devCsp ?? "")).flat();
    expect(dev).not.toContain("'unsafe-eval'");
  });

  it("frontend không dùng eval/new Function/innerHTML", () => {
    for (const { file, text } of frontendFiles) {
      expect(text, file).not.toMatch(/\beval\(|new Function\(|dangerouslySetInnerHTML|\.innerHTML\s*=/);
    }
  });
});

describe("CA-094.01 - Capability tối thiểu", () => {
  const permissions: string[] = capability.permissions;

  it("chỉ áp cho cửa sổ main, không áp cho webview đăng nhập remote", () => {
    expect(capability.windows).toEqual(["main"]);
    expect(capability.remote).toBeUndefined();
  });

  it("không cấp shell, tạo window/webview hay core:default rộng", () => {
    for (const permission of permissions) {
      expect(permission).not.toMatch(/shell|allow-create|core:default|fs:|process:/);
    }
  });

  it("giữ đủ quyền titlebar đang dùng", () => {
    expect(permissions).toEqual(
      expect.arrayContaining([
        "core:event:default",
        "core:window:allow-close",
        "core:window:allow-minimize",
        "core:window:allow-toggle-maximize",
        "core:window:allow-start-dragging",
      ]),
    );
  });
});

describe("CA-094.01 - Token/mật khẩu không đi qua React", () => {
  it("không có lời gọi IPC nào mang tham số nhạy cảm", () => {
    for (const { file, text } of frontendFiles) {
      const calls = text.match(/(?:tauriInvoke|invoke)(?:<[^>]*>)?\(\s*"[a-z_]+"(?:\s*,\s*\{[^}]*\})?/g) ?? [];
      for (const call of calls) {
        expect(call, `${file}: ${call}`).not.toMatch(SENSITIVE);
      }
    }
  });

  it("không ghi khóa nhạy cảm vào localStorage/sessionStorage", () => {
    for (const { file, text } of frontendFiles) {
      const writes = text.match(/(?:localStorage|sessionStorage)\.setItem\([^,]+/g) ?? [];
      for (const write of writes) {
        expect(write, file).not.toMatch(SENSITIVE);
      }
    }
  });

  it("console không in token, mật khẩu hoặc mã số sinh viên", () => {
    for (const { file, text } of frontendFiles) {
      const logs = text.match(/console\.(?:log|debug|info|warn|error)\([^;]*/g) ?? [];
      for (const log of logs) {
        expect(log, file).not.toMatch(SENSITIVE);
        expect(log, file).not.toMatch(/studentCode|studentId|student_code|mssv/i);
      }
    }
  });

  it("main window không còn command nhận JWT từ React", () => {
    expect(read("src-tauri/src/lib.rs")).not.toMatch(/connector_engine::sync_uth_after_login/);
    expect(read("src/tauriApi.ts")).not.toMatch(/jwtToken|jwt_token|syncUthAfterLogin/);
  });
});
