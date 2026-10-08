# CA-083 - Cách ly connector chưa xác minh và ngừng dữ liệu mô phỏng

- Status: Done
- Created: 2026-10-09
- Type: Remediation; user yêu cầu sửa để dữ liệu thật, không setup sẵn.

## Phase 0/1 - Phân tích tác động

1. CONFIRMED: uth.rs tự gán giờ/thứ/thời lượng, engine nuốt lỗi lịch thi; command prototype ghi mẫu vào cache. UNKNOWN: contract thật, không sửa bằng mapping đoán.
2. Feature: SCHOOL_SYNC_UTH; ACADEMIC_SCHEDULE_AND_EXAMS.
3. Entry: open_uth_login_window, receive_uth_jwt, sync_uth_after_login, sync_embedded_school_data.
4. CURRENT baseline: thử endpoint/parser chưa verified. TARGET scope: fail-closed, lỗi rõ trước thu token/network/DB; mở website chính thức vẫn hoạt động.
5. State: connector thử nghiệm -> chưa được xác minh, không phát success giả.
6. Đọc: cache cũ giữ trong SQLite nhưng bị cách ly khỏi lịch chính thức do có thể chứa giá trị tự điền; không gửi request tài khoản chưa verified.
7. Ghi: không ghi mock hoặc lịch suy đoán, không đổi schema/xóa dữ liệu.
8. Phụ thuộc: uth.rs, connector_engine.rs, tauriApi/SchoolPage, sync_service/SQLite (giữ nguyên).
9. Giữ SEC/DATA/AI/UI: không token React, không đoán API, không error->empty, không fake nguồn.
10. Rủi ro: luồng sync thử nghiệm sẽ từ chối có giải thích; cache cũ vẫn có thể không chính xác và vẫn ghi nhãn thử nghiệm. Không claim đã kết nối trường thật.
11. File: uth.rs, connector_engine.rs, SchoolPage.tsx, App.tsx, academicData.ts/test, useAcademicCache.ts; README source status, task/index/planning và docs runtime/feature/flow/invariant/contract/state/dependency/regression.
12. Baseline check:all PASS 61 Vitest/37 Rust/audit 0. Thêm Rust test mọi entry bị chặn, không fallback dữ liệu giả, cache không thay đổi.
13. Evidence: rg giá trị default/prototype runtime và unwrap_or_default lịch thi; check:all; git diff --check. Test gate không cần mật khẩu/token/network.

## Minimal plan được user giao remediation

- Gỡ parser HTTP/default chưa có evidence, thay bằng lỗi CONTRACT_UNVERIFIED rõ ràng; không mở endpoint mới.
- Gate native trước mở WebView bắt token và trước xử lý token/DB; command prototype trả lỗi không ghi cache.
- Fixture chỉ nằm trong test, không reachable từ runtime.
- UI nêu đồng bộ chưa sẵn sàng; giữ portal browser và cache cũ.
- CA-080/081 tiếp tục Proposed. Để bật đồng bộ thật cần triển khai verified contract + fixture và security E2E, không có công tắc bỏ qua gate.

## Done gate

- [x] Không còn parser HTTP/default/prototype runtime tạo dữ liệu trường giả.
- [x] Entry auth/sync/cache-read fail trước token/network/DB; command tests trả lỗi rõ, không success giả.
- [x] Source gate trước IO; không đổi cache/schema/sync_service; test từ chối sync và prototype. Native cache IO E2E chưa chạy, không claim đã kiểm DB thật của user.
- [x] check:all PASS 62 Vitest/39 Rust/layout/build/audit 0; source/docs/governance khớp.
- [x] Playwright local kiểm sync disabled/portal enabled/warning/no overflow PASS, screenshot 1000 đã xem. Native login/sync chưa E2E; full project chưa Done.

## Evidence

- uth.rs:5,9: lỗi CONTRACT_UNVERIFIED; helper fetch không HTTP, trả Err, 1 Rust test mới.
- connector_engine.rs:125,183,326: gate trước mở WebView/nhận JWT/sync; dòng 410/420 gate cache đọc. Prototype Err SAMPLE_SYNC_DISABLED; 1 Rust test mới cho sync/cache/prototype.
- academicData.ts:8: thông báo an toàn; App/useAcademicCache chung helper; 1 Vitest mới PASS.
- SchoolPage.tsx:318,343,362: chưa sẵn sàng/warning/button disabled; output/playwright/ca083-check.js PASS, ảnh đã xem.
- rg defaults/prototype loader/unwrap_or_default lịch thi: không có kết quả (exit 1 expected); git diff --check không lỗi whitespace.
- CA-080/081 chưa Done. Đây là cách ly capability chưa verified, không phải connector dữ liệu thật đã hoàn thành.
