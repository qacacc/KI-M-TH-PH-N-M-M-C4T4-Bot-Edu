import { describe, it, expect } from "vitest";
import { generateScheduleIcs, generateExamIcs } from "./calendarExporter";
import type { ScheduleRecord, ExamRecord } from "../types";

describe("iCalendar (.ics) RFC 5545 Compliance & Export Test Suite", () => {
  const sampleSchedules: ScheduleRecord[] = [
    {
      id: "sch-101",
      subjectId: "web-dev",
      subjectName: "Lập trình Web Nâng cao, Chuyên đề 1",
      semester: 1,
      weekday: 2, // Thứ hai
      startTime: "07:30",
      endTime: "10:00",
      room: "Phòng A2-301; Khu A",
      lecturer: "TS. Nguyễn Văn A",
      note: "Thực hành phòng máy",
    },
  ];

  const sampleExams: ExamRecord[] = [
    {
      id: "ex-101",
      subjectId: "web-dev",
      subjectName: "Lập trình Web Nâng cao",
      semester: 1,
      examDate: "2026-08-15",
      startTime: "08:00",
      durationMinutes: 90,
      room: "Hội trường H2",
      format: "Trắc nghiệm máy tính",
      note: "Nộp bài trực tuyến",
    },
  ];

  it("xuất tệp iCalendar cho Lịch học đúng định dạng VCALENDAR & VEVENT kèm escape ký tự RFC 5545", () => {
    const ics = generateScheduleIcs(sampleSchedules, "Trường Đại học GTVT TP.HCM");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//Campus Assistant Local//Student Calendar//VI");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:[Lịch học] Lập trình Web Nâng cao\\, Chuyên đề 1");
    expect(ics).toContain("LOCATION:Phòng A2-301\\; Khu A");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;COUNT=15");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("xuất tệp iCalendar cho Lịch thi đúng định dạng ca thi và thời lượng", () => {
    const ics = generateExamIcs(sampleExams, "Trường Đại học GTVT TP.HCM");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:⚠️ [Lịch thi] Lập trình Web Nâng cao");
    expect(ics).toContain("LOCATION:Hội trường H2");
    expect(ics).toContain("DTSTART:20260815T080000Z");
    expect(ics).toContain("DTEND:20260815T093000Z"); // 8:00 + 90 phút = 9:30
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });
});
