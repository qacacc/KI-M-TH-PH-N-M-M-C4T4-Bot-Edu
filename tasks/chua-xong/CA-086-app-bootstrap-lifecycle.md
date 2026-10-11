# CA-086 - Sửa lifecycle khởi tạo và trạng thái degraded

- Status: In Progress
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: Không phụ thuộc API trường
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): StrictMode mount-effect cleanup rồi setup lại: ref đã true chặn lần setup sau, promise lần đầu bị isCancelled loại. Drop effect dùng bootstrap nhưng thiếu dependency. Lỗi native init được thay bằng bootstrap giả thay vì trạng thái lỗi có retry.

Evidence: `src/main.tsx:55`, `src/App.tsx:378`, `src/App.tsx:463`, `src/App.tsx:322`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Tách vòng đời init tối thiểu, chống stale completion, phân biệt browser preview / initializing / ready / failed, có retry. Không bỏ StrictMode để che lỗi.

## File dự kiến sửa sau duyệt

- `src/App.tsx`
- `src/main.tsx`
- `src/hooks/useAppBootstrap.ts nếu cần`
- `test lifecycle mới`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Test mount trong StrictMode với deferred init chứng minh ready/failure/retry; cleanup không chặn lần setup hợp lệ.
- [ ] Drop sau init dùng roots thật, không closure bootstrap cũ; trường hợp preview không ghi asset.
- [ ] Không gắn trạng thái DB ready cho init native thất bại; message và controls phản ánh degraded.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; test lifecycle StrictMode/deferred; native khởi động lần đầu và retry.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.
