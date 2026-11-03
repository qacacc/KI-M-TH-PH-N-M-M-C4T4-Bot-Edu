import { describe, it, expect } from "vitest";
import { generateScheduleIcs, generateExamIcs, type IcsExportResult } from "./calendarExporter";
import type { ScheduleRecord, ExamRecord } from "../types";

// ---------------------------------------------------------------------------
// Parser iCalendar độc lập dùng riêng cho test (không dùng lại thuật toán exporter):
// unfold dòng, tách property/param/value, unescape TEXT và quy đổi giờ về instant UTC
// bằng chuỗi ISO có offset +07:00 do JS tự parse.
// ---------------------------------------------------------------------------
type IcsProp = { name: string; params: Record<string, string>; value: string };
type IcsComponent = { type: string; props: IcsProp[]; children: IcsComponent[] };

function unfold(content: string): string[] {
  return content.replace(/\r\n[ \t]/g, "").split("\r\n").filter((line) => line.length > 0);
}

function parseLine(line: string): IcsProp {
  const colon = line.indexOf(":");
  const head = line.slice(0, colon).split(";");
  const params: Record<string, string> = {};
  for (const part of head.slice(1)) {
    const [key, val] = part.split("=");
    params[key] = val;
  }
  return { name: head[0], params, value: line.slice(colon + 1) };
}

function parseIcs(content: string): IcsComponent {
  const root: IcsComponent = { type: "ROOT", props: [], children: [] };
  const stack: IcsComponent[] = [root];
  for (const line of unfold(content)) {
    const prop = parseLine(line);
    if (prop.name === "BEGIN") {
      const comp: IcsComponent = { type: prop.value, props: [], children: [] };
      stack[stack.length - 1].children.push(comp);
      stack.push(comp);
    } else if (prop.name === "END") {
      const top = stack.pop();
      if (!top || top.type !== prop.value) throw new Error(`END lệch: ${prop.value}`);
    } else {
      stack[stack.length - 1].props.push(prop);
    }
  }
  if (stack.length !== 1) throw new Error("Thiếu END");
  return root.children[0];
}

function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_m, ch: string) => (ch === "n" || ch === "N" ? "\n" : ch));
}

function prop(comp: IcsComponent, name: string): IcsProp {
  const found = comp.props.find((p) => p.name === name);
  if (!found) throw new Error(`Thiếu ${name}`);
  return found;
}

function events(cal: IcsComponent): IcsComponent[] {
  return cal.children.filter((c) => c.type === "VEVENT");
}

/** Quy đổi DTSTART/DTEND về instant ISO UTC theo TZID, độc lập với exporter. */
function toUtcIso(p: IcsProp): string {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(p.value);
  if (!m) throw new Error(`Giờ sai định dạng: ${p.value}`);
  const [, y, mo, d, h, mi, s, z] = m;
  if (z) return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`).toISOString();
  if (p.params.TZID !== "Asia/Ho_Chi_Minh") throw new Error("Giờ floating không có TZID Việt Nam");
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}+07:00`).toISOString();
}

function expectOk(result: IcsExportResult): string {
  if (!result.ok) throw new Error(`Không xuất được: ${result.errors.join(" | ")}`);
  return result.content;
}

const NOW = new Date("2026-10-18T03:04:05Z");

function schedule(overrides: Partial<ScheduleRecord> = {}): ScheduleRecord {
  return {
    id: "sch-101",
    subjectId: "web-dev",
    subjectName: "Lập trình Web",
    semester: 1,
    weekday: 2,
    startTime: "08:00",
    endTime: "10:00",
    room: "A2-301",
    lecturer: "TS. Nguyễn Văn A",
    note: "",
    ...overrides,
  };
}

function exam(overrides: Partial<ExamRecord> = {}): ExamRecord {
  return {
    id: "ex-101",
    subjectId: "web-dev",
    subjectName: "Lập trình Web",
    semester: 1,
    examDate: "2026-08-15",
    startTime: "08:00",
    durationMinutes: 90,
    room: "Hội trường H2",
    format: "Trắc nghiệm",
    note: "",
    ...overrides,
  };
}

