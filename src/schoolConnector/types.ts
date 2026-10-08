export interface UniversityInfo {
  id: string;
  code: string;
  name: string;
  shortName: string;
  ssoUrl: string;           // Cổng SSO Đăng nhập Sinh viên
  studentPortalUrl: string; // Cổng Cá nhân Sinh viên (Lịch học, điểm, học phần)
  publicNewsUrl: string;    // Cổng Thông tin & Tuyển sinh Công khai (Tân sinh viên)
  description: string;
}

export const SUPPORTED_UNIVERSITIES: UniversityInfo[] = [
  {
    id: "uth",
    code: "UTH",
    name: "Trường Đại học Giao thông vận tải TP.HCM",
    shortName: "GTVT TP.HCM",
    ssoUrl: "https://portal.ut.edu.vn/",
    studentPortalUrl: "https://portal.ut.edu.vn/",
    publicNewsUrl: "https://ut.edu.vn/",
    description: "Cổng Sinh viên cá nhân Portal UTH và trang tin tức tuyển sinh công khai.",
  },
  {
    id: "hcmut",
    code: "HCMUT",
    name: "Trường Đại học Bách Khoa - ĐHQG TP.HCM",
    shortName: "Bách Khoa TP.HCM",
    ssoUrl: "https://mybk.hcmut.edu.vn/",
    studentPortalUrl: "https://mybk.hcmut.edu.vn/",
    publicNewsUrl: "https://hcmut.edu.vn/",
    description: "Cổng SSO Bách Khoa, Cổng đào tạo MyBK và trang thông tin Bách Khoa.",
  },
  {
    id: "hcmus",
    code: "HCMUS",
    name: "Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
    shortName: "KHTN TP.HCM",
    ssoUrl: "https://portal.hcmus.edu.vn/",
    studentPortalUrl: "https://portal.hcmus.edu.vn/",
    publicNewsUrl: "https://hcmus.edu.vn/",
    description: "Cổng Portal KHTN tra cứu thời khóa biểu cá nhân và trang tin tức KHTN.",
  },
  {
    id: "hcmue",
    code: "HCMUE",
    name: "Trường Đại học Sư phạm TP.HCM",
    shortName: "Sư phạm TP.HCM",
    ssoUrl: "https://portal.hcmue.edu.vn/",
    studentPortalUrl: "https://portal.hcmue.edu.vn/",
    publicNewsUrl: "https://hcmue.edu.vn/",
    description: "Cổng Portal Sinh viên ĐH Sư Phạm và trang tin tức đào tạo công khai.",
  },
];

export interface StudentSession {
  schoolId: string;
  schoolName: string;
  studentId: string;
  studentName: string;
  expiresAt: string;
  lastSyncAt: string;
}

export interface SchoolSyncConfig {
  autoSync: boolean;
  syncSchedule: boolean;
  syncExams: boolean;
  syncAnnouncements: boolean;
}

export interface PublicSchoolDocument {
  id: string;
  schoolId: string;
  title: string;
  category: string;
  date: string;
  summary: string;
  sourceUrl: string;
}

