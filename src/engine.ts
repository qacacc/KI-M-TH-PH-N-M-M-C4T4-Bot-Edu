import type { ConversationState, Subject } from "./types";

export type DataSensitivity = "public" | "private" | "local";

export type IntentResult =
  | {
      intent: "FIND_DOCUMENTS";
      subjectId: string;
      subjectName: string;
      semester: number | null;
    }
  | { intent: "NEEDS_SUBJECT"; semester: number | null }
  | { intent: "FIND_ANNOUNCEMENTS" }
  | { intent: "FIND_SCHEDULE"; semester: number | null }
  | { intent: "FIND_EXAMS"; semester: number | null }
  | { intent: "PUBLIC_ADMISSIONS_INFO"; birthYear: number | null }
  | { intent: "UNKNOWN" };

export type SlashCommand =
  | "help"
  | "documents"
  | "announcements"
  | "schedule"
  | "exams"
  | "files"
  | "storage"
  | "health"
  | "release"
  | "appearance"
  | "logs"
  | "admissions"
  | "gpa"
  | "privacy"
  | "clear"
  | "school"
  | "regulations"
  | "forms"
  | "curriculum"
  | "contact"
  | "procedures"
  | "tuition"
  | "attendance"
  | "profile"
  | "unknown";

export type ConfirmationIntent = "confirm" | "cancel" | "unknown";

export type FlowControlIntent = "cancel" | "back" | "unknown";

export type DocumentActionIntent = {
  action: "open" | "copy";
  ordinal: number;
};

export const PERSONAL_MARKERS = [
  "của tôi",
  "của tui",
  "của mình",
  "của em",
  "tôi",
  "tui",
  "mình",
  "em",
  "cá nhân",
  "tài khoản của tôi",
  "hồ sơ của tôi",
  "tôi còn",
  "tôi được",
  "tui được",
  "tui phải",
  "mình có",
];

export const NORMALIZED_PERSONAL_MARKERS = [
  "cua toi",
  "cua tui",
  "cua minh",
  "cua em",
  "toi",
  "tui",
  "minh",
  "em",
  "ca nhan",
  "tai khoan cua toi",
  "ho so cua toi",
  "toi con",
  "toi duoc",
  "tui duoc",
  "tui phai",
  "minh co",
];

export function normalizeVietnamese(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}\s/.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Loại bỏ MSSV / PII nhạy cảm khỏi câu truy vấn trước khi thực hiện Public Search
 */
export function stripPiiFromPublicQuery(input: string): string {
  let cleaned = input;
  // Loại bỏ các định dạng mssv: MSSV 2251120099, mssv: 123456, 10 chữ số MSSV
  cleaned = cleaned.replace(/\b(?:mssv|ma sv|ma sinh vien)\s*[:=]?\s*\d{6,12}\b/gi, "");
  cleaned = cleaned.replace(/\b\d{10,12}\b/g, "");
  return cleaned.replace(/^[\s,.-]+|[\s,.-]+$/g, "").trim();
}

/**
 * Phân loại mức độ nhạy cảm của yêu cầu (Public vs Private vs Local)
 */
export function classifyDataScope(input: string): DataSensitivity | "ambiguous" {
  const normalized = normalizeVietnamese(input);

  const hasPersonalMarker = NORMALIZED_PERSONAL_MARKERS.some((marker) =>
    normalized.includes(marker)
  );

  const hasPrivateDataKeyword = [
    "lich hoc",
    "lich thi",
    "bang diem",
    "diem",
    "hoc phi",
    "cong no",
    "diem danh",
    "mssv",
  ].some((keyword) => normalized.includes(keyword));

  if (hasPersonalMarker && hasPrivateDataKeyword) {
    return "private";
  }

  const hasPublicKeyword = [
    "thong bao",
    "quy che",
    "bieu mau",
    "chuong trinh dao tao",
    "lien he",
    "thu tuc",
  ].some((keyword) => normalized.includes(keyword));

  if (hasPublicKeyword) {
    return "public";
  }

  if (hasPrivateDataKeyword) {
    return "ambiguous";
  }

  return "local";
}

