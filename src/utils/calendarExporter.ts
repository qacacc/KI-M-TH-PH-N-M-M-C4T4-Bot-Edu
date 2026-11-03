import type { ExamRecord, ScheduleRecord } from "../types";
import type { CanonicalExamEntry, CanonicalScheduleEntry } from "../tauriApi";

/** Múi giờ của trường. Việt Nam cố định UTC+07:00, không có giờ mùa hè. */
export const VN_TIMEZONE = "Asia/Ho_Chi_Minh";
const VN_OFFSET_MINUTES = 7 * 60;
/** Giới hạn độ dài học kỳ để tránh gõ nhầm năm tạo chuỗi lặp nhiều năm. */
const MAX_SEMESTER_DAYS = 366;

export type IcsExportResult = { ok: true; content: string } | { ok: false; errors: string[] };

/** Khoảng học kỳ do người dùng xác nhận, định dạng YYYY-MM-DD (giờ Việt Nam). */
export type SemesterRange = { startDate: string; endDate: string };

export type IcsExportOptions = { schoolName?: string; now?: Date };

/** Ngày-giờ địa phương (không gắn múi giờ) lưu dưới dạng mốc ms "naive" để cộng trừ lịch. */
type LocalStamp = number;

function pad2(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/** Escape TEXT theo RFC 5545 mục 3.3.11. */
function escapeIcsText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Gập dòng tối đa 75 octet UTF-8 (RFC 5545 mục 3.1), dòng tiếp theo bắt đầu bằng 1 dấu cách.
 * Duyệt theo code point để không cắt đôi ký tự tiếng Việt nhiều byte.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74; // dòng gập đã tốn 1 octet cho dấu cách đầu dòng
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += ch;
    currentBytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** Định dạng instant thật thành YYYYMMDDTHHMMSSZ (UTC). */
function formatUtc(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    "T" +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) +
    "Z"
  );
}

/** Định dạng giờ địa phương thành YYYYMMDDTHHMMSS (dùng kèm TZID). */
function formatLocal(stamp: LocalStamp): string {
  return formatUtc(new Date(stamp)).slice(0, -1);
}

/** Đọc YYYY-MM-DD, trả null nếu sai định dạng hoặc ngày không tồn tại (vd 2026-02-30). */
function parseDate(value: string | undefined | null): LocalStamp | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value ?? "").trim());
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const stamp = Date.UTC(year, month - 1, day);
  const check = new Date(stamp);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return stamp;
}

/** Đọc H:mm hoặc HH:mm (00:00-23:59), trả số phút trong ngày hoặc null. */
function parseTime(value: string | undefined | null): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function itemLabel(item: { subjectName?: string; id?: string }): string {
  return item.subjectName?.trim() || item.id || "(không tên)";
}

function calendarHeader(prodId: string, calName: string): string[] {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Campus Assistant Local//${prodId}//VI`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    `X-WR-TIMEZONE:${VN_TIMEZONE}`,
    "BEGIN:VTIMEZONE",
    `TZID:${VN_TIMEZONE}`,
    `X-LIC-LOCATION:${VN_TIMEZONE}`,
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0700",
    "TZOFFSETTO:+0700",
    "TZNAME:+07",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];
}

