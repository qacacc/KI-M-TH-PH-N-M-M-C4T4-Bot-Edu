# CA-094 - Gia cố desktop IPC và filesystem boundary

- Status: In Progress (CA-094.01 implementation)
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

## Evidence cập nhật CA-094.01 (2026-10-25)

Phạm vi CA-094.01: CSP, capability tối thiểu, gỡ đường JWT qua React/IPC, rà console/localStorage. Canonicalize theme/trash root và symlink tests vẫn PLANNED trong CA-094.

- CURRENT `src-tauri/tauri.conf.json:25`: CSP production `default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'`..., không `unsafe-eval`/`unsafe-inline`; chỉ mở `ipc:`/`http://ipc.localhost` và ảnh `data:`/`asset:`. `:26` devCsp riêng cho Vite HMR (inline chỉ ở dev, vẫn cấm eval).
- CURRENT `src-tauri/capabilities/default.json`: bỏ `core:default`, `core:window:allow-create`, `core:webview:allow-create-webview-window`; chỉ giữ app/event/window/webview default + 4 quyền titlebar. Không có plugin shell/fs/process trong Cargo.toml/package.json. Capability chỉ áp cho `main`, không có `remote` nên `uth-login` không có IPC (SEC-003).
- CURRENT `src/tauriApi.ts`: xóa wrapper `syncUthAfterLogin` (React gửi `jwtToken` qua IPC, không có caller). `src-tauri/src/lib.rs:179-180`: bỏ đăng ký `sync_uth_after_login`; `connector_engine.rs:322` giữ hàm nội bộ cho test gate CA-083.
- CONFIRMED (static): console.* trong `src/` chỉ in thông báo lỗi chung, không in token/mật khẩu/MSSV; localStorage chỉ lưu cấu hình/metadata, `ca_student_session_vault_v1` không có trường token (`src/schoolConnector/types.ts:55-62`).
- AUTOMATED: `npx vitest run tests/securityConfig.test.ts` PASS 12/12; chạy cùng test trên code trước sửa: 6 FAIL (CSP null, capability rộng, IPC mang jwtToken).
- AUTOMATED: `npm run build` → `dist/index.html` chỉ có `<script src>` + `<link>`; bundle không có `eval(`/`new Function(`.
- AUTOMATED: `npm run check:all` FAIL chỉ ở `npm audit` (3 advisory vite/@vitest/mocker có sẵn, dependency không đổi); 91 Vitest, layout, Postman, build, cargo check (xác thực capability/CSP), 43 Rust PASS.
- MANUAL: CHƯA CHẠY app desktop để xác nhận DevTools không có CSP violation khi khởi động/đổi ảnh nền/titlebar.
- Residual (ASSUMED/UNKNOWN): `receive_uth_jwt` vẫn đăng ký (đường thiết kế cho bridge CA-081, đang bị gate CA-083 từ chối trước IO); ảnh nền dùng `convertFileSrc` nhưng asset protocol chưa bật trong config — hành vi hiển thị ảnh nền native là UNKNOWN, không do CA-094.01 gây ra.

## Rollback

Commit nhỏ riêng cho task; không revert thay đổi user. Migration/data recovery phải có bản sao và thử trên DB fixture trước dữ liệu thật.

