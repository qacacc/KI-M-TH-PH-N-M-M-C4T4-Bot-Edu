import { describe, expect, it } from "vitest";
import { parseGpaSubjects } from "./gpaData";
describe("điểm nhập tay", () => {
  it("chưa lưu dữ liệu thì bảng điểm trống", () => expect(parseGpaSubjects(null)).toEqual([]));
  it("giữ nguyên điểm user nhập", () => {
    const subjects = [{ id: "user", name: "Môn tự nhập", credits: 2, letterGrade: "B", score10: 7.1 }];
    expect(parseGpaSubjects(JSON.stringify(subjects))).toEqual(subjects);
  });
  it("không chấp nhận dữ liệu lỗi hoặc ngoài thang điểm", () => {
    expect(() => parseGpaSubjects("{bad}")).toThrow();
    expect(() => parseGpaSubjects("{}" )).toThrow();
    expect(() => parseGpaSubjects(JSON.stringify([{ id: "user", name: "Môn", credits: -1, letterGrade: "A", score10: 20 }]))).toThrow();
  });
});
