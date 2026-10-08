# CA-087 - Toàn vẹn phiên chat và lưu lịch sử

- Status: Proposed
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: CA-086 cho bootstrap; không cần API trường
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): Đổi ID trước load, load lỗi thay chat trống, create lỗi rơi về default; không khóa chuyển phiên. Ghi message/update timestamp không transaction; ID session theo mili giây; chưa xác thực role/session ở native; lỗi CRUD UI chỉ console. Archive ẩn mà chưa có UI khôi phục.

Evidence: `src/App.tsx:572`, `src/App.tsx:1127`, `src/pages/ChatHistoryPage.tsx:151`, `src-tauri/src/db.rs:320`, `src-tauri/src/db.rs:387`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Làm session transition atomic ở UI, chống race bằng request identity; capture session cho tác vụ async. Native atomic append, unique IDs, validation; đồng bộ App sau delete/clear. Archive management là cải thiện core cần duyệt UX, không bật tính năng mở rộng.

## File dự kiến sửa sau duyệt

- `src/App.tsx`
- `src/pages/ChatHistoryPage.tsx`
- `src/tauriApi.ts`
- `src/types.ts`
- `src-tauri/src/db.rs`
- `src-tauri/src/lib.rs`
- `test React/Rust`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Chốt và test migration cleanup cũ: init không âm thầm DELETE chat theo marker thiếu; cleanup phá hủy cần policy/consent và backup đã duyệt.
- [ ] Enter khi IME đang composing không gửi message; rapid submit/double-click và async đổi phiên có mutex/request identity, không dựa riêng state render.

- [ ] Deferred A/B và load/create failure giữ phiên trước, không ghi nhầm hoặc silent default.
- [ ] Delete/clear phiên đang active không sinh orphan; append vào phiên không tồn tại trả lỗi; privacy disabled không ghi.
- [ ] Fault injection chứng minh append/timestamp rollback; concurrent create không đụng ID; migration giữ dữ liệu.
- [ ] CRUD lỗi có feedback, pending chống double-submit; modal có focus trap/restore, card dùng keyboard; có lối xem/bỏ lưu trữ hoặc đánh dấu chưa hỗ trợ rõ.
- [ ] Test opt-in/off, no backfill, thứ tự message, retry không nhân đôi; load không giới hạn cần pagination/bounds đã duyệt.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; Rust history isolated tests; UI deferred/session/delete/keyboard tests.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.
