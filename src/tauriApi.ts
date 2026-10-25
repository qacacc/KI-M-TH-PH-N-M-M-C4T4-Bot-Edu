import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ACADEMIC_CACHE_UPDATED_EVENT } from "./academicEvents";
import type {
  ActionLogEntry,
  AnnouncementRecord,
  BootstrapState,
  DiagnosticExportResult,
  DocumentRecord,
  ExamRecord,
  FileActionResult,
  HealthReport,
  PublicSearchResponse,
  ScheduleRecord,
  StorageSummary,
  UpdateCheckResult,
} from "./types";

function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!("__TAURI_INTERNALS__" in window)) {
    return Promise.reject(
      "Bạn đang mở giao diện bằng trình duyệt. Hãy chạy CampusAssistantLocal-Dev.exe hoặc npm run tauri dev để mở app desktop.",
    );
  }

  return invoke<T>(command, args);
}

export function initApp(): Promise<BootstrapState> {
  return tauriInvoke("init_app");
}

export function saveSetting(key: "theme" | "accentColor", value: string): Promise<void> {
  return tauriInvoke("save_setting", { key, value });
}

export function listDocuments(subjectId: string, semester: number): Promise<DocumentRecord[]> {
  return tauriInvoke("list_documents", { subjectId, semester });
}

export function listAnnouncements(): Promise<AnnouncementRecord[]> {
  return tauriInvoke("list_announcements");
}

export function listSchedule(semester?: number): Promise<ScheduleRecord[]> {
  return tauriInvoke("list_schedule", { semester: semester ?? null });
}

export function listExams(semester?: number): Promise<ExamRecord[]> {
  return tauriInvoke("list_exams", { semester: semester ?? null });
}

export function openDocument(documentId: string): Promise<FileActionResult> {
  return tauriInvoke("open_document", { documentId });
}

export function copyDocument(documentId: string): Promise<FileActionResult> {
  return tauriInvoke("copy_document", { documentId });
}

export function checkForUpdate(): Promise<UpdateCheckResult> {
  return tauriInvoke("check_for_update");
}

export function listActionLogs(limit = 100): Promise<ActionLogEntry[]> {
  return tauriInvoke("list_action_logs", { limit });
}

export function getStorageSummary(): Promise<StorageSummary> {
  return tauriInvoke("get_storage_summary");
}

export function clearActionLogs(): Promise<number> {
  return tauriInvoke("clear_action_logs");
}

export function openDownloadsFolder(): Promise<void> {
  return tauriInvoke("open_downloads_folder");
}

export function openExternalUrl(url: string): Promise<void> {
  if (!url) return Promise.resolve();
  if ("__TAURI_INTERNALS__" in window) {
    return tauriInvoke<void>("open_external_url", { url });
  }
  triggerAnchorClick(url);
  return Promise.resolve();
}

function triggerAnchorClick(url: string) {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 100);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function getHealthReport(): Promise<HealthReport> {
  return tauriInvoke("get_health_report");
}

export function exportDiagnosticReport(): Promise<DiagnosticExportResult> {
  return tauriInvoke("export_diagnostic_report");
}

export function saveThemeBackground(themeId: string, ext: string, base64Data: string): Promise<string> {
  return tauriInvoke("save_theme_background", { themeId, ext, base64Data });
}

export function deleteThemeBackground(themeId: string): Promise<void> {
  return tauriInvoke("delete_theme_background", { themeId });
}

export function searchPublicSchoolInfo(schoolId: string, query: string): Promise<PublicSearchResponse> {
  return tauriInvoke("search_public_school_info", { schoolId, query });
}

export interface SyncResult {
  success: boolean;
  studentCode: string;
  studentName: string;
  schedulesCount: number;
  examsCount: number;
  message: string;
}

export function syncEmbeddedSchoolData(
  schoolId: string,
  studentCode: string,
  studentName: string,
): Promise<SyncResult> {
  return tauriInvoke("sync_embedded_school_data", {
    school_id: schoolId,
    student_code: studentCode,
    student_name: studentName,
    schoolId,
    studentCode,
    studentName,
  });
}

