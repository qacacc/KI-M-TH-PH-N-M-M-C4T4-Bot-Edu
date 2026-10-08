# CA-089 - Nguồn dữ liệu và trạng thái trường trung thực

- Status: Proposed
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: CA-080/081 cho dữ liệu thật; phần sửa wording không cần mở gate
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): Settings lấy MOCK_PUBLIC_DOCS nhưng ghi tự động tải công khai. Auto-sync toggle chỉ lưu config, không scheduler; session local metadata bị mô tả token/vault. Profile có logic xóa dữ liệu theo danh tính cụ thể, school catalog trùng.

Evidence: `src/schoolConnector/schoolVault.ts:19`, `src/pages/SettingsPage.tsx:414`, `src/pages/SettingsPage.tsx:486`, `src/schoolProfile.ts:132`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Gỡ dữ liệu dựng sẵn khỏi nguồn chính hoặc tách minh họa rõ; trạng thái website/profile/session/verified độc lập. Bỏ cleanup dựa trên danh tính cụ thể theo migration minh bạch không xóa dữ liệu hợp lệ. Chốt một school registry.

## File dự kiến sửa sau duyệt

- `src/pages/SettingsPage.tsx`
- `src/pages/SchoolPage.tsx`
- `src/pages/PrivacyPage.tsx`
- `src/schoolProfile.ts`
- `src/schoolConnector/schoolVault.ts`
- `src/schoolConnector/types.ts`
- `src/schoolConnector/chatSchoolIntegration.ts`
- `test liên quan`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Không có danh sách mock gán như dữ liệu vừa tải; mỗi nguồn chính có URL/provenance/evidence hoặc empty thật.
- [ ] Auto-sync chưa có scheduler phải disabled có lý do; logout/settings gọi đúng owner backend khi có session, không chỉ xóa metadata.
- [ ] Không gọi localStorage metadata là secure token vault; consent history nói rõ sẽ lưu content sau opt-in.
- [ ] Test trường/tài khoản khác nhau, profile lỗi, old metadata; không tự xác thực theo MSSV hoặc mở browser.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; test provenance/settings/profile; source scan MOCK_PUBLIC_DOCS và capability wording.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

