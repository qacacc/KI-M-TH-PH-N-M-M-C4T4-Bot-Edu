# Báo cáo Kiểm tra Release Audit & Local REST API (Task CA-084)

> **Trạng thái nghiệm thu CA-084:** **`IN PROGRESS`**. Kiểm thử tự động và build NSIS có bằng chứng riêng; chưa đủ bằng chứng đính kèm để nghiệm thu Postman HTTP live, cài/chạy native và nâng cấp dữ liệu.
> **Tuyên bố phạm vi (`DOC-001`):** `check:postman` là kiểm tra tĩnh, không gửi HTTP. Kết quả Runner/native/upgrade do tác giả báo cáo nhưng chưa có export hoặc biên bản đã khử token/PII trong PR để reviewer xác minh độc lập (`ASSUMED`). Hợp đồng đồng bộ UTH Portal vẫn `UNKNOWN` và các endpoint phụ thuộc bị khóa ở mã `503`.

- **Dự án:** Campus Assistant Local (`127.0.0.1:47821`)
- **Nhánh thực hiện:** `feat/tram/ca-084-release-audit-postman`
- **Ngày cập nhật:** 24/11/2026
- **Quy chuẩn áp dụng:** `docs/INVARIANTS.md` (`DOC-001`, `SEC-001`..`SEC-005`, `DATA-001`..`DATA-004`)

---

## 1. Tổng hợp Trạng thái Các Cổng Phát hành (Phân loại theo `DOC-001`)

