# CA-088 - Sửa lưu, phục hồi và tính GPA

- Status: Proposed
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: Không phụ thuộc connector; GPA vẫn nhập tay
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (audit baseline 2026-10-09): storage recovery và legacy missing/corrupt cần được kiểm tra theo source tương ứng; kết luận về hàng draft F/0 là lịch sử trước PR CA-088.02, không còn mô tả source hiện tại.

CONFIRMED (PR CA-088.02 source): hàng mới khởi tạo `credits`, `letterGrade`, `score10` rỗng; `calculateGpaStats` bỏ qua môn thiếu dữ liệu điểm; F/0 đã nhập vẫn là grade hợp lệ. `parseGpaSubjects` phải giới hạn grade bằng own-key allowlist, không chấp nhận key kế thừa như `constructor`/`toString`.

Evidence hiện tại: `src/components/GpaCalculator.tsx` (`addSubject`), `src/gpaData.ts` (`parseGpaSubjects`, `calculateGpaStats`), `src/gpaData.test.ts`, `src/components/GpaCalculator.test.tsx`. Khả năng runtime ngoài test vẫn chưa xác minh bằng manual.

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

Evidence commands tại thời điểm lập task là kế hoạch ban đầu; xem review update bên dưới để biết kết quả thực tế. Không dùng rg thay cho test hành vi.

## Review remediation update (2026-10-26)

- `CONFIRMED`: parser và calculator chỉ nhận own-key letter grade; điểm trống không tính, F/0 hợp lệ vẫn được tính.
- Evidence: `src/gpaData.ts`, `src/gpaData.test.ts`, `src/components/GpaCalculator.test.tsx`; `npm run check:all` chạy 84 Vitest, layout, Postman, build, Rust check và Rust tests PASS.
- Full command kết thúc non-zero ở `npm audit`: 2 moderate `@vitest/mocker`, 1 high Vite advisory. Chưa cập nhật dependency trong scope này.
- CA-088 còn gồm recovery/legacy persistence chưa hoàn tất; status tổng tiếp tục `Proposed`, không chuyển `Done`. Điểm/tín chỉ trường thật và bảng quy đổi vẫn `UNKNOWN`.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