function serialize(lines: string[]): string {
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/**
 * Chuyển danh sách Lịch học thành iCalendar, lặp hằng tuần trong khoảng học kỳ người dùng nhập.
 * Thiếu khoảng ngày hoặc có buổi sai dữ liệu thì không tạo file và trả danh sách lỗi.
 */
export function generateScheduleIcs(
  schedules: Array<ScheduleRecord | CanonicalScheduleEntry>,
  range: SemesterRange | null,
  options: IcsExportOptions = {}
): IcsExportResult {
  const errors: string[] = [];
  if (!schedules.length) errors.push("Không có buổi học nào để xuất.");

  const rangeStart = parseDate(range?.startDate);
  const rangeEnd = parseDate(range?.endDate);
  if (rangeStart === null || rangeEnd === null) {
    errors.push("Cần nhập ngày bắt đầu và ngày kết thúc học kỳ hợp lệ.");
  } else if (rangeEnd < rangeStart) {
    errors.push("Ngày kết thúc học kỳ phải sau hoặc trùng ngày bắt đầu.");
  } else if ((rangeEnd - rangeStart) / 86_400_000 > MAX_SEMESTER_DAYS) {
    errors.push(`Khoảng học kỳ dài hơn ${MAX_SEMESTER_DAYS} ngày, vui lòng kiểm tra lại năm.`);
  }

  const events: string[][] = [];
  const dtStamp = formatUtc(options.now ?? new Date());
  // UNTIL phải là UTC khi DTSTART có TZID: 23:59:59 giờ Việt Nam của ngày kết thúc.
  const until = rangeEnd === null ? "" : formatUtc(new Date(rangeEnd + (24 * 60 - VN_OFFSET_MINUTES) * 60_000 - 1000));

  for (const item of schedules) {
    const label = `${itemLabel(item)} (${item.startTime || "?"}-${item.endTime || "?"})`;
    const start = parseTime(item.startTime);
    const end = parseTime(item.endTime);
    // Quy ước dữ liệu: 2 = Thứ Hai ... 7 = Thứ Bảy, 8 = Chủ nhật.
    if (!Number.isInteger(item.weekday) || item.weekday < 2 || item.weekday > 8) {
      errors.push(`${label}: thứ trong tuần không hợp lệ.`);
      continue;
    }
    if (start === null || end === null) {
      errors.push(`${label}: thiếu hoặc sai giờ bắt đầu/kết thúc.`);
      continue;
    }
    if (end <= start) {
      errors.push(`${label}: giờ kết thúc phải sau giờ bắt đầu.`);
      continue;
    }
    if (rangeStart === null || rangeEnd === null) continue;

    const targetJsDay = item.weekday === 8 ? 0 : item.weekday - 1;
    const offsetDays = (targetJsDay - new Date(rangeStart).getUTCDay() + 7) % 7;
    const firstDay = rangeStart + offsetDays * 86_400_000;
    if (firstDay > rangeEnd) {
      errors.push(`${label}: không có buổi nào trong khoảng ngày đã nhập.`);
      continue;
    }

    events.push([
      "BEGIN:VEVENT",
      `UID:${escapeIcsText(`sch-${item.id}`)}@campusassistant.local`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;TZID=${VN_TIMEZONE}:${formatLocal(firstDay + start * 60_000)}`,
      `DTEND;TZID=${VN_TIMEZONE}:${formatLocal(firstDay + end * 60_000)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${until}`,
      `SUMMARY:${escapeIcsText(`[Lịch học] ${item.subjectName}`)}`,
      `LOCATION:${escapeIcsText(item.room)}`,
      `DESCRIPTION:${escapeIcsText(`Giảng viên: ${item.lecturer}\nThời gian: ${item.startTime} - ${item.endTime}\nPhòng: ${item.room}`)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ]);
  }

  if (errors.length) return { ok: false, errors };
  const schoolName = options.schoolName ?? "Campus Assistant Local";
  return {
    ok: true,
    content: serialize([...calendarHeader("Student Calendar", `Lịch học - ${schoolName}`), ...events.flat(), "END:VCALENDAR"]),
  };
}

/**
 * Chuyển danh sách Lịch thi thành iCalendar theo giờ Việt Nam.
 * Có ca thi thiếu/sai ngày, giờ hoặc thời lượng thì không tạo file và trả danh sách lỗi.
 */
export function generateExamIcs(
  exams: Array<ExamRecord | CanonicalExamEntry>,
  options: IcsExportOptions = {}
): IcsExportResult {
  const errors: string[] = [];
  if (!exams.length) errors.push("Không có ca thi nào để xuất.");

  const events: string[][] = [];
  const dtStamp = formatUtc(options.now ?? new Date());

  for (const item of exams) {
    const label = `${itemLabel(item)} (${item.examDate || "?"} ${item.startTime || "?"})`;
    const day = parseDate(item.examDate);
    const start = parseTime(item.startTime);
    const duration = item.durationMinutes;
    if (day === null) {
      errors.push(`${label}: thiếu hoặc sai ngày thi.`);
      continue;
    }
    if (start === null) {
      errors.push(`${label}: thiếu hoặc sai giờ thi.`);
      continue;
    }
    if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 60) {
      errors.push(`${label}: thời lượng thi không hợp lệ.`);
      continue;
    }

    // Cộng thời lượng trên giờ địa phương: ca thi qua nửa đêm tự sang ngày/tháng/năm sau.
    const startStamp = day + start * 60_000;
    const endStamp = startStamp + Math.round(duration) * 60_000;

    events.push([
      "BEGIN:VEVENT",
      `UID:${escapeIcsText(`exam-${item.id}`)}@campusassistant.local`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;TZID=${VN_TIMEZONE}:${formatLocal(startStamp)}`,
      `DTEND;TZID=${VN_TIMEZONE}:${formatLocal(endStamp)}`,
      `SUMMARY:${escapeIcsText(`⚠️ [Lịch thi] ${item.subjectName}`)}`,
      `LOCATION:${escapeIcsText(item.room)}`,
      `DESCRIPTION:${escapeIcsText(`Hình thức thi: ${item.format}\nThời lượng: ${duration} phút\nPhòng: ${item.room}`)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ]);
  }

  if (errors.length) return { ok: false, errors };
  const schoolName = options.schoolName ?? "Campus Assistant Local";
  return {
    ok: true,
    content: serialize([...calendarHeader("Exam Calendar", `Lịch thi - ${schoolName}`), ...events.flat(), "END:VCALENDAR"]),
  };
}

/**
 * Kích hoạt tải tệp .ics trên trình duyệt
 */
export function downloadIcsFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