| Hạng mục cổng kiểm tra | Phân loại (`DOC-001`) | Nguồn bằng chứng & Chi tiết xác minh |
|---|---|---|
| **Chuỗi kiểm tra tự động (`npm run check:all`)** | **`CONFIRMED`** *(Automated)* | Chạy trên bản sửa: frontend 116/116, layout PASS, Postman tĩnh 10/10, TypeScript/Vite build PASS, Rust 62/62, `npm audit` 0 vulnerabilities. Không suy ra HTTP live/native smoke từ kết quả này. |
| **Kiểm thử Local REST API (Postman Runner)** | **`ASSUMED`** *(chưa tái kiểm)* | Tác giả báo 10/10 requests và 24/24 assertions PASS, nhưng PR chưa đính kèm Runner export/log đã khử secret/PII. Không dùng `check:postman` thay cho kết quả HTTP. |
| **Đóng gói trình cài đặt Windows (NSIS v1.0.1)** | **`CONFIRMED`** *(build, chưa cài)* | Lệnh `npm run tauri -- build --bundles nsis` trên commit `8cdffd5` tạo gói NSIS v1.0.1; SHA-256: `16DD162AE28E567C33073D923CC5C82F09476D54C1EE6D26EEE681CE79B2B7BA`. Build không chứng minh cài đặt/chạy thật. |
| **Native Smoke Test trên bản cài đặt v1.0.1** | **`ASSUMED`** *(chưa tái kiểm)* | Tác giả báo đã chạy, nhưng PR chưa có biên bản/screenshot/log đã khử PII để reviewer xác minh. Không ghi Health 200 là kết quả kiểm thử độc lập. |
| **Kiểm thử nâng cấp / giữ dữ liệu qua bản cập nhật (Upgrade DB Check)** | **`ASSUMED`** *(chưa tái kiểm)* | Tác giả báo đã cài đè và giữ dữ liệu; PR chưa có số lượng bản ghi trước/sau, schema version, log hoặc fixture temp DB kèm bằng chứng. Không kết luận giữ 100% dữ liệu. |
| **Phê duyệt Pull Request (#27)** | **`PLANNED`** *(PENDING)* | Cần bằng chứng Runner/native/upgrade hoặc sửa các tuyên bố tương ứng thành chưa kiểm; chỉ chuyển CA-084 sang `Done` sau khi các cổng nghiệm thu thực sự đạt. |
| **Hợp đồng đồng bộ UTH Portal thực tế** | **`UNKNOWN`** / **`PLANNED`** | API contract của cổng thông tin UTH bên ngoài chưa được xác minh; các endpoint đồng bộ và dữ liệu cá nhân tiếp tục bị khóa an toàn ở mức `503`. |

---

## 2. Kiểm tra Bảo mật, Ràng buộc Loopback & Chặn Dữ liệu Giả

| Tiêu chí kiểm tra | Phân loại (`DOC-001`) | Phương pháp & Kết quả thực tế |
|---|---|---|
| **Payload `/api/v1/health`** | **`CONFIRMED`** *(Rust test/source)* | Unit test xác minh payload và mã `200`; chưa có kết quả HTTP live đính kèm PR. Hằng số `API_ADDR` không tự chứng minh socket đang mở. |
| **Socket lắng nghe thực tế cấp OS** | **`UNKNOWN`** *(cần native smoke)* | Cần lưu kết quả `Get-NetTCPConnection -LocalPort 47821 -State Listen` cùng PID sau khi khởi chạy app với token phiên cục bộ; không đưa token vào log. |
| **Bearer Token & Constant-Time Compare** | **`CONFIRMED`** *(Rust test/source)* | Unit test xác minh `401`, `WWW-Authenticate: Bearer` và so sánh constant-time; HTTP Postman live chưa có export xác minh. |
| **Cổng chặn Contract UTH (`Schedule` & `Exams`)** | **`CONFIRMED`** *(Rust test/source)* | Unit test xác minh `503 CONNECTOR_UNAVAILABLE`; request Postman dùng mã tổng hợp `TEST000001` là kịch bản chờ chạy HTTP. |
| **Hồ sơ, sync và nguồn sample-local** | **`CONFIRMED`** *(Rust test/source + static guard)* | Source/test xác minh status tương ứng; guard tĩnh xác nhận collection/environment không lưu token hoặc mã sinh viên thật. HTTP live vẫn chờ bằng chứng. |

---

## 3. Thiết kế Kịch bản Kiểm thử Hộp đen (EP, BVA và test case)

### 3.1. Bảng phân hoạch lớp tương đương (EP)

| Nhóm điều kiện kiểm thử | Lớp tương đương hợp lệ (Valid) | Lớp tương đương không hợp lệ (Invalid) |
|---|---|---|
| **Xác thực (`Authorization` Header)** | **V1:** Header `Bearer <API_TOKEN>` khớp biến môi trường phiên | **X1:** Thiếu header `Authorization` (`noauth`) hoặc sai token |
| **Tham số truy vấn (`Query Params`)** | **V2:** Truyền đủ tham số bắt buộc hợp lệ (`subjectId`, `studentCode=TEST000001`) | **X2:** Thiếu tham số bắt buộc (`subjectId` hoặc `studentCode` rỗng) |
| **Trạng thái kết nối & Contract UTH** | **V3:** Nguồn dữ liệu cục bộ sẵn sàng (`runtime`, `sample-local`) | **X3:** Chưa kết nối hồ sơ UTH hoặc chưa xác minh contract đồng bộ |

### 3.2. Giá trị biên (BVA)

| Đầu vào | min- | min | min+ | nominal | max- | max | max+ | Tag biên | Kết quả mong đợi |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Độ dài token cấu hình (ký tự ASCII) | 31 | 32 | 33 | 64 | 255 | 256 | 257 | B1–B7 | 32–256 hợp lệ; ngoài khoảng từ chối khi khởi động REST. Rust unit test đã chạy; chưa khởi động app thử từng giá trị. |
| `studentCode` trong query (ký tự; source chưa trim) | 0 | 1 | 2 | 10 | N/A | N/A | N/A | B8–B11 | Rỗng trả `400`; không rỗng đi đến cổng `503` khi contract chưa xác minh. Chuỗi chỉ chứa khoảng trắng chưa được xem là rỗng trong source hiện tại; test HTTP live còn chờ, không suy đoán giới hạn tối đa. |

### 3.3. Test case Postman (`TC01`–`TC10`)

- **Tài nguyên kiểm thử:** `postman/Campus_Assistant_Local_REST_API.postman_collection.json` (10 requests, đã chuẩn hóa bảng mã UTF-8 và đồng bộ 11 file mirror YAML) và `postman/Campus_Assistant_Local_REST_API.postman_environment.json`.
- **Trạng thái thực thi:** 10 request và 24 assertion đã được tác giả báo PASS; chưa có Runner export đã khử token/PII trong PR nên phân loại `ASSUMED`. Bảng dưới ghi kết quả **mong đợi**, không phải kết quả live đã tái kiểm. Không có phép đo hiệu năng độc lập.

| Mã TC | Tên Test Case (Request) | Method & Endpoint | HTTP mong đợi | Assertions thiết kế | Trạng thái live |
|---|---|---|---|---:|---|
| **TC01** | Health (**V1**) | `GET /api/v1/health` | `200 OK` | 3 | `ASSUMED` |
| **TC02** | Auth - missing token (**X1**) | `GET /api/v1/health` *(noauth)* | `401 Unauthorized` | 3 | `ASSUMED` |
| **TC03** | Profile - not connected (**V1, X3**) | `GET /api/v1/profile` | `404 Not Found` | 2 | `ASSUMED` |
| **TC04** | Announcements - local source (**V1, V3**) | `GET /api/v1/announcements` | `200 OK` | 3 | `ASSUMED` |
| **TC05** | Documents - valid empty result (**V1, V2**) | `GET /api/v1/documents?subjectId=unknown-subject&semester=1` | `200 OK` | 3 | `ASSUMED` |
| **TC06** | Documents - validation error (**V1, X2**) | `GET /api/v1/documents` | `400 Bad Request` | 2 | `ASSUMED` |
| **TC07** | Schedule - requires verified cache (**V1, V2, X3**) | `GET /api/v1/schedule?studentCode=TEST000001` *(prerequest)* | `503 Service Unavailable` | 2 | `ASSUMED` |
| **TC08** | Exams - requires verified cache (**V1, V2, X3**) | `GET /api/v1/exams?studentCode=TEST000001` *(prerequest)* | `503 Service Unavailable` | 2 | `ASSUMED` |
| **TC09** | Sync - blocked until UTH contract is verified (**V1, X3**) | `POST /api/v1/sync` | `503 Service Unavailable` | 2 | `ASSUMED` |
| **TC10** | Sync status - requires account (**V1, X2**) | `GET /api/v1/sync/status` | `400 Bad Request` | 2 | `ASSUMED` |

---

## 4. Bằng chứng Kiểm thử Tự động (Source, File:Line & Unit Tests — `AI-006` / `DOC-001`)

### 4.1. Đối chiếu Mã nguồn & Unit Test Bảo vệ Contract / Security (`CONFIRMED`)

| Hạng mục kiểm soát | Vị trí mã nguồn (`file:line`) | Unit Test / Script kiểm chứng | Kết quả rút gọn (`CONFIRMED`) |
|---|---|---|---|
| **Khóa endpoint `/schedule` & `/exams` khi chưa có UTH contract** | `src-tauri/src/api.rs:242-290` (`schedule`, `exams`, `connector_failure`) | `api::tests::schedule_endpoint_giu_503_khi_contract_uth_chua_xac_minh`, `api::tests::exams_endpoint_giu_503_khi_contract_uth_chua_xac_minh` | Trả về `503 Service Unavailable` (`CONNECTOR_UNAVAILABLE`) trước mọi truy cập dữ liệu giả (**PASS**). |
| **Chặn endpoint `POST /api/v1/sync`** | `src-tauri/src/api.rs:292-298` (`sync`) | `api::tests::sync_endpoint_khong_gia_danh_thanh_cong`, `connectors::connector_engine::tests::sync_entries_reject_unverified_contract_and_mock_before_database_access` | Trả về `503 Service Unavailable` (`SYNC_NOT_READY`), không ghi dữ liệu giả (**PASS**). |
| **Xác thực Bearer Token & so sánh Constant-Time** | `src-tauri/src/api.rs` (`require_bearer_token`, `constant_time_eq`) | `api::tests::bearer_token_yeu_cau_header_dung_va_so_sanh_constant_time`, `api::tests::unauthorized_response_co_header_challenge_va_envelope`, `api::tests::constant_time_comparison_checks_equal_different_and_length_mismatch` | Từ chối `401 Unauthorized` kèm header `WWW-Authenticate: Bearer` khi thiếu/sai token (**PASS**). |
| **Ràng buộc Loopback & không chặn khởi động Desktop** | `src-tauri/src/api.rs` (`health`, `API_ADDR`) | `api::tests::health_endpoint_tra_thong_tin_loopback`, `api::tests::thieu_token_khong_chan_desktop_startup`, `api::tests::instance_thu_hai_nhan_biet_port_da_duoc_dung` | Payload `127.0.0.1:47821` (`loopback`), app desktop vẫn chạy khi thiếu token (**PASS**). |
| **Guard Postman Loopback & chống rò rỉ Secret/PII** | `tools/check-postman.cjs:1-21`, `tools/check-local-postman.cjs:1-85`, `tools/postman-guards.cjs:1-35` | `npm run check:postman` (`assertLoopbackCollection`, `assertNoSensitiveData`) | `Postman canonical PASS: 10 requests; environment loopback; secret guard PASS` & 11 mirror YAML đồng bộ (**PASS**). |
| **Trạng thái Release Checklist trên UI (`local-only`)** | `src/releaseChecklist.ts`, `src/releaseChecklist.test.ts` | `npx vitest run src/releaseChecklist.test.ts` | **2/2 tests PASS** — phân biệt `WARN` cho local-only với `FAIL` thật. |
| **Biên token và `studentCode`** | `src-tauri/src/api.rs` (`validate_api_token`, `schedule`) | `api::tests::api_token_config_yeu_cau_do_dai_va_ascii_khong_khoang_trang`, `api::tests::schedule_student_code_bva_giu_ro_ranh_gioi_rong_va_chua_xac_minh` | B1–B11 có Rust unit test; Postman HTTP live chưa xác minh. |

### 4.2. Lệnh kiểm chứng toàn cục & Kết quả thực thi (`CONFIRMED`)

- **Lệnh thực thi:** `npm run check:all` (tại nhánh `feat/tram/ca-084-release-audit-postman`)
- **Kết quả từng giai đoạn:**
  1. `npm run test` (`vitest run`): **`Test Files 14 passed (14) | Tests 116 passed (116)`** (`4.05s`), gồm `src/releaseChecklist.test.ts` (2), `src/gpaData.test.ts` (16), `src/components/GpaCalculator.test.tsx` (2), `src/utils/backupRestore.test.ts` (7), `src/engine.test.ts` (56) và 9 file test khác.
  2. `npm run test:layout` (`node tools/layout-regression-check.cjs`): **`Layout regression check passed.`**
  3. `npm run check:postman` (`node tools/check-postman.cjs && node tools/check-local-postman.cjs`): **`10 kiểm tra local Postman PASS; không gửi HTTP và không xác nhận contract UTH.`**
  4. `npm run build` (`tsc && vite build`): **`✓ 1607 modules transformed. ✓ built in 1.29s`** (0 lỗi TypeScript/bundler).
  5. `npm run check:rust` (`cargo check --manifest-path src-tauri/Cargo.toml`): **`Finished dev profile target(s)`** (0 lỗi biên dịch).
  6. `npm run test:rust` (`cargo test --manifest-path src-tauri/Cargo.toml`): **`test result: ok. 62 passed; 0 failed; 0 ignored`** (1.40s).
  7. `npm audit`: **`found 0 vulnerabilities`**.