/** Mở cửa sổ WebView đăng nhập UTH Portal riêng biệt */
export function openUthLoginWindow(): Promise<void> {
  return tauriInvoke("open_uth_login_window");
}

export interface UthSyncEventPayload {
  success: boolean;
  message: string;
  studentCode?: string;
  studentName?: string;
  schedulesCount?: number;
  examsCount?: number;
}

/** Lắng nghe kết quả auto-sync từ WebView UTH */
export async function onUthSyncResult(
  callback: (payload: UthSyncEventPayload) => void,
): Promise<() => void> {
  if (!("__TAURI_INTERNALS__" in window)) {
    return () => {};
  }
  const unlisten = await listen<UthSyncEventPayload>("uth-sync-result", (event) => {
    if (event.payload.success) window.dispatchEvent(new Event(ACADEMIC_CACHE_UPDATED_EVENT));
    callback(event.payload);
  });
  return unlisten;
}

// Canonical types từ Rust Connector (khác ScheduleRecord ở frontend)
export interface CanonicalScheduleEntry {
  id: string;
  studentCode: string;
  subjectCode: string;
  subjectName: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string;
  lecturer: string;
  source: string;
}

export interface CanonicalExamEntry {
  id: string;
  studentCode: string;
  subjectCode: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  room: string;
  format: string;
  source: string;
}

/** Đọc lịch học từ SQLite local (offline fallback) */
export function listConnectorSchedules(studentCode: string): Promise<CanonicalScheduleEntry[]> {
  return tauriInvoke("list_connector_schedules", {
    student_code: studentCode,
    studentCode,
  });
}

/** Đọc lịch thi từ SQLite local */
export function listConnectorExams(studentCode: string): Promise<CanonicalExamEntry[]> {
  return tauriInvoke("list_connector_exams", {
    student_code: studentCode,
    studentCode,
  });
}

export interface ConnectorSyncStatus {
  sourceName: string;
  studentCode: string;
  status: "ok" | "failed" | "partial";
  lastSuccessAt: string | null;
  lastAttemptAt: string;
  lastError: string | null;
  schedulesCount: number;
  examsCount: number;
}

/** Đọc trạng thái đồng bộ lần cuối */
export function getConnectorSyncStatus(studentCode: string): Promise<ConnectorSyncStatus | null> {
  return tauriInvoke("get_connector_sync_status", {
    student_code: studentCode,
    studentCode,
  });
}

/** Ngắt kết nối phiên làm việc backend và xóa session bộ nhớ */
export function disconnectConnector(schoolId: string, studentCode: string): Promise<void> {
  return tauriInvoke("disconnect_connector", {
    school_id: schoolId,
    student_code: studentCode,
    schoolId,
    studentCode,
  });
}

/** Xóa sạch dữ liệu cache connector trong SQLite */
export function deleteConnectorData(studentCode: string): Promise<void> {
  return tauriInvoke("delete_connector_data_cmd", {
    student_code: studentCode,
    studentCode,
  });
}

/** Ngắt kết nối và xóa toàn bộ dữ liệu connector của student_code */
export function disconnectUthConnector(studentCode: string): Promise<void> {
  return tauriInvoke("disconnect_uth_connector", {
    student_code: studentCode,
    studentCode,
  });
}

export interface TrashItemRecord {
  trash_id: string;
  original_relative_path: string;
  trash_storage_name: string;
  original_file_name: string;
  deleted_at: string;
  size_bytes: number;
}

export function moveFileToTrash(relativePath: string): Promise<TrashItemRecord> {
  return tauriInvoke("move_file_to_trash", { relative_path: relativePath, relativePath });
}

export function listTrashItems(): Promise<TrashItemRecord[]> {
  return tauriInvoke("list_trash_items");
}

export function restoreTrashItem(trashId: string): Promise<string> {
  return tauriInvoke("restore_trash_item", { trash_id: trashId, trashId });
}

export function emptyTrashBin(): Promise<number> {
  return tauriInvoke("empty_trash_bin");
}
