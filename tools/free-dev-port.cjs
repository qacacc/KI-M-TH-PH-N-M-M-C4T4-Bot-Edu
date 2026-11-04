/**
 * free-dev-port.cjs  [CA-094.03]
 *
 * Giải phóng port dev (5173, 51730) một cách an toàn:
 *   1. Tìm PID đang LISTEN trên các port dev.
 *   2. Xác minh cwd và cmdline của PID → chỉ kill nếu thuộc dự án này.
 *   3. Hoạt động trên Windows (netstat / WMIC / taskkill).
 *
 * Marker dự án: tên thư mục gốc hoặc package name trong cmdline.
 */

"use strict";

const { execFileSync, execSync } = require("node:child_process");
const path = require("node:path");

// ─── Cấu hình ────────────────────────────────────────────────────────────────

/** Các port cần giải phóng trước khi dev/test */
const DEV_PORTS = [5173, 51730];

/**
 * Chuỗi nhận dạng dự án.
 * Script chỉ kill PID nếu cmdline hoặc cwd chứa ÍT NHẤT MỘT trong các marker.
 */
const PROJECT_MARKERS = [
  "campus-assistant-local",
  "KI-M-TH-PH-N-M-M-C4T4-Bot-Edu", // tên repo
  "campus_assistant",
];

/** Tên image được phép kill (bảo vệ thêm tầng 2) */
const ALLOWED_IMAGES = new Set([
  "node.exe",
  "npm.exe",
  "npx.exe",
  "cargo.exe",
  "campus-assistant-local.exe",
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      ...opts,
    });
  } catch {
    return "";
  }
}

/** Trả về Set<number> PID đang LISTEN trên port chỉ định */
function getPidsOnPort(port) {
  const out = run("netstat.exe", ["-ano", "-p", "tcp"]);
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes(`:${port}`) || !/LISTENING/i.test(line)) continue;
    const parts = line.trim().split(/\s+/);
    const pid = Number(parts[parts.length - 1]);
    if (Number.isInteger(pid) && pid > 0) pids.add(pid);
  }
  return pids;
}

/** Tên image của PID (ví dụ: "node.exe") */
function getImageName(pid) {
  const out = run("tasklist.exe", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"]);
  const match = out.trim().split(/\r?\n/)[0]?.match(/^"([^"]+)"/);
  return match?.[1]?.toLowerCase() ?? "";
}

/**
 * Lấy command-line của PID qua WMIC.
 * Trả về chuỗi rỗng nếu thất bại (quyền không đủ, PID không tồn tại).
 */
function getCmdLine(pid) {
  const out = run("wmic.exe", [
    "process",
    "where",
    `ProcessId=${pid}`,
    "get",
    "CommandLine",
    "/VALUE",
  ]);
  // Định dạng: "CommandLine=<value>\r\n"
  return out.replace(/^CommandLine=/im, "").trim();
}

/**
 * Lấy thư mục làm việc (ExecutablePath) của PID qua WMIC.
 * ExecutablePath trả về đường dẫn exe; ta lấy dirname làm cwd gần đúng.
 */
function getExePath(pid) {
  const out = run("wmic.exe", [
    "process",
    "where",
    `ProcessId=${pid}`,
    "get",
    "ExecutablePath",
    "/VALUE",
  ]);
  const raw = out.replace(/^ExecutablePath=/im, "").trim();
  return raw ? path.dirname(raw).toLowerCase() : "";
}

/** Kiểm tra PID có thuộc dự án Campus Assistant không */
function belongsToProject(pid) {
  const cmdline = getCmdLine(pid).toLowerCase();
  const exePath = getExePath(pid);

  for (const marker of PROJECT_MARKERS) {
    const m = marker.toLowerCase();
    if (cmdline.includes(m) || exePath.includes(m)) return true;
  }
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

let freed = 0;

for (const port of DEV_PORTS) {
  const pids = getPidsOnPort(port);

  if (pids.size === 0) {
    console.log(`[free-dev-port] Port ${port}: free.`);
    continue;
  }

  for (const pid of pids) {
    const image = getImageName(pid);

    if (!ALLOWED_IMAGES.has(image)) {
      console.warn(
        `[free-dev-port] Port ${port}: PID ${pid} (${image || "unknown"}) — không phải Node/Cargo, bỏ qua.`
      );
      continue;
    }

    if (!belongsToProject(pid)) {
      console.warn(
        `[free-dev-port] Port ${port}: PID ${pid} (${image}) — không phải Campus Assistant, bỏ qua.`
      );
      continue;
    }

    try {
      execFileSync("taskkill.exe", ["/F", "/PID", String(pid)], { stdio: "ignore" });
      console.log(`[free-dev-port] Port ${port}: đã kill PID ${pid} (${image}). ✓`);
      freed++;
    } catch (e) {
      console.error(`[free-dev-port] Port ${port}: không thể kill PID ${pid} — ${e.message}`);
    }
  }
}

if (freed === 0) {
  console.log("[free-dev-port] Không có tiến trình nào cần giải phóng.");
}
