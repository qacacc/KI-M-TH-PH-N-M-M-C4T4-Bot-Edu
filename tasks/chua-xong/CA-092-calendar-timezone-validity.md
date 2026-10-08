# CA-092 - Xuất lịch đúng múi giờ và phạm vi học kỳ

- Status: Proposed
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: CA-080/081 để ngày/học kỳ verified; timezone pure có thể sửa trước
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): 08:00 địa phương xuất 08:00Z thay vì 01:00Z; lịch học tự đặt tuần hiện tại và COUNT=15, không dựa contract ngày bắt đầu/kết thúc.

Evidence: `src/utils/calendarExporter.ts:42`, `src/utils/calendarExporter.ts:104`, `src/utils/calendarExporter.test.ts:64`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Chốt timezone trường, serialize UTC đúng hoặc TZID; không phát minh dates/recurrence. Nếu thiếu thông tin, disable export lịch chính thức hoặc chỉ export phạm vi user xác nhận.

## File dự kiến sửa sau duyệt

- `src/utils/calendarExporter.ts`
- `src/utils/calendarExporter.test.ts`
- `src/pages/CampusDataPages.tsx`
- `model calendar đã duyệt`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Fixture 08h Việt Nam export 01hZ hoặc TZID tương đương; import calendar giữ giờ, ngày rollover đúng.
- [ ] Không hardcode 15 tuần/tuần hiện tại thành dữ liệu trường; model có phạm vi hoặc UI giải thích giới hạn.
- [ ] Validate giờ/ngày/duration/weekday; escape/folding/UID ổn định test parser độc lập.
- [ ] Thay test đang khẳng định output sai, không chỉ sửa expected bằng cùng thuật toán.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; calendar exact-time/parser tests; manual import calendar.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