describe("Xuất lịch thi (.ics)", () => {
  it("08:00 giờ Việt Nam được ghi theo TZID và tương đương 01:00Z", () => {
    const cal = parseIcs(expectOk(generateExamIcs([exam()], { now: NOW })));
    const [ev] = events(cal);
    expect(prop(ev, "DTSTART").params.TZID).toBe("Asia/Ho_Chi_Minh");
    expect(prop(ev, "DTSTART").value).toBe("20260815T080000");
    expect(toUtcIso(prop(ev, "DTSTART"))).toBe("2026-08-15T01:00:00.000Z");
    expect(toUtcIso(prop(ev, "DTEND"))).toBe("2026-08-15T02:30:00.000Z");
  });

  it("khai báo VTIMEZONE Asia/Ho_Chi_Minh +0700 để Outlook/Google hiểu TZID", () => {
    const cal = parseIcs(expectOk(generateExamIcs([exam()], { now: NOW })));
    const tz = cal.children.find((c) => c.type === "VTIMEZONE");
    expect(tz).toBeDefined();
    expect(prop(tz!, "TZID").value).toBe("Asia/Ho_Chi_Minh");
    const std = tz!.children.find((c) => c.type === "STANDARD")!;
    expect(prop(std, "TZOFFSETFROM").value).toBe("+0700");
    expect(prop(std, "TZOFFSETTO").value).toBe("+0700");
  });

  it("ca thi kéo qua nửa đêm cuối tháng chuyển sang ngày đầu tháng sau", () => {
    const cal = parseIcs(expectOk(generateExamIcs([exam({ examDate: "2026-02-28", startTime: "23:00", durationMinutes: 120 })], { now: NOW })));
    expect(prop(events(cal)[0], "DTEND").value).toBe("20260301T010000");
  });

  it("ca thi kéo qua năm mới: 31/12 23:30 + 60 phút = 01/01 năm sau 00:30", () => {
    const cal = parseIcs(expectOk(generateExamIcs([exam({ examDate: "2026-12-31", startTime: "23:30", durationMinutes: 60 })], { now: NOW })));
    const ev = events(cal)[0];
    expect(prop(ev, "DTSTART").value).toBe("20261231T233000");
    expect(prop(ev, "DTEND").value).toBe("20270101T003000");
    expect(toUtcIso(prop(ev, "DTEND"))).toBe("2026-12-31T17:30:00.000Z");
  });

  it("escape ký tự đặc biệt , ; \\ và xuống dòng, parser đọc lại đúng nguyên văn", () => {
    const name = "Toán, Lý; C:\\path\nDòng 2";
    const cal = parseIcs(expectOk(generateExamIcs([exam({ subjectName: name, room: "P.1; Khu A, tầng 2" })], { now: NOW })));
    const ev = events(cal)[0];
    expect(unescapeText(prop(ev, "SUMMARY").value)).toBe(`⚠️ [Lịch thi] ${name}`);
    expect(unescapeText(prop(ev, "LOCATION").value)).toBe("P.1; Khu A, tầng 2");
  });

  it("mọi dòng kết thúc CRLF và không dòng vật lý nào vượt 75 octet UTF-8 (folding tiếng Việt)", () => {
    const longName = "Phương pháp nghiên cứu khoa học trong kỹ thuật giao thông vận tải đường thủy nội địa ".repeat(3);
    const content = expectOk(generateExamIcs([exam({ subjectName: longName })], { now: NOW }));
    expect(content.endsWith("\r\n")).toBe(true);
    expect(/(^|[^\r])\n/.test(content)).toBe(false);
    const encoder = new TextEncoder();
    for (const line of content.split("\r\n")) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    // Folding không được cắt đôi ký tự nhiều byte: nối lại phải ra đúng tên gốc.
    const ev = events(parseIcs(content))[0];
    expect(unescapeText(prop(ev, "SUMMARY").value)).toBe(`⚠️ [Lịch thi] ${longName}`);
  });

  it("UID ổn định giữa các lần xuất và DTSTAMP là UTC", () => {
    const a = events(parseIcs(expectOk(generateExamIcs([exam()], { now: NOW }))))[0];
    const b = events(parseIcs(expectOk(generateExamIcs([exam()], { now: new Date() }))))[0];
    expect(prop(a, "UID").value).toBe(prop(b, "UID").value);
    expect(prop(a, "DTSTAMP").value).toBe("20261018T030405Z");
  });

  it.each([
    ["thiếu ngày", { examDate: "" }],
    ["ngày không tồn tại", { examDate: "2026-02-30" }],
    ["giờ sai", { startTime: "25:00" }],
    ["thiếu giờ", { startTime: "" }],
    ["thời lượng 0", { durationMinutes: 0 }],
    ["thời lượng không phải số", { durationMinutes: Number.NaN }],
  ])("báo 'Chưa thể xuất file' khi %s", (_label, overrides) => {
    const result = generateExamIcs([exam(), exam({ id: "ex-bad", subjectName: "Môn lỗi", ...overrides })], { now: NOW });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join("\n")).toContain("Môn lỗi");
  });

  it("danh sách rỗng không tạo file", () => {
    expect(generateExamIcs([], { now: NOW }).ok).toBe(false);
  });
});

