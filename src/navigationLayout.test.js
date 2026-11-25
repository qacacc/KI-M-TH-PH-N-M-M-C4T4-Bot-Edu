import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
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
    expect(layout).toMatch(/\.starter-grid button\.starter-featured > svg\s*\{[\s\S]*color:\s*var\(--accent\);/);
  });

  it("biểu tượng và phần chữ trong bảng tìm nhanh không ép cột", () => {
    expect(layout).toMatch(/\.starter-grid button > svg\s*\{[\s\S]*flex:\s*0 0 18px;/);
    expect(layout).toMatch(/\.command-palette-item > div:last-child\s*\{[\s\S]*min-width:\s*0;/);
  });
});
