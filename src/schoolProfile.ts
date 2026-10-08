export type SchoolMode = "public" | "student";

export interface SchoolOption {
  id: string;
  shortName: string;
  name: string;
  domain: string;
  studentPortalUrl: string | null; // Cổng Sinh viên cá nhân (portal.ut.edu.vn)
  lmsPortalUrl: string | null;     // Cổng LMS Bài giảng & Tài liệu (courses.ut.edu.vn)
  publicNewsUrl: string | null;    // Trang tin tức / tuyển sinh công khai
  portalUrl: string | null;        // Alias tương thích
  connectorStatus: string;
}

export interface SchoolProfile {
  schoolId: string;
  schoolName: string;
  mode: SchoolMode;
  displayName: string;
  studentCode: string;
  schoolEmail: string;
  updatedAt: string;
}

export const SCHOOL_PROFILE_STORAGE_KEY = "ca-school-profile-v1";
export const SCHOOL_PROFILE_UPDATED_EVENT = "ca-school-profile-updated";

export const schoolOptions: SchoolOption[] = [
  {
    id: "uth",
    shortName: "UTH",
    name: "Trường Đại học Giao thông vận tải TP.HCM",
    domain: "ut.edu.vn",
    studentPortalUrl: "https://portal.ut.edu.vn/",
    lmsPortalUrl: "https://courses.ut.edu.vn/my/courses.php",
    publicNewsUrl: "https://ut.edu.vn/",
    portalUrl: "https://portal.ut.edu.vn/",
    connectorStatus: "Cổng Portal & LMS Sinh viên UTH (Sẵn sàng)",
  },
  {
    id: "hcmut",
    shortName: "Bách Khoa",
    name: "Trường Đại học Bách Khoa - ĐHQG TP.HCM",
    domain: "hcmut.edu.vn",
    studentPortalUrl: "https://mybk.hcmut.edu.vn/",
    lmsPortalUrl: "https://lms.hcmut.edu.vn/",
    publicNewsUrl: "https://hcmut.edu.vn/",
    portalUrl: "https://mybk.hcmut.edu.vn/",
    connectorStatus: "Cổng SSO MyBK Bách Khoa (Sẵn sàng)",
  },
  {
    id: "hcmus",
    shortName: "KHTN",
    name: "Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM",
    domain: "hcmus.edu.vn",
    studentPortalUrl: "https://portal.hcmus.edu.vn/",
    lmsPortalUrl: "https://moodle.hcmus.edu.vn/",
    publicNewsUrl: "https://hcmus.edu.vn/",
    portalUrl: "https://portal.hcmus.edu.vn/",
    connectorStatus: "Cổng Portal Sinh viên KHTN (Sẵn sàng)",
  },
  {
    id: "hcmue",
    shortName: "Sư Phạm",
    name: "Trường Đại học Sư phạm TP.HCM",
    domain: "hcmue.edu.vn",
    studentPortalUrl: "https://portal.hcmue.edu.vn/",
    lmsPortalUrl: null,
    publicNewsUrl: "https://hcmue.edu.vn/",
    portalUrl: "https://portal.hcmue.edu.vn/",
    connectorStatus: "Cổng Portal Sinh viên ĐH Sư Phạm (Sẵn sàng)",
  },
  {
    id: "other",
    shortName: "Khác",
    name: "Trường khác",
    domain: "Cấu hình sau",
    studentPortalUrl: null,
    lmsPortalUrl: null,
    publicNewsUrl: null,
    portalUrl: null,
    connectorStatus: "Chờ manifest trường",
  },
];

export function createDefaultSchoolProfile(): SchoolProfile {
  const uth = schoolOptions[0];
  return {
    schoolId: uth.id,
    schoolName: uth.name,
    mode: "public",
    displayName: "",
    studentCode: "",
    schoolEmail: "",
    updatedAt: "",
  };
}

export function readSchoolProfile(): SchoolProfile {
  try {
    const raw = localStorage.getItem(SCHOOL_PROFILE_STORAGE_KEY);
    if (!raw) return createDefaultSchoolProfile();
    const parsed = JSON.parse(raw) as Partial<SchoolProfile>;
    const school = schoolOptions.find((item) => item.id === parsed.schoolId) ?? schoolOptions[0];
    let displayName = parsed.displayName || "";
    let studentCode = parsed.studentCode || "";
    // Tự động làm sạch dữ liệu cá nhân nếu còn lưu trong localStorage từ phiên cũ
    if (displayName.includes("Huỳnh Tấn Đạt")) displayName = "";
    if (studentCode.includes("079205017256")) studentCode = "";

    return {
      schoolId: school.id,
      schoolName: parsed.schoolName || school.name,
      mode: parsed.mode === "student" ? "student" : "public",
      displayName,
      studentCode,
      schoolEmail: parsed.schoolEmail || "",
      updatedAt: parsed.updatedAt || "",
    };
  } catch {
    return createDefaultSchoolProfile();
  }
}

export function saveSchoolProfile(profile: SchoolProfile) {
  localStorage.setItem(SCHOOL_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(SCHOOL_PROFILE_UPDATED_EVENT));
}

export function clearSchoolProfile() {
  localStorage.removeItem(SCHOOL_PROFILE_STORAGE_KEY);
  window.dispatchEvent(new Event(SCHOOL_PROFILE_UPDATED_EVENT));
}

export function getSchoolOption(profile: SchoolProfile) {
  return schoolOptions.find((item) => item.id === profile.schoolId) ?? schoolOptions[0];
}

export function getSchoolProfileInitials(profile: SchoolProfile) {
  const source = profile.displayName.trim() || getSchoolOption(profile).shortName || "SV";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function getSchoolProfileTitle(profile: SchoolProfile) {
  return profile.displayName.trim() || "Sinh viên";
}

export function getSchoolProfileSubtitle(profile: SchoolProfile) {
  const school = getSchoolOption(profile);
  const code = profile.studentCode.trim();
  const modeText = profile.mode === "student" ? "Sinh viên" : "Public";
  if (code) return `${school.shortName} · ${code}`;
  return `${school.shortName} · ${modeText}`;
}
