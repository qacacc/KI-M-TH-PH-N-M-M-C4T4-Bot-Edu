import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const app = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
const layout = styles.slice(styles.lastIndexOf("/* Lối tắt có chiều cao"));

describe("Bố cục lối tắt và tìm nhanh", () => {
  it("chỉ hai lối tắt đầu là ô nổi bật", () => {
    expect([...app.matchAll(/className="starter-featured"/g)]).toHaveLength(2);
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