export function extractSemester(input: string): number | null {
  const normalized = normalizeVietnamese(input);
  const numericOnly = normalized.match(/^([1-9])$/);
  if (numericOnly) return Number(numericOnly[1]);

  const match = normalized.match(/\b(?:hoc ky|hk|ky)\s*([1-9])\b/);
  if (!match) return null;
  return Number(match[1]);
}

export function extractBirthYear(input: string): number | null {
  const normalized = normalizeVietnamese(input);
  if (/\btuyen sinh nam\s*20[0-2][0-9]\b/.test(normalized)) return null;

  const explicit = normalized.match(/\b(?:khoi|sinh nam|sn|2k)\s*(20[0-2][0-9])\b/);
  if (explicit) {
    const year = Number(explicit[1]);
    return year >= 2000 && year <= 2029 ? year : null;
  }

  const plain = normalized.match(/\b(20[0-1][0-9])\b/);
  const year = Number(plain?.[1]);
  if (!year || year < 2000 || year > 2014) return null;
  return year;
}

export function buildAdmissionsAnswer(input: string): string | null {
  const birthYear = extractBirthYear(input);
  if (!birthYear) {
    return [
      "Tui có thể tra cứu thông tin tuyển sinh công khai theo trường bạn đã chọn.",
      "Ví dụ: nhập \"khối 2008 thi năm nào nhập học\".",
      "App sẽ tìm từ khóa trên các trang công khai của trường, không yêu cầu đăng nhập.",
    ].join("\n");
  }

  return [
    `Tui sẽ dùng từ khóa "${birthYear}" để tra cứu trên nguồn công khai của trường đã chọn.`,
    "Nếu nguồn công khai không có dữ liệu khớp, app sẽ báo không tìm thấy thay vì tự suy luận.",
  ].join("\n");
}

export function detectIntent(input: string, subjects: Subject[]): IntentResult {
  const normalized = normalizeVietnamese(input);
  const semester = extractSemester(input);

  const asksAdmissions =
    normalized.includes("tuyen sinh") ||
    normalized.includes("nhap hoc") ||
    normalized.includes("tan sinh vien") ||
    normalized.includes("thi thpt") ||
    normalized.includes("thi tot nghiep") ||
    /\bkhoi\s*20[0-2][0-9]\b/.test(normalized);

  if (asksAdmissions) {
    return { intent: "PUBLIC_ADMISSIONS_INFO", birthYear: extractBirthYear(input) };
  }

  if (
    normalized.includes("thong bao") ||
    normalized.includes("tin tuc") ||
    normalized.includes("news") ||
    normalized.includes("cong bo") ||
    normalized.includes("hoc phi") ||
    normalized.includes("cong no") ||
    normalized.includes("han nop") ||
    normalized.includes("dong hoc phi")
  ) {
    return { intent: "FIND_ANNOUNCEMENTS" };
  }

  if (
    normalized.includes("lich hoc") ||
    normalized.includes("thoi khoa bieu") ||
    normalized.includes("tkb") ||
    normalized.includes("hoc hom nay") ||
    normalized.includes("het mon") ||
    normalized.includes("xong mon") ||
    normalized.includes("buoi hoc")
  ) {
    return { intent: "FIND_SCHEDULE", semester };
  }

  if (normalized.includes("lich thi") || normalized.includes("thi cu") || normalized.includes("ngay thi")) {
    return { intent: "FIND_EXAMS", semester };
  }

  const wantsDocuments =
    normalized.includes("tai lieu") ||
    normalized.includes("slide") ||
    normalized.includes("bai tap") ||
    normalized.includes("thuc hanh") ||
    normalized.includes("tai du lieu") ||
    normalized.includes("tai ve") ||
    normalized.includes("download") ||
    normalized.includes("du lieu mon");

  if (!wantsDocuments) return { intent: "UNKNOWN" };

  const matchedSubject = findSubjectInText(input, subjects);

  if (!matchedSubject) return { intent: "NEEDS_SUBJECT", semester };

  return {
    intent: "FIND_DOCUMENTS",
    subjectId: matchedSubject.id,
    subjectName: matchedSubject.name,
    semester,
  };
}

