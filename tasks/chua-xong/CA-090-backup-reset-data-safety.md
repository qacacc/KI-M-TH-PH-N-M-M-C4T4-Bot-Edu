# CA-090 - Sao lưu và reset đúng phạm vi, không mất dữ liệu

- Status: In Progress (CA-090.01 implementation)
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: CA-088; phối hợp CA-095 storage ownership
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): Backup dùng ca-appearance-settings và GPA v1, bỏ active appearance/GPA v2/preset/layout. Snapshot đọc ngoài try, rollback có thể throw. Reset clear toàn localStorage nhưng không DB/assets, ErrorBoundary xóa không confirm; live state có thể ghi lại settings cũ.

Evidence: `src/utils/backupRestore.ts:12`, `src/utils/backupRestore.ts:84`, `src/pages/SettingsPage.tsx:209`, `src/main.tsx:38`, `src/hooks/useAppearanceDraft.ts:40`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Chốt config backup hay data backup trước code; không tự export chat/PII/secret. Dùng registry keys/version/schema từng miền và transactional import/rollback có báo lỗi. Tách reload an toàn, reset config, xóa dữ liệu đúng phạm vi.

## File dự kiến sửa sau duyệt

- `src/utils/backupRestore.ts`
- `src/utils/backupRestore.test.ts`
- `src/pages/SettingsPage.tsx`
- `src/main.tsx`
- `src/hooks/useAppearanceDraft.ts`
- `src/hooks/useLayoutState.ts`
- `storage owners đã duyệt`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Backup round-trip active keys thực, dữ liệu v2/preset/layout theo scope user duyệt; không export secret hoặc chat ngầm.
- [ ] Malformed/domain-invalid/quota/storage-blocked không crash; rollback failure báo rõ, không claim success toàn bộ.
- [ ] Destructive reset có confirm, không clear dữ liệu không thuộc scope; live state/reload giữ trạng thái reset.
- [ ] Không ghi xóa toàn bộ dữ liệu khi chỉ xóa settings; DB/cache/assets chỉ xóa khi scope riêng được duyệt.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; backup/reset round-trip & quota/failure tests; UI confirm/reload.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

## Evidence cập nhật CA-090.01 (2026-10-19)

- `src-tauri/src/lib.rs:34-36`: khởi động không còn tự xóa lịch sử chat cũ.
- `src-tauri/src/db.rs:64-68`: bật `PRAGMA foreign_keys` trước khi kiểm tra/nâng cấp schema.
- `src-tauri/src/db.rs:551-596`: migration v1 -> v2 được kiểm tra giữ nguyên message cũ và bật foreign key.
- `src/main.tsx:37-44`: ErrorBoundary chỉ reload, không xóa localStorage âm thầm.
- `src/resetConfig.ts:1-31` và `src/pages/SettingsPage.tsx:209-232`: reset chỉ xóa allowlist cấu hình; GPA, chat và hồ sơ trường được giữ lại.
- Automated: `npm run check:all` PASS (67 Vitest, 43 Rust, build/layout/Postman/npm audit).
- Static source check: không còn `localStorage.clear()` trong flow reset khởi động/settings.
- Manual visual/native check: chưa thực hiện; task chưa chuyển Done.


## Evidence cập nhật CA-090 & phối hợp CA-106 (2026-11-24)

- `src-tauri/src/db.rs:10-39`: Bổ sung `SCHEMA_INIT_LOCK` (`OnceLock<Mutex<()>>`) và `busy_timeout(5s)` khi mở kết nối SQLite, chống lỗi tranh chấp khóa ghi khi các lệnh Tauri chạy đồng thời.
- `src-tauri/src/db.rs:77-282`:
  - Khai báo khóa chính văn bản với `TEXT NOT NULL PRIMARY KEY CHECK(length(trim(...)) > 0)` cho toàn bộ các bảng.
  - Thêm `migrate_to_v6` nâng cấp schema lên `PRAGMA user_version = 6` và khởi tạo bảng `student_notes`.
  - Thêm `infer_legacy_class_date` và `backfill_empty_schedule_class_dates` để tự động điền `class_date` (`YYYY-MM-DD`) cho các hàng lịch học cũ khi nâng cấp lên v4+.
  - Thêm `is_runtime_schema_complete` kiểm tra chỉ đọc trước khi chạy DDL trong `ensure_connector_runtime_schema`, đồng thời đảm bảo khôi phục đủ cả `connector_exams`, `connector_sync_status`, `connector_schedule_weeks`, `connector_transcripts` và `student_notes`.
- `src-tauri/src/db.rs:948-1462`: Kiểm thử nâng cấp E2E trên Temp DB Fixture (`test_bva02_and_dt2_rule2_temp_db_fixture_upgrades_v1_to_v6_on_disk`), kiểm thử trực tiếp `migrate_to_v6` (`test_migrate_to_v6_directly_creates_student_notes_and_rejects_null_or_blank_primary_key`) và kiểm thử round-trip sao lưu/khôi phục ghi chú (`test_bva03_bva04_and_dt3_student_notes_crud_validation_and_backup_roundtrip`).
- `src/utils/backupRestore.ts:12-151` & `src/utils/backupRestore.test.ts:36-162`: Mở rộng `ALLOWLIST_KEYS` bao phủ đủ các khóa cấu hình active (`campus-assistant-appearance`, `campus-assistant-layout`, `ca_custom_theme_presets_v1`, `ca_gpa_calculator_manual_v2`), bọc `try/catch` cho cả snapshot và rollback, kiểm thử đủ 6 điểm biên kích thước file BVA-01 (`0`, `1`, `500`, `1MB - 1`, `1MB`, `1MB + 1`).
- `src/pages/SettingsPage.tsx:568-575`: Chuẩn hóa nhãn nút đặt lại cấu hình thành `"Đặt lại Cấu hình Ứng dụng Local"`, giữ nguyên dữ liệu DB, GPA, chat và sổ ghi chú.
- Automated (`npm run check:all`): **PASS** (74 Vitest tests, 64 Rust tests, layout check, local Postman check, TypeScript/Vite build, `npm audit` 0 vulnerabilities).
