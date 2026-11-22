# Báo cáo Nghiệm thu Release Audit & Kiểm thử Local REST API (Task CA-084)

* **Dự án:** Campus Assistant Local (`127.0.0.1:47821`)
* **Nhánh thực hiện:** `feat/tram/ca-084-release-audit-postman`
* **Ngày thực hiện:** 22/11/2026
* **Công cụ kiểm thử:** Postman Collection Runner (`Campus_Assistant_Local_REST_API.postman_collection.json`), Cargo Test (Rust), Vitest (TypeScript)

---

## 1. Hạng mục Release Audit & Bảo mật

| Hạng mục kiểm tra | Tiêu chí nghiệm thu | Kết quả thực tế | Trạng thái |
|---|---|---|---|
| **Loopback Binding** | REST API cục bộ chỉ lắng nghe trên địa chỉ loopback `127.0.0.1:47821`, không mở cổng ra mạng ngoài (`0.0.0.0`). | `GET /api/v1/health` xác nhận `address: "127.0.0.1:47821"`, `transport: "loopback"`. | **PASS** |
| **Bearer Token Authentication** | Bắt buộc xác thực `Authorization: Bearer <token>` khi cấu hình `CAMPUS_ASSISTANT_LOCAL_API_TOKEN`; so sánh constant-time; từ chối `401` kèm `WWW-Authenticate: Bearer` khi thiếu/sai token. | Request thiếu token trả về `401 Unauthorized`, header `WWW-Authenticate: Bearer`, mã lỗi `UNAUTHORIZED`. | **PASS** |
| **No Fake / Unverified Data** | Không trả về hồ sơ sinh viên, lịch học, lịch thi hay trạng thái đồng bộ giả khi chưa xác minh contract UTH. | `/profile` trả về `404 PROFILE_NOT_CONNECTED`; `/schedule` & `/exams` trả về `400/503`; `POST /sync` trả về `503 SYNC_NOT_READY`; `/announcements` & `/documents` ghi rõ `source: "sample-local"`. | **PASS** |
| **Zero Secret / PII in Git** | Không lưu cứng `API_TOKEN`, thông tin đăng nhập hoặc dữ liệu cá nhân thật trong collection/environment hay báo cáo commit lên GitHub. | Collection dùng biến môi trường `{{BASE_URL}}`, `{{API_TOKEN}}`, `{{STUDENT_CODE}}` để trống giá trị mặc định. | **PASS** |

---

## 2. Kết quả Kiểm thử API bằng Postman Collection Runner

* **Thời gian chạy:** 22/11/2026 14:53:40
* **Tổng số request:** 10 requests (1 iteration)
* **Tổng số assertions:** **24/24 Passed** (`0 Failed`, `0 Errors`)
* **Thời gian thực thi:** `1s 300ms` (Trung bình `2 ms`/request)

| STT | Tên Request trong Collection | Method & Endpoint | HTTP Status | Số Assertions | Kết quả |
|---:|---|---|---:|---:|---|
| 1 | Health | `GET /api/v1/health` | `200 OK` | 3/3 | **PASS** |
| 2 | Auth - missing token | `GET /api/v1/health` *(noauth)* | `401 Unauthorized` | 3/3 | **PASS** |
| 3 | Profile - not connected | `GET /api/v1/profile` | `404 Not Found` | 2/2 | **PASS** |
| 4 | Announcements - local source | `GET /api/v1/announcements` | `200 OK` | 3/3 | **PASS** |
| 5 | Documents - valid empty result | `GET /api/v1/documents?subjectId=unknown-subject&semester=1` | `200 OK` | 3/3 | **PASS** |
| 6 | Documents - validation error | `GET /api/v1/documents` | `400 Bad Request` | 2/2 | **PASS** |
| 7 | Schedule - requires verified cache | `GET /api/v1/schedule?studentCode=` | `400 Bad Request` | 2/2 | **PASS** |
| 8 | Exams - requires verified cache | `GET /api/v1/exams?studentCode=` | `400 Bad Request` | 2/2 | **PASS** |
| 9 | Sync - blocked until UTH contract is verified | `POST /api/v1/sync` | `503 Service Unavailable` | 2/2 | **PASS** |
| 10 | Sync status - requires account | `GET /api/v1/sync/status` | `400 Bad Request` | 2/2 | **PASS** |

---

## 3. Kết quả Kiểm thử Tự động (Backend & Release Checklist)

* **Rust Backend Unit Tests (`cargo test --manifest-path src-tauri/Cargo.toml`):**
  * **61 passed**, `0 failed` (`0.36s`), bao phủ `constant_time_comparison`, `bearer_token_yeu_cau_header_dung_va_so_sanh_constant_time`, `unauthorized_response_co_header_challenge_va_envelope`, `health_endpoint_tra_thong_tin_loopback`, `sync_endpoint_khong_gia_danh_thanh_cong`.
* **Frontend Release Checklist (`npx vitest run src/releaseChecklist.test.ts`):**
  * **2 passed**, `0 failed`, xác nhận trạng thái `local-only` không báo lỗi giả và phản ánh đúng trạng thái `Version` / `Health report`.