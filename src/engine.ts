import type { ConversationState, ExamRecord, ScheduleRecord, Subject } from "./types";

export type DataSensitivity = "public" | "private" | "local";

// Bộ lọc thời gian tương đối theo timezone Asia/Ho_Chi_Minh
export type TimeFilter =
  | { kind: "today"; weekday: number; isoDate: string }
  | { kind: "tomorrow"; weekday: number; isoDate: string }
  | null;

export type IntentResult =
  | {
      intent: "FIND_DOCUMENTS";
      subjectId: string;
      subjectName: string;
      semester: number | null;
    }
  | { intent: "NEEDS_SUBJECT"; semester: number | null }
  | { intent: "AMBIGUOUS_SUBJECT"; candidates: string[]; semester: number | null }
  | { intent: "FIND_ANNOUNCEMENTS" }
  | { intent: "FIND_SCHEDULE"; semester: number | null; timeFilter: TimeFilter }
  | { intent: "FIND_EXAMS"; semester: number | null; timeFilter: TimeFilter }
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

/**
 * Lấy weekday (2=Thứ 2...7=Thứ 7, 8=Chủ nhật theo quy ước ScheduleRecord)
 * và ngày ISO cho "hôm nay" hoặc "ngày mai" theo timezone Asia/Ho_Chi_Minh (+07:00),
 * độc lập hoàn toàn với múi giờ của máy chủ chạy code.
 */
export function extractTimeFilter(input: string, now?: Date): TimeFilter {
  const normalized = normalizeVietnamese(input);

  const isToday =
    normalized.includes("hom nay") ||
    normalized.includes("hoc hom nay") ||
    normalized.includes("lich hom nay");

  const isTomorrow =
    normalized.includes("ngay mai") ||
    normalized.includes("hoc ngay mai") ||
    normalized.includes("lich ngay mai");

  if (!isToday && !isTomorrow) return null;

  // Xác định ngày theo timezone Asia/Ho_Chi_Minh
  const base = now ?? new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayParts = formatter.formatToParts(base);
  const todayYear = Number(todayParts.find((p) => p.type === "year")?.value);
  const todayMonth = Number(todayParts.find((p) => p.type === "month")?.value);
  const todayDay = Number(todayParts.find((p) => p.type === "day")?.value);

  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (isToday) {
    const todayISO = `${todayYear}-${pad2(todayMonth)}-${pad2(todayDay)}`;
    // Tính weekday qua UTC để tránh bị lệch múi giờ trên máy chủ khác UTC+7
    const todayUtc = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay));
    const jsDay = todayUtc.getUTCDay(); // 0=CN, 1=T2, ... 6=T7
    const weekday = jsDay === 0 ? 8 : jsDay + 1; // Quy ước ScheduleRecord: 2..8
    return { kind: "today", weekday, isoDate: todayISO };
  }

  // Ngày mai: cộng 1 ngày trên UTC để xử lý chuẩn xác chuyển tháng/năm
  const tomorrowUtc = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay + 1));
  const tYear = tomorrowUtc.getUTCFullYear();
  const tMonth = tomorrowUtc.getUTCMonth() + 1;
  const tDay = tomorrowUtc.getUTCDate();
  const tomorrowISO = `${tYear}-${pad2(tMonth)}-${pad2(tDay)}`;
  const tJsDay = tomorrowUtc.getUTCDay();
  const tomorrowWeekday = tJsDay === 0 ? 8 : tJsDay + 1;
  return { kind: "tomorrow", weekday: tomorrowWeekday, isoDate: tomorrowISO };
}

