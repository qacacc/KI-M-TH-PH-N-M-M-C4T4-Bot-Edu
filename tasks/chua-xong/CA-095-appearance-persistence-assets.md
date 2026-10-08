# CA-095 - Theme: persistence, draft và ownership ảnh nền

- Status: Proposed
- Priority: P2
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: CA-090 storage registry; CA-094 managed-root protection
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): SQLite save settings bị catch bỏ qua, localStorage save cũng bỏ qua; presets có hai owner/key, any[] chưa validate; mọi ảnh managed ghi themes/current nên preset có thể giữ URL tới file bị ghi đè/xóa.

Evidence: `src/hooks/useAppearanceDraft.ts:225`, `src/hooks/useAppearanceDraft.ts:483`, `src/App.tsx:1110`, `src/pages/AppearancePage.tsx:96`, `src/appearance/presetStore.ts:10`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Một owner preset typed/sanitized, asset immutable IDs/reference policy; apply có persistence feedback, không silent success. Giữ preview/undo chưa ghi storage và auto/manual màu.

## File dự kiến sửa sau duyệt

- `src/hooks/useAppearanceDraft.ts`
- `src/pages/AppearancePage.tsx`
- `src/App.tsx`
- `src/appearance/presetStore.ts`
- `src-tauri/src/theme_assets.rs`
- `test theme/preset`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Save/quota/native failure hiện trạng thái chưa lưu; reload giữ config đã áp dụng thành công.
- [ ] Preset A/B ảnh khác nhau không bị overwrite khi thay current; xóa ảnh tham chiếu cần policy/confirm.
- [ ] Old key migration không mất preset; malformed JSON không crash/map sai.
- [ ] Light/dark, auto/manual, apply/undo/reset/image workflow có test và visual evidence.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; theme storage/asset failure tests; light/dark/preset visual matrix.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

