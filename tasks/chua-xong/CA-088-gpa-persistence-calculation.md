# CA-088 - Sửa lưu, phục hồi và tính GPA

- Status: Proposed
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: Không phụ thuộc connector; GPA vẫn nhập tay
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): storageFailed cố định chặn persist sau recovery; missing legacy parse [] thay bảng; hàng draft mặc định F/0 tính ngay vào GPA.

Evidence: `src/components/GpaCalculator.tsx:34`, `src/components/GpaCalculator.tsx:46`, `src/components/GpaCalculator.tsx:72`, `src/gpaData.ts:6`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Phân biệt missing/corrupt/valid và draft/chưa nhập/F0 thật. Recovery explicit mới gỡ chặn lưu. Giữ bản lỗi gốc; thang điểm chỉ tham khảo tới khi có contract trường.

## File dự kiến sửa sau duyệt

- `src/components/GpaCalculator.tsx`
- `src/gpaData.ts`
- `src/gpaData.test.ts`
- `test UI GPA mới`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Phục hồi hợp lệ lưu lại v2 và reload đúng; không ghi đè bản lỗi trước consent.
- [ ] Legacy missing/empty báo đúng và không thay bảng hiện tại ngoài ý muốn.
- [ ] Hàng chưa có điểm không ảnh hưởng tổng; F/0 thật có tính; tín chỉ/điểm/chữ test độc lập.
- [ ] Không thêm điểm mẫu, không claim bảng điểm trường hoặc thang quy đổi verified.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; GPA pure + component storage/recovery tests.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

