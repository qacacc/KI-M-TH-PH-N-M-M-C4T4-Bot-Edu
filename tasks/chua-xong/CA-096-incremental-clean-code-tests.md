# CA-096 - Clean code tăng dần và test hành vi

- Status: Proposed
- Priority: P2
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: Sau P1; mỗi lần refactor giữ scope nhỏ
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): App 2005 dòng, CSS6571 dòng nhiều override; assertContains không chứng minh hành vi. check:all chưa gồm fmt/clippy/lint; fmt check fail, Clippy needless_borrow fail.

Evidence: `src/App.tsx:1`, `src/styles.css:6039`, `tools/layout-regression-check.cjs:13`, `package.json:17`, `src-tauri/src/connectors/connector_engine.rs:145`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Refactor theo miền đã ổn định: bootstrap/chat/session/shell, typed IPC/error, CSS tokens/component ownership. Tách formatting/lint thành commit riêng, không xóa !important hoặc fallback toàn cục.

## File dự kiến sửa sau duyệt

- `src/App.tsx`
- `src/hooks/`
- `src/tauriApi.ts`
- `src/styles.css hoặc CSS component`
- `test hiện có/mới`
- `package.json`
- `tools/layout-regression-check.cjs`
- `Rust modules lint phạm vi nhỏ`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Mỗi extraction có characterization test trước/sau, không đổi route/command/schema ngoài scope duyệt.
- [ ] Thêm test React interaction/deferred/StrictMode, storage blocked, failure injection; static check là phụ trợ.
- [ ] Format/clippy check đạt; lint/hooks/no-floating-promises policy được duyệt trước thêm dependency.
- [ ] CSS consolidation có screenshot light/dark/rail/expanded/desktop constraints trước/sau; không coi LOC giảm là proof correctness.
- [ ] Không làm global rewrite hoặc tiện thể xóa sample test fixtures/managed user data.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; cargo fmt --manifest-path src-tauri/Cargo.toml -- --check; cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings; behavior/visual regression.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

