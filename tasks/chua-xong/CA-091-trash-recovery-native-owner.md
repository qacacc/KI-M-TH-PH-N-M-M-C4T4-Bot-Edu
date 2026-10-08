# CA-091 - Thùng rác an toàn và một nguồn dữ liệu

- Status: Proposed
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: Không cần connector
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): Move file trước open_db/schema, các lỗi ở bước đó không rollback. Restore file trước delete metadata, partial empty báo như đã dọn sạch; catch native rơi sang localStorage giả. Schema trash tạo ngoài user_version.

Evidence: `src-tauri/src/trash.rs:77`, `src-tauri/src/trash.rs:81`, `src-tauri/src/trash.rs:215`, `src/pages/FilesPage.tsx:35`, `src/pages/FilesPage.tsx:129`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Native là owner thùng rác; chuẩn bị DB trước IO, recovery journal/compensation cho các bước và failure. Schema phải migration; validate cả đường dẫn từ metadata. Không xóa localStorage legacy ngầm.

## File dự kiến sửa sau duyệt

- `src-tauri/src/trash.rs`
- `src-tauri/src/db.rs`
- `src-tauri/src/paths.rs`
- `src/pages/FilesPage.tsx`
- `src/utils/trashBin.ts`
- `src/tauriApi.ts`
- `test Rust/UI`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] DB open/schema/insert/delete và IO failure không làm mất dấu file; retry/restart phục hồi trạng thái nhất quán.
- [ ] Native failure hiện lỗi và giữ list, không mock fallback hoặc fake restore/empty.
- [ ] Empty partial trả attempted/succeeded/failed và UI ghi đúng; collision/cross-volume behavior được test.
- [ ] Path traversal/symlink ở workspace/trash metadata bị chặn; orphan inventory/recovery không xóa file không rõ.
- [ ] Migration từ DB v2 giữ lịch sử/settings/cache và metadata trash cũ.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; Rust injected failures/restart/path tests; UI native-failure tests.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

