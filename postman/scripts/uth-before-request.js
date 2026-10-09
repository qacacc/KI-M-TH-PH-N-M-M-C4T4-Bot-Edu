// Chỉ kiểm thử tài khoản được chủ sở hữu cho phép; không tự thu token/cookie.
try {
  const stop = (message) => { throw new Error(message); };
  if (pm.environment.get("LIVE_REQUESTS_ENABLED") !== "true" ||
      pm.environment.get("ACCOUNT_CONSENT") !== "true") {
    stop("Chưa bật kiểm thử live và xác nhận quyền sử dụng tài khoản.");
  }
  const base = pm.variables.get("BASE_URL");
  if (base !== "https://portal.ut.edu.vn") stop("BASE_URL không thuộc host UTH được cho phép.");
  if (pm.request.method !== "GET") stop("Collection chỉ cho phép request đọc GET.");
  const url = pm.variables.replaceIn(pm.request.url.toString());
  const routes = {
    "https://portal.ut.edu.vn/api/v1/user/getSummaryProfile": "PROFILE",
    "https://portal.ut.edu.vn/api/v1/lichthi/all": "EXAMS",
  };
  let domain = routes[url];
  if (url.startsWith(base + "/api/v1/lichhoc/thang?date=")) {
    const date = pm.variables.get("SCHEDULE_DATE");
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) stop("Nhập SCHEDULE_DATE dạng YYYY-MM-DD.");
    const parsed = new Date(date + "T00:00:00Z");
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ||
        url !== base + "/api/v1/lichhoc/thang?date=" + date) stop("Ngày hoặc query lịch học không hợp lệ.");
    domain = "SCHEDULE";
  }
  if (!domain) stop("Endpoint/query chưa thuộc collection kiểm thử.");
  if (pm.environment.get(domain + "_REQUEST_REVIEWED") !== "true") {
    stop("Phải đối chiếu method/URL/auth với request portal thật trước khi gửi miền này.");
  }
  if (!pm.vault || typeof pm.vault.get !== "function") stop("Cần Postman Desktop hỗ trợ Local Vault.");
  const token = await pm.vault.get("uth-portal-token");
  if (typeof token !== "string" || !token.trim() || /[\r\n]/.test(token)) stop("Local Vault chưa có token hợp lệ.");
  // Header dùng tham chiếu vault, không ghi token vào environment/collection/log.
  if (pm.request.headers.get("Authorization") !== "Bearer {{vault:uth-portal-token}}") {
    stop("Authorization phải dùng tham chiếu Local Vault.");
  }
} catch {
  pm.execution.skipRequest();
  throw new Error("Request đã chặn. Kiểm tra consent, host, ngày, request đã đối chiếu và quyền Local Vault theo README; không ghi secret vào biến thường.");
}
