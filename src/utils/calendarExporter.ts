import type { ExamRecord, ScheduleRecord } from "../types";
import type { CanonicalExamEntry, CanonicalScheduleEntry } from "../tauriApi";

/**
 * Thêm 0 đằng trước số nếu nhỏ hơn 10
 */
function pad2(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Escape các ký tự đặc biệt cho định dạng RFC 5545
 */
function escapeIcsText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Format Date object thành YYYYMMDDTHHMMSSZ cho file .ics
 */
function formatIcsDateTime(date: Date): string {
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

/**
 * Format YYYY-MM-DD và HH:mm thành Date UTC
 */
function parseDateTimeUtc(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
}

/**
 * Lấy ngày Thứ Hai đầu tiên trong tuần hiện tại
 */
function getMondayOfCurrentWeek(): Date {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh khi Chủ nhật
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Chuyển đổi danh sách Lịch học thành nội dung file iCalendar (.ics)
 */
export function generateScheduleIcs(
  schedules: Array<ScheduleRecord | CanonicalScheduleEntry>,
  schoolName = "Campus Assistant Local"
): string {
  const now = formatIcsDateTime(new Date());
  const monday = getMondayOfCurrentWeek();

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Campus Assistant Local//Student Calendar//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Lịch học - ${escapeIcsText(schoolName)}`,
    "X-WR-TIMEZONE:Asia/Ho_Chi_Minh",
  ].join("\r\n");

  for (const item of schedules) {
    const subjectName = item.subjectName;
    const weekday = item.weekday;
    const startTime = item.startTime;
    const endTime = item.endTime;
    const room = item.room;
    const lecturer = item.lecturer;
    const id = item.id;

    // Tính ngày học đầu tiên dựa trên weekday (2 = Thứ 2, 7 = Thứ 7, 8 = Chủ Nhật)
    const dayOffset = weekday >= 2 && weekday <= 7 ? weekday - 2 : 6;
    const eventDate = new Date(monday);
    eventDate.setDate(monday.getDate() + dayOffset);

    const dateStr = `${eventDate.getFullYear()}-${pad2(eventDate.getMonth() + 1)}-${pad2(eventDate.getDate())}`;
    const dtStart = formatIcsDateTime(parseDateTimeUtc(dateStr, startTime));
    const dtEnd = formatIcsDateTime(parseDateTimeUtc(dateStr, endTime));

    ics += "\r\n" + [
      "BEGIN:VEVENT",
      `UID:sch-${id}@campusassistant.local`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `RRULE:FREQ=WEEKLY;COUNT=15`, // Lặp lại 15 tuần học
      `SUMMARY:[Lịch học] ${escapeIcsText(subjectName)}`,
      `LOCATION:${escapeIcsText(room)}`,
      `DESCRIPTION:Giảng viên: ${escapeIcsText(lecturer)}\\nThời gian: ${startTime} - ${endTime}\\nPhòng: ${escapeIcsText(room)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ].join("\r\n");
  }

  ics += "\r\nEND:VCALENDAR";
  return ics;
}

/**
 * Chuyển đổi danh sách Lịch thi thành nội dung file iCalendar (.ics)
 */
export function generateExamIcs(
  exams: Array<ExamRecord | CanonicalExamEntry>,
  schoolName = "Campus Assistant Local"
): string {
  const now = formatIcsDateTime(new Date());

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Campus Assistant Local//Exam Calendar//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Lịch thi - ${escapeIcsText(schoolName)}`,
    "X-WR-TIMEZONE:Asia/Ho_Chi_Minh",
  ].join("\r\n");

  for (const item of exams) {
    const subjectName = item.subjectName;
    const examDate = item.examDate;
    const startTime = item.startTime;
    const duration = item.durationMinutes;
    const room = item.room;
    const format = item.format;
    const id = item.id;

    // Tính thời gian kết thúc dựa trên durationMinutes
    const dtStartObj = parseDateTimeUtc(examDate, startTime);
    const dtEndObj = new Date(dtStartObj.getTime() + duration * 60 * 1000);

    const dtStart = formatIcsDateTime(dtStartObj);
    const dtEnd = formatIcsDateTime(dtEndObj);

    ics += "\r\n" + [
      "BEGIN:VEVENT",
      `UID:exam-${id}@campusassistant.local`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:⚠️ [Lịch thi] ${escapeIcsText(subjectName)}`,
      `LOCATION:${escapeIcsText(room)}`,
      `DESCRIPTION:Hình thức thi: ${escapeIcsText(format)}\\nThời lượng: ${duration} phút\\nPhòng: ${escapeIcsText(room)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    ].join("\r\n");
  }

  ics += "\r\nEND:VCALENDAR";
  return ics;
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
