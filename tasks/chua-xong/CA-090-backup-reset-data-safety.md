# CA-090 - Sao lưu và reset đúng phạm vi, không mất dữ liệu

- Status: Proposed
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

