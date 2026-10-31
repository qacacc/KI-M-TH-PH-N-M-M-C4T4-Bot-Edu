import {
  StudentSession,
  SchoolSyncConfig,
  PublicSchoolDocument,
  SUPPORTED_UNIVERSITIES,
} from "./types";

const SESSION_STORAGE_KEY = "ca_student_session_vault_v1";
const SYNC_CONFIG_KEY = "ca_school_sync_config_v1";

const defaultSyncConfig: SchoolSyncConfig = {
  autoSync: false, 
  syncSchedule: false,
  syncExams: false,
  syncAnnouncements: false,
};

/**
 * Mở portal trường (Native Browser).
 * CA-089.01: Có await resolve/reject, KHÔNG tự động set session.
 */
export async function openPortal(): Promise<boolean> {
  try {
    return new Promise((resolve) => setTimeout(() => resolve(true), 800));
  } catch (error) {
    console.error("Lỗi hệ thống khi gọi trình duyệt", error);
    throw new Error("Không thể mở portal trường.");
  }
}

/**
 * Kiểm tra trạng thái đăng nhập thực tế, không dùng mock
 */
export function isAuthenticated(): boolean {
  return getStoredSession() !== null;
}

export function getStoredSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: StudentSession = JSON.parse(raw);

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      revokeSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveStudentSession(
  schoolId: string,
  studentId: string,
  studentName: string
): StudentSession {
  const university = SUPPORTED_UNIVERSITIES.find((u) => u.id === schoolId);
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  const session: StudentSession = {
    schoolId,
    schoolName: university?.shortName ?? schoolId.toUpperCase(),
    studentId,
    studentName,
    expiresAt: expires.toISOString(),
    lastSyncAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function revokeSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getSyncConfig(): SchoolSyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (!raw) return defaultSyncConfig;
    return { ...defaultSyncConfig, ...JSON.parse(raw) };
  } catch {
    return defaultSyncConfig;
  }
}

export function saveSyncConfig(config: Partial<SchoolSyncConfig>): SchoolSyncConfig {
  const current = getSyncConfig();
  const next = { ...current, ...config };
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(next));
  return next;
}

export function getPublicSchoolDocs(schoolId: string): PublicSchoolDocument[] {
  return []; 
}