# Báo cáo Kiểm tra Release Audit & Local REST API (Task CA-084)

> **Trạng thái nghiệm thu CA-084:** **`IN PROGRESS` (Chưa hoàn tất điều kiện phê duyệt cuối cùng)**
> **Tuyên bố phạm vi (`DOC-001`):** Báo cáo này **KHÔNG phải là bằng chứng nghiệm thu (Release Sign-off) cuối cùng** của Task CA-084. Các cổng **Kiểm thử nâng cấp dữ liệu (Upgrade DB Check)** và **Phê duyệt Pull Request (#27)** hiện vẫn ở trạng thái **`PENDING`**.

* **Dự án:** Campus Assistant Local (`127.0.0.1:47821`)
* **Nhánh thực hiện:** `feat/tram/ca-084-release-audit-postman`
* **Ngày cập nhật:** 23/11/2026
* **Quy chuẩn áp dụng:** `docs/INVARIANTS.md` (`DOC-001`, `SEC-001`..`SEC-005`, `DATA-001`..`DATA-004`)

---

## 1. Tổng hợp Trạng thái Các Cổng Phát hành (Phân loại theo `DOC-001`)

| Hạng mục cổng kiểm tra | Phân loại (`DOC-001`) | Nguồn bằng chứng & Chi tiết xác minh |
|---|---|---|
| **Chuỗi kiểm tra tự động (`npm run check:all`)** | **`CONFIRMED`** *(Automated)* | Đã thực thi và đạt 100%: `vitest run` (116/116 tests, 14 files), `test:layout`, `check:postman` (10/10 checks & đồng bộ 11 mirror YAML), `tsc && vite build`, `cargo check`, `cargo test` (61/61 tests), `npm audit` (0 vulnerabilities). |
| **Kiểm thử Local REST API (Postman Runner)** | **`CONFIRMED`** *(Manual Postman Run)* | Thực thi Collection Runner trên backend cục bộ `http://127.0.0.1:47821` với token phiên cục bộ: **10/10 requests (24/24 assertions) PASS**. |
| **Đóng gói trình cài đặt Windows (NSIS v1.0.1)** | **`CONFIRMED`** *(Local Build Artifact)* | Đã biên dịch thành công gói cài đặt `src-tauri/target/release/bundle/nsis/Campus Assistant Local_1.0.1_x64-setup.exe` từ cây mã nguồn hiện tại bằng `npm run build:installer`. |
| **Native Smoke Test trên bản cài đặt v1.0.1** | **`CONFIRMED`** *(Manual Native Smoke)* | Đã cài đặt `Campus Assistant Local_1.0.1_x64-setup.exe` lên Windows, khởi chạy ứng dụng desktop hiển thị đầy đủ giao diện (không lỗi kết nối) và xác nhận `GET /api/v1/health` phản hồi `200 OK` (`version: "1.0.1"`). |
| **Kiểm thử nâng cấp / giữ dữ liệu qua bản cập nhật (Upgrade DB Check)** | **`PLANNED`** *(PENDING)* | Chưa thực hiện kịch bản nâng cấp đè từ phiên bản cũ lên `1.0.1` có sẵn dữ liệu SQLite người dùng để xác minh tính toàn vẹn sau migration/restart. |
| **Phê duyệt Pull Request (#27)** | **`PLANNED`** *(PENDING)* | Đang chờ reviewer kiểm tra lại bản cập nhật báo cáo và collection trên GitHub PR #27 trước khi chuyển trạng thái Task CA-084 sang `Done`. |
| **Hợp đồng đồng bộ UTH Portal thực tế** | **`UNKNOWN`** / **`PLANNED`** | API contract của cổng thông tin UTH bên ngoài chưa được xác minh; các endpoint đồng bộ và dữ liệu cá nhân tiếp tục bị khóa an toàn ở mức `503`. |

---

## 2. Kiểm tra Bảo mật, Ràng buộc Loopback & Chặn Dữ liệu Giả

| Tiêu chí kiểm tra | Phân loại (`DOC-001`) | Phương pháp & Kết quả thực tế |
|---|---|---|
| **Xác thực payload `/api/v1/health`** | **`CONFIRMED`** *(Source `src-tauri/src/api.rs` + Manual Postman)* | `GET /api/v1/health` trả về `200 OK` với `address: "127.0.0.1:47821"`, `transport: "loopback"`, `source: "runtime"`. *(Lưu ý: Endpoint này chỉ phản ánh hằng số cấu hình `API_ADDR`, không tự chứng minh các socket đang mở trên hệ điều hành).* |
| **Kiểm tra Socket lắng nghe thực tế cấp OS** | **`CONFIRMED`** *(OS Socket Inspection)* | Kiểm tra bằng `Get-NetTCPConnection -LocalPort 47821 -State Listen` trên Windows xác nhận tiến trình `campus-assistant-local` chỉ mở duy nhất một listener tại `127.0.0.1:47821`, không mở cổng trên giao diện wildcard `0.0.0.0`. |
| **Xác thực Bearer Token & Constant-Time Compare** | **`CONFIRMED`** *(Automated Rust Test + Manual Postman)* | Xác minh qua unit test `bearer_token_yeu_cau_header_dung_va_so_sanh_constant_time` và request `Auth - missing token`: gọi `/api/v1/health` ở chế độ `noauth` trả về `401 Unauthorized`, kèm header `WWW-Authenticate: Bearer` và mã lỗi `UNAUTHORIZED`. |
| **Kiểm tra cổng chặn Contract UTH (`Schedule` & `Exams`)** | **`CONFIRMED`** *(Automated Rust Test + Manual Postman)* | Truyền mã kiểm thử tổng hợp không rỗng `STUDENT_CODE=TEST000001` (qua `prerequest` script) để đi qua bước kiểm tra tham số rỗng và chạm tới contract gate: cả `/api/v1/schedule` và `/api/v1/exams` đều trả về `503 Service Unavailable` với mã `CONNECTOR_UNAVAILABLE`. |
| **Không trả hồ sơ giả & không lưu Secret/PII trong Git** | **`CONFIRMED`** *(Automated Guard + Manual Postman)* | `/profile` trả về `404 PROFILE_NOT_CONNECTED`; `POST /sync` trả về `503 SYNC_NOT_READY`; `/announcements` và `/documents` ghi rõ `source: "sample-local"`. Các biến `API_TOKEN` và `STUDENT_CODE` trong file environment đều để trống (`""`). |

---

## 3. Thiết kế Kịch bản Kiểm thử Hộp đen (Phân hoạch lớp tương đương - EP)

### 3.1. Bảng phân hoạch lớp tương đương (EP)

| Nhóm điều kiện kiểm thử | Lớp tương đương hợp lệ (Valid) | Lớp tương đương không hợp lệ (Invalid) |
|---|---|---|
| **Xác thực (`Authorization` Header)** | **V1:** Header `Bearer <API_TOKEN>` khớp biến môi trường phiên | **X1:** Thiếu header `Authorization` (`noauth`) hoặc sai token |
| **Tham số truy vấn (`Query Params`)** | **V2:** Truyền đủ tham số bắt buộc hợp lệ (`subjectId`, `studentCode=TEST000001`) | **X2:** Thiếu tham số bắt buộc (`subjectId` hoặc `studentCode` rỗng) |
| **Trạng thái kết nối & Contract UTH** | **V3:** Nguồn dữ liệu cục bộ sẵn sàng (`runtime`, `sample-local`) | **X3:** Chưa kết nối hồ sơ UTH hoặc chưa xác minh contract đồng bộ |

### 3.2. Chi tiết Kết quả Thực thi Test Case trên Postman (`TC01`–`TC10`)

* **Tài nguyên kiểm thử:** `postman/Campus_Assistant_Local_REST_API.postman_collection.json` (10 requests) và `postman/Campus_Assistant_Local_REST_API.postman_environment.json`.
* **Tổng hợp kết quả:** **10/10 requests hoàn tất**, **24/24 assertions PASS** (`0 Failed`, `0 Errors`).
* **Ghi chú hiệu năng đo được (`CONFIRMED`):** Độ trễ phản hồi HTTP loopback trung bình của backend Rust là **~2 ms/request** (tổng thời gian xử lý mạng thuần túy cho 10 requests khoảng **20 ms**; phần thời gian còn lại trong tổng thời lượng chạy Runner khoảng 1.3s là chi phí khởi tạo sandbox script và kết xuất giao diện của Postman Desktop).

| Mã TC | Tên Test Case (Request) | Method & Endpoint | HTTP Status | Assertions | Phân loại (`DOC-001`) |
|---|---|---|---|---:|---|
| **TC01** | Health (**V1**) | `GET /api/v1/health` | `200 OK` | 3/3 PASS | **`CONFIRMED`** *(Manual Postman)* |
| **TC02** | Auth - missing token (**X1**) | `GET /api/v1/health` *(noauth)* | `401 Unauthorized` | 3/3 PASS | **`CONFIRMED`** *(Manual Postman)* |
| **TC03** | Profile - not connected (**V1, X3**) | `GET /api/v1/profile` | `404 Not Found` | 2/2 PASS | **`CONFIRMED`** *(Manual Postman)* |
| **TC04** | Announcements - local source (**V1, V3**) | `GET /api/v1/announcements` | `200 OK` | 3/3 PASS | **`CONFIRMED`** *(Manual Postman)* |
| **TC05** | Documents - valid empty result (**V1, V2**) | `GET /api/v1/documents?subjectId=unknown-subject&semester=1` | `200 OK` | 3/3 PASS | **`CONFIRMED`** *(Manual Postman)* |
| **TC06** | Documents - validation error (**V1, X2**) | `GET /api/v1/documents` | `400 Bad Request` | 2/2 PASS | **`CONFIRMED`** *(Manual Postman)* |
| **TC07** | Schedule - requires verified cache (**V1, V2, X3**) | `GET /api/v1/schedule?studentCode=TEST000001` *(prerequest)* | `503 Service Unavailable` | 2/2 PASS | **`CONFIRMED`** *(Manual Postman)* |
| **TC08** | Exams - requires verified cache (**V1, V2, X3**) | `GET /api/v1/exams?studentCode=TEST000001` *(prerequest)* | `503 Service Unavailable` | 2/2 PASS | **`CONFIRMED`** *(Manual Postman)* |
| **TC09** | Sync - blocked until UTH contract is verified (**V1, X3**) | `POST /api/v1/sync` | `503 Service Unavailable` | 2/2 PASS | **`CONFIRMED`** *(Manual Postman)* |
| **TC10** | Sync status - requires account (**V1, X2**) | `GET /api/v1/sync/status` | `400 Bad Request` | 2/2 PASS | **`CONFIRMED`** *(Manual Postman)* |

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

### 4.2. Lệnh kiểm chứng toàn cục & Kết quả thực thi (`CONFIRMED`)

* **Lệnh thực thi:** `npm run check:all` (tại nhánh `feat/tram/ca-084-release-audit-postman`)
* **Kết quả từng giai đoạn:**
  1. `npm run test` (`vitest run`): **`Test Files 14 passed (14) | Tests 116 passed (116)`** (`4.91s`), gồm `src/releaseChecklist.test.ts` (2), `src/gpaData.test.ts` (16), `src/components/GpaCalculator.test.tsx` (2), `src/utils/backupRestore.test.ts` (7), `src/engine.test.ts` (56) và 9 file test khác.
  2. `npm run test:layout` (`node tools/layout-regression-check.cjs`): **`Layout regression check passed.`**
  3. `npm run check:postman` (`node tools/check-postman.cjs && node tools/check-local-postman.cjs`): **`10 kiểm tra local Postman PASS; không gửi HTTP và không xác nhận contract UTH.`**
  4. `npm run build` (`tsc && vite build`): **`✓ 1607 modules transformed. ✓ built in 749ms`** (0 lỗi TypeScript/bundler).
  5. `npm run check:rust` (`cargo check --manifest-path src-tauri/Cargo.toml`): **`Finished dev profile target(s)`** (0 lỗi biên dịch).
  6. `npm run test:rust` (`cargo test --manifest-path src-tauri/Cargo.toml`): **`test result: ok. 61 passed; 0 failed; 0 ignored`** (`0.29s`).
  7. `npm audit`: **`found 0 vulnerabilities`**.