export function findSubjectInText(input: string, subjects: Subject[]): Subject | null {
  const normalized = normalizeVietnamese(input);
  const matchedSubject = subjects.find((item) => {
    const names = [item.name, ...item.aliases].map(normalizeVietnamese);
    return names.some((name) => normalized.includes(name));
  });

  return matchedSubject ?? null;
}

export function createFindDocumentsState(intent: Extract<IntentResult, { intent: "FIND_DOCUMENTS" }>): ConversationState {
  return {
    flow: "FIND_DOCUMENTS",
    step: intent.semester ? "SHOWING_DOCUMENTS" : "WAITING_FOR_SEMESTER",
    data: {
      subjectId: intent.subjectId,
      subjectName: intent.subjectName,
      semester: intent.semester,
    },
  };
}

export function parseSlashCommand(input: string): SlashCommand {
  const normalized = input.trim().toLowerCase();
  switch (normalized) {
    case "/help":
    case "/commands":
      return "help";
    case "/documents":
    case "/doc":
      return "documents";
    case "/announcements":
    case "/thongbao":
    case "/news":
      return "announcements";
    case "/schedule":
    case "/calendar":
    case "/lichhoc":
    case "/tkb":
      return "schedule";
    case "/exams":
    case "/exam":
    case "/lichthi":
      return "exams";
    case "/files":
    case "/file":
      return "files";
    case "/trash":
      return "files"; // Opens files page on trash tab
    case "/storage":
      return "storage";
    case "/health":
    case "/check":
      return "health";
    case "/release":
    case "/about":
      return "release";
    case "/appearance":
    case "/theme":
      return "appearance";
    case "/logs":
      return "logs";
    case "/admissions":
    case "/tuyensinh":
    case "/nhaphoc":
      return "admissions";
    case "/gpa":
    case "/cpa":
    case "/diem":
    case "/bangdiem":
      return "gpa";
    case "/school":
    case "/truong":
      return "school";
    case "/privacy":
      return "privacy";
    case "/clear":
      return "clear";
    default:
      return normalized.startsWith("/") ? "unknown" : "unknown";
  }
}

export function parseConfirmationIntent(input: string): ConfirmationIntent {
  const normalized = normalizeVietnamese(input);
  const confirmWords = ["xac nhan", "dong y", "ok", "oke", "yes", "co", "mo", "copy"];
  const cancelWords = ["huy", "khong", "ko", "cancel", "no", "bo qua"];

  if (confirmWords.includes(normalized)) return "confirm";
  if (cancelWords.includes(normalized)) return "cancel";
  return "unknown";
}

export function parseFlowControlIntent(input: string): FlowControlIntent {
  const normalized = normalizeVietnamese(input);
  const cancelWords = ["huy", "dung", "thoat", "thoi", "cancel"];
  const backWords = ["quay lai", "tro lai", "doi hoc ky", "chon lai hoc ky"];

  if (cancelWords.includes(normalized)) return "cancel";
  if (backWords.includes(normalized)) return "back";
  return "unknown";
}

export function parseDocumentActionIntent(input: string): DocumentActionIntent | null {
  const normalized = normalizeVietnamese(input);
  const numberMatch = normalized.match(/\b(?:file|so)?\s*([1-9][0-9]?)\b/);
  if (!numberMatch) return null;

  const wantsOpen = /\b(mo|open|xem)\b/.test(normalized);
  const wantsCopy = /\b(copy|sao chep|tai|download)\b/.test(normalized);

  if (wantsOpen === wantsCopy) return null;

  return {
    action: wantsOpen ? "open" : "copy",
    ordinal: Number(numberMatch[1]),
  };
}
