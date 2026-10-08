# CA-094 - Gia cố desktop IPC và filesystem boundary

- Status: Proposed
- Priority: P1
- Created: 2026-10-09
- Owner: AI + User review
- Dependencies: Giữ CA-083 gate; CA-080 quyết định auth contract
- Audit: [SOURCE_AUDIT_2026-10-09.md](../../docs/SOURCE_AUDIT_2026-10-09.md)

## Truth check và mục tiêu

CONFIRMED (static source): CSP null, main có quyền tạo webview/window; legacy JWT poller và frontend JWT wrapper vẫn tồn tại nhưng bị gate. Theme assets chỉ kiểm theme_id lexical chưa canonicalize root; chưa có evidence lạm dụng runtime.

Evidence: `src-tauri/tauri.conf.json:29`, `src-tauri/capabilities/default.json:13`, `src/tauriApi.ts:168`, `src-tauri/src/connectors/connector_engine.rs:27`. Hậu quả runtime chưa có repro riêng phải ghi ASSUMED/UNKNOWN trong triển khai; xem phân loại chi tiết ở audit.

PLANNED: Threat-model quyền thật đang dùng; least privilege/CSP tương thích assets; loại bỏ hoặc cách ly bridge đoán không reachable. Không bật token polling hoặc thiết kế auth mới khi contract UNKNOWN.

## File dự kiến sửa sau duyệt

- `src-tauri/tauri.conf.json`
- `src-tauri/capabilities/default.json`
- `src-tauri/src/connectors/connector_engine.rs`
- `src/tauriApi.ts`
- `src-tauri/src/paths.rs`
- `src-tauri/src/theme_assets.rs`
- `security tests`
- Task này, TASK_INDEX và tài liệu phụ thuộc liên quan.

## Bất biến và ngoài scope

- Đọc AI_CHANGE_PROTOCOL, INVARIANTS, FLOW_MAP, REGRESSION_MATRIX trước code; báo impact và xin duyệt scope triển khai.
- Không bật connector UNKNOWN, không đoán endpoint/field, không secret trong React/storage/log/Git.
- Error != Empty; giữ dữ liệu tốt; xóa cần confirm; schema thay đổi phải migration.
- Không kích hoạt CA-064/CA-085, không thêm AI/BYOK hoặc feature ngoài mục tiêu.
- Không sửa runtime trong giai đoạn lập task này. Không tự đổi trạng thái Done của task lịch sử.

## Tiêu chí Done

- [ ] Policy CSP production và capability allowlist có native test; titlebar/assets/links vẫn chạy.
- [ ] Frontend không mang token/session secret; remote webview không có broad IPC; gate vẫn từ chối trước IO.
- [ ] Managed theme/trash roots canonicalized và symlink/path malicious tests; không chỉ regex theme ID.
- [ ] Ghi residual risks rõ; không gọi cấu hình yếu là exploit confirmed khi chưa có repro.
- [ ] npm run check:all pass; source/test evidence có file:line, output và giới hạn native/manual.
- [ ] Chuyển khỏi Active, cập nhật Status: Done và di chuyển sang done chỉ khi tất cả gate đạt.

## Kiểm thử và evidence dự kiến

npm run check:all; native capability/CSP/path tests; source scan legacy JWT; security checklist.

Các lệnh mới/test mới là PLANNED: agent triển khai phải ghi tên lệnh thực tế, expected failure trước sửa và pass sau sửa. Không dùng rg thay cho test hành vi.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

