# CA-084 - Nghiệm thu và phát hành từ source đã sửa

- Status: Proposed
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: Sau các task sửa P1; CA-080/081 nếu bản phát hành tuyên bố có connector thật
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): Checklist hiện yêu cầu dữ liệu mẫu không rỗng và có PASS tĩnh cho capability chưa chạy. Installer cũ không chứng minh source mới.

Evidence: `src/pages/ReleasePage.tsx:24`, `src/pages/ReleasePage.tsx:49`, `src-tauri/tauri.conf.json:35`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Tạo tiêu chí release theo khả năng thực tế; phân biệt local-only với connector verified. Không tự xây auto-updater hoặc vault.

## File dự kiến sửa sau duyệt

- `src/pages/ReleasePage.tsx`
- `src/pages/HealthPage.tsx`
- `src-tauri/src/diagnostics.rs`
- `package.json`
- `src-tauri/tauri.conf.json`
- `tài liệu release`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Checklist không FAIL vì dữ liệu trường chưa kết nối hợp lệ; không PASS capability chỉ từ chuỗi tĩnh.
- [ ] Chạy native smoke, restart, upgrade DB, privacy opt-in, path guard và UI light/dark trên bản build mới.
- [ ] Build installer từ commit đã xác minh; ghi hash/version/artifact/test evidence, giới hạn và rollback.
- [ ] Nếu connector chưa verified, phát hành giới hạn local-only với nhãn rõ hoặc giữ release chưa đạt.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; npm run build:installer; native smoke theo checklist; đối chiếu artifact với commit.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

