import {
  StudentSession,
  SchoolSyncConfig,
  PublicSchoolDocument,
  SUPPORTED_UNIVERSITIES,
} from "./types";

const SESSION_STORAGE_KEY = "ca_student_session_vault_v1";
const SYNC_CONFIG_KEY = "ca_school_sync_config_v1";

const defaultSyncConfig: SchoolSyncConfig = {
  autoSync: true,
  syncSchedule: true,
  syncExams: true,
  syncAnnouncements: true,
};

// Mock Public School Documents cho Chế độ Tân sinh viên (Public Portal Mode)
const MOCK_PUBLIC_DOCS: Record<string, PublicSchoolDocument[]> = {
  uth: [
    {
      id: "uth-pub-01",
      schoolId: "uth",
      title: "Hướng dẫn Thủ tục Nhập học Tân sinh viên Khóa K26 (UTH)",
      category: "ADMISSION",
      date: "2026-08-15",
      summary: "Quy trình xác nhận nhập học trực tuyến, hồ sơ sinh viên và lịch chụp hình thẻ sinh viên UTH.",
      sourceUrl: "https://ut.edu.vn/",
    },
    {
      id: "uth-pub-02",
      schoolId: "uth",
      title: "Sơ đồ Cơ sở 1 (Thành Thái) & Cơ sở 2 (Cát Lái) - UTH",
      category: "CAMPUS_MAP",
      date: "2026-08-10",
      summary: "Bản đồ chi tiết hội trường, phòng máy tính, phòng đào tạo và thư viện UTH.",
      sourceUrl: "https://ut.edu.vn/",
    },
    {
      id: "uth-pub-03",
      schoolId: "uth",
      title: "Sổ tay Tân sinh viên & Quy chế Đào tạo Tín chỉ UTH",
      category: "HANDBOOK",
      date: "2026-08-01",
      summary: "Quy định đăng ký môn học, thang điểm 4, quy chế rèn luyện và chính sách học bổng.",
      sourceUrl: "https://ut.edu.vn/",
    },
  ],
  hcmut: [
    {
      id: "bk-pub-01",
      schoolId: "hcmut",
      title: "Cổng thông tin Đào tạo & Thủ tục Nhập học Bách Khoa (HCMUT)",
      category: "ADMISSION",
      date: "2026-08-15",
      summary: "Hướng dẫn đăng ký tài khoản MyBK, kiểm tra trình độ Anh văn và nộp học phí.",
      sourceUrl: "https://mybk.hcmut.edu.vn/",
    },
    {
      id: "bk-pub-02",
      schoolId: "hcmut",
      title: "Sơ đồ Cơ sở Lý Thường Kiệt & Cơ sở Dĩ An Bách Khoa",
      category: "CAMPUS_MAP",
      date: "2026-08-05",
      summary: "Bản đồ khu giảng đường A1-A5, B6 và khu KTX Bách Khoa Dĩ An.",
      sourceUrl: "https://hcmut.edu.vn/campus-map",
    },
    {
      id: "bk-pub-03",
      schoolId: "hcmut",
      title: "Sổ tay Sinh viên & Quy chế Đào tạo Tín chỉ HCMUT",
      category: "HANDBOOK",
      date: "2026-08-01",
      summary: "Quy định đăng ký học phần trên MyBK, thang điểm, quy chế rèn luyện và cảnh báo học vụ.",
      sourceUrl: "https://hcmut.edu.vn/",
    },
  ],
  hcmus: [
    {
      id: "khtn-pub-01",
      schoolId: "hcmus",
      title: "Thủ tục Nhập học Tân sinh viên KHTN (HCMUS)",
      category: "ADMISSION",
      date: "2026-08-15",
      summary: "Quy trình xác nhận nhập học, đăng ký tài khoản portal và lịch chụp hình thẻ sinh viên HCMUS.",
      sourceUrl: "https://hcmus.edu.vn/",
    },
    {
      id: "khtn-pub-02",
      schoolId: "hcmus",
      title: "Sơ đồ Cơ sở Nguyễn Văn Cừ & Cơ sở Linh Trung - HCMUS",
      category: "CAMPUS_MAP",
      date: "2026-08-10",
      summary: "Bản đồ chi tiết các khoa, phòng thực hành và thư viện HCMUS.",
      sourceUrl: "https://hcmus.edu.vn/",
    },
  ],
  hcmue: [
    {
      id: "sp-pub-01",
      schoolId: "hcmue",
      title: "Thủ tục Nhập học Tân sinh viên Sư Phạm (HCMUE)",
      category: "ADMISSION",
      date: "2026-08-15",
      summary: "Hướng dẫn xác nhận nhập học, nộp hồ sơ và đăng ký tài khoản portal sinh viên HCMUE.",
      sourceUrl: "https://hcmue.edu.vn/",
    },
    {
      id: "sp-pub-02",
      schoolId: "hcmue",
      title: "Sơ đồ Cơ sở 280 An Dương Vương - HCMUE",
      category: "CAMPUS_MAP",
      date: "2026-08-05",
      summary: "Bản đồ các khoa, hội trường và thư viện của Trường ĐH Sư Phạm TP.HCM.",
      sourceUrl: "https://hcmue.edu.vn/",
    },
  ],
};

/**
 * Đọc Session từ Local Vault (có kiểm tra hết hạn)
 */
export function getStoredSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: StudentSession = JSON.parse(raw);

    // Kiểm tra hết hạn Token (Expired Token)
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      revokeSession(); // Tự động xóa Token đã hết hạn
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Lưu Session Metadata vào Storage Local (chỉ chứa metadata, KHÔNG chứa secret token)
 */
export function saveStudentSession(
  schoolId: string,
  studentId: string,
  studentName: string
): StudentSession {
  const university = SUPPORTED_UNIVERSITIES.find((u) => u.id === schoolId);
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // Thời hạn 7 ngày

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

/**
 * Đăng xuất & Xóa sạch Session Vault Local
 */
export function revokeSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Đọc cấu hình Đồng bộ Ngầm
 */
export function getSyncConfig(): SchoolSyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (!raw) return defaultSyncConfig;
    return { ...defaultSyncConfig, ...JSON.parse(raw) };
  } catch {
    return defaultSyncConfig;
  }
}

/**
 * Lưu cấu hình Đồng bộ Ngầm
 */
export function saveSyncConfig(config: Partial<SchoolSyncConfig>): SchoolSyncConfig {
  const current = getSyncConfig();
  const next = { ...current, ...config };
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(next));
  return next;
}

/**
 * Lấy Tài liệu Công khai cho Tân sinh viên (Public Portal Mode)
 */
export function getPublicSchoolDocs(schoolId: string): PublicSchoolDocument[] {
  // Trả về đúng dữ liệu theo trường — không fallback về "uth" nếu trường khác
  return MOCK_PUBLIC_DOCS[schoolId] ?? [];
}
