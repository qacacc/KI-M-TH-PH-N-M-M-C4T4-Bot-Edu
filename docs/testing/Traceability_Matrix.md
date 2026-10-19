# Ma trận truy vết kiểm thử - Campus Assistant Local

Ma trận Markdown là nguồn truy vết chính. Phụ lục `TESTING.xlsx` chứa bước thao tác, dữ liệu vào và kết quả mong đợi chi tiết cho từng test case; hai tài liệu phải dùng cùng ID TC-001 đến TC-010.

| Req ID | Test case | Phạm vi kiểm tra | Evidence/source hiện tại | Command/evidence cần chạy | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| REQ-001 | TC-001 | React mount, StrictMode và bootstrap không tạo dữ liệu giả | `src/main.tsx`, `src/bootstrapRequest.test.ts` | `npm run test -- src/bootstrapRequest.test.ts`; manual desktop nếu cần | `PARTIAL` |
| REQ-002 | TC-002 | Chuỗi nhập chat, chuẩn hóa và biên input | `src/engine.ts`, `src/engine.test.ts` | `npm run test -- src/engine.test.ts`; bổ sung boundary case nếu thiếu | `PARTIAL` |
| REQ-003 | TC-003 | Phân lớp intent/slash command và state flow | `src/engine.test.ts` | `npm run test -- src/engine.test.ts` | `CONFIRMED` khi command pass |
| REQ-004 | TC-004 | Draft/apply/reset theme, light/dark và accent | `src/hooks/useAppearanceDraft.test.ts`, `src/appearanceOptions.ts` | `npm run test -- src/hooks/useAppearanceDraft.test.ts`; manual visual là riêng | `PARTIAL` |
| REQ-005 | TC-005 | Tìm tài liệu, học kỳ và tham số thiếu/không hợp lệ | `src/engine.test.ts`, `src/pages/CampusDataPages.tsx` | `npm run test -- src/engine.test.ts`; manual flow nếu cần | `PARTIAL` |
| REQ-006 | TC-006 | Phân biệt local REST error, empty và UTH chưa verified | `src-tauri/src/api.rs`, `postman/`, `docs/testing/UTH_API_CONTRACT.md` | `npm run check:postman`; `cargo test --manifest-path src-tauri/Cargo.toml api::tests` | `PARTIAL`; UTH thật `UNKNOWN` |
| REQ-007 | TC-007 | Bật/tắt chat history opt-in và lưu vào SQLite | `src/App.tsx`, `src/pages/ChatHistoryPage.tsx`, `src-tauri/src/db.rs` | `npm run test:rust`; manual Tauri persistence test | `PARTIAL` |
| REQ-008 | TC-008 | Transaction/rollback và giữ cache khi sync lỗi | `src-tauri/src/connectors/sync_service.rs`, Rust connector tests | `npm run test:rust`; fault-injection/manual native test nếu yêu cầu | `PARTIAL` |
| REQ-009 | TC-009 | Backup JSON syntax, schema, allowlist và key nguy hiểm | `src/utils/backupRestore.test.ts` | `npm run test -- src/utils/backupRestore.test.ts` | `CONFIRMED` khi command pass |
| REQ-010 | TC-010 | Giới hạn kích thước file import và rollback | `src/utils/backupRestore.test.ts` | `npm run test -- src/utils/backupRestore.test.ts` | `CONFIRMED` khi command pass |

## Chi tiết thực hiện

### TC-001 - Bootstrap và mount

- **Tiền điều kiện:** dependency đã cài; không có yêu cầu API UTH.
- **Dữ liệu:** bootstrap loader local.
- **Kỳ vọng:** lỗi bootstrap không tạo sample giả; có thể retry theo test hiện có.
- **Gap:** chưa có bằng chứng manual desktop trong tài liệu này.

### TC-002 - Input chat và boundary

- **Tiền điều kiện:** chạy engine thuần, không gọi Tauri/network.
- **Dữ liệu:** chuỗi có dấu/không dấu, chuỗi rỗng, chuỗi dài và input không thuộc intent.
- **Kỳ vọng:** normalize/detect đúng hoặc trả unknown; không tự suy đoán intent.
- **Gap:** boundary cụ thể phải được ghi trong output test nếu chưa có.

### TC-003 - Intent và command

- **Kỳ vọng:** nhận diện đúng `FIND_DOCUMENTS`, `FIND_ANNOUNCEMENTS`, `FIND_SCHEDULE`, `FIND_EXAMS`, slash command và confirmation flow.
- **Evidence:** `src/engine.test.ts`.

### TC-004 - Appearance

- **Kỳ vọng:** draft không ghi live storage trước apply; reset/discard đúng; dữ liệu màu hợp lệ.
- **Evidence:** `src/hooks/useAppearanceDraft.test.ts`.
- **Gap:** screenshot/manual visual không được suy ra từ unit test.

### TC-005 - Document search

- **Kỳ vọng:** thiếu học kỳ thì hỏi lại; thiếu môn không tự chọn `subjects[0]`; thao tác file cần confirmation.
- **Evidence:** engine tests và runtime flow.

### TC-006 - REST/API errors

- **Kỳ vọng local:** error khác empty; validation và profile-not-connected có response riêng; sync/cache UTH chưa verified bị gate.
- **Kỳ vọng UTH:** chưa xác định cho tới khi có contract/fixture thật.
- **Evidence:** `npm run check:postman`, Rust API tests.

### TC-007 - Chat history

- **Kỳ vọng:** mặc định không lưu raw chat; chỉ lưu khi opt-in; lỗi persistence phải hiển thị, không bị nuốt.
- **Gap:** cần manual/native evidence cho toàn bộ vòng đời SQLite.

### TC-008 - SQLite integrity

- **Kỳ vọng:** transaction lỗi không xóa cache tốt; partial sync không làm mất domain không có dữ liệu mới.
- **Evidence:** `sync_service.rs` và Rust tests.
- **Gap:** tắt ứng dụng đột ngột thực tế chưa được chứng minh chỉ bằng unit test.

### TC-009 - Backup format

- **Kỳ vọng:** JSON hợp lệ, schema đúng, chỉ restore allowlist; từ chối prototype pollution/token/cookie giả.
- **Evidence:** `src/utils/backupRestore.test.ts`.

### TC-010 - Import size/rollback

- **Kỳ vọng:** file lớn hơn 1 MB bị từ chối; lỗi import khôi phục snapshot cũ.
- **Evidence:** `src/utils/backupRestore.test.ts`.

## Lệnh kiểm thử tổng hợp

```text
npm run check:all
```

Lệnh trên chỉ được ghi `PASS` sau khi chạy thực tế. Nó không chứng minh UTH live API, native login, manual visual hoặc installer E2E đã hoạt động.

## Gaps không được đóng giả là PASS

- UTH API contract, auth/session, schema và fixture PII-sanitized: `UNKNOWN`.
- Live Postman tới UTH: `NOT RUN` nếu chưa có consent và môi trường được duyệt.
- Manual visual/native desktop: ghi `NOT RUN` nếu chưa có biên bản.
- `TESTING.xlsx` là phụ lục cần được đặt tại `docs/testing/TESTING.xlsx` trước khi commit; không đưa token, cookie, mật khẩu hoặc PII thật vào file.
