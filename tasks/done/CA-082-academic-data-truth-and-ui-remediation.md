# CA-082 - Dữ liệu học tập đúng nguồn và sửa giao diện

- Status: Done
- Created: 2026-10-08
- Type: Remediation, được user yêu cầu triển khai và commit/push.

## Truth check và tác động

- CONFIRMED: CampusDataPages tự dùng MOCK_DEFAULT khi cache rỗng/lỗi; GPA khởi tạo điểm mẫu và persist; SchoolPage hứa đồng bộ một lần nhưng API/auth chưa có evidence E2E.
- CONFIRMED: baseline `npm run check:all` pass 51 Vitest/layout/build nhưng fail Rust với 7 E0599 do thiếu import Emitter. Sửa compile trước, xác minh lại trước thay đổi chức năng.
- UNKNOWN: contract API/auth trường. Không triển khai endpoint/mapping chưa xác minh; CA-080/081 giữ Proposed.
- Entry: CampusDataPages, App chat actions, SchoolPage, GpaCalculator; phụ thuộc tauriApi/SQLite connector cache.
- Baseline: sample fallback. CURRENT sau sửa: cache-only đúng account/source, GPA nhập tay trống mặc định. Profile tự khai/WebView thử nghiệm; auth/parser thật vẫn UNKNOWN, CA-080/081 Proposed.
- Đọc: hồ sơ local, SQLite connector, điểm user nhập; ghi: điểm nhập tay v2, hồ sơ khi user lưu. Không xóa dữ liệu điểm v1/cache cũ.
- Giữ SEC/DATA/UI: không secret React, không đoán API, không sample giả nguồn thật, không xóa user data, thao tác xóa confirm.
- Rủi ro: chat/page khác nguồn, stale response khi đổi account, event listener không cleanup, bảng tràn, titlebar không phản hồi.
- Phạm vi: sửa import Emitter; thêm loader cache dùng chung chat/page; bỏ default sample trên trang học tập; GPA trống mặc định, dữ liệu cũ chỉ phục hồi có chủ ý; portal lỗi được báo; bỏ hứa auth chưa xác minh; sửa bảng/avatar/window controls; docs/tests.
- Không thêm API trường mới, không claim login/sync E2E đã chạy.

## Done gate

- [x] Build/check:all PASS: 61 Vitest, 37 Rust, layout/build, audit 0.
- [x] Lịch/thi chat/page dùng chung cache đúng MSSV/source, không sample/prototype fallback.
- [x] Thông báo chưa có connector rõ trạng thái; GPA không tự seed mẫu.
- [x] Portal await/error; MSSV tự khai không phải auth, WebView ghi thử nghiệm.
- [x] Giữ dữ liệu v1/cache, bỏ response async account cũ.
- [x] Responsive bảng/avatar/titlebar icon sửa source; native window action chưa E2E.
- [x] Playwright local PASS, screenshot đã xem; manual native desktop/auth CHƯA CHẠY.
- [x] Docs/governance đồng bộ.

## Evidence đã chạy

- academicData.ts:8,19: loader/source/account; 5 test PASS.
- gpaData.ts:3,6: storage v2/validation; 3 test PASS.
- SchoolPage.tsx:138,351: portal awaited/disabled/error; 2 test tauriApi PASS.
- connector_engine.rs:13: Emitter; cargo check/37 Rust PASS.
- styles.css:5858,5864: responsive grid; Playwright 1280/1000 PASS.
- rg mẫu/promise cũ trong 3 component: không có kết quả (exit 1 expected).
- output/playwright/ca082-check.js và ca082-interactions.js PASS. Native auth/API thật chưa verified; không báo 100% runtime.

## Bàn giao Git

Commit tiếng Việt/push develop theo user; hash/evidence remote cung cấp ở phản hồi bàn giao. Không đưa file Postman đã staged sẵn của user vào commit này.

## Evidence

`npm run check:all`; `git diff --check`; `rg -n 'MOCK_DEFAULT|DEFAULT_SUBJECTS|Chỉ cần xác nhận 1 lần|phíd' src/pages/CampusDataPages.tsx src/pages/SchoolPage.tsx src/components/GpaCalculator.tsx` (expected 0); source loader/test và screenshots cục bộ. API thật chưa xác minh.
