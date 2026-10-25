import type { PublicSearchResponse } from "./types";

export const PUBLIC_SEARCH_OFFLINE_MESSAGE = "Mất kết nối tới nguồn tài liệu";

// CA-093.01: trạng thái cần nút "Thử lại" (lỗi toàn bộ hoặc chỉ đọc được một phần)
export function shouldOfferPublicSearchRetry(response: PublicSearchResponse) {
  return response.status === "error" || response.status === "partial";
}

function failedSourceLines(response: PublicSearchResponse) {
  if (response.failedUrls.length === 0) return [];
  return ["Nguồn không tải được (giữ nguyên URL gốc để truy vết):", ...response.failedUrls.map((url) => `- ${url}`)];
}

function resultLines(response: PublicSearchResponse) {
  return response.results.slice(0, 4).flatMap((result, index) => [
    `${index + 1}. ${result.title}`,
    result.snippet,
    `Nguồn: ${result.sourceUrl}`,
    "",
  ]);
}

export function formatPublicSearchResponse(response: PublicSearchResponse) {
  switch (response.status) {
    case "error":
      // DATA-001: lỗi fetch/timeout không được hiển thị như "không tìm thấy"
      return [
        `${PUBLIC_SEARCH_OFFLINE_MESSAGE} của ${response.schoolName}.`,
        response.timedOut
          ? "Đã hết thời gian chờ trước khi đọc được trang công khai nào."
          : "Không đọc được trang công khai nào sau khi đã thử lại.",
        "",
        ...failedSourceLines(response),
        "",
        "Kiểm tra kết nối mạng rồi bấm Thử lại.",
      ].join("\n").trim();
    case "partial":
      return [
        `Chỉ đọc được một phần nguồn công khai của ${response.schoolName}${response.timedOut ? " (đã hết thời gian chờ)" : ""}.`,
        response.results.length
          ? `Tìm thấy ${response.results.length} kết quả trong các nguồn đọc được:`
          : "Các nguồn đọc được chưa có nội dung khớp; kết quả có thể chưa đầy đủ.",
        "",
        ...resultLines(response),
        ...failedSourceLines(response),
        "",
        "Kết quả này lấy từ trang công khai, không dùng dữ liệu đăng nhập cá nhân.",
      ].join("\n").trim();
    case "no_match":
      return [
        response.message,
        "",
        "Nguồn đã kiểm tra:",
        ...response.searchedUrls.map((url) => `- ${url}`),
        "",
        "Bot không tự suy luận ngày nhập học nếu trang công khai không có dữ liệu khớp.",
      ].join("\n");
    default:
      return [
        response.message,
        "",
        ...resultLines(response),
        "Kết quả này lấy từ trang công khai, không dùng dữ liệu đăng nhập cá nhân.",
      ].join("\n").trim();
  }
}
