// Đây là kiểm tra transport/JSON, không chứng nhận schema nghiệp vụ trường.
const code = pm.response.code;
const contentType = pm.response.headers.get("Content-Type") || "";
const body = pm.response.text();
const isHtml = /text\/html/i.test(contentType) || /^\s*(?:<!doctype\s+html|<html\b)/i.test(body);
let parsed;
let jsonValid = false;
try { parsed = pm.response.json(); jsonValid = true; } catch { /* JSON lỗi phải fail test. */ }

pm.test("Không redirect sang đăng nhập", () => pm.expect(code >= 300 && code < 400).to.equal(false));
pm.test("Không unauthorized/forbidden", () => pm.expect(code === 401 || code === 403).to.equal(false));
pm.test("HTTP 200 cho probe JSON", () => pm.expect(code).to.equal(200));
pm.test("Content-Type JSON", () => pm.expect(/^application\/(?:[\w.-]+\+)?json\b/i.test(contentType)).to.equal(true));
pm.test("Không nhầm HTML login thành dữ liệu", () => pm.expect(isHtml).to.equal(false));
pm.test("Body là JSON object/array, không phải null/scalar", () => {
  pm.expect(jsonValid && parsed !== null && typeof parsed === "object").to.equal(true);
});
// Không lưu response, PII hoặc cookie vào biến và không gọi API phụ.
// HTTP 200 có business error hoặc [] chỉ phân loại được sau khi xác minh contract.
