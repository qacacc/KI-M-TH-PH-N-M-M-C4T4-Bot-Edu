import { describe, it, expect } from "vitest";
import {
  PUBLIC_SEARCH_OFFLINE_MESSAGE,
  formatPublicSearchResponse,
  shouldOfferPublicSearchRetry,
} from "../src/publicSearchMessage";
import type { PublicSearchResponse } from "../src/types";

function response(overrides: Partial<PublicSearchResponse>): PublicSearchResponse {
  return {
    schoolId: "uth",
    schoolName: "Truong Dai hoc Giao thong van tai TP.HCM",
    query: "tuyen sinh",
    searchedUrls: ["https://uth.edu.vn/", "https://tuyensinh.ut.edu.vn/"],
    results: [],
    message: "Khong tim thay tu khoa \"tuyen sinh\" trong cac trang cong khai da cau hinh.",
    status: "no_match",
    failedUrls: [],
    timedOut: false,
    ...overrides,
  };
}

const RESULT = {
  title: "Tuyen sinh 2026",
  snippet: "Thi sinh sinh nam 2008 xem lich nhap hoc.",
  sourceUrl: "https://tuyensinh.ut.edu.vn/tin-tuc/tuyen-sinh-2026?id=7",
};

describe("Public search - CA-093.01 - Error != Empty", () => {
  it("lỗi mạng hiển thị mất kết nối, không hiển thị không tìm thấy, có Thử lại", () => {
    const res = response({
      status: "error",
      message: "Mat ket noi toi nguon tai lieu cong khai.",
      failedUrls: ["https://uth.edu.vn/", "https://tuyensinh.ut.edu.vn/"],
    });
    const text = formatPublicSearchResponse(res);

    expect(text).toContain(PUBLIC_SEARCH_OFFLINE_MESSAGE);
    expect(text).not.toMatch(/không tìm thấy|khong tim thay/i);
    expect(text).toContain("- https://uth.edu.vn/");
    expect(shouldOfferPublicSearchRetry(res)).toBe(true);
  });

  it("hết hạn chót tổng báo hết thời gian chờ thay vì danh sách rỗng", () => {
    const text = formatPublicSearchResponse(response({ status: "error", timedOut: true }));

    expect(text).toContain(PUBLIC_SEARCH_OFFLINE_MESSAGE);
    expect(text).toContain("hết thời gian chờ");
    expect(text).not.toMatch(/không tìm thấy|khong tim thay/i);
  });

  it("partial giữ kết quả và liệt kê nguồn lỗi với URL gốc", () => {
    const res = response({
      status: "partial",
      results: [RESULT],
      failedUrls: ["https://uth.edu.vn/"],
    });
    const text = formatPublicSearchResponse(res);

    expect(text).toContain("Chỉ đọc được một phần");
    expect(text).toContain(`Nguồn: ${RESULT.sourceUrl}`);
    expect(text).toContain("- https://uth.edu.vn/");
    expect(shouldOfferPublicSearchRetry(res)).toBe(true);
  });

  it("no_match chỉ khi mọi nguồn đọc được, không có nút Thử lại", () => {
    const res = response({});
    const text = formatPublicSearchResponse(res);

    expect(text).toContain("Khong tim thay");
    expect(text).not.toContain(PUBLIC_SEARCH_OFFLINE_MESSAGE);
    expect(shouldOfferPublicSearchRetry(res)).toBe(false);
  });

  it("success giữ nguyên URL gốc của nguồn tài liệu", () => {
    const res = response({ status: "success", results: [RESULT], message: "Tim thay 1 ket qua." });
    const text = formatPublicSearchResponse(res);

    expect(text).toContain(`Nguồn: ${RESULT.sourceUrl}`);
    expect(shouldOfferPublicSearchRetry(res)).toBe(false);
  });
});
