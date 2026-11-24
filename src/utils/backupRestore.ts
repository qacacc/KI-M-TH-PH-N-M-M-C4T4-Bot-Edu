export interface BackupBundle {
  format: "campus-assistant-backup";
  schemaVersion: 1;
  appVersion: string;
  exportedAt: string;
  data: Record<string, string>;
}

export const MAX_BACKUP_BYTES = 1 * 1024 * 1024; // 1 MB limit (1,048,576 bytes)

// ALLOWLIST CHÍNH XÁC: Bao gồm đầy đủ các khóa cấu hình hiển thị, layout, preset & GPA manual v2/v1
export const ALLOWLIST_KEYS = new Set([
  "ca-settings-lang",
  "ca-settings-default-view",
  "ca-settings-autofocus",
  "ca-settings-dev-mode",
  "ca-appearance-settings",
  "campus-assistant-appearance",
  "campus-assistant-layout",
  "campus-assistant-custom-presets",
  "ca_custom_theme_presets_v1",
  "ca_gpa_calculator_data_v1",
  "ca_gpa_calculator_manual_v2",
]);

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/**
 * Xuất dữ liệu cấu hình giao diện & tùy chọn local theo Allowlist cố định.
 * Session Token, Credential và Vault ID hoàn toàn KHÔNG thuộc định dạng backup này.
 */
export function exportLocalAppDataJSON(): string {
  const data: Record<string, string> = {};

  for (const key of ALLOWLIST_KEYS) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        data[key] = val;
      }
    } catch {
      // Bỏ qua nếu storage bị chặn
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
 * Phục hồi dữ liệu cấu hình local từ chuỗi JSON có kiểm tra Schema & Allowlist nghiêm ngặt.
 * Bọc cả bước đọc snapshot và bước rollback trong try/catch để không bao giờ crash khi quota/storage bị chặn.
 */
export function importLocalAppDataJSON(jsonString: string): boolean {
  if (!jsonString || jsonString.length === 0 || jsonString.length > MAX_BACKUP_BYTES) {
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

  const snapshot: Record<string, string | null> = {};
  try {
    for (const key of ALLOWLIST_KEYS) {
      snapshot[key] = localStorage.getItem(key);
    }
  } catch {
    return false;
  }

  try {
    const bundle = JSON.parse(jsonString) as Partial<BackupBundle>;

    // Kiểm tra contract cố định
    if (
      !bundle ||
      bundle.format !== "campus-assistant-backup" ||
      bundle.schemaVersion !== 1 ||
      !bundle.data ||
      typeof bundle.data !== "object" ||
      Array.isArray(bundle.data)
    ) {
      return false;
    }

    const data = bundle.data;

    // Chặn Prototype Pollution & kiểm tra kiểu giá trị trước khi ghi (Transactional Validation)
    for (const [key, value] of Object.entries(data)) {
      if (DANGEROUS_KEYS.has(key)) {
        return false;
      }
      if (ALLOWLIST_KEYS.has(key) && typeof value !== "string") {
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
    // Rollback an toàn trong try/catch để không throw khi storage bị đầy hoặc bị khóa
    try {
      for (const [key, value] of Object.entries(snapshot)) {
        if (value !== null) {
          localStorage.setItem(key, value);
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Nếu cả rollback cũng gặp lỗi storage-blocked, vẫn trả về false rõ ràng thay vì crash
    }
    return false;
  }
}

/**
 * Đọc tệp Backup JSON từ máy tính và khôi phục
 */
export function uploadBackupFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    if (file.size === 0 || file.size > MAX_BACKUP_BYTES) {
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