export function detectIntent(input: string, subjects: Subject[], now?: Date): IntentResult {
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

  const isScheduleQuery =
    normalized.includes("lich hoc") ||
    normalized.includes("thoi khoa bieu") ||
    normalized.includes("tkb") ||
    normalized.includes("hoc hom nay") ||
    normalized.includes("het mon") ||
    normalized.includes("xong mon") ||
    normalized.includes("buoi hoc") ||
    normalized.includes("hom nay hoc") ||
    normalized.includes("ngay mai hoc") ||
    // "lịch hôm nay" / "lịch ngày mai" mà không có từ thi
    (normalized.includes("lich hom nay") && !/\bthi\b/.test(normalized)) ||
    (normalized.includes("lich ngay mai") && !/\bthi\b/.test(normalized));

  if (isScheduleQuery) {
    return { intent: "FIND_SCHEDULE", semester, timeFilter: extractTimeFilter(input, now) };
  }

  const isExamQuery =
    normalized.includes("lich thi") ||
    normalized.includes("thi cu") ||
    normalized.includes("ngay thi") ||
    (/\bthi\b/.test(normalized) && (normalized.includes("hom nay") || normalized.includes("ngay mai")));

  if (isExamQuery) {
    return { intent: "FIND_EXAMS", semester, timeFilter: extractTimeFilter(input, now) };
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

  // Sử dụng longest-match và phát hiện ambiguous
  const subjectMatch = findSubjectMatchInText(input, subjects);

  if (subjectMatch.kind === "none") return { intent: "NEEDS_SUBJECT", semester };

  if (subjectMatch.kind === "ambiguous") {
    return {
      intent: "AMBIGUOUS_SUBJECT",
      candidates: subjectMatch.candidates.map((s) => s.name),
      semester,
    };
  }

  return {
    intent: "FIND_DOCUMENTS",
    subjectId: subjectMatch.subject.id,
    subjectName: subjectMatch.subject.name,
    semester,
  };
}

/**
 * Kết quả nhận diện môn học: null = không khớp, Subject = khớp chính xác,
 * { ambiguous: Subject[] } = nhiều môn cùng mức độ khớp.
 */
export type SubjectMatchResult =
  | { kind: "match"; subject: Subject }
  | { kind: "ambiguous"; candidates: Subject[] }
  | { kind: "none" };

/**
 * Tìm môn học khớp trong câu, ưu tiên tên dài nhất.
 * Khi hai môn có cùng độ dài khớp dài nhất => trả về ambiguous.
 * Đảm bảo ranh giới từ: tên môn phải không bị nhúng giữa ký tự \p{L}\p{N}.
 */
export function findSubjectMatchInText(input: string, subjects: Subject[]): SubjectMatchResult {
  const normalized = normalizeVietnamese(input);

  type Candidate = { subject: Subject; matchLength: number };
  const candidates: Candidate[] = [];

  for (const subject of subjects) {
    const names = [subject.name, ...subject.aliases].map(normalizeVietnamese);
    // Chọn tên/alias dài nhất thực sự xuất hiện trong câu
    let bestLen = 0;
    for (const name of names) {
      if (name.length === 0) continue;
      // Tìm tất cả các lần xuất hiện cho đến khi gặp ranh giới từ hợp lệ
      let startIdx = 0;
      while (startIdx < normalized.length) {
        const idx = normalized.indexOf(name, startIdx);
        if (idx === -1) break;
        const before = idx > 0 ? normalized[idx - 1] : " ";
        const after = idx + name.length < normalized.length ? normalized[idx + name.length] : " ";
        // Cho phép ranh giới: khoảng trắng, đầu chuỗi, cuối chuỗi, hoặc ký tự không phải chữ/số
        const validBefore = /[\s/.,\-]/.test(before) || idx === 0;
        const validAfter = /[\s/.,\-]/.test(after) || idx + name.length === normalized.length;
        if (validBefore && validAfter) {
          if (name.length > bestLen) {
            bestLen = name.length;
          }
          break;
        }
        startIdx = idx + 1;
      }
    }
    if (bestLen > 0) {
      candidates.push({ subject, matchLength: bestLen });
    }
  }

  if (candidates.length === 0) return { kind: "none" };

  // Sắp xếp theo độ dài giảm dần
  candidates.sort((a, b) => b.matchLength - a.matchLength);
  const best = candidates[0].matchLength;
  const topMatches = candidates.filter((c) => c.matchLength === best);

  if (topMatches.length === 1) return { kind: "match", subject: topMatches[0].subject };
  return { kind: "ambiguous", candidates: topMatches.map((c) => c.subject) };
}

/**
 * Wrapper tương thích ngược: trả về Subject | null (không phân biệt ambiguous).
 * Dùng cho context WAITING_FOR_SUBJECT khi người dùng chưa làm rõ.
 */
export function findSubjectInText(input: string, subjects: Subject[]): Subject | null {
  const result = findSubjectMatchInText(input, subjects);
  if (result.kind === "match") return result.subject;
  return null;
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
