# CA-093 - Tìm kiếm công khai: lỗi, thời gian và nguồn tin

- Status: Proposed
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: Không phụ thuộc authenticated contract
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): Tất cả fetch lỗi vẫn trả Ok không tìm thấy. Crawler tuần tự tối đa 12 trang x timeout8s không có budget toàn query; HTML/URL parse thủ công, redirect destination chưa kiểm tra rõ.

Evidence: `src-tauri/src/public_search.rs:432`, `src-tauri/src/public_search.rs:388`, `src-tauri/src/public_search.rs:169`, `src-tauri/src/public_search.rs:313`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Phân biệt complete/partial/offline/no-match; budget/cancel/bounded cache theo school/source, parser/URL API có cấu trúc. Xác minh redirect allowlist bằng HTTP fixture cục bộ; không crawl website thật trong test.

## File dự kiến sửa sau duyệt

- `src-tauri/src/public_search.rs`
- `src-tauri/src/models.rs`
- `src/tauriApi.ts`
- `src/App.tsx`
- `test fixtures public search`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] All-failure trả lỗi, partial giữ kết quả kèm failed-source metadata, no-match chỉ khi nguồn đọc được.
- [ ] Query có deadline/cancel và không block UI thread lâu; không fetch không giới hạn hoặc auto retry vô tận.
- [ ] Redirect scheme/host và HTML content-type/size validated; Unicode malformed không panic.
- [ ] PII policy đúng boundary; không claim query đang gửi HTTP nếu source chỉ fetch URLs cố định; test sanitizer và raw query không ghi log.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; Rust fetcher fault tests + local HTTP redirect fixtures; query budget tests.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

