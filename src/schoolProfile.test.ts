import { describe, expect, it } from "vitest";
import {
  createDefaultSchoolProfile,
  getSchoolProfileInitials,
  getSchoolProfileSubtitle,
  getSchoolProfileTitle,
} from "./schoolProfile";

describe("school profile footer helpers", () => {
  it("hiển thị mặc định gọn khi chưa có tên người dùng", () => {
    const profile = createDefaultSchoolProfile();
    expect(getSchoolProfileTitle(profile)).toBe("Sinh viên");
    expect(getSchoolProfileInitials(profile)).toBe("UT");
    expect(getSchoolProfileSubtitle(profile)).toBe("UTH · Public");
  });

  it("ưu tiên tên hiển thị đã lưu cho footer", () => {
    const profile = {
      ...createDefaultSchoolProfile(),
      displayName: "Nguyễn An",
      mode: "student" as const,
    };
    expect(getSchoolProfileTitle(profile)).toBe("Nguyễn An");
    expect(getSchoolProfileInitials(profile)).toBe("NA");
    expect(getSchoolProfileSubtitle(profile)).toBe("UTH · Sinh viên");
  });
});
