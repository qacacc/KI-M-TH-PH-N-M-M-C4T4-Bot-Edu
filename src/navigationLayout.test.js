import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const schoolPage = readFileSync(new URL("./pages/SchoolPage.tsx", import.meta.url), "utf8");
const historyPage = readFileSync(new URL("./pages/ChatHistoryPage.tsx", import.meta.url), "utf8");
const filesPage = readFileSync(new URL("./pages/FilesPage.tsx", import.meta.url), "utf8");
const campusPages = readFileSync(new URL("./pages/CampusDataPages.tsx", import.meta.url), "utf8");
const layout = styles.slice(styles.lastIndexOf("/* Lối tắt có chiều cao"));
const starterStart = app.indexOf('<div className="starter-grid">');
const starter = app.slice(starterStart, app.indexOf("</div>", starterStart));

describe("Bố cục lối tắt và tìm nhanh", () => {
  it("chỉ hai lối tắt đầu là ô nổi bật", () => {
    expect([...app.matchAll(/className="starter-featured"/g)]).toHaveLength(2);
  });

  it("chỉ hiển thị tám lối tắt đúng thứ tự của màn chat", () => {
    expect([...starter.matchAll(/<button\b/g)]).toHaveLength(8);
    expect([...starter.matchAll(/<strong>([^<]+)<\/strong>/g)].map((match) => match[1])).toEqual([
      "Tìm tài liệu", "Lịch học", "Tài liệu", "Thông báo",
      "Ghi chú", "GPA / CPA", "Kiểm tra ứng dụng", "Lệnh nhanh",
    ]);
  });

  it("các lối tắt điều hướng đến trang hiện có", () => {
    for (const route of ["schedule", "files", "announcements", "notes", "gpa", "health"]) {
      expect(starter).toContain(`setView("${route}")`);
    }
    expect(app).toContain('<NotesPage />');
    expect(starter).not.toContain('setView("logs")');
    expect(starter).toContain('submitText("tìm tài liệu", "starter")');
    expect(starter).toContain('submitText("/help", "starter")');
  });

  it("ẩn riêng tin chào khi đang hiện lối tắt, không xóa khỏi state hoặc DB", () => {
    expect(app).toContain('message.id === "welcome" && messages.length === 1 && !conversation');
    expect(app).toContain("setMessages([welcomeMessage])");
  });

  it("ở cửa sổ rộng dùng bốn cột bằng nhau", () => {
    expect(layout).toMatch(/grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  });

  it("từ 601 đến 900 px chuyển thành hai cột", () => {
    expect(layout).toMatch(/@media \(max-width: 900px\)[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  });

  it("từ 600 px trở xuống chỉ còn một cột", () => {
    expect(layout).toMatch(/@media \(max-width: 600px\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  it("nhãn dài xuống dòng thay vì bị cắt bằng dấu ba chấm", () => {
    expect(layout).toMatch(/\.starter-grid strong,[\s\S]*\.command-palette-item small[\s\S]*text-overflow:\s*clip;[\s\S]*white-space:\s*normal;/);
  });

  it("các lối tắt có hàng và chiều cao tối thiểu thống nhất", () => {
    expect(layout).toMatch(/grid-auto-rows:\s*minmax\(64px,\s*auto\)/);
    expect(layout).toMatch(/\.starter-grid button\s*\{[\s\S]*min-height:\s*64px;/);
  });

  it("mọi lối tắt chỉ còn đường phân cách như quy tắc cuối của clone", () => {
    expect(layout).toMatch(/\.starter-grid button\s*\{[\s\S]*border:\s*0 !important;[\s\S]*border-bottom:\s*1px solid var\(--border\) !important;/);
    expect(layout).toMatch(/\.starter-grid button\.starter-featured\s*\{[\s\S]*border:\s*0 !important;[\s\S]*border-bottom:\s*1px solid var\(--border\) !important;/);
    expect(layout).toMatch(/\.starter-grid button\.starter-featured > svg\s*\{[\s\S]*color:\s*var\(--muted\);/);
  });

  it("icon lối tắt đồng màu, icon khu vực tài khoản không trùng GPA", () => {
    expect(layout).toMatch(/\.starter-grid button > svg\s*\{[\s\S]*color:\s*var\(--muted\);/);
    expect(app).toMatch(/view === "gpa"[^]*?<GraduationCap size=\{17\}/);
    expect(app).toMatch(/view === "school"[^]*?<Building2 size=\{17\}/);
  });

  it("chế độ tài khoản tự lưu và không yêu cầu nhập tên/MSSV thủ công", () => {
    expect(schoolPage).toContain('function handleProfileModeChange(mode: "public" | "student")');
    expect(schoolPage).toMatch(/handleProfileModeChange[\s\S]*saveSchoolProfile\(next\)/);
    expect(schoolPage).toMatch(/function updateSchool\(school: SchoolOption\)[\s\S]*saveSchoolProfile\(next\)/);
    expect(schoolPage).not.toContain("Tên sinh viên hiển thị");
    expect(schoolPage).not.toContain("Mã số sinh viên (MSSV nếu có)");
    expect(schoolPage).not.toContain("Lưu hồ sơ");
  });

  it("avatar rail căn giữa initials và tooltip không nằm trong grid avatar", () => {
    expect(app).toMatch(/className="avatar"[^]*?<span className="avatar-initials">/);
    expect(app).toMatch(/className="sidebar-tooltip">\{getSchoolProfileTitle/);
    expect(styles).toMatch(/\.avatar-initials\s*\{[\s\S]*place-items:\s*center;[\s\S]*line-height:\s*1 !important;/);
  });

  it("lịch sử hiển thị lỗi và có thao tác thử lại khi đọc hoặc ghi thất bại", () => {
    expect(historyPage).toContain('invoke<string>("get_setting_cmd"');
    expect(historyPage).toContain('invoke<ChatSession[]>("list_chat_sessions")');
    expect(historyPage).toContain('role="alert"');
    expect(historyPage).toContain('onClick={() => void loadState()}>Thử lại');
    expect(historyPage).toContain("Bật lưu lịch sử");
  });

  it("tài liệu và thông báo báo kết quả mở website, không giả vờ đã đồng bộ", () => {
    expect(filesPage).toContain("openExternalUrl(school.lmsPortalUrl)");
    expect(filesPage).toContain("Tài liệu LMS chưa được đồng bộ vào ứng dụng");
    expect(campusPages).toContain("await openExternalUrl(school.publicNewsUrl)");
    expect(campusPages).toContain("Tin chưa được đồng bộ vào ứng dụng");
  });

  it("biểu tượng và phần chữ trong bảng tìm nhanh không ép cột", () => {
    expect(layout).toMatch(/\.starter-grid button > svg\s*\{[\s\S]*flex:\s*0 0 18px;/);
    expect(layout).toMatch(/\.command-palette-item > div:last-child\s*\{[\s\S]*min-width:\s*0;/);
  });
});