describe("Xuất lịch học (.ics) theo khoảng học kỳ người dùng nhập", () => {
  const range = { startDate: "2026-09-02", endDate: "2026-12-20" }; // 02/09/2026 là Thứ Tư

  it("buổi đầu tiên là ngày đúng thứ đầu tiên kể từ ngày bắt đầu, giờ theo TZID", () => {
    const cal = parseIcs(expectOk(generateScheduleIcs([schedule({ weekday: 2 })], range, { now: NOW })));
    const ev = events(cal)[0];
    expect(prop(ev, "DTSTART").value).toBe("20260907T080000"); // Thứ Hai đầu tiên
    expect(toUtcIso(prop(ev, "DTSTART"))).toBe("2026-09-07T01:00:00.000Z");
    expect(new Date(toUtcIso(prop(ev, "DTSTART"))).getUTCDay()).toBe(1);
  });

  it("Thứ Tư trùng ngày bắt đầu và Chủ nhật (weekday=8) được tính đúng", () => {
    const cal = parseIcs(expectOk(generateScheduleIcs([schedule({ id: "a", weekday: 4 }), schedule({ id: "b", weekday: 8 })], range, { now: NOW })));
    const [wed, sun] = events(cal);
    expect(prop(wed, "DTSTART").value).toBe("20260902T080000");
    expect(prop(sun, "DTSTART").value).toBe("20260906T080000");
  });

  it("lặp hằng tuần đến hết ngày kết thúc (UNTIL UTC), không còn COUNT=15", () => {
    const content = expectOk(generateScheduleIcs([schedule()], range, { now: NOW }));
    expect(content).not.toContain("COUNT=");
    const rrule = prop(events(parseIcs(content))[0], "RRULE").value;
    // 20/12/2026 23:59:59 giờ Việt Nam = 16:59:59Z
    expect(rrule).toBe("FREQ=WEEKLY;UNTIL=20261220T165959Z");
  });

  it("học kỳ qua năm mới: ngày bắt đầu cuối tháng 12, buổi đầu rơi vào tháng 1 năm sau", () => {
    const cal = parseIcs(expectOk(generateScheduleIcs([schedule({ weekday: 2 })], { startDate: "2026-12-29", endDate: "2027-05-30" }, { now: NOW })));
    const ev = events(cal)[0];
    expect(prop(ev, "DTSTART").value).toBe("20270104T080000");
    expect(prop(ev, "RRULE").value).toBe("FREQ=WEEKLY;UNTIL=20270530T165959Z");
  });

  it("không đổi kết quả theo ngày hiện tại của máy (không dùng tuần hiện tại)", () => {
    const a = expectOk(generateScheduleIcs([schedule()], range, { now: NOW }));
    const b = expectOk(generateScheduleIcs([schedule()], range, { now: new Date("2030-01-01T00:00:00Z") }));
    const start = (c: string) => prop(events(parseIcs(c))[0], "DTSTART").value;
    expect(start(a)).toBe(start(b));
  });

  it.each([
    ["chưa nhập khoảng ngày", null],
    ["thiếu ngày kết thúc", { startDate: "2026-09-02", endDate: "" }],
    ["ngày kết thúc trước ngày bắt đầu", { startDate: "2026-12-20", endDate: "2026-09-02" }],
    ["ngày không tồn tại", { startDate: "2026-02-30", endDate: "2026-06-01" }],
    ["khoảng quá dài hơn 1 năm", { startDate: "2026-09-01", endDate: "2028-09-01" }],
  ])("chặn xuất khi %s", (_label, badRange) => {
    const result = generateScheduleIcs([schedule()], badRange, { now: NOW });
    expect(result.ok).toBe(false);
  });

  it.each([
    ["thứ ngoài 2..8", { weekday: 1 }],
    ["thiếu giờ bắt đầu", { startTime: "" }],
    ["giờ kết thúc trước giờ bắt đầu", { startTime: "10:00", endTime: "08:00" }],
    ["phút sai", { endTime: "09:75" }],
  ])("chặn cả file và nêu tên môn khi %s", (_label, overrides) => {
    const result = generateScheduleIcs([schedule(), schedule({ id: "bad", subjectName: "Môn lỗi", ...overrides })], range, { now: NOW });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join("\n")).toContain("Môn lỗi");
  });

  it("chặn khi thứ học không có buổi nào trong khoảng ngày ngắn", () => {
    const result = generateScheduleIcs([schedule({ weekday: 2, subjectName: "Môn hụt" })], { startDate: "2026-09-02", endDate: "2026-09-04" }, { now: NOW });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join("\n")).toContain("Môn hụt");
  });
});
