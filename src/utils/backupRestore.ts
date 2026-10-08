export interface BackupBundle {
  format: "campus-assistant-backup";
  schemaVersion: 1;
  appVersion: string;
  exportedAt: string;
  data: Record<string, string>;
}

export const MAX_BACKUP_BYTES = 1 * 1024 * 1024; // 1 MB limit

// ALLAWLIST CHÍNH XÁC: Chỉ cho phép các khóa cấu hình hiển thị & tùy chọn cá nhân
const ALLOWLIST_KEYS = new Set([
  "ca-settings-lang",
  "ca-settings-default-view",
  "ca-settings-autofocus",
  "ca-settings-dev-mode",
  "ca-appearance-settings",
  "ca_gpa_calculator_data_v1",
]);

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/**
 * Xuất dữ liệu cấu hình giao diện & tùy chọn local theo Allowlist cố định.
 * Session Token, Credential và Vault ID hoàn toàn KHÔNG thuộc định dạng backup này.
 */
export function exportLocalAppDataJSON(): string {
  const data: Record<string, string> = {};

  for (const key of ALLOWLIST_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) {
      data[key] = val;
    }
  }

  const exportBundle: BackupBundle = {
    format: "campus-assistant-backup",
    schemaVersion: 1,
    appVersion: "1.0.1",
    exportedAt: new Date().toISOString(),
    data,
  };

  return JSON.stringify(exportBundle, null, 2);
}

/**
 * Kích hoạt tải tệp backup JSON cấu hình về máy
 */
export function downloadBackupFile(): void {
  const jsonStr = exportLocalAppDataJSON();
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `campus-assistant-config-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Phục hồi dữ liệu cấu hình local từ chuỗi JSON có kiểm tra Schema & Allowlist nghiêm ngặt
 */
export function importLocalAppDataJSON(jsonString: string): boolean {
  if (!jsonString || jsonString.length > MAX_BACKUP_BYTES) {
    return false;
  }

  // Chặn tuyệt đối Prototype Pollution ngay từ chuỗi JSON thô
  if (
    jsonString.includes("__proto__") ||
    jsonString.includes("prototype") ||
    jsonString.includes("constructor")
  ) {
    return false;
  }

  // Backup snapshot cũ để rollback nếu có lỗi
  const snapshot: Record<string, string | null> = {};
  for (const key of ALLOWLIST_KEYS) {
    snapshot[key] = localStorage.getItem(key);
  }

  try {
    const bundle = JSON.parse(jsonString) as Partial<BackupBundle>;

    // Kiểm tra contract cố định
    if (
      !bundle ||
      bundle.format !== "campus-assistant-backup" ||
      bundle.schemaVersion !== 1 ||
      !bundle.data ||
      typeof bundle.data !== "object"
    ) {
      return false;
    }

    const data = bundle.data;

    // Chặn Prototype Pollution
    for (const key of Object.keys(data)) {
      if (DANGEROUS_KEYS.has(key)) {
        return false;
      }
    }

    // Áp dụng dữ liệu chỉ cho các khóa thuộc Allowlist
    for (const [key, value] of Object.entries(data)) {
      if (ALLOWLIST_KEYS.has(key) && typeof value === "string") {
        localStorage.setItem(key, value);
      }
    }

    return true;
  } catch {
    // Rollback về snapshot cũ nếu gặp sự cố trong quá trình parse
    for (const [key, value] of Object.entries(snapshot)) {
      if (value !== null) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    }
    return false;
  }
}

/**
 * Đọc tệp Backup JSON từ máy tính và khôi phục
 */
export function uploadBackupFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    if (file.size > MAX_BACKUP_BYTES) {
      resolve(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        const success = importLocalAppDataJSON(content);
        resolve(success);
      } else {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}
