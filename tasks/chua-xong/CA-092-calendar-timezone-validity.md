# CA-092 - Xuất lịch đúng múi giờ và phạm vi học kỳ

- Status: In Progress
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

- [x] Fixture 08h Việt Nam export TZID (tương đương 01hZ); rollover ngày/tháng/năm đúng (AUTOMATED). Import vào Google/Outlook: CHƯA chạy manual.
- [x] Không hardcode 15 tuần/tuần hiện tại; người dùng nhập khoảng học kỳ, RRULE UNTIL theo ngày kết thúc; UI giải thích giới hạn.
- [x] Validate giờ/ngày/duration/weekday/khoảng học kỳ; escape/folding 75 octet/UID ổn định, test bằng parser độc lập.
- [x] Thay test cũ khẳng định 08:00Z; test mới quy đổi bằng ISO +07:00 của JS, không dùng thuật toán exporter.
- [x] npm run check:all pass trọn chuỗi (2026-10-18, exit 0, Rust 1.99.1 tại D:\Rust).
- [ ] Manual: import file .ics thật vào Google Calendar/Outlook và mở trang Lịch học/Lịch thi trong app.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; calendar exact-time/parser tests; manual import calendar.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.


## Tiến độ triển khai 2026-10-18

User duyệt: người dùng nhập ngày bắt đầu/kết thúc học kỳ; có mục lỗi thì chặn cả file và liệt kê lỗi; mở CA-092 song song CA-080.

CONFIRMED (source + AUTOMATED):
- `src/utils/calendarExporter.ts:5` múi giờ `Asia/Ho_Chi_Minh`, khối VTIMEZONE +0700; `:186-188`, `:245-246` DTSTART/DTEND dùng TZID; `:152` UNTIL là UTC của 23:59:59 giờ VN ngày kết thúc.
- `src/utils/calendarExporter.ts:78` kiểm tra ngày có thật; `:38` gập dòng 75 octet theo code point; `:197`, `:255` trả `{ ok: false, errors }` thay vì tạo file.
- `src/pages/CampusDataPages.tsx:31-41` hiển thị "Chưa thể xuất file .ics." kèm danh sách lỗi; `:61-63` ô nhập khoảng học kỳ; `:94` lịch thi dùng kết quả có kiểm tra.
- `src/utils/calendarExporter.test.ts:117`, `:140`, `:159`, `:214`: 08:00 VN = 01:00Z, 31/12 23:30 + 60' = 01/01 00:30, dòng <= 75 octet, UNTIL đúng.

Lệnh đã chạy:
- Trước sửa: `npx vitest run src/utils/calendarExporter.test.ts` -> 29 failed (29).
- Sau sửa: `npm run check:all` -> Vitest 92 passed (10 files), test:layout pass, check:postman 6 PASS, build pass; dừng ở `check:rust`: `'cargo' is not recognized`.
- `npm audit` -> found 0 vulnerabilities.

Chưa đạt / giới hạn:
- UNKNOWN: ngày học kỳ chính thức từ UTH (phụ thuộc CA-080/081); hiện dựa vào ngày người dùng nhập.
- Chưa có MANUAL VISUAL CHECK và chưa import thử vào Google Calendar/Outlook.
- Không sửa Rust.
- Lần 2 sau khi cài Rust: `npm run check:all` exit 0 -> Vitest 92 passed, layout pass, Postman 6 PASS, build pass, cargo check Finished, cargo test 42 passed/0 failed, audit 0 vulnerabilities.
